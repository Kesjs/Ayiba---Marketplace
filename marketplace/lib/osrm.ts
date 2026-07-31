// Distance routière réelle entre deux points GPS.
//
// Calculée via OpenRouteService (ORS), appelé côté serveur (voir
// app/api/distance-routiere/route.ts) pour ne jamais exposer la clé API
// ORS_API_KEY au navigateur. Ce module reste le point d'entrée côté client
// (checkout, etc.) — il ne fait qu'appeler notre propre route interne.
//
// ⚠️ Le quota gratuit ORS est limité (2000 req/jour, 40/min). En cas
// d'échec ou de dépassement de quota, on retombe silencieusement sur le
// haversine/commune déjà géré côté serveur (voir calculer_frais_livraison).
export async function getDistanceRoutiereKm(
  latVendeur: number,
  lonVendeur: number,
  latClient: number,
  lonClient: number
): Promise<number | null> {
  try {
    const params = new URLSearchParams({
      latVendeur: String(latVendeur),
      lonVendeur: String(lonVendeur),
      latClient: String(latClient),
      lonClient: String(lonClient),
    })
    const res = await fetch(`/api/distance-routiere?${params.toString()}`)
    if (!res.ok) return null

    const data = await res.json()
    return typeof data?.distance_km === 'number' ? data.distance_km : null
  } catch (err) {
    console.error('[osrm] getDistanceRoutiereKm error:', err)
    return null
  }
}

// Construit un lien de navigation Google Maps vers une destination.
//
// ⚠️ Ceci n'est PAS l'API Directions payante utilisée ci-dessus pour le
// calcul des frais — c'est un simple lien "Google Maps Navigation" gratuit
// et sans clé API. Il ouvre l'app Google Maps (mobile) ou maps.google.com
// (web) avec le guidage GPS turn-by-turn déjà lancé vers la destination,
// en partant de la position actuelle de l'appareil.
//
// Priorité aux coordonnées GPS précises (plus fiable) ; on retombe sur
// l'adresse texte uniquement si elles sont absentes.
export function getLienNavigationGoogleMaps(
  destination: { latitude: number | null; longitude: number | null; adresseTexte: string | null }
): string | null {
  const { latitude, longitude, adresseTexte } = destination
  const dest =
    latitude !== null && longitude !== null
      ? `${latitude},${longitude}`
      : adresseTexte

  if (!dest) return null

  const params = new URLSearchParams({
    api: '1',
    destination: dest,
    travelmode: 'driving',
  })
  return `https://www.google.com/maps/dir/?${params.toString()}`
}
