import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, isSupabaseConfigured } from "@/lib/supabase-server";
import {
  getDemoOrdersByTable,
  updateDemoOrderStatus,
} from "@/lib/demo-orders";
import type { PaymentMethod } from "@/types";

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

export async function POST(
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

  const body = await request.json();
  const { table_id, method, amount, tip } = body as {
    table_id: string;
    method: PaymentMethod;
    amount: number;
    tip?: number;
  };

  if (!table_id || !method || !amount) {
    return NextResponse.json(
      { error: "table_id, method y amount requeridos" },
      { status: 400 }
    );
  }

  if (!isSupabaseConfigured) {
    const tableOrders = getDemoOrdersByTable(table_id);
    tableOrders.forEach((o) => updateDemoOrderStatus(o.id, "delivered"));
    return NextResponse.json({
      payment: {
        id: `pay-${Date.now()}`,
        restaurant_id: restaurantId,
        method,
        amount,
        status: "completed",
        created_at: new Date().toISOString(),
      },
    });
  }

  const { data: activeOrders } = await supabaseAdmin
    .from("orders")
    .select("id")
    .eq("restaurant_id", restaurantId)
    .eq("table_id", table_id)
    .in("status", ["pending", "in_kitchen", "ready"]);

  if (!activeOrders || activeOrders.length === 0) {
    return NextResponse.json(
      { error: "No hay pedidos activos en esta mesa" },
      { status: 400 }
    );
  }

  const orderId = activeOrders[0].id;

  const insertData: Record<string, unknown> = {
    restaurant_id: restaurantId,
    order_id: orderId,
    cashier_id: body.cashier_id ?? null,
    method,
    amount,
    status: "completed",
  };
  if (tip && tip > 0) {
    insertData.tip = tip;
  }

  const { data: payment, error } = await supabaseAdmin
    .from("payments")
    .insert(insertData)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  for (const order of activeOrders) {
    await supabaseAdmin
      .from("orders")
      .update({ status: "delivered" })
      .eq("id", order.id);
  }

  return NextResponse.json({ payment });
}
