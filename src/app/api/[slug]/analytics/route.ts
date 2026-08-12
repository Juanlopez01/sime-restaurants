import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { getRestaurantId } from "@/lib/restaurant";

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  const restaurantId = await getRestaurantId(params.slug);
  if (!restaurantId) {
    return NextResponse.json({ error: "Restaurante no encontrado" }, { status: 404 });
  }

  const { searchParams } = new URL(request.url);
  const days = parseInt(searchParams.get("days") ?? "30", 10);
  const since = new Date(Date.now() - days * 86400000).toISOString();

  const { data: orders } = await supabaseAdmin
    .from("orders")
    .select("id, table_id, status, subtotal, created_at, table:tables(table_number)")
    .eq("restaurant_id", restaurantId)
    .gte("created_at", since)
    .in("status", ["delivered", "ready", "in_kitchen", "pending"])
    .order("created_at", { ascending: false });

  const { data: orderItems } = await supabaseAdmin
    .from("order_items")
    .select("product_name, quantity, unit_price, order_id")
    .in("order_id", (orders ?? []).map((o) => o.id));

  const tableStats: Record<string, { table_number: string; total_orders: number; total_spent: number; last_visit: string }> = {};
  for (const o of orders ?? []) {
    const tn = (o.table as unknown as { table_number: string } | null)?.table_number ?? "?";
    if (!tableStats[o.table_id]) {
      tableStats[o.table_id] = { table_number: tn, total_orders: 0, total_spent: 0, last_visit: o.created_at };
    }
    tableStats[o.table_id].total_orders++;
    tableStats[o.table_id].total_spent += Number(o.subtotal);
    if (o.created_at > tableStats[o.table_id].last_visit) {
      tableStats[o.table_id].last_visit = o.created_at;
    }
  }

  const productCounts: Record<string, { name: string; quantity: number; revenue: number }> = {};
  for (const item of orderItems ?? []) {
    if (!productCounts[item.product_name]) {
      productCounts[item.product_name] = { name: item.product_name, quantity: 0, revenue: 0 };
    }
    productCounts[item.product_name].quantity += item.quantity;
    productCounts[item.product_name].revenue += item.quantity * Number(item.unit_price);
  }

  const topProducts = Object.values(productCounts)
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 15);

  const tableRanking = Object.values(tableStats)
    .sort((a, b) => b.total_spent - a.total_spent)
    .slice(0, 15);

  const hourCounts = new Array(24).fill(0);
  for (const o of orders ?? []) {
    const h = new Date(o.created_at).getHours();
    hourCounts[h]++;
  }

  const dayCounts: Record<string, number> = {};
  for (const o of orders ?? []) {
    const d = new Date(o.created_at).toLocaleDateString("es-AR", { weekday: "long" });
    dayCounts[d] = (dayCounts[d] ?? 0) + 1;
  }

  return NextResponse.json({
    period_days: days,
    total_orders: (orders ?? []).length,
    top_products: topProducts,
    table_ranking: tableRanking,
    orders_by_hour: hourCounts,
    orders_by_day: dayCounts,
  });
}
