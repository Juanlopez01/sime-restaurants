import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, isSupabaseConfigured } from "@/lib/supabase-server";

async function getRestaurantId(slug: string): Promise<string | null> {
  if (!isSupabaseConfigured) {
    return slug === "la-ribera" ? "demo-la-ribera" : null;
  }
  const { data } = await supabaseAdmin
    .from("restaurants")
    .select("id")
    .eq("slug", slug)
    .eq("is_active", true)
    .single();
  return data?.id ?? null;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  const restaurantId = await getRestaurantId(params.slug);
  if (!restaurantId) {
    return NextResponse.json(
      { error: "Restaurante no encontrado" },
      { status: 404 }
    );
  }

  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  if (!from || !to) {
    return NextResponse.json(
      { error: "Parámetros from y to son obligatorios" },
      { status: 400 }
    );
  }

  if (!isSupabaseConfigured) {
    return NextResponse.json({ report: getDemoReport(from, to) });
  }

  const fromDate = `${from}T00:00:00`;
  const toDate = `${to}T23:59:59`;

  const [ordersRes, paymentsRes, itemsRes] = await Promise.all([
    supabaseAdmin
      .from("orders")
      .select("id, status, subtotal, waiter_id, created_at, users!orders_waiter_id_fkey(name)")
      .eq("restaurant_id", restaurantId)
      .neq("status", "cancelled")
      .gte("created_at", fromDate)
      .lte("created_at", toDate),
    supabaseAdmin
      .from("payments")
      .select("method, amount, created_at")
      .eq("restaurant_id", restaurantId)
      .eq("status", "completed")
      .gte("created_at", fromDate)
      .lte("created_at", toDate),
    supabaseAdmin
      .from("order_items")
      .select("product_name, unit_price, quantity, order_id, orders!inner(restaurant_id, created_at, status)")
      .eq("orders.restaurant_id", restaurantId)
      .neq("orders.status", "cancelled")
      .gte("orders.created_at", fromDate)
      .lte("orders.created_at", toDate),
  ]);

  const orders = ordersRes.data ?? [];
  const payments = paymentsRes.data ?? [];
  const items = itemsRes.data ?? [];

  const delivered = orders.filter((o) => o.status === "delivered");
  const totalSales = delivered.reduce((sum, o) => sum + Number(o.subtotal), 0);
  const totalOrders = orders.length;
  const avgTicket = totalOrders > 0 ? totalSales / totalOrders : 0;

  // Daily sales
  const dailyMap = new Map<string, { sales: number; orders: number }>();
  for (const order of orders) {
    const day = order.created_at.split("T")[0];
    const entry = dailyMap.get(day) ?? { sales: 0, orders: 0 };
    if (order.status === "delivered") {
      entry.sales += Number(order.subtotal);
    }
    entry.orders++;
    dailyMap.set(day, entry);
  }
  const dailySales = Array.from(dailyMap.entries())
    .map(([date, data]) => ({ date, ...data }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // Payments by method
  const methodMap = new Map<string, number>();
  for (const p of payments) {
    methodMap.set(p.method, (methodMap.get(p.method) ?? 0) + Number(p.amount));
  }
  const paymentsByMethod = Array.from(methodMap.entries())
    .map(([method, amount]) => ({ method, amount }))
    .sort((a, b) => b.amount - a.amount);

  // Top products
  const productMap = new Map<string, { name: string; quantity: number; revenue: number }>();
  for (const item of items) {
    const entry = productMap.get(item.product_name) ?? {
      name: item.product_name,
      quantity: 0,
      revenue: 0,
    };
    entry.quantity += item.quantity;
    entry.revenue += Number(item.unit_price) * item.quantity;
    productMap.set(item.product_name, entry);
  }
  const topProducts = Array.from(productMap.values())
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 10);

  // Hourly distribution
  const hourMap = new Map<number, number>();
  for (const order of orders) {
    const hour = new Date(order.created_at).getHours();
    hourMap.set(hour, (hourMap.get(hour) ?? 0) + 1);
  }
  const hourlyDistribution = Array.from({ length: 24 }, (_, h) => ({
    hour: h,
    orders: hourMap.get(h) ?? 0,
  }));

  // Waiter stats
  const waiterMap = new Map<string, { name: string; orders: number; sales: number }>();
  for (const order of orders) {
    const waiterName =
      (order.users as unknown as { name: string } | null)?.name ?? "Sin asignar";
    const waiterId = order.waiter_id ?? "none";
    const entry = waiterMap.get(waiterId) ?? { name: waiterName, orders: 0, sales: 0 };
    entry.orders++;
    if (order.status === "delivered") {
      entry.sales += Number(order.subtotal);
    }
    waiterMap.set(waiterId, entry);
  }
  const waiterStats = Array.from(waiterMap.values()).sort(
    (a, b) => b.sales - a.sales
  );

  return NextResponse.json({
    report: {
      totals: {
        sales: totalSales,
        orders: totalOrders,
        avg_ticket: avgTicket,
        delivered: delivered.length,
      },
      daily_sales: dailySales,
      payments_by_method: paymentsByMethod,
      top_products: topProducts,
      hourly_distribution: hourlyDistribution,
      waiter_stats: waiterStats,
    },
  });
}

function getDemoReport(from: string, to: string) {
  const days: { date: string; sales: number; orders: number }[] = [];
  const start = new Date(from);
  const end = new Date(to);

  let totalSales = 0;
  let totalOrders = 0;

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const sales = Math.round(15000 + Math.random() * 35000);
    const orders = Math.round(8 + Math.random() * 20);
    days.push({
      date: d.toISOString().split("T")[0],
      sales,
      orders,
    });
    totalSales += sales;
    totalOrders += orders;
  }

  return {
    totals: {
      sales: totalSales,
      orders: totalOrders,
      avg_ticket: totalOrders > 0 ? totalSales / totalOrders : 0,
      delivered: totalOrders,
    },
    daily_sales: days,
    payments_by_method: [
      { method: "cash", amount: totalSales * 0.45 },
      { method: "card", amount: totalSales * 0.25 },
      { method: "mp", amount: totalSales * 0.2 },
      { method: "transfer", amount: totalSales * 0.1 },
    ],
    top_products: [
      { name: "Bife de chorizo", quantity: 45, revenue: 67500 },
      { name: "Empanadas x6", quantity: 38, revenue: 30400 },
      { name: "Ensalada Caesar", quantity: 32, revenue: 22400 },
      { name: "Milanesa napolitana", quantity: 28, revenue: 36400 },
      { name: "Flan casero", quantity: 25, revenue: 12500 },
      { name: "Agua mineral", quantity: 22, revenue: 4400 },
      { name: "Provoleta", quantity: 20, revenue: 18000 },
      { name: "Vino Malbec", quantity: 18, revenue: 27000 },
    ],
    hourly_distribution: Array.from({ length: 24 }, (_, h) => ({
      hour: h,
      orders: h >= 11 && h <= 15 ? Math.round(3 + Math.random() * 5) :
              h >= 19 && h <= 23 ? Math.round(4 + Math.random() * 8) : 0,
    })),
    waiter_stats: [
      { name: "Carlos", orders: 35, sales: 52500 },
      { name: "María", orders: 28, sales: 42000 },
      { name: "Pedro", orders: 22, sales: 33000 },
    ],
  };
}
