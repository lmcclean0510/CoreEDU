// Create this file: src/app/api/auth/session/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';

export async function POST(request: NextRequest) {
  try {
    const { idToken } = await request.json();

    if (!idToken) {
      return NextResponse.json(
        { error: 'ID token is required' }, 
        { status: 400 }
      );
    }

    // Verify the ID token and extract claims
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    
    // Check if user is banned or disabled
    if (decodedToken.disabled) {
      return NextResponse.json(
        { error: 'Account is disabled' }, 
        { status: 403 }
      );
    }

    // Create session cookie (expires in 5 days)
    const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days in milliseconds
    const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });

    // Create response with secure cookie
    const response = NextResponse.json({ 
      success: true,
      user: {
        uid: decodedToken.uid,
        email: decodedToken.email,
        role: decodedToken.role,
        isAdmin: !!decodedToken.admin
      }
    });

    // Set secure session cookie
    response.cookies.set('session', sessionCookie, {
      maxAge: expiresIn / 1000, // Convert to seconds
      httpOnly: true, // Cannot be accessed via JavaScript (XSS protection)
      secure: process.env.NODE_ENV === 'production', // HTTPS only in production
      sameSite: 'lax', // CSRF protection
      path: '/', // Available for entire site
    });

    return response;

  } catch (error: any) {
    console.error('Session creation error:', error);
    
    // Handle specific Firebase errors
    if (error.code === 'auth/id-token-expired') {
      return NextResponse.json(
        { error: 'Token expired. Please login again.' }, 
        { status: 401 }
      );
    } else if (error.code === 'auth/id-token-revoked') {
      return NextResponse.json(
        { error: 'Token revoked. Please login again.' }, 
        { status: 401 }
      );
    } else if (error.code === 'auth/invalid-id-token') {
      return NextResponse.json(
        { error: 'Invalid token. Please login again.' }, 
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { error: 'Authentication failed' }, 
      { status: 500 }
    );
  }
}

// Logout endpoint
export async function DELETE() {
  try {
    const response = NextResponse.json({ success: true });
    
    // Clear the session cookie
    response.cookies.set('session', '', {
      maxAge: 0,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'Logout failed' }, 
      { status: 500 }
    );
  }
}