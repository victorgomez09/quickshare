import { NextResponse, type NextRequest } from 'next/server'

// export function middleware(request: NextRequest) {
//     const currentUser = request.cookies.get('tk')?.value
//     console.log('currentUser', currentUser)

//     if (currentUser && !request.nextUrl.pathname.startsWith('/dashboard')) {
//         return Response.redirect(new URL('/dashboard', request.url))
//     }

//     if (!currentUser && !request.nextUrl.pathname.startsWith('/login')) {
//         return Response.redirect(new URL('/login', request.url))
//     }
// }

// export const config = {
//     matcher: ['/((?!api|_next/static|_next/image|.*\\.png$).*)'],
// }

export function middleware(request: NextRequest) {
    const tokenCookie = request.cookies.get('tk');
    console.log('request.cookies', request.cookies)
    const token = tokenCookie ? tokenCookie.value : null;

    console.log("Token from Middleware:", token); // This will appear in your server's console

    // Example: Redirect if not authenticated
    // if (!token && request.nextUrl.pathname.startsWith('/dashboard')) {
    //     return NextResponse.redirect(new URL('/login', request.url));
    // }

    return NextResponse.next();
}