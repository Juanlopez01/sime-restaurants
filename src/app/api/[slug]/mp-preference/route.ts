import { NextRequest, NextResponse } from "next/server";
import { MercadoPagoConfig, Preference } from "mercadopago";
import { supabaseAdmin, isSupabaseConfigured } from "@/lib/supabase-server";
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

  if (!isSupabaseConfigured) {
    return NextResponse.json(
      { error: "DB no configurada" },
      { status: 503 }
    );
  }

  const { data: restaurant } = await supabaseAdmin
    .from("restaurants")
    .select("mp_access_token, name")
    .eq("id", restaurantId)
    .single();

  if (!restaurant?.mp_access_token) {
    return NextResponse.json(
      { error: "MercadoPago no configurado para este restaurante" },
      { status: 400 }
    );
  }

  const body = await request.json();
  const { table_id, order_ids } = body as {
    table_id: string;
    order_ids?: string[];
  };

  if (!table_id) {
    return NextResponse.json(
      { error: "table_id requerido" },
      { status: 400 }
    );
  }

  let query = supabaseAdmin
    .from("orders")
    .select("id, subtotal, items:order_items(product_name, quantity, unit_price)")
    .eq("restaurant_id", restaurantId)
    .eq("table_id", table_id)
    .in("status", ["pending", "in_kitchen", "ready"]);

  if (order_ids && order_ids.length > 0) {
    query = query.in("id", order_ids);
  }

  const { data: orders } = await query;

  if (!orders || orders.length === 0) {
    return NextResponse.json(
      { error: "No hay pedidos activos en esta mesa" },
      { status: 400 }
    );
  }

  const items = orders.flatMap((order) =>
    (order.items as { product_name: string; quantity: number; unit_price: number }[]).map((item, idx) => ({
      id: `${order.id}-${idx}`,
      title: item.product_name,
      quantity: item.quantity,
      unit_price: Number(item.unit_price),
      currency_id: "ARS",
    }))
  );

  const total = items.reduce((sum, i) => sum + i.unit_price * i.quantity, 0);

  const client = new MercadoPagoConfig({ accessToken: restaurant.mp_access_token });
  const preference = new Preference(client);

  const origin = request.headers.get("origin") || `https://${request.headers.get("host")}`;

  try {
    const result = await preference.create({
      body: {
        items,
        external_reference: JSON.stringify({
          restaurant_id: restaurantId,
          table_id,
          order_ids: orders.map((o) => o.id),
          amount: total,
        }),
        notification_url: `${origin}/api/${params.slug}/mp-webhook`,
        back_urls: {
          success: `${origin}/${params.slug}/caja`,
          failure: `${origin}/${params.slug}/caja/mesa/${table_id}`,
          pending: `${origin}/${params.slug}/caja/mesa/${table_id}`,
        },
        auto_return: "approved",
        statement_descriptor: restaurant.name.slice(0, 22),
      },
    });

    return NextResponse.json({
      preference_id: result.id,
      init_point: result.init_point,
      sandbox_init_point: result.sandbox_init_point,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error creando preferencia";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
