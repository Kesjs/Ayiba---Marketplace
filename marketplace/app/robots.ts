import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://ayiba-marketplace-4376-rho.vercel.app";

  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/catalogue",
          "/produits/*",
          "/boutiques",
          "/devenir-vendeur",
          "/devenir-livreur",
          "/a-propos",
          "/comment-ca-marche",
          "/centre-aide",
          "/faq",
          "/contact",
          "/cgu",
          "/privacy",
          "/politique-livraison",
          "/politique-remboursement",
          "/politique-commission",
        ],
        disallow: [
          "/admin/*",
          "/vendeur/dashboard/*",
          "/vendeur/articles/*",
          "/vendeur/commandes/*",
          "/vendeur/finances/*",
          "/vendeur/parametres/*",
          "/livreur/dashboard/*",
          "/livreur/livraisons/*",
          "/livreur/gains/*",
          "/api/*",
          "/checkout/*",
          "/commandes/*",
          "/panier/*",
          "/profil/*",
          "/parametres/*",
          "/auth/callback*",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
