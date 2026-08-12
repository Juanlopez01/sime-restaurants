"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { formatPrice } from "@/lib/format";
import type { OrderWithItems, PaymentMethod } from "@/types";
import { useStaff } from "@/contexts/staff-context";
import { PinLogin } from "@/components/staff/PinLogin";

const PAYMENT_METHODS: { value: PaymentMethod; label: string; icon: JSX.Element }[] = [
  {
    value: "cash",
    label: "Efectivo",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
        <rect x="2" y="6" width="20" height="12" rx="2" />
        <circle cx="12" cy="12" r="3" />
        <path d="M2 10h2M20 10h2M2 14h2M20 14h2" />
      </svg>
    ),
  },
  {
    value: "card",
    label: "Tarjeta",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
        <rect x="2" y="5" width="20" height="14" rx="2" />
        <path d="M2 10h20" />
      </svg>
    ),
  },
  {
    value: "mp",
    label: "MercadoPago",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
        <rect x="5" y="2" width="14" height="20" rx="2" />
        <path d="M12 18h.01" />
      </svg>
    ),
  },
  {
    value: "transfer",
    label: "Transferencia",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
        <path d="M3 7l6-4 6 4 6-4v13l-6 4-6-4-6 4V7z" />
        <path d="M9 3v13M15 7v13" />
      </svg>
    ),
  },
];

