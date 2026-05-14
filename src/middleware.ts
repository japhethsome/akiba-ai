import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/request'

export function middleware(request: NextRequest) {
  const session = request.cookies.get('session')?.value
  const isAuthPage = request.nextUrl.pathname.startsWith('/auth')
  const isDashboardPage = request.nextUrl.pathname.startsWith('/dashboard')

  if (isDashboardPage && !session) {
    return NextResponse.redirect(new URL('/auth', request.url))
  }

  if (isAuthPage && session) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/auth/:path*'],
}
