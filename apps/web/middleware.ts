import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

/**
 * Optional gate for dashboard routes. Off by default so local dev is frictionless.
 * Set NEXT_PUBLIC_PORTAL_GUARD=true and set an `ls_access_token` cookie when auth ships.
 */
export function middleware(request: NextRequest) {
  const guard = process.env["NEXT_PUBLIC_PORTAL_GUARD"] === "true"
  if (!guard) {
    return NextResponse.next()
  }

  const protectedPrefixes = ["/buyer", "/agent", "/developer", "/admin"]
  const isProtected = protectedPrefixes.some((prefix) =>
    request.nextUrl.pathname.startsWith(prefix),
  )

  if (isProtected) {
    const token = request.cookies.get("ls_access_token")?.value
    if (!token) {
      const login = new URL("/login", request.url)
      login.searchParams.set("next", request.nextUrl.pathname)
      return NextResponse.redirect(login)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/buyer/:path*", "/agent/:path*", "/developer/:path*", "/admin/:path*"],
}
