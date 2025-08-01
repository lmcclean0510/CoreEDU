import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  console.log('🚀 MIDDLEWARE RUNNING:', request.nextUrl.pathname)
  
  if (request.nextUrl.pathname === '/dashboard/teacher') {
    console.log('🔒 Blocking teacher dashboard')
    return NextResponse.redirect(new URL('/login', request.url))
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*']
}
