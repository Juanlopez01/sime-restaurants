"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { formatPrice } from "@/lib/format";

interface DailySummaryData {
  date: string;
  total_orders: number;
  total_delivered: number;
  total_active: number;
  total_sales: number;
  active_sales: number;
  grand_total: number;
  payments_by_method: Record<string, number>;
  invoiced_amount: number;
}

interface InvoiceRecord {
  id: string;
  invoice_type: string;
  invoice_number: number;
  point_of_sale: number;
  cae: string | null;
  total: number;
  customer_cuit: string | null;
  customer_name: string | null;
  created_at: string;
}

const METHOD_LABELS: Record<string, string> = {
  cash: "Efectivo",
  card: "Tarjeta",
  mp: "MercadoPago",
  transfer: "Transferencia",
};

export default function FacturacionPage() {
  const params = useParams<{ slug: string }>();
  const [summary, setSummary] = useState<DailySummaryData | null>(null);
  const [invoices, setInvoices] = useState<InvoiceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [invoiceAmount, setInvoiceAmount] = useState("");
  const [invoiceType, setInvoiceType] = useState<"B" | "C">("C");
  const [customerCuit, setCustomerCuit] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [emitting, setEmitting] = useState(false);
  const [result, setResult] = useState<{ cae: string; number: number; pos: number } | null>(null);
  const [error, setError] = useState("");

  const loadData = useCallback(() => {
    Promise.all([
      fetch(`/api/${params.slug}/daily-summary`).then((r) => r.json()),
      fetch(`/api/${params.slug}/invoices`).then((r) => r.json()),
    ]).then(([summaryData, invoicesData]) => {
      setSummary(summaryData.summary);
      setInvoices(invoicesData.invoices ?? []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [params.slug]);

  useEffect(() => { loadData(); }, [loadData]);

  async function emitInvoice() {
    if (emitting) return;
    setEmitting(true);
    setError("");
    setResult(null);

    const pendingToInvoice = (summary?.total_sales ?? 0) - (summary?.invoiced_amount ?? 0);
    const amount = parseInt(invoiceAmount) || pendingToInvoice;

    const res = await fetch(`/api/${params.slug}/invoices`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount,
        invoice_type: invoiceType,
        customer_cuit: customerCuit || undefined,
        customer_name: customerName || undefined,
      }),
    });

    const data = await res.json();
    setEmitting(false);

    if (!res.ok) {
      setError(data.error || "Error al emitir factura");
      return;
    }

    const inv = data.invoice;
    setResult({ cae: inv.cae, number: inv.invoice_number, pos: inv.point_of_sale });
    setInvoiceAmount("");
    setCustomerCuit("");
    setCustomerName("");
    loadData();
  }

  if (loading) {
    return (
      <main className="p-6 flex items-center justify-center min-h-[60vh]">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600" />
      </main>
    );
  }

  if (!summary) {
    return (
      <main className="p-6 flex flex-col items-center justify-center min-h-[60vh]">
        <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center mb-4">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-6 w-6 text-ink-faint" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
            <path d="M14 2v6h6" />
          </svg>
        </div>
        <p className="text-ink-muted">No hay datos disponibles.</p>
      </main>
    );
  }

  const pendingToInvoice = summary.total_sales - summary.invoiced_amount;

  return (
    <main className="p-5 lg:p-0 space-y-5 max-w-2xl lg:max-w-3xl mx-auto">
      <div>
        <h2 className="text-lg font-semibold text-ink tracking-tight">Facturación del día</h2>
        <p className="text-sm text-ink-muted mt-0.5">
          {new Date(summary.date + "T12:00:00").toLocaleDateString("es-AR", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="stat-card">
          <p className="stat-label">Pedidos del día</p>
          <p className="stat-value">{summary.total_orders}</p>
          <p className="stat-detail">
            {summary.total_delivered} cobrados · {summary.total_active} activos
          </p>
        </div>

        <div className="stat-card">
          <p className="stat-label">Total cobrado</p>
          <p className="stat-value !text-[#b49a5a]">
            {formatPrice(summary.total_sales)}
          </p>
          {summary.active_sales > 0 && (
            <p className="stat-detail !text-[#b49a5a]">
              + {formatPrice(summary.active_sales)} pendiente
            </p>
          )}
        </div>
      </div>

      <div className="card card-body">
        <p className="section-label mb-4">Desglose por método</p>
        <div className="space-y-3">
          {Object.entries(summary.payments_by_method).map(([method, amount]) => (
            <div key={method} className="flex items-center justify-between">
              <span className="text-sm text-ink-muted">{METHOD_LABELS[method] ?? method}</span>
              <span className="text-sm font-semibold text-ink tabular-nums">
                {formatPrice(amount as number)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Emitir factura */}
      <div className="card overflow-hidden">
        <div className="bg-blue-50 border-b border-blue-100 px-5 py-4">
          <p className="text-sm font-semibold text-blue-900">Emitir factura ARCA</p>
          <p className="text-xs text-blue-700/70 mt-0.5">Elegí el tipo, monto y emití con CAE</p>
        </div>

        <div className="p-5 space-y-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-ink-muted">Ya facturado hoy</span>
            <span className="font-medium text-ink tabular-nums">{formatPrice(summary.invoiced_amount)}</span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-ink-muted">Pendiente de facturar</span>
            <span className="font-bold text-ink tabular-nums">{formatPrice(pendingToInvoice)}</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-ink-muted mb-1.5">Tipo de factura</label>
              <select
                value={invoiceType}
                onChange={(e) => setInvoiceType(e.target.value as "B" | "C")}
                className="input text-sm"
              >
                <option value="C">Factura C — Monotributista</option>
                <option value="B">Factura B — Resp. Inscripto a CF</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-ink-muted mb-1.5">Monto</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-faint text-sm">$</span>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder={pendingToInvoice.toLocaleString("es-AR")}
                  value={invoiceAmount}
                  onChange={(e) => setInvoiceAmount(e.target.value.replace(/\D/g, ""))}
                  className="input pl-7 text-sm"
                />
              </div>
            </div>
          </div>

          {invoiceType === "B" && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-ink-muted mb-1.5">CUIT cliente (opcional)</label>
                <input
                  type="text"
                  value={customerCuit}
                  onChange={(e) => setCustomerCuit(e.target.value.replace(/[^0-9-]/g, ""))}
                  placeholder="20-12345678-9"
                  className="input text-xs font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-ink-muted mb-1.5">Nombre (opcional)</label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Consumidor Final"
                  className="input text-xs"
                />
              </div>
            </div>
          )}

          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3">
              <p className="text-xs text-red-700">{error}</p>
            </div>
          )}

          {result && (
            <div className="rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-3 space-y-1">
              <p className="text-xs font-semibold text-emerald-800">Factura emitida correctamente</p>
              <p className="text-xs text-emerald-700">
                PV {String(result.pos).padStart(4, "0")} - Nº {String(result.number).padStart(8, "0")}
              </p>
              <p className="text-xs text-emerald-700 font-mono">CAE: {result.cae}</p>
            </div>
          )}

          <button
            onClick={emitInvoice}
            disabled={pendingToInvoice <= 0 || emitting}
            className="btn-primary bg-blue-600 hover:bg-blue-700 w-full py-3"
          >
            {emitting ? (
              <span className="flex items-center justify-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Emitiendo...
              </span>
            ) : (
              "Facturar"
            )}
          </button>
        </div>
      </div>

      {/* Historial del día */}
      {invoices.length > 0 && (
        <div className="card card-body">
          <p className="section-label mb-4">Facturas del día</p>
          <div className="space-y-2">
            {invoices.map((inv) => (
              <div key={inv.id} className="flex items-center justify-between py-2 border-b border-[#e8e6e1] last:border-0">
                <div>
                  <p className="text-sm font-medium text-ink">
                    Factura {inv.invoice_type} — PV {String(inv.point_of_sale).padStart(4, "0")}-{String(inv.invoice_number).padStart(8, "0")}
                  </p>
                  <p className="text-xs text-ink-faint font-mono">
                    CAE: {inv.cae ?? "—"}
                  </p>
                  {inv.customer_name && (
                    <p className="text-xs text-ink-muted">{inv.customer_name}</p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-ink tabular-nums">{formatPrice(inv.total)}</p>
                  <p className="text-xs text-ink-faint">
                    {new Date(inv.created_at).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}
