import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const isAdminRoute = req.nextUrl.pathname.startsWith('/admin');

    // Nếu là admin route nhưng user không phải admin → redirect về home
    if (isAdminRoute && token?.role !== 'admin') {
        return NextResponse.redirect(new URL('/', req.url));
    }

    // Onboarding Redirection Logic
    const isOnboardingPage = req.nextUrl.pathname === '/onboarding';
    
    if (token) {
      const isCompleted = token.onboardingCompleted;
      
      if (
        !isCompleted && 
        !isOnboardingPage && 
        !req.nextUrl.pathname.startsWith('/api') && 
        !req.nextUrl.pathname.startsWith('/_next')
      ) {
         return NextResponse.redirect(new URL('/onboarding', req.url));
      }

      if (isCompleted && isOnboardingPage) {
        return NextResponse.redirect(new URL('/', req.url));
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const isAdminRoute = req.nextUrl.pathname.startsWith('/admin');

        // Admin routes yêu cầu phải đăng nhập
        if (isAdminRoute) {
          return !!token;
        }

        // Các routes khác không yêu cầu auth
        return true; 
      },
    },
    pages: {
      signIn: '/login',
    },
  }
);

export const config = {
  matcher: ['/admin/:path*', '/', '/onboarding'],
};
