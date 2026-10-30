import { NextResponse } from "next/server";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  const apiKey = process.env.BREVO_API_KEY;
  const listId = Number(process.env.BREVO_NEWSLETTER_LIST_ID);

  if (!apiKey || !Number.isInteger(listId) || listId < 1) {
    return NextResponse.json(
      { error: "La newsletter n’est pas encore configurée." },
      { status: 503 },
    );
  }

  let body: { email?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!EMAIL_PATTERN.test(email)) {
    return NextResponse.json({ error: "Entre une adresse email valide." }, { status: 400 });
  }

  const response = await fetch("https://api.brevo.com/v3/contacts", {
    method: "POST",
    headers: {
      accept: "application/json",
      "api-key": apiKey,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      email,
      listIds: [listId],
      updateEnabled: true,
      attributes: { SOURCE: "Ayiba website" },
    }),
  });

  if (response.ok || response.status === 201) {
    return NextResponse.json({ ok: true });
  }

  if (response.status === 400) {
    const errorBody = await response.text();
    if (errorBody.toLowerCase().includes("already exists")) {
      return NextResponse.json({ ok: true });
    }
  }

  return NextResponse.json(
    { error: "Impossible de confirmer ton inscription pour le moment." },
    { status: 502 },
  );
}
