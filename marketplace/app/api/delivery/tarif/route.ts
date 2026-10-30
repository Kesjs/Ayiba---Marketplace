import { NextRequest, NextResponse } from "next/server";
import { getDeliveryUser, getRouteDistanceServer } from "@/lib/delivery-server";

export async function GET(req: NextRequest) {
  const auth = await getDeliveryUser(req);
  if ("error" in auth) return auth.error;

  const params = req.nextUrl.searchParams;
  const depart = { latitude: Number(params.get("departLat")), longitude: Number(params.get("departLng")) };
  const destination = { latitude: Number(params.get("destinationLat")), longitude: Number(params.get("destinationLng")) };
  if (![depart.latitude, depart.longitude, destination.latitude, destination.longitude].every(Number.isFinite)) {
    return NextResponse.json({ error: "Coordonnées de départ ou d’arrivée invalides." }, { status: 400 });
  }

  const routeDistance = await getRouteDistanceServer(depart, destination);
  const { data, error } = await auth.cookieClient.rpc("calculer_tarif_course", {
    p_depart_latitude: depart.latitude,
    p_depart_longitude: depart.longitude,
    p_destination_latitude: destination.latitude,
    p_destination_longitude: destination.longitude,
    p_distance_route_km: routeDistance,
  });
  if (error) return NextResponse.json({ error: "Impossible de calculer le tarif pour le moment." }, { status: 500 });
  return NextResponse.json({ quote: data, distanceSource: routeDistance !== null ? "route" : "estimation" });
}
