import { NextRequest } from "next/server";
import { proxy } from "./proxy";

export async function middleware(req: NextRequest) {
  return await proxy(req);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
