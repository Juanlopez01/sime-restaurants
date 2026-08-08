import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, isSupabaseConfigured } from "@/lib/supabase-server";
import {
  getDemoOrders,
  getDemoOrdersByTable,
  createDemoOrder,
  updateDemoOrderStatus,
} from "@/lib/demo-orders";

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
  const tableId = searchParams.get("table_id");
  const status = searchParams.get("status");
  const date = searchParams.get("date");
  const includeAll = searchParams.get("all") === "true";

  if (!isSupabaseConfigured) {
    const activeStatuses = ["pending", "in_kitchen", "ready"];
    const orders = tableId
      ? getDemoOrdersByTable(tableId)
      : getDemoOrders(includeAll ? undefined : activeStatuses);
    return NextResponse.json({ orders });
  }

  let query = supabaseAdmin
    .from("orders")
    .select(
      `
      *,
      items:order_items(*),
      table:tables(id, table_number),
      waiter:users!orders_waiter_id_fkey(id, name)
    `
    )
    .eq("restaurant_id", restaurantId)
    .order("created_at", { ascending: false });

  if (status) {
    query = query.eq("status", status);
  } else if (!includeAll) {
    query = query.in("status", ["pending", "in_kitchen", "ready"]);
  }

  if (tableId) {
    query = query.eq("table_id", tableId);
  }

  if (date) {
    query = query.gte("created_at", `${date}T00:00:00`).lt("created_at", `${date}T23:59:59`);
  }

  if (includeAll) {
    query = query.limit(100);
  }

  const { data: ordersData } = await query;

  return NextResponse.json({ orders: ordersData ?? [] });
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
  const { table_id, items, notes, waiter_id } = body;

  if (!table_id || !items || items.length === 0) {
    return NextResponse.json(
      { error: "table_id e items requeridos" },
      { status: 400 }
    );
  }

  if (!isSupabaseConfigured) {
    const order = createDemoOrder(table_id, items, notes);
    return NextResponse.json({ order }, { status: 201 });
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
      table_id,
      waiter_id: waiter_id ?? null,
      status: "pending",
      notes: notes || null,
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
  const { id, status } = body;

  if (!id || !status) {
    return NextResponse.json(
      { error: "id y status requeridos" },
      { status: 400 }
    );
  }

  if (!isSupabaseConfigured) {
    const order = updateDemoOrderStatus(id, status);
    if (!order) {
      return NextResponse.json(
        { error: "Pedido no encontrado" },
        { status: 404 }
      );
    }
    return NextResponse.json({ order });
  }

  const { data, error } = await supabaseAdmin
    .from("orders")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("restaurant_id", restaurantId)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  if (status === "in_kitchen" || status === "ready") {
    const itemStatus = status === "in_kitchen" ? "preparing" : "ready";
    await supabaseAdmin
      .from("order_items")
      .update({ status: itemStatus })
      .eq("order_id", id);
  }

  // Deduct stock when order moves to in_kitchen
  if (status === "in_kitchen") {
    try {
      const { data: orderItems } = await supabaseAdmin
        .from("order_items")
        .select("product_id, quantity")
        .eq("order_id", id);

      if (orderItems && orderItems.length > 0) {
        const productIds = orderItems.map((i) => i.product_id);
        const { data: links } = await supabaseAdmin
          .from("product_ingredients")
          .select("product_id, ingredient_id, quantity_needed")
          .in("product_id", productIds);

        if (links && links.length > 0) {
          const deductions = new Map<string, number>();
          for (const item of orderItems) {
            const itemLinks = links.filter((l) => l.product_id === item.product_id);
            for (const link of itemLinks) {
              const amount = link.quantity_needed * item.quantity;
              deductions.set(
                link.ingredient_id,
                (deductions.get(link.ingredient_id) ?? 0) + amount
              );
            }
          }

          for (const [ingredientId, amount] of deductions) {
            await supabaseAdmin.rpc("decrement_stock", {
              p_ingredient_id: ingredientId,
              p_amount: amount,
            }).then((res) => {
              if (res.error) {
                // Fallback: manual update if RPC doesn't exist
                return supabaseAdmin
                  .from("ingredients")
                  .select("current_stock")
                  .eq("id", ingredientId)
                  .single()
                  .then(({ data: ing }) => {
                    if (ing) {
                      const newStock = Math.max(0, Number(ing.current_stock) - amount);
                      return supabaseAdmin
                        .from("ingredients")
                        .update({ current_stock: newStock, updated_at: new Date().toISOString() })
                        .eq("id", ingredientId);
                    }
                  });
              }
            });
          }
        }
      }
    } catch {
      // Stock deduction is best-effort — don't block the order
    }
  }

  return NextResponse.json({ order: data });
}
