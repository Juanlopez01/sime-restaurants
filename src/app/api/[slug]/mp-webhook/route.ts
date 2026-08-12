import { NextRequest, NextResponse } from "next/server";
import { MercadoPagoConfig, Payment as MPPayment } from "mercadopago";
import { supabaseAdmin, isSupabaseConfigured } from "@/lib/supabase-server";
import { getRestaurantId } from "@/lib/restaurant";

export async function POST(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  if (!isSupabaseConfigured) {
    return NextResponse.json({ ok: true });
  }

  const restaurantId = await getRestaurantId(params.slug);
  if (!restaurantId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await request.json();

  if (body.type !== "payment" || !body.data?.id) {
    return NextResponse.json({ ok: true });
  }

  const mpPaymentId = String(body.data.id);

  const { data: restaurant } = await supabaseAdmin
    .from("restaurants")
    .select("mp_access_token")
    .eq("id", restaurantId)
    .single();

  if (!restaurant?.mp_access_token) {
    return NextResponse.json({ error: "MP not configured" }, { status: 400 });
  }

  const client = new MercadoPagoConfig({ accessToken: restaurant.mp_access_token });
  const mpPaymentClient = new MPPayment(client);

  let mpPayment;
  try {
    mpPayment = await mpPaymentClient.get({ id: Number(mpPaymentId) });
  } catch {
    return NextResponse.json({ error: "Could not verify payment" }, { status: 400 });
  }

  if (mpPayment.status !== "approved") {
    return NextResponse.json({ ok: true, status: mpPayment.status });
  }

  let externalRef: { restaurant_id: string; table_id: string; order_ids: string[]; amount: number };
  try {
    externalRef = JSON.parse(mpPayment.external_reference ?? "{}");
  } catch {
    return NextResponse.json({ error: "Invalid external_reference" }, { status: 400 });
  }

  if (externalRef.restaurant_id !== restaurantId) {
    return NextResponse.json({ error: "Restaurant mismatch" }, { status: 403 });
  }

  const { data: existingPayment } = await supabaseAdmin
    .from("payments")
    .select("id")
    .eq("mp_payment_id", mpPaymentId)
    .single();

  if (existingPayment) {
    return NextResponse.json({ ok: true, already_processed: true });
  }

  const orderId = externalRef.order_ids[0];
  const amount = Number(mpPayment.transaction_amount ?? externalRef.amount);

  await supabaseAdmin
    .from("payments")
    .insert({
      restaurant_id: restaurantId,
      order_id: orderId,
      method: "mp",
      amount,
      mp_payment_id: mpPaymentId,
      status: "completed",
    });

  for (const oid of externalRef.order_ids) {
    await supabaseAdmin
      .from("orders")
      .update({ status: "delivered", updated_at: new Date().toISOString() })
      .eq("id", oid)
      .eq("restaurant_id", restaurantId);
  }

  return NextResponse.json({ ok: true, payment_recorded: true });
}
