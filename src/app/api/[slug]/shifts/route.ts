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
  const active = searchParams.get("active");
  const date = searchParams.get("date");

  let query = supabaseAdmin
    .from("shifts")
    .select("*, cashier:users!shifts_cashier_id_fkey(id, name)")
    .eq("restaurant_id", restaurantId)
    .order("opened_at", { ascending: false });

  if (active === "true") {
    query = query.is("closed_at", null);
  }

  if (date) {
    query = query.gte("opened_at", `${date}T00:00:00`).lt("opened_at", `${date}T23:59:59`);
  }

  const { data } = await query;
  return NextResponse.json({ shifts: data ?? [] });
}

export async function POST(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  const restaurantId = await getRestaurantId(params.slug);
  if (!restaurantId) {
    return NextResponse.json({ error: "Restaurante no encontrado" }, { status: 404 });
  }

  const body = await request.json();
  const { cashier_id, opening_amount } = body;

  if (!cashier_id) {
    return NextResponse.json({ error: "cashier_id requerido" }, { status: 400 });
  }

  const { data: existing } = await supabaseAdmin
    .from("shifts")
    .select("id")
    .eq("restaurant_id", restaurantId)
    .eq("cashier_id", cashier_id)
    .is("closed_at", null)
    .single();

  if (existing) {
    return NextResponse.json({ error: "Ya hay un turno abierto para este cajero" }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from("shifts")
    .insert({
      restaurant_id: restaurantId,
      cashier_id,
      opening_amount: opening_amount ?? 0,
      opened_at: new Date().toISOString(),
    })
    .select("*, cashier:users!shifts_cashier_id_fkey(id, name)")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ shift: data }, { status: 201 });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  const restaurantId = await getRestaurantId(params.slug);
  if (!restaurantId) {
    return NextResponse.json({ error: "Restaurante no encontrado" }, { status: 404 });
  }

  const body = await request.json();
  const { id, closing_amount, notes } = body;

  if (!id) {
    return NextResponse.json({ error: "id requerido" }, { status: 400 });
  }

  const { data: shift } = await supabaseAdmin
    .from("shifts")
    .select("*")
    .eq("id", id)
    .eq("restaurant_id", restaurantId)
    .is("closed_at", null)
    .single();

  if (!shift) {
    return NextResponse.json({ error: "Turno no encontrado o ya cerrado" }, { status: 404 });
  }

  const { data: payments } = await supabaseAdmin
    .from("payments")
    .select("amount, method, tip, created_at")
    .eq("restaurant_id", restaurantId)
    .eq("status", "completed")
    .gte("created_at", shift.opened_at)
    .lte("created_at", new Date().toISOString());

  const totalSales = (payments ?? []).reduce((sum, p) => sum + Number(p.amount), 0);
  const totalTips = (payments ?? []).reduce((sum, p) => sum + Number(p.tip ?? 0), 0);
  const paymentsByMethod: Record<string, number> = {};
  for (const p of payments ?? []) {
    paymentsByMethod[p.method] = (paymentsByMethod[p.method] ?? 0) + Number(p.amount);
  }

  const closingAmt = closing_amount ?? 0;
  const expectedAmount = shift.opening_amount + totalSales;
  const difference = closingAmt - expectedAmount;

  const { data, error } = await supabaseAdmin
    .from("shifts")
    .update({
      closed_at: new Date().toISOString(),
      closing_amount: closingAmt,
      total_sales: totalSales,
      total_tips: totalTips,
      total_orders: (payments ?? []).length,
      payments_by_method: paymentsByMethod,
      difference,
      notes: notes || null,
    })
    .eq("id", id)
    .select("*, cashier:users!shifts_cashier_id_fkey(id, name)")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ shift: data });
}
