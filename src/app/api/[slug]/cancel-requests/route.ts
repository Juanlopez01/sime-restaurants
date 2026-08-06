import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, isSupabaseConfigured } from "@/lib/supabase-server";
import {
  getDemoCancelRequests,
  createDemoCancelRequest,
  resolveDemoCancelRequest,
} from "@/lib/demo-cancel-requests";

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
    const pending = getDemoCancelRequests("pending");
    return NextResponse.json({ requests: pending });
  }

  const { data } = await supabaseAdmin
    .from("cancel_requests")
    .select(
      `*, order:orders(*, items:order_items(*), table:tables(id, table_number)), requester:users!cancel_requests_requested_by_fkey(id, name)`
    )
    .eq("restaurant_id", restaurantId)
    .eq("status", "pending")
    .order("created_at", { ascending: true });

  return NextResponse.json({ requests: data ?? [] });
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
  const { order_id, requested_by, reason } = body;

  if (!order_id || !requested_by) {
    return NextResponse.json(
      { error: "order_id y requested_by requeridos" },
      { status: 400 }
    );
  }

  if (!isSupabaseConfigured) {
    const req = createDemoCancelRequest(order_id, requested_by, reason);
    if (!req) {
      return NextResponse.json(
        { error: "Pedido no encontrado o ya tiene solicitud pendiente" },
        { status: 400 }
      );
    }
    return NextResponse.json({ request: req }, { status: 201 });
  }

  const { data, error } = await supabaseAdmin
    .from("cancel_requests")
    .insert({
      restaurant_id: restaurantId,
      order_id,
      requested_by,
      reason: reason || null,
      status: "pending",
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ request: data }, { status: 201 });
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
  const { id, resolved_by, approved } = body;

  if (!id || !resolved_by || typeof approved !== "boolean") {
    return NextResponse.json(
      { error: "id, resolved_by y approved requeridos" },
      { status: 400 }
    );
  }

  if (!isSupabaseConfigured) {
    const req = resolveDemoCancelRequest(id, resolved_by, approved);
    if (!req) {
      return NextResponse.json(
        { error: "Solicitud no encontrada o ya resuelta" },
        { status: 400 }
      );
    }
    return NextResponse.json({ request: req });
  }

  const status = approved ? "approved" : "denied";
  const { data, error } = await supabaseAdmin
    .from("cancel_requests")
    .update({
      status,
      resolved_by,
      resolved_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("restaurant_id", restaurantId)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  if (approved) {
    const cancelReq = await supabaseAdmin
      .from("cancel_requests")
      .select("order_id")
      .eq("id", id)
      .single();

    if (cancelReq.data) {
      await supabaseAdmin
        .from("orders")
        .update({ status: "cancelled" })
        .eq("id", cancelReq.data.order_id);
    }
  }

  return NextResponse.json({ request: data });
}
