// src/app/api/auth/session/route.ts - Version without email verification requirement

import { NextRequest, NextResponse } from 'next/server';
import { validateRequest } from '@/lib/validation/schemas';
import { createSessionSchema } from '@/lib/validation/schemas';
import { rateLimit } from '@/lib/security/rate-limit';

export const runtime = 'nodejs';

// Rate limiting configuration
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxAttempts: 5, // 5 login attempts per window
  skipSuccessfulRequests: true,
});

export async function POST(request: NextRequest) {
  const clientIp = request.ip || request.headers.get('x-forwarded-for') || 'unknown';
  
  try {
    // Rate limiting check
    const rateLimitResult = await loginLimiter.check(clientIp);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { 
          error: 'Too many login attempts. Please try again later.',
          retryAfter: rateLimitResult.retryAfter 
        }, 
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': rateLimitResult.limit.toString(),
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
            'X-RateLimit-Reset': new Date(rateLimitResult.resetTime).toISOString(),
          }
        }
      );
    }

    // Parse and validate request body
    let body;
    try {
      body = await request.json();
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' }, 
        { status: 400 }
      );
    }

    // Validate input schema
    const validation = validateRequest(createSessionSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        { error: `Validation failed: ${validation.error}` }, 
        { status: 400 }
      );
    }

    const { idToken } = validation.data;

    // Import Firebase Admin (lazy loading for better cold start performance)
    const { adminAuth } = await import('@/lib/firebase-admin');

    // Verify the ID token with additional checks
    let decodedToken;
    try {
      decodedToken = await adminAuth.verifyIdToken(idToken, true); // checkRevoked = true
    } catch (error: any) {
      console.error('Token verification failed:', error.code);
      
      // Specific error handling for different token issues
      if (error.code === 'auth/id-token-expired') {
        return NextResponse.json(
          { error: 'Session expired. Please login again.' }, 
          { status: 401 }
        );
      } else if (error.code === 'auth/id-token-revoked') {
        return NextResponse.json(
          { error: 'Session revoked. Please login again.' }, 
          { status: 401 }
        );
      } else if (error.code === 'auth/invalid-id-token') {
        return NextResponse.json(
          { error: 'Invalid authentication token.' }, 
          { status: 401 }
        );
      } else if (error.code === 'auth/user-disabled') {
        return NextResponse.json(
          { error: 'Account has been disabled.' }, 
          { status: 403 }
        );
      }
      
      return NextResponse.json(
        { error: 'Authentication verification failed' }, 
        { status: 401 }
      );
    }

    // REMOVED: Email verification check
    // if (!decodedToken.email_verified) {
    //   return NextResponse.json(
    //     { error: 'Email address must be verified before accessing the platform' }, 
    //     { status: 403 }
    //   );
    // }

    // Check token freshness (optional: reject tokens older than X minutes)
    const tokenAge = Date.now() - (decodedToken.auth_time * 1000);
    const maxTokenAge = 24 * 60 * 60 * 1000; // 24 hours
    if (tokenAge > maxTokenAge) {
      return NextResponse.json(
        { error: 'Token too old. Please login again.' }, 
        { status: 401 }
      );
    }

    // Create session cookie with security flags
    const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days in milliseconds
    let sessionCookie;
    try {
      sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });
    } catch (error) {
      console.error('Session cookie creation failed:', error);
      return NextResponse.json(
        { error: 'Failed to create session' }, 
        { status: 500 }
      );
    }

    // Prepare user data (sanitized)
    const userData = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      emailVerified: decodedToken.email_verified,
      role: decodedToken.role || null,
      isAdmin: !!decodedToken.admin,
      lastLogin: new Date().toISOString(),
    };

    // Create response with security headers
    const response = NextResponse.json({ 
      success: true,
      user: userData
    });

    // Set secure session cookie with enhanced security
    response.cookies.set('session', sessionCookie, {
      maxAge: expiresIn / 1000, // Convert to seconds
      httpOnly: true, // Cannot be accessed via JavaScript (XSS protection)
      secure: process.env.NODE_ENV === 'production', // HTTPS only in production
      sameSite: 'lax', // CSRF protection while allowing normal navigation
      path: '/', // Available for entire site
      // Note: You might want to add 'domain' if you have subdomains
    });

    // Add security headers
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-XSS-Protection', '1; mode=block');

    // Log successful login (for security monitoring)

    return response;

  } catch (error: any) {
    console.error('[SECURITY] Session creation error:', error);
    
    // Don't expose internal error details to client
    return NextResponse.json(
      { error: 'Internal server error during authentication' }, 
      { status: 500 }
    );
  }
}

// Enhanced logout endpoint
export async function DELETE(request: NextRequest) {
  const clientIp = request.ip || request.headers.get('x-forwarded-for') || 'unknown';
  
  try {
    // Get session cookie for logging purposes
    const sessionCookie = request.cookies.get('session')?.value;
    
    if (sessionCookie) {
      try {
        // Import Firebase Admin
        const { adminAuth } = await import('@/lib/firebase-admin');
        
        // Verify and revoke the session (optional: for immediate invalidation)
        const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie, true);
        await adminAuth.revokeRefreshTokens(decodedClaims.uid);
        
      } catch (error) {
        // Session might already be invalid - that's okay for logout
      }
    }

    // Create response
    const response = NextResponse.json({ success: true, message: 'Logged out successfully' });
    
    // Clear the session cookie securely
    response.cookies.set('session', '', {
      maxAge: 0,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });

    // Add security headers
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'DENY');

    return response;
    
  } catch (error) {
    console.error('[SECURITY] Logout error:', error);
    
    // Even if logout fails internally, we should clear the cookie
    const response = NextResponse.json({ success: true, message: 'Logged out' });
    response.cookies.set('session', '', {
      maxAge: 0,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });
    
    return response;
  }
}