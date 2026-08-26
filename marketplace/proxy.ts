import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Headers de cache pour les pages publiques (contenu statique côté vendeur/livreur
// et fichiers image sont déjà exclus par le matcher plus bas, donc pas besoin
// de les gérer ici).
function applyCacheHeaders(res: NextResponse, path: string) {
  const publicPages = [
    "/catalogue",
    "/devenir-vendeur",
    "/devenir-livreur",
    "/cgu",
    "/privacy",
  ];

  if (publicPages.some((page) => path.startsWith(page))) {
    res.headers.set(
      "Cache-Control",
      "public, max-age=3600, stale-while-revalidate=86400"
    );
    return res;
  }

  if (path.startsWith("/api/")) {
    res.headers.set("Cache-Control", "private, max-age=0, must-revalidate");
    return res;
  }

  return res;
}

export async function proxy(req: NextRequest) {
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

  // Mode maintenance : bloque tout le monde sauf les admins et la page /maintenance elle-même.
  // Seule cette ligne (cle = 'mode_maintenance') est lisible publiquement, cf. policy dédiée.
  if (path !== "/maintenance" && !path.startsWith("/admin")) {
    const { data: maintenanceRow } = await supabase
      .from("parametres_systeme")
      .select("valeur")
      .eq("cle", "mode_maintenance")
      .single();

    const isMaintenance = maintenanceRow?.valeur === true || maintenanceRow?.valeur === "true";

    if (isMaintenance) {
      let isAdmin = false;
      if (user) {
        const { data: userData } = await supabase.from("users").select("role").eq("id", user.id).single();
        isAdmin = userData?.role === "admin";
      }
      if (!isAdmin) {
        return NextResponse.redirect(new URL("/maintenance", req.url));
      }
    }
  }

  // Liste des routes accessibles sans connexion
  const publicRoutes = [
    "/", "/catalogue", "/devenir-vendeur", "/devenir-livreur",
    "/cgu", "/privacy", "/compte-suspendu", "/auth", "/admin/login",
  ];
  if (publicRoutes.some((route) => (route === "/" ? path === "/" : path.startsWith(route)))) {
    return applyCacheHeaders(res, path);
  }

  const clientRoutes = ["/commandes", "/messages", "/historique", "/profil", "/favoris", "/checkout"];
  // Préfixes complets : toute page sous /vendeur ou /livreur est protégée par défaut,
  // même une page ajoutée plus tard sans penser à la lister ici (c'est ce qui a créé
  // le trou précédent : boutique/articles/commandes/messages/paiements/parametres
  // n'étaient pas dans la liste et étaient donc accessibles sans connexion).
  const vendeurRoutes = ["/vendeur"];
  const livreurRoutes = ["/livreur"];
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
      .select("role, account_roles, statut")
      .eq("id", user.id)
      .single();

    if (userData?.statut === "suspendu") {
      return NextResponse.redirect(new URL("/compte-suspendu", req.url));
    }
    const roles = userData?.account_roles ?? [userData?.role ?? "client"];
    if (vendeurRoutes.some((r) => path.startsWith(r)) && !roles.includes("vendeur")) {
      return NextResponse.redirect(new URL("/catalogue", req.url));
    }
    if (livreurRoutes.some((r) => path.startsWith(r)) && !roles.includes("livreur")) {
      return NextResponse.redirect(new URL("/catalogue", req.url));
    }

    // KYC obligatoire avant tout accès au dashboard vendeur/livreur : tant que le
    // dossier n'est pas validé, on redirige vers la page KYC elle-même (seule route
    // exclue de ce blocage, sinon boucle infinie), où le wizard/l'écran d'attente
    // gère déjà l'affichage correct (formulaire, "en cours de vérification", refus)
    // et propose une déconnexion. Couvre statut null (jamais commencé), en_attente
    // et refuse — seul 'valide' laisse passer.
    if (
      vendeurRoutes.some((r) => path.startsWith(r)) &&
      roles.includes("vendeur") &&
      !path.startsWith("/vendeur/kyc")
    ) {
      const { data: vendeur } = await supabase
        .from("vendeurs")
        .select("statut")
        .eq("id", user.id)
        .maybeSingle();
      if (vendeur?.statut !== "valide") {
        return NextResponse.redirect(new URL("/vendeur/kyc", req.url));
      }
    }
    if (
      livreurRoutes.some((r) => path.startsWith(r)) &&
      roles.includes("livreur") &&
      !path.startsWith("/livreur/kyc")
    ) {
      const { data: livreur } = await supabase
        .from("livreurs")
        .select("statut_verification")
        .eq("id", user.id)
        .maybeSingle();
      if (livreur?.statut_verification !== "valide") {
        return NextResponse.redirect(new URL("/livreur/kyc", req.url));
      }
    }
    if (adminRoutes.some((r) => path.startsWith(r)) && userData?.role !== "admin") {
      return NextResponse.redirect(new URL("/catalogue", req.url));
    }
  }

  return applyCacheHeaders(res, path);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
