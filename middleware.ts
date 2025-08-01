// middleware.ts - CORRECTED VERSION for Vercel

import { NextRequest, NextResponse } from 'next/server'

// ❌ WRONG: export default function middleware(request: Request)
// ✅ CORRECT: Named export with NextRequest type
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Debug logging (will appear in Vercel logs)
  console.log('🚀 Middleware triggered for:', pathname)
  console.log('Full URL:', request.url)
  console.log('Method:', request.method)
  
  // Test redirect first
  if (pathname === '/test-middleware') {
    console.log('🔧 Test redirect triggered!')
    // ✅ Use NextResponse.redirect instead of raw Response
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
  
  // Allow request to continue normally
  console.log('✅ Allowing request to continue:', pathname)
  
  // ✅ IMPORTANT: Always return NextResponse.next() to continue
  return NextResponse.next()
}

// Configure which paths trigger the middleware
export const config = {
  matcher: [
    // Run on all paths except static files and API routes
    '/((?!_next/static|_next/image|favicon.ico|api).*)',
  ],
}

// Alternative, more specific matcher if you want to be more targeted:
// export const config = {
//   matcher: [
//     '/dashboard/:path*',
//     '/admin/:path*',
//     '/test-middleware',
//     '/'  // Include homepage if needed
//   ],
// }