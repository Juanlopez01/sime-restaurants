import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { getRestaurantId } from "@/lib/restaurant";

export async function PUT(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  const restaurantId = await getRestaurantId(params.slug);
  if (!restaurantId) {
    return NextResponse.json({ error: "Restaurante no encontrado" }, { status: 404 });
  }

  const body = await request.json();
  const { item_id, status } = body;

  if (!item_id || !status) {
    return NextResponse.json({ error: "item_id y status requeridos" }, { status: 400 });
  }

  const { data: item, error } = await supabaseAdmin
    .from("order_items")
    .update({ status })
    .eq("id", item_id)
    .select("*, order:orders(id, restaurant_id, status, table_id, waiter_id)")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const orderId = (item.order as { id: string }).id;
  const orderRestaurantId = (item.order as { restaurant_id: string }).restaurant_id;
  if (orderRestaurantId !== restaurantId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  if (status === "ready") {
    const { data: allItems } = await supabaseAdmin
      .from("order_items")
      .select("status")
      .eq("order_id", orderId);

    const allReady = (allItems ?? []).every((i) => i.status === "ready" || i.status === "delivered");
    if (allReady) {
      await supabaseAdmin
        .from("orders")
        .update({ status: "ready", updated_at: new Date().toISOString() })
        .eq("id", orderId);
    }
  }

  return NextResponse.json({ item });
}

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  const restaurantId = await getRestaurantId(params.slug);
  if (!restaurantId) {
    return NextResponse.json({ error: "Restaurante no encontrado" }, { status: 404 });
  }

  const { searchParams } = new URL(request.url);
  const station = searchParams.get("station");

  const { data: orders } = await supabaseAdmin
    .from("orders")
    .select("id, order_number, status, created_at, notes, table:tables(id, table_number), waiter:users!orders_waiter_id_fkey(id, name)")
    .eq("restaurant_id", restaurantId)
    .in("status", ["pending", "in_kitchen", "ready"])
    .order("created_at", { ascending: true });

  if (!orders || orders.length === 0) {
    return NextResponse.json({ orders: [] });
  }

  const orderIds = orders.map((o) => o.id);

  const itemsQuery = supabaseAdmin
    .from("order_items")
    .select("*, product:products(id, category_id, category:categories(id, station))")
    .in("order_id", orderIds)
    .in("status", ["pending", "preparing", "ready"]);

  const { data: items } = await itemsQuery;

  const filteredItems = station
    ? (items ?? []).filter((item) => {
        const cat = (item.product as { category: { station?: string } | null })?.category;
        const itemStation = cat?.station ?? "cocina";
        return itemStation === station;
      })
    : items ?? [];

  const orderMap = new Map(orders.map((o) => [o.id, o]));
  const grouped: Record<string, { order: typeof orders[0]; items: typeof filteredItems }> = {};

  for (const item of filteredItems) {
    if (!grouped[item.order_id]) {
      const order = orderMap.get(item.order_id);
      if (order) {
        grouped[item.order_id] = { order, items: [] };
      }
    }
    if (grouped[item.order_id]) {
      grouped[item.order_id].items.push(item);
    }
  }

  const result = Object.values(grouped).filter((g) => g.items.length > 0);

  return NextResponse.json({ orders: result });
}
