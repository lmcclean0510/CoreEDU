// src/middleware.ts - Authentication-aware version

import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Check for unified session cookie only
  const sessionCookie = request.cookies.get('session')?.value
  const isAuthenticated = !!sessionCookie
  
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
    return NextResponse.next()
  }
  
  // Optional test path retained but without logging
  if (pathname === '/test-middleware') {
    return NextResponse.redirect(new URL('/login?test=working', request.url))
  }
  
  // 🔒 PROTECTED ROUTES - Only redirect if NOT authenticated
  if (pathname.startsWith('/dashboard')) {
    if (!isAuthenticated) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('blocked', pathname)
      return NextResponse.redirect(loginUrl)
    } else {
      return NextResponse.next()
    }
  }
  
  if (pathname.startsWith('/admin')) {
    if (!isAuthenticated) {
      return NextResponse.redirect(new URL('/login?admin=blocked', request.url))
    } else {
      return NextResponse.next()
    }
  }
  
  if (pathname.startsWith('/account')) {
    if (!isAuthenticated) {
      return NextResponse.redirect(new URL('/login?blocked=' + encodeURIComponent(pathname), request.url))
    } else {
      return NextResponse.next()
    }
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api).*)',
  ],
}