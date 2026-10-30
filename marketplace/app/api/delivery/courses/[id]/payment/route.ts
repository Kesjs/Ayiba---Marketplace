import { NextRequest, NextResponse } from "next/server";
import { declencherPaiementMobileMoney, declencherPaiementParCarte } from "@/lib/geniuspay";
import { getDeliveryUser } from "@/lib/delivery-server";

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const auth = await getDeliveryUser(req);
  if ("error" in auth) return auth.error;
  const { id } = await context.params;
  const body = await req.json().catch(() => null);
  const method = body?.method === "carte" ? "carte" : "mobile_money";
  const network = body?.network === "moov" ? "moov" : body?.network === "mtn" ? "mtn" : null;

  const { data: course, error: courseError } = await auth.admin
    .from("courses_delivery")
    .select("id, numero, client_id, statut, statut_paiement, montant_final, montant_estime, destination_nom, destination_telephone")
    .eq("id", id)
    .eq("client_id", auth.user.id)
    .maybeSingle();
  if (courseError || !course) return NextResponse.json({ error: "Course introuvable." }, { status: 404 });
  if (course.statut !== "arrivee") return NextResponse.json({ error: "Le paiement sera disponible à l’arrivée du livreur." }, { status: 400 });

  const amount = Number(course.montant_final ?? course.montant_estime);
  if (!Number.isFinite(amount) || amount <= 0) return NextResponse.json({ error: "Montant de course invalide." }, { status: 400 });
  if (method === "mobile_money" && (!network || typeof body?.phone !== "string" || !body.phone.trim())) {
    return NextResponse.json({ error: "Choisis un réseau et renseigne le numéro Mobile Money." }, { status: 400 });
  }

  const { data: intent, error: intentError } = await auth.admin
    .from("delivery_payment_intents")
    .upsert({
      course_id: course.id,
      client_id: auth.user.id,
      montant: amount,
      methode: method === "carte" ? "carte" : "mobile_money",
      reseau: method === "mobile_money" ? network : null,
      telephone: method === "mobile_money" ? body.phone.trim() : null,
      statut: "en_attente",
      updated_at: new Date().toISOString(),
    }, { onConflict: "course_id" })
    .select("id")
    .single();
  if (intentError || !intent) return NextResponse.json({ error: "Impossible de préparer le paiement." }, { status: 500 });

  try {
    const deliveryOrigin = new URL(req.url).origin;
    const common = {
      montant: amount,
      description: `Ayiba Delivery — ${course.numero}`,
      nomClient: auth.user.user_metadata?.full_name || "Client Ayiba",
      emailClient: auth.user.email || `client-${auth.user.id}@ayiba.shop`,
      metadata: { delivery_payment_intent_id: intent.id, delivery_course_id: course.id, user_id: auth.user.id },
    };
    const payment = method === "mobile_money"
      ? await declencherPaiementMobileMoney({ ...common, reseau: network!, telephone: body.phone.trim() })
      : await declencherPaiementParCarte({ ...common, successUrl: `${deliveryOrigin}/delivery/courses/${course.id}?payment=success`, errorUrl: `${deliveryOrigin}/delivery/courses/${course.id}?payment=error` });

    await auth.admin.from("delivery_payment_intents").update({ transaction_reference: payment.reference, payment_url: "paymentUrl" in payment ? payment.paymentUrl : null, updated_at: new Date().toISOString() }).eq("id", intent.id);
    await auth.admin.from("courses_delivery").update({ statut_paiement: "en_attente", payment_intent_id: intent.id, updated_at: new Date().toISOString() }).eq("id", course.id);
    return NextResponse.json({ intentId: intent.id, transactionId: payment.reference, paymentUrl: "paymentUrl" in payment ? payment.paymentUrl : null });
  } catch (error) {
    await auth.admin.from("delivery_payment_intents").update({ statut: "echoue", raison_echec: error instanceof Error ? error.message : "GeniusPay indisponible", updated_at: new Date().toISOString() }).eq("id", intent.id);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Le paiement n’a pas pu démarrer." }, { status: 502 });
  }
}
