import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, isSupabaseConfigured } from "@/lib/supabase-server";
import { DEMO_TABLES } from "@/lib/demo-data";
import { getDemoOrdersByTable } from "@/lib/demo-orders";
import type { TableWithStatus } from "@/types";

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
    const tablesWithStatus: TableWithStatus[] = DEMO_TABLES.map((t) => {
      const activeOrders = getDemoOrdersByTable(t.id);
      const hasReady = activeOrders.some((o) => o.status === "ready");
      return {
        ...t,
        current_order: activeOrders[0] ?? null,
        has_open_bill: hasReady,
      };
    });
    return NextResponse.json({ tables: tablesWithStatus });
  }

  const { data: tables } = await supabaseAdmin
    .from("tables")
    .select("*")
    .eq("restaurant_id", restaurantId)
    .eq("is_active", true)
    .order("table_number", { ascending: true });

  if (!tables) {
    return NextResponse.json({ tables: [] });
  }

  const { data: activeOrders } = await supabaseAdmin
    .from("orders")
    .select("id, table_id, status, subtotal")
    .eq("restaurant_id", restaurantId)
    .in("status", ["pending", "in_kitchen", "ready"]);

  const ordersByTable = new Map<string, (typeof activeOrders extends (infer T)[] | null ? T : never)[]>();
  activeOrders?.forEach((o) => {
    const existing = ordersByTable.get(o.table_id) ?? [];
    existing.push(o);
    ordersByTable.set(o.table_id, existing);
  });

  const tablesWithStatus: TableWithStatus[] = tables.map((t) => {
    const tableOrders = ordersByTable.get(t.id) ?? [];
    return {
      ...t,
      current_order: tableOrders[0] ?? null,
      has_open_bill: tableOrders.length > 0,
    };
  });

  return NextResponse.json({ tables: tablesWithStatus });
}
