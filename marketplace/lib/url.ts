/**
 * Retourne l'URL de base canonique de l'application Ayiba.
 * Priorité :
 * 1. process.env.NEXT_PUBLIC_SITE_URL (définie dans .env.local / Render / Vercel)
 * 2. process.env.NEXT_PUBLIC_VERCEL_URL
 * 3. window.location.origin (si dans le navigateur)
 * 4. Fallback http://localhost:3000
 */
export function getAppUrl(): string {
  let url =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_VERCEL_URL ||
    (typeof window !== "undefined" ? window.location.origin : "http://localhost:3000");

  url = url.trim();
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    url = `https://${url}`;
  }
  return url.replace(/\/$/, "");
}
