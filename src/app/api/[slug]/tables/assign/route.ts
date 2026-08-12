import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, isSupabaseConfigured } from "@/lib/supabase-server";
import { DEMO_TABLES } from "@/lib/demo-data";
import { getRestaurantId } from "@/lib/restaurant";

export async function PUT(
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
  const { table_id, waiter_id } = body;

  if (!table_id) {
    return NextResponse.json(
      { error: "table_id requerido" },
      { status: 400 }
    );
  }

  if (!isSupabaseConfigured) {
    const table = DEMO_TABLES.find((t) => t.id === table_id);
    if (table) {
      table.assigned_waiter_id = waiter_id || null;
    }
    return NextResponse.json({ ok: true });
  }

  const { error } = await supabaseAdmin
    .from("tables")
    .update({ assigned_waiter_id: waiter_id || null })
    .eq("id", table_id)
    .eq("restaurant_id", restaurantId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
