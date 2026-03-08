import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { decrypt } from '@/lib/auth';


const protectedRoutes = ['/dashboard'];
const authOnlyRoutes = ['/login', '/register'];

export async function middleware(req: NextRequest) {
    const path = req.nextUrl.pathname;
    const isProtectedRoute = protectedRoutes.some(route => path.startsWith(route));
    const isAuthOnlyRoute = authOnlyRoutes.includes(path);

    const cookie = req.cookies.get('session')?.value;
    const session = await decrypt(cookie);

    if (isProtectedRoute && !session?.userId) {
        return NextResponse.redirect(new URL('/login', req.nextUrl));
    }

    if (isAuthOnlyRoute && session?.userId) {
        if (session.role === 'doctor') {
            return NextResponse.redirect(new URL('/dashboard/doctor', req.nextUrl));
        } else {
            return NextResponse.redirect(new URL('/', req.nextUrl));
        }
    }

    if (isProtectedRoute && session?.role !== 'doctor') {
        return NextResponse.redirect(new URL('/', req.nextUrl));
    }

    return NextResponse.next();
}


export const config = {
    matcher: ['/((?!api|_next/static|_next/image|.*\\.png$).*)'],
};
