import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, isSupabaseConfigured } from "@/lib/supabase-server";
import { getRestaurantId } from "@/lib/restaurant";

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  const restaurantId = await getRestaurantId(params.slug);
  if (!restaurantId) {
    return NextResponse.json({ error: "Restaurante no encontrado" }, { status: 404 });
  }

  if (!isSupabaseConfigured) {
    return NextResponse.json({ product_ingredients: [] });
  }

  const { searchParams } = new URL(request.url);
  const productId = searchParams.get("product_id");

  let query = supabaseAdmin
    .from("product_ingredients")
    .select("*, ingredient:ingredients(id, name, unit, current_stock)");

  if (productId) {
    query = query.eq("product_id", productId);
  }

  const { data } = await query;

  return NextResponse.json({ product_ingredients: data ?? [] });
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
  const { product_id, ingredient_id, quantity_needed } = body;

  if (!product_id || !ingredient_id) {
    return NextResponse.json({ error: "product_id e ingredient_id requeridos" }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from("product_ingredients")
    .upsert(
      {
        product_id,
        ingredient_id,
        quantity_needed: quantity_needed ?? 1,
      },
      { onConflict: "product_id,ingredient_id" }
    )
    .select("*, ingredient:ingredients(id, name, unit)")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ product_ingredient: data }, { status: 201 });
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
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "id requerido" }, { status: 400 });
  }

  const { error } = await supabaseAdmin
    .from("product_ingredients")
    .delete()
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
