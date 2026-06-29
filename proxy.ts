import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function proxy(request: NextRequest) {
  const session = await auth()
  const { pathname } = request.nextUrl

  const isAuthPage = pathname.startsWith("/login")
  const isApiAuth = pathname.startsWith("/api/auth")
  const isProtected =
    pathname === "/" ||
    pathname.startsWith("/pipeline") ||
    pathname.startsWith("/leads") ||
    pathname.startsWith("/users") ||
    pathname.startsWith("/employees") ||
    pathname.startsWith("/settings") ||
    pathname.startsWith("/revenue") ||
    pathname.startsWith("/mous") ||
    pathname.startsWith("/send-email")

  if (isApiAuth) return NextResponse.next()

  if (!session && isProtected) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  if (session && isAuthPage) {
    return NextResponse.redirect(new URL("/pipeline", request.url))
  }

  if (session && pathname.startsWith("/users") && session.user.role !== "super_admin") {
    return NextResponse.redirect(new URL("/pipeline", request.url))
  }

  if (session && (pathname.startsWith("/mous") || pathname.startsWith("/send-email")) && session.user.role !== "super_admin") {
    return NextResponse.redirect(new URL("/pipeline", request.url))
  }

  if (session && pathname.startsWith("/employees") && session.user.role === "employee") {
    return NextResponse.redirect(new URL("/pipeline", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|sw.js).*)"],
}
