// Distance routière réelle entre deux points GPS, via le serveur de
// démonstration public d'OSRM (gratuit, sans clé — même logique que
// Nominatim déjà utilisé pour le reverse-geocoding côté client).
//
// ⚠️ Le serveur de démo OSRM (router.project-osrm.org) n'est pas garanti
// en disponibilité ni en volume pour de la prod à grande échelle. En cas
// d'échec ou de dépassement de trafic, on retombe silencieusement sur le
// haversine/commune déjà géré côté serveur (voir calculer_frais_livraison).
export async function getDistanceRoutiereKm(
  latVendeur: number,
  lonVendeur: number,
  latClient: number,
  lonClient: number
): Promise<number | null> {
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${lonVendeur},${latVendeur};${lonClient},${latClient}?overview=false`;
    const res = await fetch(url);
    if (!res.ok) return null;

    const data = await res.json();
    const distanceMetres = data?.routes?.[0]?.distance;
    if (typeof distanceMetres !== "number") return null;

    return distanceMetres / 1000;
  } catch (err) {
    console.error("[osrm] getDistanceRoutiereKm error:", err);
    return null;
  }
}
