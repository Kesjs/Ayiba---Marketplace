import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/distance-routiere?latVendeur=..&lonVendeur=..&latClient=..&lonClient=..
 *
 * Calcule la distance routière réelle (en km) entre un vendeur et une
 * adresse client via OpenRouteService (ORS, désormais sous api.heigit.org).
 * Cette route existe pour ne jamais exposer ORS_API_KEY au navigateur — voir
 * lib/osrm.ts côté client, qui appelle cette route au lieu d'appeler ORS
 * directement.
 *
 * Renvoie { distance_km: number } en cas de succès, ou { distance_km: null }
 * si les coordonnées sont invalides, si ORS échoue ou si le quota est
 * dépassé — dans tous ces cas, calculer_frais_livraison() côté Postgres
 * retombe silencieusement sur haversine/commune (voir son commentaire).
 */
export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams
  const latVendeur = Number(params.get('latVendeur'))
  const lonVendeur = Number(params.get('lonVendeur'))
  const latClient = Number(params.get('latClient'))
  const lonClient = Number(params.get('lonClient'))

  if (
    !Number.isFinite(latVendeur) ||
    !Number.isFinite(lonVendeur) ||
    !Number.isFinite(latClient) ||
    !Number.isFinite(lonClient)
  ) {
    return NextResponse.json({ distance_km: null })
  }

  const apiKey = process.env.ORS_API_KEY
  if (!apiKey) {
    console.error('[distance-routiere] ORS_API_KEY manquante')
    return NextResponse.json({ distance_km: null })
  }

  try {
    const url = new URL('https://api.heigit.org/openrouteservice/v2/directions/driving-car')
    url.searchParams.set('api_key', apiKey)
    url.searchParams.set('start', `${lonVendeur},${latVendeur}`)
    url.searchParams.set('end', `${lonClient},${latClient}`)

    const res = await fetch(url.toString())
    if (!res.ok) {
      // Quota dépassé (429), coordonnées hors zone couverte, etc.
      console.error('[distance-routiere] ORS a répondu', res.status)
      return NextResponse.json({ distance_km: null })
    }

    const data = await res.json()
    const distanceMetres = data?.routes?.[0]?.summary?.distance
    if (typeof distanceMetres !== 'number') {
      return NextResponse.json({ distance_km: null })
    }

    return NextResponse.json({ distance_km: distanceMetres / 1000 })
  } catch (err) {
    console.error('[distance-routiere] erreur:', err)
    return NextResponse.json({ distance_km: null })
  }
}
