import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, isSupabaseConfigured } from "@/lib/supabase-server";
import { DEMO_TABLES } from "@/lib/demo-data";
import { getRestaurantId } from "@/lib/restaurant";

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
  const { table_number, items, notes } = body;

  if (!table_number || !items || items.length === 0) {
    return NextResponse.json(
      { error: "table_number e items requeridos" },
      { status: 400 }
    );
  }

  let tableId: string | null = null;

  if (!isSupabaseConfigured) {
    const demoTable = DEMO_TABLES.find(
      (t) => t.table_number === String(table_number)
    );
    tableId = demoTable?.id ?? null;
  } else {
    const { data: table } = await supabaseAdmin
      .from("tables")
      .select("id")
      .eq("restaurant_id", restaurantId)
      .eq("table_number", String(table_number))
      .eq("is_active", true)
      .single();
    tableId = table?.id ?? null;
  }

  if (!tableId) {
    return NextResponse.json(
      { error: "Mesa no encontrada" },
      { status: 404 }
    );
  }

  if (!isSupabaseConfigured) {
    const order = {
      id: `demo-cust-${Date.now()}`,
      restaurant_id: restaurantId,
      table_id: tableId,
      waiter_id: null,
      order_number: Math.floor(Math.random() * 900) + 100,
      status: "pending",
      notes: notes || null,
      subtotal: items.reduce(
        (sum: number, i: { unit_price: number; quantity: number }) =>
          sum + i.unit_price * i.quantity,
        0
      ),
      created_at: new Date().toISOString(),
    };
    return NextResponse.json({ order }, { status: 201 });
  }

  // Get or create a system user for customer self-orders
  let customerUserId: string;
  const { data: existingSystemUser } = await supabaseAdmin
    .from("users")
    .select("id")
    .eq("restaurant_id", restaurantId)
    .eq("name", "Pedido QR")
    .eq("is_active", false)
    .single();

  if (existingSystemUser) {
    customerUserId = existingSystemUser.id;
  } else {
    const { data: newUser, error: userError } = await supabaseAdmin
      .from("users")
      .insert({
        restaurant_id: restaurantId,
        name: "Pedido QR",
        role: "waiter",
        pin: "0000",
        is_active: false,
      })
      .select("id")
      .single();

    if (userError || !newUser) {
      return NextResponse.json(
        { error: "Error al configurar pedidos de cliente" },
        { status: 500 }
      );
    }
    customerUserId = newUser.id;
  }

  const subtotal = items.reduce(
    (sum: number, i: { unit_price: number; quantity: number }) =>
      sum + i.unit_price * i.quantity,
    0
  );

  const { data: order, error: orderError } = await supabaseAdmin
    .from("orders")
    .insert({
      restaurant_id: restaurantId,
      table_id: tableId,
      waiter_id: customerUserId,
      status: "pending",
      notes: notes ? `[Pedido desde QR] ${notes}` : "[Pedido desde QR]",
      subtotal,
    })
    .select()
    .single();

  if (orderError) {
    return NextResponse.json({ error: orderError.message }, { status: 400 });
  }

  const orderItems = items.map(
    (item: {
      product_id: string;
      product_name: string;
      unit_price: number;
      quantity: number;
      notes?: string;
    }) => ({
      order_id: order.id,
      product_id: item.product_id,
      product_name: item.product_name,
      unit_price: item.unit_price,
      quantity: item.quantity,
      notes: item.notes || null,
      status: "pending",
    })
  );

  const { error: itemsError } = await supabaseAdmin
    .from("order_items")
    .insert(orderItems);

  if (itemsError) {
    return NextResponse.json({ error: itemsError.message }, { status: 400 });
  }

  return NextResponse.json({ order }, { status: 201 });
}
