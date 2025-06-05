import { type NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
    const currentUser = request.cookies.get('tk')?.value
    console.log('currentUser', currentUser)

    if (currentUser && !request.nextUrl.pathname.startsWith('/')) {
        return Response.redirect(new URL('/', request.url))
    }

    if (!currentUser && !request.nextUrl.pathname.startsWith('/login')) {
        return Response.redirect(new URL('/login', request.url))
    }
}