export default function CajaMesaPage() {
  const params = useParams<{ slug: string; tableId: string }>();
  const router = useRouter();
  const { staff, loading: staffLoading } = useStaff();
  const [method, setMethod] = useState<PaymentMethod>("cash");
  const [processing, setProcessing] = useState(false);
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [loading, setLoading] = useState(true);
  const [tipPercent, setTipPercent] = useState<number>(0);
  const [customTip, setCustomTip] = useState("");
  const [mpInitPoint, setMpInitPoint] = useState<string | null>(null);
  const [mpWaiting, setMpWaiting] = useState(false);
  const [mpError, setMpError] = useState<string | null>(null);
  const mpPollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    fetch(`/api/${params.slug}/orders?table_id=${params.tableId}`)
      .then((res) => res.json())
      .then((data) => {
        setOrders(data.orders ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [params.slug, params.tableId]);

  const allItems = orders.flatMap((o) => o.items);
  const subtotal = allItems.reduce((sum, item) => sum + item.unit_price * item.quantity, 0);
  const tipAmount = customTip ? parseFloat(customTip) || 0 : Math.round(subtotal * tipPercent / 100);
  const total = subtotal + tipAmount;

  function printReceipt() {
    const tableNum = orders[0]?.table?.table_number ?? params.tableId.slice(0, 4);
    const w = window.open("", "_blank", "width=320,height=600");
    if (!w) return;

    const METHODS: Record<string, string> = { cash: "Efectivo", card: "Tarjeta", mp: "MercadoPago", transfer: "Transferencia" };
    const items = allItems
      .map((i) => `<tr><td>${i.quantity}x ${i.product_name}</td><td style="text-align:right">${formatPrice(i.unit_price * i.quantity)}</td></tr>`)
      .join("");

    const tipLine = tipAmount > 0 ? `<tr><td>Propina</td><td style="text-align:right">${formatPrice(tipAmount)}</td></tr>` : "";
    w.document.write(`<!DOCTYPE html>
<html><head><title>Recibo Mesa ${tableNum}</title>
<style>
  body { font-family: monospace; font-size: 12px; width: 280px; margin: 0 auto; padding: 16px; }
  h2 { text-align: center; margin: 0 0 4px; font-size: 14px; }
  .meta { text-align: center; color: #666; font-size: 11px; margin-bottom: 12px; }
  hr { border: none; border-top: 1px dashed #999; margin: 8px 0; }
  table { width: 100%; border-collapse: collapse; }
  td { padding: 3px 0; }
  .total { font-weight: bold; font-size: 14px; }
  .footer { text-align: center; color: #999; font-size: 10px; margin-top: 16px; }
  @media print { body { width: auto; } }
</style></head><body>
<h2>Recibo</h2>
<p class="meta">Mesa ${tableNum} · ${new Date().toLocaleString("es-AR")}</p>
<hr>
<table>${items}</table>
<hr>
<table><tr><td>Subtotal</td><td style="text-align:right">${formatPrice(subtotal)}</td></tr>${tipLine}<tr class="total"><td>TOTAL</td><td style="text-align:right">${formatPrice(total)}</td></tr></table>
<p style="font-size:11px;color:#666;text-align:center;margin-top:8px">Pago: ${METHODS[method] ?? method}</p>
<p class="footer">Gracias por su visita</p>
<script>window.print();</script>
</body></html>`);
    w.document.close();
  }

  const checkMpPayment = useCallback(async () => {
    const res = await fetch(`/api/${params.slug}/orders?table_id=${params.tableId}`);
    const data = await res.json();
    const active = (data.orders as OrderWithItems[]).filter(
      (o) => o.status !== "delivered" && o.status !== "cancelled"
    );
    if (active.length === 0) {
      if (mpPollRef.current) clearInterval(mpPollRef.current);
      setMpWaiting(false);
      setMpInitPoint(null);
      router.push(`/${params.slug}/caja`);
    }
  }, [params.slug, params.tableId, router]);

  useEffect(() => {
    return () => {
      if (mpPollRef.current) clearInterval(mpPollRef.current);
    };
  }, []);

  async function handlePayment() {
    if (total === 0) return;

    if (method === "mp") {
      setProcessing(true);
      setMpError(null);
      try {
        const res = await fetch(`/api/${params.slug}/mp-preference`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            table_id: params.tableId,
            order_ids: orders.map((o) => o.id),
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          setMpError(data.error || "Error al crear el pago");
          setProcessing(false);
          return;
        }
        setMpInitPoint(data.init_point);
        setMpWaiting(true);
        setProcessing(false);
        mpPollRef.current = setInterval(checkMpPayment, 5000);
      } catch {
        setMpError("Error de conexión");
        setProcessing(false);
      }
      return;
    }

    setProcessing(true);
    try {
      await fetch(`/api/${params.slug}/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ table_id: params.tableId, method, amount: total, tip: tipAmount, cashier_id: staff?.id }),
      });
      printReceipt();
    } catch { /* offline */ }
    setProcessing(false);
    router.push(`/${params.slug}/caja`);
  }

  function cancelMpPayment() {
    if (mpPollRef.current) clearInterval(mpPollRef.current);
    setMpWaiting(false);
    setMpInitPoint(null);
    setMpError(null);
  }

  if (staffLoading) return null;
  if (!staff) return <PinLogin module="Caja" />;

  if (loading) {
    return (
      <main className="min-h-screen bg-surface flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-[#e8e6e1] border-t-[#b49a5a]" />
          <p className="mt-3 text-sm text-ink-faint">Cargando cuenta...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-surface flex flex-col lg:flex-row">
      {/* Left: header + order summary */}
      <div className="flex-1 flex flex-col lg:min-h-screen">
        <header className="module-header">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.06] text-[#888] hover:text-white transition-colors"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
            <h1>Cobrar Mesa {orders[0]?.table?.table_number ?? params.tableId.slice(0, 4)}</h1>
          </div>
        </header>

        <div className="flex-1 p-5 lg:p-8 lg:max-w-2xl">
          <div className="card card-body">
            <p className="section-label mb-3">Resumen del pedido</p>

            {allItems.length === 0 ? (
              <p className="text-sm text-ink-faint">No hay pedidos activos en esta mesa</p>
            ) : (
              <div className="space-y-2.5">
                {allItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between text-sm">
                    <span className="text-ink-muted">{item.quantity}x {item.product_name}</span>
                    <span className="text-ink font-medium tabular-nums">{formatPrice(item.unit_price * item.quantity)}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Tip selector */}
            <div className="mt-4 border-t border-slate-100 pt-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#999] mb-2">Propina</p>
              <div className="flex gap-2 mb-2">
                {[0, 10, 15, 20].map((pct) => (
                  <button
                    key={pct}
                    onClick={() => { setTipPercent(pct); setCustomTip(""); }}
                    className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-colors ${
                      tipPercent === pct && !customTip
                        ? "bg-[#b49a5a] text-white"
                        : "bg-[#f5f3ee] text-[#777] hover:bg-[#ebe8e0]"
                    }`}
                  >
                    {pct === 0 ? "Sin" : `${pct}%`}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#999]">Otro:</span>
                <div className="relative flex-1">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-[#999]">$</span>
                  <input
                    type="number"
                    value={customTip}
                    onChange={(e) => { setCustomTip(e.target.value); setTipPercent(0); }}
                    placeholder="0"
                    className="w-full rounded-lg border border-[#e8e6e1] pl-6 pr-3 py-1.5 text-sm tabular-nums focus:border-[#b49a5a] focus:outline-none"
                  />
                </div>
                {tipAmount > 0 && (
                  <span className="text-sm font-semibold text-[#b49a5a] tabular-nums">
                    +{formatPrice(tipAmount)}
                  </span>
                )}
              </div>
            </div>

            <div className="mt-4 flex justify-between border-t border-slate-100 pt-4">
              <span className="text-lg font-bold text-ink">Total</span>
              <span className="text-lg font-bold tabular-nums text-[#b49a5a]">{formatPrice(total)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right: payment method + button */}
      <div className="lg:w-96 lg:border-l lg:border-slate-200/80 lg:bg-slate-50/50 lg:flex lg:flex-col">
        <div className="hidden lg:block p-5 border-b border-slate-200/80 bg-white">
          <h2 className="text-base font-bold text-ink tracking-tight">Cobrar</h2>
          <p className="text-xs text-ink-faint mt-0.5">Seleccioná el método de pago</p>
        </div>

        <div className="p-5 lg:flex-1 space-y-5">
          <div>
            <p className="section-label mb-3 lg:hidden">Método de pago</p>
            <div className="grid grid-cols-2 gap-2.5">
              {PAYMENT_METHODS.map((pm) => (
                <button
                  key={pm.value}
                  onClick={() => setMethod(pm.value)}
                  className={`card flex flex-col items-center gap-2 px-4 py-5 text-center touch-target transition-all ${
                    method === pm.value
                      ? "ring-2 ring-[#b49a5a] bg-[#f5f3ee] shadow-card-hover"
                      : "hover:shadow-card-hover"
                  }`}
                >
                  <span className={method === pm.value ? "text-[#b49a5a]" : "text-ink-faint"}>
                    {pm.icon}
                  </span>
                  <span className={`text-sm font-semibold ${method === pm.value ? "text-[#8a7a3a]" : "text-ink-muted"}`}>
                    {pm.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {mpError && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3">
              <p className="text-sm text-red-700">{mpError}</p>
            </div>
          )}

          {mpWaiting && mpInitPoint && (
            <div className="card card-body space-y-4 text-center">
              <div className="mx-auto h-10 w-10 rounded-full bg-[#009ee3]/10 flex items-center justify-center">
                <svg viewBox="0 0 24 24" fill="none" stroke="#009ee3" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                  <rect x="5" y="2" width="14" height="20" rx="2" />
                  <path d="M12 18h.01" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-ink">Esperando pago de MercadoPago</p>
                <p className="text-xs text-ink-faint mt-1">El cliente debe completar el pago desde el link</p>
              </div>
              <a
                href={mpInitPoint}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary w-full bg-[#009ee3] hover:bg-[#0087cd] inline-flex items-center justify-center gap-2"
              >
                Abrir link de pago
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                  <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
                  <polyline points="15 3 21 3 21 9" />
                  <line x1="10" y1="14" x2="21" y2="3" />
                </svg>
              </a>
              <div className="flex items-center gap-2 justify-center text-xs text-ink-faint">
                <div className="h-3 w-3 animate-spin rounded-full border-2 border-[#e8e6e1] border-t-[#009ee3]" />
                Verificando pago automáticamente...
              </div>
              <button
                onClick={cancelMpPayment}
                className="text-sm text-red-500 hover:text-red-700 font-medium transition-colors"
              >
                Cancelar y elegir otro método
              </button>
            </div>
          )}

          {/* Desktop total + button inline */}
          {!mpWaiting && (
          <div className="hidden lg:block">
            <div className="flex justify-between items-center mb-4 pt-4 border-t border-slate-200">
              <span className="text-lg font-bold text-ink">Total</span>
              <span className="text-2xl font-bold tabular-nums text-[#b49a5a]">{formatPrice(total)}</span>
            </div>
            <button
              onClick={handlePayment}
              disabled={processing || total === 0}
              className="btn-primary w-full bg-[#141414] hover:bg-[#222]"
            >
              {processing ? (
                <span className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Procesando...
                </span>
              ) : total === 0 ? (
                "Sin pedidos"
              ) : (
                `Cobrar ${formatPrice(total)}`
              )}
            </button>
          </div>
          )}
        </div>
      </div>

      {/* Mobile sticky bottom */}
      {!mpWaiting && (
      <div className="lg:hidden border-t border-slate-200 bg-white px-5 py-4 shadow-float">
        <button
          onClick={handlePayment}
          disabled={processing || total === 0}
          className="btn-primary w-full bg-[#141414] hover:bg-[#222]"
        >
          {processing ? (
            <span className="flex items-center gap-2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              Procesando...
            </span>
          ) : total === 0 ? (
            "Sin pedidos"
          ) : (
            `Cobrar ${formatPrice(total)}`
          )}
        </button>
      </div>
      )}
    </main>
  );
}
