import {withAuth} from 'next-auth/middleware';
import {NextResponse} from 'next/server';
import {Action, Subject, canAccess, defineRulesFor} from '@socialbook/shared';

function isAdminPath(pathname: string): boolean {
    return pathname.startsWith('/admin');
}

export default withAuth(
    function middleware(req) {
        const token = req.nextauth.token;

        // Nếu là admin route nhưng user không phải admin → chặn quyền (403)
        if (isAdminPath(req.nextUrl.pathname) && !canAccess(defineRulesFor(token?.role ?? ''), Action.Manage, Subject.All)) {
            return NextResponse.redirect(new URL('/403', req.url));
        }

        return NextResponse.next();
    },
    {
        callbacks: {
            authorized: ({token, req}) => {
                // Admin routes yêu cầu phải đăng nhập
                if (isAdminPath(req.nextUrl.pathname)) {
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
    matcher: ['/admin/:path*'],
};