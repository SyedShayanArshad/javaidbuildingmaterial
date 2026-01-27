import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Ignore public routes and ALL API routes (they handle auth themselves)
  if (pathname.startsWith('/login') || 
      pathname.startsWith('/_next') || 
      pathname.startsWith('/api')) {
    return NextResponse.next();
  }

  const token = req.cookies.get('session')?.value;

  // Token missing → redirect to login
  if (!token) {
    const loginUrl = new URL('/login', req.url);
    return NextResponse.redirect(loginUrl);
  }

  try {
    // Use the same secret as createSession
    const secret = new TextEncoder().encode(
      process.env.NEXTAUTH_SECRET || 'your-secret-key-change-in-production'
    );
    
    await jwtVerify(token, secret);
    return NextResponse.next(); // valid token → proceed
  } catch (err) {
    const loginUrl = new URL('/login', req.url);
    return NextResponse.redirect(loginUrl);
  }
}

// Apply to all dashboard routes (NOT API routes - they handle auth themselves)
export const config = {
  matcher: ['/dashboard/:path*', '/purchases/:path*', '/sales/:path*', '/products/:path*', '/vendors/:path*', '/stock/:path*', '/reports/:path*', '/settings/:path*'],
};
