import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, isSupabaseConfigured } from "@/lib/supabase-server";
import { DEMO_MENU } from "@/lib/demo-data";

export async function GET(
  _request: NextRequest,
  { params }: { params: { slug: string } }
) {
  if (!isSupabaseConfigured) {
    if (params.slug !== "la-ribera") {
      return NextResponse.json(
        { error: "Restaurante no encontrado" },
        { status: 404 }
      );
    }
    return NextResponse.json({ menu: DEMO_MENU });
  }

  const { data: restaurant } = await supabaseAdmin
    .from("restaurants")
    .select("id")
    .eq("slug", params.slug)
    .eq("is_active", true)
    .single();

  if (!restaurant) {
    return NextResponse.json(
      { error: "Restaurante no encontrado" },
      { status: 404 }
    );
  }

  const { data: categories } = await supabaseAdmin
    .from("categories")
    .select("id, name, display_order")
    .eq("restaurant_id", restaurant.id)
    .eq("is_active", true)
    .order("display_order", { ascending: true });

  const { data: products } = await supabaseAdmin
    .from("products")
    .select(
      "id, category_id, name, description, price, image_url, is_available, display_order"
    )
    .eq("restaurant_id", restaurant.id)
    .order("display_order", { ascending: true });

  const menu = (categories ?? []).map((cat) => ({
    ...cat,
    products: (products ?? []).filter((p) => p.category_id === cat.id),
  }));

  return NextResponse.json(
    { menu },
    {
      headers: {
        "Cache-Control":
          "public, s-maxage=30, stale-while-revalidate=60",
      },
    }
  );
}

export async function POST(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  if (!isSupabaseConfigured) {
    return NextResponse.json({ error: "DB no configurada" }, { status: 503 });
  }

  const { data: restaurant } = await supabaseAdmin
    .from("restaurants")
    .select("id")
    .eq("slug", params.slug)
    .eq("is_active", true)
    .single();

  if (!restaurant) {
    return NextResponse.json({ error: "Restaurante no encontrado" }, { status: 404 });
  }

  const body = await request.json();

  if (!body.name || !body.category_id || body.price == null) {
    return NextResponse.json({ error: "name, category_id y price son requeridos" }, { status: 400 });
  }

  const { count } = await supabaseAdmin
    .from("products")
    .select("*", { count: "exact", head: true })
    .eq("category_id", body.category_id);

  const { data, error } = await supabaseAdmin
    .from("products")
    .insert({
      restaurant_id: restaurant.id,
      category_id: body.category_id,
      name: body.name,
      description: body.description || null,
      price: body.price,
      display_order: (count ?? 0) + 1,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ product: data }, { status: 201 });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  if (!isSupabaseConfigured) {
    return NextResponse.json({ error: "DB no configurada" }, { status: 503 });
  }

  const { data: restaurant } = await supabaseAdmin
    .from("restaurants")
    .select("id")
    .eq("slug", params.slug)
    .eq("is_active", true)
    .single();

  if (!restaurant) {
    return NextResponse.json({ error: "Restaurante no encontrado" }, { status: 404 });
  }

  const body = await request.json();

  if (!body.id) {
    return NextResponse.json({ error: "id es requerido" }, { status: 400 });
  }

  const updates: Record<string, unknown> = {};
  if (body.name !== undefined) updates.name = body.name;
  if (body.price !== undefined) updates.price = body.price;
  if (body.description !== undefined) updates.description = body.description;
  if (body.is_available !== undefined) updates.is_available = body.is_available;
  if (body.image_url !== undefined) updates.image_url = body.image_url;

  const { data, error } = await supabaseAdmin
    .from("products")
    .update(updates)
    .eq("id", body.id)
    .eq("restaurant_id", restaurant.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ product: data });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  if (!isSupabaseConfigured) {
    return NextResponse.json({ error: "DB no configurada" }, { status: 503 });
  }

  const { data: restaurant } = await supabaseAdmin
    .from("restaurants")
    .select("id")
    .eq("slug", params.slug)
    .eq("is_active", true)
    .single();

  if (!restaurant) {
    return NextResponse.json({ error: "Restaurante no encontrado" }, { status: 404 });
  }

  const { id } = await request.json();

  if (!id) {
    return NextResponse.json({ error: "id es requerido" }, { status: 400 });
  }

  const { error } = await supabaseAdmin
    .from("products")
    .delete()
    .eq("id", id)
    .eq("restaurant_id", restaurant.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ deleted: true });
}
