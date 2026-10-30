import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient as createServiceClient, type SupabaseClient } from "@supabase/supabase-js";

export function getDeliveryServerConfig() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !anonKey || !serviceRoleKey) return null;
  return { supabaseUrl, anonKey, serviceRoleKey };
}

export async function getDeliveryUser(req: NextRequest) {
  const config = getDeliveryServerConfig();
  if (!config) {
    return { error: NextResponse.json({ error: "Configuration serveur incomplète." }, { status: 500 }) } as const;
  }

  const cookieClient = createServerClient(config.supabaseUrl, config.anonKey, {
    cookies: { getAll: () => req.cookies.getAll(), setAll: () => {} },
  });
  const { data: { user } } = await cookieClient.auth.getUser();
  if (!user) return { error: NextResponse.json({ error: "Connecte-toi pour continuer." }, { status: 401 }) } as const;

  const admin = createServiceClient(config.supabaseUrl, config.serviceRoleKey);
  return { user, cookieClient, admin, config } as const;
}

export async function getRouteDistanceServer(
  depart: { latitude: number; longitude: number },
  destination: { latitude: number; longitude: number },
) {
  const apiKey = process.env.ORS_API_KEY;
  if (!apiKey) return null;
  try {
    const url = new URL("https://api.heigit.org/openrouteservice/v2/directions/driving-car");
    url.searchParams.set("api_key", apiKey);
    url.searchParams.set("start", `${depart.longitude},${depart.latitude}`);
    url.searchParams.set("end", `${destination.longitude},${destination.latitude}`);
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) return null;
    const data = await response.json();
    const distance = data?.routes?.[0]?.summary?.distance;
    return typeof distance === "number" ? distance / 1000 : null;
  } catch {
    return null;
  }
}

export function asSupabaseError(error: { message?: string } | null, fallback: string) {
  return error?.message || fallback;
}

export type DeliverySupabaseAdmin = SupabaseClient;
