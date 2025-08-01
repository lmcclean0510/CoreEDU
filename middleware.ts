import { NextRequest, NextResponse } from 'next/server'
import { adminAuth } from '@/lib/firebase-admin'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  console.log(`🚀 MIDDLEWARE: ${pathname}`)

  // Get session cookie
  const sessionCookie = request.cookies.get('session')?.value
  
  // Define route types
  const publicRoutes = [
    '/',
    '/login',
    '/signup',
    '/corecs',
    '/corelabs', 
    '/coretools'
  ]
  
  const protectedRoutes = [
    '/dashboard',
    '/admin',
    '/account',
    '/homework'
  ]
  
  // Check if current path is public
  const isPublicRoute = publicRoutes.some(route => 
    pathname === route || pathname.startsWith(`${route}/`)
  )
  
  // Check if current path requires authentication
  const isProtectedRoute = protectedRoutes.some(route =>
    pathname.startsWith(route)
  )
  
  // Allow public routes without authentication
  if (isPublicRoute && !isProtectedRoute) {
    // If user is already authenticated and tries to access login/signup, redirect to dashboard
    if (sessionCookie && (pathname === '/login' || pathname === '/signup')) {
      console.log('✅ Already authenticated, redirecting to dashboard')
      try {
        const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie)
        const isAdmin = !!decodedClaims.admin
        const role = decodedClaims.role || 'student'
        
        if (isAdmin) {
          return NextResponse.redirect(new URL('/admin', request.url))
        } else if (role === 'teacher') {
          return NextResponse.redirect(new URL('/dashboard/teacher', request.url))
        } else {
          return NextResponse.redirect(new URL('/dashboard/student', request.url))
        }
      } catch (error) {
        console.log('🔥 Invalid session cookie, clearing it')
        const response = NextResponse.next()
        response.cookies.set('session', '', { maxAge: 0 })
        return response
      }
    }
    
    console.log('✅ Public route, allowing access')
    return NextResponse.next()
  }
  
  // Handle protected routes
  if (isProtectedRoute) {
    if (!sessionCookie) {
      console.log('🔒 No session cookie, redirecting to login')
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }
    
    try {
      // Verify the session cookie
      const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie)
      console.log(`✅ Valid session for user: ${decodedClaims.uid}`)
      
      // Check role-based access
      const isAdmin = !!decodedClaims.admin
      const role = decodedClaims.role || 'student'
      
      // Admin routes - require admin privileges
      if (pathname.startsWith('/admin')) {
        if (!isAdmin) {
          console.log('🚫 Admin access denied - not admin')
          return NextResponse.redirect(new URL('/dashboard/student', request.url))
        }
      }
      
      // Teacher dashboard - require teacher role or admin
      if (pathname.startsWith('/dashboard/teacher')) {
        if (role !== 'teacher' && !isAdmin) {
          console.log('🚫 Teacher dashboard access denied - not teacher')
          return NextResponse.redirect(new URL('/dashboard/student', request.url))
        }
      }
      
      // Student dashboard - anyone authenticated can access
      if (pathname.startsWith('/dashboard/student')) {
        // Allow access for all authenticated users
      }
      
      // Add user info to headers for the page to use
      const requestHeaders = new Headers(request.headers)
      requestHeaders.set('x-user-uid', decodedClaims.uid)
      requestHeaders.set('x-user-role', role)
      requestHeaders.set('x-user-admin', isAdmin.toString())
      
      console.log('✅ Access granted')
      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      })
      
    } catch (error) {
      console.log('🔥 Invalid session cookie:', error)
      
      // Clear invalid session cookie and redirect to login
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      const response = NextResponse.redirect(loginUrl)
      response.cookies.set('session', '', { 
        maxAge: 0,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/'
      })
      
      return response
    }
  }
  
  console.log('✅ Allowing request to continue')
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.jpeg$|.*\\.gif$|.*\\.svg$).*)',
  ],
}