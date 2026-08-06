import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, isSupabaseConfigured } from "@/lib/supabase-server";

async function getRestaurantId(slug: string): Promise<string | null> {
  if (!isSupabaseConfigured) return null;
  const { data } = await supabaseAdmin
    .from("restaurants")
    .select("id")
    .eq("slug", slug)
    .eq("is_active", true)
    .single();
  return data?.id ?? null;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: { slug: string } }
) {
  const restaurantId = await getRestaurantId(params.slug);
  if (!restaurantId) {
    return NextResponse.json({ error: "Restaurante no encontrado" }, { status: 404 });
  }

  const { data } = await supabaseAdmin
    .from("categories")
    .select("*")
    .eq("restaurant_id", restaurantId)
    .eq("is_active", true)
    .order("display_order", { ascending: true });

  return NextResponse.json({ categories: data ?? [] });
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

  if (!body.name) {
    return NextResponse.json({ error: "Nombre requerido" }, { status: 400 });
  }

  const { count } = await supabaseAdmin
    .from("categories")
    .select("*", { count: "exact", head: true })
    .eq("restaurant_id", restaurantId)
    .eq("is_active", true);

  const { data, error } = await supabaseAdmin
    .from("categories")
    .insert({
      restaurant_id: restaurantId,
      name: body.name,
      display_order: (count ?? 0) + 1,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ category: data }, { status: 201 });
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
  if (body.name !== undefined) updates.name = body.name;
  if (body.display_order !== undefined) updates.display_order = body.display_order;

  const { data, error } = await supabaseAdmin
    .from("categories")
    .update(updates)
    .eq("id", body.id)
    .eq("restaurant_id", restaurantId)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ category: data });
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

  const { id } = await request.json();

  if (!id) {
    return NextResponse.json({ error: "id es requerido" }, { status: 400 });
  }

  // Check if category has products
  const { count } = await supabaseAdmin
    .from("products")
    .select("*", { count: "exact", head: true })
    .eq("category_id", id)
    .eq("restaurant_id", restaurantId);

  if (count && count > 0) {
    return NextResponse.json(
      { error: "No se puede eliminar una categoría con productos. Eliminá los productos primero." },
      { status: 400 }
    );
  }

  const { error } = await supabaseAdmin
    .from("categories")
    .delete()
    .eq("id", id)
    .eq("restaurant_id", restaurantId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ deleted: true });
}
