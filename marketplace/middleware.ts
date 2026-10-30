import { NextRequest, NextResponse } from "next/server";

const DELIVERY_HOSTS = new Set(["delivery.ayiba.shop", "www.delivery.ayiba.shop"]);
const ADMIN_HOSTS = new Set(["admin.ayiba.shop", "www.admin.ayiba.shop"]);

export function middleware(request: NextRequest) {
  const host = request.headers.get("host")?.split(":")[0].toLowerCase();
  const pathname = request.nextUrl.pathname;

  if (pathname.startsWith("/_next") || pathname.startsWith("/api") || pathname.includes(".")) {
    return NextResponse.next();
  }

  const target = DELIVERY_HOSTS.has(host ?? "")
    ? pathname === "/"
      ? "/delivery"
      : null
    : ADMIN_HOSTS.has(host ?? "")
      ? pathname === "/"
        ? "/admin/dashboard"
        : null
      : null;

  if (!target) return NextResponse.next();

  const url = request.nextUrl.clone();
  url.pathname = target;
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
