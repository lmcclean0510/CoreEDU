import { NextRequest, NextResponse } from 'next/server'

// Explicitly declare edge runtime
export const runtime = 'edge'

export function middleware(request: NextRequest) {
  const url = request.nextUrl.clone()
  const pathname = url.pathname
  
  // Force console output with timestamp for better debugging
  const timestamp = new Date().toISOString()
  console.log(`[${timestamp}] 🚀 MIDDLEWARE: ${pathname}`)
  
  // Test with homepage redirect first
  if (pathname === '/test-middleware') {
    console.log(`[${timestamp}] 🔧 Test redirect triggered`)
    url.pathname = '/login'
    url.searchParams.set('test', 'middleware-works')
    return NextResponse.redirect(url)
  }
  
  // Dashboard blocking
  if (pathname.startsWith('/dashboard')) {
    console.log(`[${timestamp}] 🔒 Dashboard blocked: ${pathname}`)
    url.pathname = '/login'
    url.searchParams.set('blocked', pathname)
    url.searchParams.set('reason', 'middleware')
    return NextResponse.redirect(url)
  }
  
  console.log(`[${timestamp}] ✅ Allowing: ${pathname}`)
  return NextResponse.next()
}

export const config = {
  matcher: [
    // Match all paths except static files and API routes
    '/((?!_next/static|_next/image|favicon.ico|api).*)',
  ],
}