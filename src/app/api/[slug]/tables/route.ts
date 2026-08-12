import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, isSupabaseConfigured } from "@/lib/supabase-server";
import { DEMO_TABLES } from "@/lib/demo-data";
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
    return NextResponse.json({ tables: DEMO_TABLES });
  }

  const { data } = await supabaseAdmin
    .from("tables")
    .select("*")
    .eq("restaurant_id", restaurantId)
    .eq("is_active", true)
    .order("table_number", { ascending: true });

  return NextResponse.json({ tables: data ?? [] });
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
  const { data, error } = await supabaseAdmin
    .from("tables")
    .insert({
      restaurant_id: restaurantId,
      table_number: body.table_number,
      x: body.x ?? 100,
      y: body.y ?? 100,
      width: body.width ?? 80,
      height: body.height ?? 80,
      shape: body.shape ?? "square",
      capacity: body.capacity ?? 4,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ table: data }, { status: 201 });
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
    return NextResponse.json({ error: "id requerido" }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from("tables")
    .update({
      table_number: body.table_number,
      x: body.x,
      y: body.y,
      width: body.width,
      height: body.height,
      shape: body.shape,
      capacity: body.capacity,
    })
    .eq("id", body.id)
    .eq("restaurant_id", restaurantId)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ table: data });
}

export async function DELETE(
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

  const { searchParams } = new URL(request.url);
  const tableId = searchParams.get("id");

  if (!tableId) {
    return NextResponse.json({ error: "id requerido" }, { status: 400 });
  }

  const { error } = await supabaseAdmin
    .from("tables")
    .update({ is_active: false })
    .eq("id", tableId)
    .eq("restaurant_id", restaurantId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
