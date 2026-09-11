import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, isSupabaseConfigured } from "@/lib/supabase-server";

async function getRestaurant(slug: string) {
  if (!isSupabaseConfigured) return null;
  const { data } = await supabaseAdmin
    .from("restaurants")
    .select("id, name, address, phone, logo_url, settings, billing_config, mp_access_token")
    .eq("slug", slug)
    .eq("is_active", true)
    .single();
  return data;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: { slug: string } }
) {
  const restaurant = await getRestaurant(params.slug);
  if (!restaurant) {
    return NextResponse.json({ error: "Restaurante no encontrado" }, { status: 404 });
  }

  const bc = (restaurant.billing_config || {}) as Record<string, unknown>;

  return NextResponse.json({
    restaurant: {
      name: restaurant.name,
      address: restaurant.address || "",
      phone: restaurant.phone || "",
      logo_url: restaurant.logo_url || "",
      settings: restaurant.settings || { currency: "ARS", timezone: "America/Argentina/Buenos_Aires" },
      billing_config: {
        billing_type: bc.billing_type || "end_of_day",
        cuit: bc.cuit || "",
        razon_social: bc.razon_social || "",
        punto_venta: bc.punto_venta || "",
        environment: bc.environment || "testing",
        has_cert: !!bc.cert,
        has_key: !!bc.key,
      },
      has_mp: !!restaurant.mp_access_token,
    },
  });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  if (!isSupabaseConfigured) {
    return NextResponse.json({ error: "DB no configurada" }, { status: 503 });
  }

  const restaurant = await getRestaurant(params.slug);
  if (!restaurant) {
    return NextResponse.json({ error: "Restaurante no encontrado" }, { status: 404 });
  }

  const body = await request.json();

  const updates: Record<string, unknown> = {};
  if (body.name !== undefined) updates.name = body.name;
  if (body.address !== undefined) updates.address = body.address;
  if (body.phone !== undefined) updates.phone = body.phone;
  if (body.logo_url !== undefined) updates.logo_url = body.logo_url;
  if (body.settings !== undefined) updates.settings = body.settings;
  if (body.billing_config !== undefined) {
    const existing = (restaurant.billing_config || {}) as Record<string, unknown>;
    const incoming = body.billing_config as Record<string, unknown>;
    const merged = { ...existing, ...incoming };
    delete merged.has_cert;
    delete merged.has_key;
    if (!incoming.cert) merged.cert = existing.cert;
    if (!incoming.key) merged.key = existing.key;
    updates.billing_config = merged;
  }
  if (body.mp_access_token !== undefined) updates.mp_access_token = body.mp_access_token || null;

  const { error } = await supabaseAdmin
    .from("restaurants")
    .update(updates)
    .eq("id", restaurant.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
