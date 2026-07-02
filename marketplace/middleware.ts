import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          res.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: any) {
          res.cookies.delete({ name, ...options });
        },
      },
    }
  );

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const path = req.nextUrl.pathname;

  // Routes publiques - pas de vérification d'auth
  const publicRoutes = [
    "/",
    "/catalogue",
    "/devenir-vendeur",
    "/devenir-livreur",
    "/cgu",
    "/privacy",
    "/compte-suspendu",
    "/auth"
  ];
  
  const isPublicRoute = publicRoutes.some((route) => path.startsWith(route));
  if (isPublicRoute) {
    return res;
  }

  // Routes protégées client
  const clientRoutes = ["/commandes", "/messages", "/historique", "/profil", "/favoris"];
  const isClientRoute = clientRoutes.some((route) => path.startsWith(route));

  // Routes protégées vendeur
  const vendeurRoutes = ["/vendeur/dashboard", "/vendeur/kyc"];
  const isVendeurRoute = vendeurRoutes.some((route) => path.startsWith(route));

  // Routes protégées livreur
  const livreurRoutes = ["/livreur/missions", "/livreur/kyc"];
  const isLivreurRoute = livreurRoutes.some((route) => path.startsWith(route));

  // Routes protégées admin
  const adminRoutes = ["/admin"];
  const isAdminRoute = adminRoutes.some((route) => path.startsWith(route));

  const isProtectedRoute = isClientRoute || isVendeurRoute || isLivreurRoute || isAdminRoute;

  if (isProtectedRoute) {
    // Si session absente → redirect vers /auth/inscription
    if (!session) {
      return NextResponse.redirect(new URL("/auth/inscription", req.url));
    }

    // Si session présente mais role absent dans users → redirect vers /auth/choix-role
    const { data: userData } = await supabase
      .from("users")
      .select("role, statut")
      .eq("id", session.user.id)
      .single();

    if (!userData?.role) {
      return NextResponse.redirect(new URL("/auth/choix-role", req.url));
    }

    // Vérifier si le compte est suspendu
    if (userData.statut === "suspendu") {
      return NextResponse.redirect(new URL("/compte-suspendu", req.url));
    }

    // Vérifier que l'utilisateur a le bon rôle pour accéder à la route
    if (isVendeurRoute && userData.role !== "vendeur") {
      return NextResponse.redirect(new URL("/auth/choix-role", req.url));
    }
    if (isLivreurRoute && userData.role !== "livreur") {
      return NextResponse.redirect(new URL("/auth/choix-role", req.url));
    }
    if (isAdminRoute && userData.role !== "admin") {
      return NextResponse.redirect(new URL("/auth/choix-role", req.url));
    }
  }

  return res;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
