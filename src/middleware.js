import { NextRequest, NextResponse } from 'next/server'

export function middleware(request) {
  console.log('MIDDLEWARE RUNNING:', request.nextUrl.pathname);
  
  if (request.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/login?blocked=true', request.url));
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: '/dashboard/:path*'
}