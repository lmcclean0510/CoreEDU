// src/middleware.ts - Enhanced version with security hardening

import { NextRequest, NextResponse } from 'next/server'
import { rateLimit } from '@/lib/security/rate-limit';

// Create rate limiter for general page access
const pageRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  maxAttempts: 100, // 100 requests per minute per IP
});

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const clientIp = request.ip || request.headers.get('x-forwarded-for') || 'unknown';
  
  // Apply rate limiting to all requests
  const rateLimitResult = await pageRateLimit.check(clientIp);
  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: 'Too many requests. Please slow down.' },
      { 
        status: 429,
        headers: {
          'X-RateLimit-Limit': rateLimitResult.limit.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': new Date(rateLimitResult.resetTime).toISOString(),
          'Retry-After': rateLimitResult.retryAfter?.toString() || '60',
        }
      }
    );
  }

  // Check for unified session cookie only
  const sessionCookie = request.cookies.get('session')?.value
  const isAuthenticated = !!sessionCookie
  
  // Security headers for all responses
  const response = NextResponse.next();
  
  // Essential security headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Content Security Policy - adjust based on your needs
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://cdnjs.cloudflare.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https: blob:",
    "connect-src 'self' https://*.googleapis.com https://*.firebaseio.com wss://*.firebaseio.com",
    "media-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ].join('; ');
  
  response.headers.set('Content-Security-Policy', csp);
  
  // HTTPS enforcement in production
  if (process.env.NODE_ENV === 'production') {
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }
  
  // ✅ ALLOW PUBLIC ROUTES
  const publicRoutes = [
    '/',
    '/login',
    '/signup',
    '/corecs',
    '/corelabs',
    '/coretools'
  ]
  
  const isPublicRoute = publicRoutes.some(route => 
    pathname === route || 
    (route !== '/' && pathname.startsWith(route))
  )
  
  if (isPublicRoute) {
    return response
  }
  
  // Test path for middleware verification
  if (pathname === '/test-middleware') {
    const testResponse = NextResponse.redirect(new URL('/login?test=working', request.url))
    // Copy security headers to redirect response
    testResponse.headers.set('X-Content-Type-Options', 'nosniff');
    testResponse.headers.set('X-Frame-Options', 'DENY');
    return testResponse
  }
  
  // 🔒 PROTECTED ROUTES - Only redirect if NOT authenticated
  if (pathname.startsWith('/dashboard')) {
    if (!isAuthenticated) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('blocked', pathname)
      const redirectResponse = NextResponse.redirect(loginUrl)
      
      // Add security headers to redirect
      redirectResponse.headers.set('X-Content-Type-Options', 'nosniff');
      redirectResponse.headers.set('X-Frame-Options', 'DENY');
      
      return redirectResponse
    } else {
      return response
    }
  }
  
  if (pathname.startsWith('/admin')) {
    if (!isAuthenticated) {
      const redirectResponse = NextResponse.redirect(new URL('/login?admin=blocked', request.url))
      
      // Add security headers to redirect
      redirectResponse.headers.set('X-Content-Type-Options', 'nosniff');
      redirectResponse.headers.set('X-Frame-Options', 'DENY');
      
      return redirectResponse
    } else {
      return response
    }
  }
  
  if (pathname.startsWith('/account')) {
    if (!isAuthenticated) {
      const redirectResponse = NextResponse.redirect(new URL('/login?blocked=' + encodeURIComponent(pathname), request.url))
      
      // Add security headers to redirect
      redirectResponse.headers.set('X-Content-Type-Options', 'nosniff');
      redirectResponse.headers.set('X-Frame-Options', 'DENY');
      
      return redirectResponse
    } else {
      return response
    }
  }
  
  if (pathname.startsWith('/homework')) {
    if (!isAuthenticated) {
      const redirectResponse = NextResponse.redirect(new URL('/login?blocked=' + encodeURIComponent(pathname), request.url))
      
      // Add security headers to redirect
      redirectResponse.headers.set('X-Content-Type-Options', 'nosniff');
      redirectResponse.headers.set('X-Frame-Options', 'DENY');
      
      return redirectResponse
    } else {
      return response
    }
  }
  
  // Block access to sensitive API routes
  if (pathname.startsWith('/api/') && !pathname.startsWith('/api/auth/')) {
    if (!isAuthenticated) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { 
          status: 401,
          headers: {
            'X-Content-Type-Options': 'nosniff',
            'X-Frame-Options': 'DENY',
          }
        }
      )
    }
  }
  
  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public directory)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}