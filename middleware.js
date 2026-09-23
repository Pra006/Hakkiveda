import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

const protectedRoutes = ["/account", "/wishlist", "/checkout"];
const vendorRoutes = ["/vendor"];
const adminRoutes = ["/admin"];
const authRoutes = ["/auth/login", "/auth/register"];

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;
  // Redirect logged-in users away from auth pages
  if (isLoggedIn && authRoutes.some((r) => pathname.startsWith(r))) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  // Protect customer routes
  if (protectedRoutes.some((r) => pathname.startsWith(r)) && !isLoggedIn) {
    const loginUrl = new URL("/auth/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Protect vendor routes
  if (vendorRoutes.some((r) => pathname.startsWith(r))) {
    if (!isLoggedIn) {
      const loginUrl = new URL("/auth/login", req.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
    if (!req.auth?.user?.adminRole) {
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  // Protect admin routes — check adminRole from JWT
  if (adminRoutes.some((r) => pathname.startsWith(r))) {
    if (!isLoggedIn) {
      const loginUrl = new URL("/auth/login", req.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
    if (!req.auth?.user?.adminRole) {
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  // Protect B2B routes — require login; org membership is checked at page/API level
  if (pathname.startsWith("/b2b")) {
    if (!isLoggedIn) {
      const loginUrl = new URL("/auth/login", req.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/account/:path*",
    "/wishlist/:path*",
    "/checkout/:path*",
    "/vendor/:path*",
    "/admin/:path*",
    "/auth/:path*",
    "/b2b/:path*",
  ],
};
