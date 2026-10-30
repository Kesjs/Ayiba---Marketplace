import { NextRequest, NextResponse } from "next/server";
import { getDeliveryUser, getRouteDistanceServer } from "@/lib/delivery-server";

export async function POST(req: NextRequest) {
  const auth = await getDeliveryUser(req);
  if ("error" in auth) return auth.error;

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Données de course invalides." }, { status: 400 });

  const requiredText = ["departAdresse", "destinationAdresse"];
  if (requiredText.some((key) => typeof body[key] !== "string" || !body[key].trim())) {
    return NextResponse.json({ error: "Indique les adresses de départ et de destination." }, { status: 400 });
  }

  const coordinates = [body.departLatitude, body.departLongitude, body.destinationLatitude, body.destinationLongitude].map(Number);
  if (!coordinates.every(Number.isFinite)) {
    return NextResponse.json({ error: "Sélectionne une adresse proposée pour obtenir sa position." }, { status: 400 });
  }

  const [departLatitude, departLongitude, destinationLatitude, destinationLongitude] = coordinates;
  const routeDistance = await getRouteDistanceServer(
    { latitude: departLatitude, longitude: departLongitude },
    { latitude: destinationLatitude, longitude: destinationLongitude },
  );

  const { data, error } = await auth.cookieClient.rpc("creer_course_delivery", {
    p_depart_adresse: body.departAdresse.trim(),
    p_depart_commune: body.departCommune?.trim() || null,
    p_depart_latitude: departLatitude,
    p_depart_longitude: departLongitude,
    p_depart_nom: body.departNom?.trim() || null,
    p_depart_telephone: body.departTelephone?.trim() || null,
    p_destination_adresse: body.destinationAdresse.trim(),
    p_destination_commune: body.destinationCommune?.trim() || null,
    p_destination_latitude: destinationLatitude,
    p_destination_longitude: destinationLongitude,
    p_destination_nom: body.destinationNom?.trim() || null,
    p_destination_telephone: body.destinationTelephone?.trim() || null,
    p_type_colis: body.typeColis?.trim() || "colis",
    p_description_colis: body.descriptionColis?.trim() || null,
    p_note_livreur: body.noteLivreur?.trim() || null,
    p_distance_route_km: routeDistance,
  });
  if (error) return NextResponse.json({ error: error.message || "Impossible de créer la course." }, { status: 400 });
  return NextResponse.json({ course: data }, { status: 201 });
}
