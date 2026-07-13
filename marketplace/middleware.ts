import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  let res = NextResponse.next({ request: req });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) return res;

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return req.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => req.cookies.set(name, value));
        res = NextResponse.next({ request: req });
        cookiesToSet.forEach(({ name, value, options }) =>
          res.cookies.set(name, value, options)
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = req.nextUrl.pathname;

  // Liste des routes accessibles sans connexion
  const publicRoutes = [
    "/", "/catalogue", "/devenir-vendeur", "/devenir-livreur",
    "/cgu", "/privacy", "/compte-suspendu", "/auth",
  ];
  if (publicRoutes.some((route) => path.startsWith(route))) return res;

  const clientRoutes = ["/commandes", "/messages", "/historique", "/profil", "/favoris"];
  const vendeurRoutes = ["/vendeur/dashboard", "/vendeur/kyc"];
  const livreurRoutes = ["/livreur/missions", "/livreur/kyc"];
  const adminRoutes = ["/admin"];

  const isProtectedRoute = [...clientRoutes, ...vendeurRoutes, ...livreurRoutes, ...adminRoutes]
    .some((route) => path.startsWith(route));

  if (isProtectedRoute) {
    // Redirection vers l'accueil si non connecté au lieu de /auth/inscription
    if (!user) {
      return NextResponse.redirect(new URL("/", req.url));
    }

    const { data: userData } = await supabase
      .from("users")
      .select("role, statut")
      .eq("id", user.id)
      .single();

    if (userData?.statut === "suspendu") {
      return NextResponse.redirect(new URL("/compte-suspendu", req.url));
    }
    if (vendeurRoutes.some((r) => path.startsWith(r)) && userData?.role !== "vendeur") {
      return NextResponse.redirect(new URL("/catalogue", req.url));
    }
    if (livreurRoutes.some((r) => path.startsWith(r)) && userData?.role !== "livreur") {
      return NextResponse.redirect(new URL("/catalogue", req.url));
    }
    if (adminRoutes.some((r) => path.startsWith(r)) && userData?.role !== "admin") {
      return NextResponse.redirect(new URL("/catalogue", req.url));
    }
  }

  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
