import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'

export default auth((req) => {
  const isAuthed = !!req.auth
  const isCoursePath = req.nextUrl.pathname.startsWith('/course')
  if (isCoursePath && !isAuthed) {
    return NextResponse.redirect(new URL('/signin', req.url))
  }
})

export const config = {
  matcher: ['/course/:path*'],
}
