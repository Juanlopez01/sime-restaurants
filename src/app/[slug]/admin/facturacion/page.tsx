"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

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

const METHOD_LABELS: Record<string, string> = {
  cash: "Efectivo",
  card: "Tarjeta",
  mp: "MercadoPago",
  transfer: "Transferencia",
};

export default function FacturacionPage() {
  const params = useParams<{ slug: string }>();
  const [summary, setSummary] = useState<DailySummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [invoiceAmount, setInvoiceAmount] = useState("");

  useEffect(() => {
    fetch(`/api/${params.slug}/daily-summary`)
      .then((res) => res.json())
      .then((data) => {
        setSummary(data.summary);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [params.slug]);

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
            ${summary.total_sales.toLocaleString("es-AR")}
          </p>
          {summary.active_sales > 0 && (
            <p className="stat-detail !text-[#b49a5a]">
              + ${summary.active_sales.toLocaleString("es-AR")} pendiente
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
                ${(amount as number).toLocaleString("es-AR")}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="bg-blue-50 border-b border-blue-100 px-5 py-4">
          <p className="text-sm font-semibold text-blue-900">Facturación ARCA</p>
          <p className="text-xs text-blue-700/70 mt-0.5">Elegí el monto a facturar al cierre del día</p>
        </div>

        <div className="p-5 space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-ink-muted">Ya facturado hoy</span>
            <span className="font-medium text-ink tabular-nums">${summary.invoiced_amount.toLocaleString("es-AR")}</span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-ink-muted">Pendiente de facturar</span>
            <span className="font-bold text-ink tabular-nums">${pendingToInvoice.toLocaleString("es-AR")}</span>
          </div>

          <div className="flex gap-2 pt-2">
            <div className="flex-1 relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-faint text-sm">$</span>
              <input
                type="text"
                inputMode="numeric"
                placeholder={pendingToInvoice.toLocaleString("es-AR")}
                value={invoiceAmount}
                onChange={(e) => setInvoiceAmount(e.target.value.replace(/\D/g, ""))}
                className="input pl-7"
              />
            </div>
            <button
              onClick={() => {
                const amount = parseInt(invoiceAmount) || pendingToInvoice;
                alert(`Facturación ARCA: se facturaría $${amount.toLocaleString("es-AR")}\n\n(Integración ARCA pendiente)`);
              }}
              disabled={pendingToInvoice <= 0}
              className="btn-primary bg-blue-600 hover:bg-blue-700 px-6"
            >
              Facturar
            </button>
          </div>

          <p className="text-xs text-ink-faint">
            La integración con ARCA será configurada cuando se ingresen los certificados en Configuración.
          </p>
        </div>
      </div>
    </main>
  );
}
