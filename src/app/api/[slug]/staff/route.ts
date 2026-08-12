import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, isSupabaseConfigured } from "@/lib/supabase-server";
import { DEMO_USERS } from "@/lib/demo-data";
import { getRestaurantId } from "@/lib/restaurant";

export async function GET(
  _request: NextRequest,
  { params }: { params: { slug: string } }
) {
  const restaurantId = await getRestaurantId(params.slug);
  if (!restaurantId) {
    return NextResponse.json({ error: "Restaurante no encontrado" }, { status: 404 });
  }

  if (!isSupabaseConfigured) {
    const staff = DEMO_USERS.filter((u) => u.is_active).map((u) => ({
      id: u.id,
      name: u.name,
      role: u.role,
      pin: u.pin,
      is_active: u.is_active,
    }));
    return NextResponse.json({ staff });
  }

  const { data } = await supabaseAdmin
    .from("users")
    .select("id, name, role, pin, is_active")
    .eq("restaurant_id", restaurantId)
    .order("created_at", { ascending: true });

  return NextResponse.json({ staff: data ?? [] });
}

export async function POST(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  if (!isSupabaseConfigured) {
    return NextResponse.json({ error: "DB no configurada" }, { status: 503 });
  }

  const restaurantId = await getRestaurantId(params.slug);
  if (!restaurantId) {
    return NextResponse.json({ error: "Restaurante no encontrado" }, { status: 404 });
  }

  const body = await request.json();

  if (!body.name || !body.role || !body.pin) {
    return NextResponse.json({ error: "name, role y pin son requeridos" }, { status: 400 });
  }

  const validRoles = ["waiter", "kitchen", "cashier", "admin"];
  if (!validRoles.includes(body.role)) {
    return NextResponse.json({ error: "Rol inválido" }, { status: 400 });
  }

  if (body.pin.length < 4) {
    return NextResponse.json({ error: "El PIN debe tener al menos 4 dígitos" }, { status: 400 });
  }

  const { data: existing } = await supabaseAdmin
    .from("users")
    .select("id")
    .eq("restaurant_id", restaurantId)
    .eq("pin", body.pin)
    .eq("is_active", true)
    .single();

  if (existing) {
    return NextResponse.json({ error: "Ya existe un usuario con ese PIN" }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from("users")
    .insert({
      restaurant_id: restaurantId,
      name: body.name,
      role: body.role,
      pin: body.pin,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ user: data }, { status: 201 });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  if (!isSupabaseConfigured) {
    return NextResponse.json({ error: "DB no configurada" }, { status: 503 });
  }

  const restaurantId = await getRestaurantId(params.slug);
  if (!restaurantId) {
    return NextResponse.json({ error: "Restaurante no encontrado" }, { status: 404 });
  }

  const body = await request.json();

  if (!body.id) {
    return NextResponse.json({ error: "id es requerido" }, { status: 400 });
  }

  const updates: Record<string, unknown> = {};
  if (body.is_active !== undefined) updates.is_active = body.is_active;
  if (body.name !== undefined) updates.name = body.name;
  if (body.role !== undefined) updates.role = body.role;

  const { data, error } = await supabaseAdmin
    .from("users")
    .update(updates)
    .eq("id", body.id)
    .eq("restaurant_id", restaurantId)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ user: data });
}
