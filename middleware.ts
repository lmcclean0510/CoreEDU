// middleware.ts - Following Vercel's exact format

export default function middleware(request: Request) {
  const url = new URL(request.url);
  const pathname = url.pathname;
  
  // Debug logging (will appear in Vercel logs)
  console.log('🚀 Middleware triggered for:', pathname);
  console.log('Full URL:', request.url);
  console.log('Method:', request.method);
  
  // Test redirect first
  if (pathname === '/test-middleware') {
    console.log('🔧 Test redirect triggered!');
    return new Response(null, {
      status: 302,
      headers: { Location: '/login?test=working' },
    });
  }
  
  // Dashboard protection
  if (pathname.startsWith('/dashboard')) {
    console.log('🔒 Dashboard access blocked:', pathname);
    return new Response(null, {
      status: 302,
      headers: { Location: `/login?blocked=${encodeURIComponent(pathname)}` },
    });
  }
  
  // Admin protection  
  if (pathname.startsWith('/admin')) {
    console.log('🔒 Admin access blocked:', pathname);
    return new Response(null, {
      status: 302,
      headers: { Location: `/login?admin=blocked` },
    });
  }
  
  // Allow request to continue
  console.log('✅ Allowing request to continue:', pathname);
  
  // For Vercel, we need to return a response that doesn't interfere
  // This is different from Next.js where we use NextResponse.next()
  return new Response(null, {
    status: 200,
    headers: {
      'x-middleware-processed': 'true'
    }
  });
}

// Configure which paths trigger the middleware
export const config = {
  runtime: 'nodejs', // Use Node.js runtime (Vercel default)
  matcher: [
    // Run on all paths except static files and API routes
    '/((?!_next/static|_next/image|favicon.ico|api).*)',
  ],
};