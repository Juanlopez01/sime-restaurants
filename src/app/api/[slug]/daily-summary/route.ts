import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, isSupabaseConfigured } from "@/lib/supabase-server";
import { getDemoOrders } from "@/lib/demo-orders";
import { getRestaurantId } from "@/lib/restaurant";

export async function GET(
  _request: NextRequest,
  { params }: { params: { slug: string } }
) {
  const restaurantId = await getRestaurantId(params.slug);
  if (!restaurantId) {
    return NextResponse.json(
      { error: "Restaurante no encontrado" },
      { status: 404 }
    );
  }

  if (!isSupabaseConfigured) {
    const allOrders = getDemoOrders();
    const delivered = allOrders.filter((o) => o.status === "delivered");
    const active = allOrders.filter(
      (o) =>
        o.status === "pending" ||
        o.status === "in_kitchen" ||
        o.status === "ready"
    );

    const totalSales = delivered.reduce((sum, o) => sum + o.subtotal, 0);
    const activeSales = active.reduce((sum, o) => sum + o.subtotal, 0);

    return NextResponse.json({
      summary: {
        date: new Date().toISOString().split("T")[0],
        total_orders: allOrders.filter((o) => o.status !== "cancelled").length,
        total_delivered: delivered.length,
        total_active: active.length,
        total_sales: totalSales,
        active_sales: activeSales,
        grand_total: totalSales + activeSales,
        payments_by_method: {
          cash: totalSales,
          card: 0,
          mp: 0,
          transfer: 0,
        },
        invoiced_amount: 0,
      },
    });
  }

  const today = new Date().toISOString().split("T")[0];

  const { data: orders } = await supabaseAdmin
    .from("orders")
    .select("id, status, subtotal")
    .eq("restaurant_id", restaurantId)
    .gte("created_at", `${today}T00:00:00`)
    .lt("created_at", `${today}T23:59:59`);

  const { data: payments } = await supabaseAdmin
    .from("payments")
    .select("method, amount, status")
    .eq("restaurant_id", restaurantId)
    .eq("status", "completed")
    .gte("created_at", `${today}T00:00:00`);

  const { data: invoices } = await supabaseAdmin
    .from("invoices")
    .select("total")
    .eq("restaurant_id", restaurantId)
    .gte("created_at", `${today}T00:00:00`);

  const allOrders = orders ?? [];
  const delivered = allOrders.filter((o) => o.status === "delivered");
  const active = allOrders.filter(
    (o) =>
      o.status === "pending" ||
      o.status === "in_kitchen" ||
      o.status === "ready"
  );

  const paymentsByMethod: Record<string, number> = {};
  (payments ?? []).forEach((p) => {
    paymentsByMethod[p.method] =
      (paymentsByMethod[p.method] ?? 0) + p.amount;
  });

  const invoicedAmount = (invoices ?? []).reduce(
    (sum, i) => sum + i.total,
    0
  );

  return NextResponse.json({
    summary: {
      date: today,
      total_orders: allOrders.filter((o) => o.status !== "cancelled").length,
      total_delivered: delivered.length,
      total_active: active.length,
      total_sales: delivered.reduce((sum, o) => sum + o.subtotal, 0),
      active_sales: active.reduce((sum, o) => sum + o.subtotal, 0),
      grand_total: allOrders
        .filter((o) => o.status !== "cancelled")
        .reduce((sum, o) => sum + o.subtotal, 0),
      payments_by_method: paymentsByMethod,
      invoiced_amount: invoicedAmount,
    },
  });
}
