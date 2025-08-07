// src/middleware.ts - Authentication-aware version

import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  
  // Check for authentication cookie/session
  const sessionCookie = request.cookies.get('session')?.value
  const authToken = request.cookies.get('__session')?.value // Firebase uses this sometimes
  const firebaseToken = request.cookies.get('firebase-token')?.value
  
  // Check various possible auth cookies your app might use
  const isAuthenticated = !!(sessionCookie || authToken || firebaseToken)
  
  console.log('🔍 Auth check:', { 
    isAuthenticated, 
    sessionCookie: !!sessionCookie,
    authToken: !!authToken,
    firebaseToken: !!firebaseToken 
  })
  
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
    console.log('✅ Public route, allowing access:', pathname)
    return NextResponse.next()
  }
  
  // Test redirect
  if (pathname === '/test-middleware') {
    console.log('🔧 Test redirect triggered!')
    return NextResponse.redirect(new URL('/login?test=working', request.url))
  }
  
  // 🔒 PROTECTED ROUTES - Only redirect if NOT authenticated
  if (pathname.startsWith('/dashboard')) {
    if (!isAuthenticated) {
      console.log('🔒 Dashboard access blocked - not authenticated:', pathname)
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('blocked', pathname)
      return NextResponse.redirect(loginUrl)
    } else {
      console.log('✅ Dashboard access allowed - user authenticated:', pathname)
      return NextResponse.next()
    }
  }
  
  if (pathname.startsWith('/admin')) {
    if (!isAuthenticated) {
      console.log('🔒 Admin access blocked - not authenticated:', pathname)
      return NextResponse.redirect(new URL('/login?admin=blocked', request.url))
    } else {
      console.log('✅ Admin access allowed - user authenticated:', pathname)
      return NextResponse.next()
    }
  }
  
  if (pathname.startsWith('/account')) {
    if (!isAuthenticated) {
      console.log('🔒 Account access blocked - not authenticated:', pathname)
      return NextResponse.redirect(new URL('/login?blocked=' + encodeURIComponent(pathname), request.url))
    } else {
      console.log('✅ Account access allowed - user authenticated:', pathname)
      return NextResponse.next()
    }
  }
  
  console.log('✅ Allowing request to continue:', pathname)
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api).*)',
  ],
}