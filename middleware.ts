// middleware.ts - Fixed to allow public routes

import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Debug logging (will appear in Vercel logs)
  console.log('🚀 Middleware triggered for:', pathname)
  console.log('Full URL:', request.url)
  console.log('Method:', request.method)
  
  // ✅ ALLOW PUBLIC ROUTES - Add this section!
  const publicRoutes = [
    '/',
    '/login',
    '/signup',
    '/corecs',
    '/corelabs',
    '/coretools'
  ]
  
  // Check if current path is public
  const isPublicRoute = publicRoutes.some(route => 
    pathname === route || 
    (route !== '/' && pathname.startsWith(route))
  )
  
  if (isPublicRoute) {
    console.log('✅ Public route, allowing access:', pathname)
    return NextResponse.next()
  }
  
  // Test redirect first
  if (pathname === '/test-middleware') {
    console.log('🔧 Test redirect triggered!')
    return NextResponse.redirect(new URL('/login?test=working', request.url))
  }
  
  // Dashboard protection
  if (pathname.startsWith('/dashboard')) {
    console.log('🔒 Dashboard access blocked:', pathname)
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('blocked', pathname)
    return NextResponse.redirect(loginUrl)
  }
  
  // Admin protection  
  if (pathname.startsWith('/admin')) {
    console.log('🔒 Admin access blocked:', pathname)
    return NextResponse.redirect(new URL('/login?admin=blocked', request.url))
  }
  
  // Account protection
  if (pathname.startsWith('/account')) {
    console.log('🔒 Account access blocked:', pathname)
    return NextResponse.redirect(new URL('/login?blocked=' + encodeURIComponent(pathname), request.url))
  }
  
  // Allow request to continue normally
  console.log('✅ Allowing request to continue:', pathname)
  return NextResponse.next()
}

// Configure which paths trigger the middleware
export const config = {
  matcher: [
    // Run on all paths except static files and API routes
    '/((?!_next/static|_next/image|favicon.ico|api).*)',
  ],
}