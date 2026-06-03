import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

import { decodeAccessTokenRole, portalMismatchRedirect } from "@/lib/portal-routing"

const PROTECTED_PREFIXES = ["/buyer", "/agent", "/developer", "/admin", "/provider"]

/**
 * Optional gate for dashboard routes. Off by default so local dev is frictionless.
 * Set NEXT_PUBLIC_PORTAL_GUARD=true and set an `ls_access_token` cookie when auth ships.
 */
export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  const isProtected = PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix))
  if (!isProtected) {
    return NextResponse.next()
  }

  const token = request.cookies.get("ls_access_token")?.value
  const guard = process.env["NEXT_PUBLIC_PORTAL_GUARD"] === "true"

  if (guard && !token) {
    const login = new URL("/login", request.url)
    login.searchParams.set("next", pathname)
    return NextResponse.redirect(login)
  }

  if (token) {
    const role = decodeAccessTokenRole(token)
    const portalHome = portalMismatchRedirect(pathname, role)
    if (portalHome) {
      return NextResponse.redirect(new URL(portalHome, request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/buyer/:path*",
    "/agent/:path*",
    "/developer/:path*",
    "/admin/:path*",
    "/provider/:path*",
  ],
}
