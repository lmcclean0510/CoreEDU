import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  console.log('🚀 MIDDLEWARE TEST:', request.nextUrl.pathname)
  
  // Force redirect for any dashboard access
  if (request.nextUrl.pathname.startsWith('/dashboard')) {
    console.log('🔒 BLOCKING DASHBOARD ACCESS')
    return NextResponse.redirect(new URL('/login?blocked=true', request.url))
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*']
}