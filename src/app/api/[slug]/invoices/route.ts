import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, isSupabaseConfigured } from "@/lib/supabase-server";
import { getRestaurantId } from "@/lib/restaurant";
import { createInvoice, isArcaConfigured } from "@/lib/arca";
import type { BillingConfig, InvoiceType } from "@/types";

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  const restaurantId = await getRestaurantId(params.slug);
  if (!restaurantId) {
    return NextResponse.json({ error: "Restaurante no encontrado" }, { status: 404 });
  }

  if (!isSupabaseConfigured) {
    return NextResponse.json({ invoices: [] });
  }

  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date") || new Date().toISOString().split("T")[0];

  const { data: invoices } = await supabaseAdmin
    .from("invoices")
    .select("*")
    .eq("restaurant_id", restaurantId)
    .gte("created_at", `${date}T00:00:00`)
    .lt("created_at", `${date}T23:59:59`)
    .order("created_at", { ascending: false });

  return NextResponse.json({ invoices: invoices ?? [] });
}

export async function POST(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  const restaurantId = await getRestaurantId(params.slug);
  if (!restaurantId) {
    return NextResponse.json({ error: "Restaurante no encontrado" }, { status: 404 });
  }

  if (!isSupabaseConfigured) {
    return NextResponse.json({ error: "DB no configurada" }, { status: 503 });
  }

  const { data: restaurant } = await supabaseAdmin
    .from("restaurants")
    .select("billing_config")
    .eq("id", restaurantId)
    .single();

  const billingConfig = restaurant?.billing_config as BillingConfig | null;

  if (!isArcaConfigured(billingConfig)) {
    return NextResponse.json(
      { error: "ARCA no configurado. Ingresá CUIT, certificado y clave en Configuración." },
      { status: 400 }
    );
  }

  const body = await request.json();
  const { amount, invoice_type, customer_cuit, customer_name } = body as {
    amount: number;
    invoice_type?: InvoiceType;
    customer_cuit?: string;
    customer_name?: string;
  };

  if (!amount || amount <= 0) {
    return NextResponse.json({ error: "Monto inválido" }, { status: 400 });
  }

  const type: InvoiceType = invoice_type || "C";

  try {
    const result = await createInvoice(billingConfig!, {
      amount,
      invoice_type: type,
      customer_cuit,
      customer_name,
    });

    const { data: invoice, error: dbError } = await supabaseAdmin
      .from("invoices")
      .insert({
        restaurant_id: restaurantId,
        invoice_type: result.invoice_type,
        cae: result.cae,
        cae_expiration: result.cae_expiration,
        point_of_sale: result.point_of_sale,
        invoice_number: result.invoice_number,
        customer_cuit: customer_cuit || null,
        customer_name: customer_name || null,
        total: result.total,
        raw_response: result.raw_response,
      })
      .select()
      .single();

    if (dbError) {
      return NextResponse.json(
        { error: `Factura emitida (CAE: ${result.cae}) pero error al guardar: ${dbError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ invoice }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error al emitir factura";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
