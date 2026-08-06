import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, isSupabaseConfigured } from "@/lib/supabase-server";

async function getRestaurant(slug: string) {
  if (!isSupabaseConfigured) return null;
  const { data } = await supabaseAdmin
    .from("restaurants")
    .select("id, name, address, phone, settings, billing_config")
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

  return NextResponse.json({
    restaurant: {
      name: restaurant.name,
      address: restaurant.address || "",
      phone: restaurant.phone || "",
      settings: restaurant.settings || { currency: "ARS", timezone: "America/Argentina/Buenos_Aires" },
      billing_config: restaurant.billing_config || {},
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
  if (body.settings !== undefined) updates.settings = body.settings;
  if (body.billing_config !== undefined) updates.billing_config = body.billing_config;

  const { error } = await supabaseAdmin
    .from("restaurants")
    .update(updates)
    .eq("id", restaurant.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
