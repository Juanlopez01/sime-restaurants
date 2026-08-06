"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

interface RestaurantConfig {
  name: string;
  address: string;
  phone: string;
  settings: {
    currency: string;
    timezone: string;
  };
  billing_config: {
    billing_type?: string;
  };
}

export default function ConfigPage() {
  const params = useParams<{ slug: string }>();
  const [config, setConfig] = useState<RestaurantConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch(`/api/${params.slug}/config`)
      .then((res) => res.json())
      .then((data) => {
        setConfig(data.restaurant);
        setLoading(false);
      });
  }, [params.slug]);

  async function save() {
    if (!config) return;
    setSaving(true);
    setSaved(false);

    const res = await fetch(`/api/${params.slug}/config`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(config),
    });

    if (res.ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    }
    setSaving(false);
  }

  if (loading || !config) {
    return (
      <main className="p-6 flex items-center justify-center min-h-[200px]">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600" />
      </main>
    );
  }

  return (
    <main className="p-5 lg:p-0 space-y-5 max-w-2xl lg:max-w-3xl mx-auto">
      <div>
        <h2 className="text-lg font-semibold text-ink tracking-tight">Configuración</h2>
        <p className="text-sm text-ink-muted mt-0.5">Datos generales de tu restaurante</p>
      </div>

      <div className="card card-body space-y-5">
        <div>
          <label className="block text-sm font-medium text-ink mb-1.5">
            Nombre del restaurante
          </label>
          <input
            type="text"
            value={config.name}
            onChange={(e) => setConfig({ ...config, name: e.target.value })}
            className="input"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-ink mb-1.5">
            Dirección
          </label>
          <input
            type="text"
            value={config.address}
            onChange={(e) => setConfig({ ...config, address: e.target.value })}
            placeholder="Av. Corrientes 1234, CABA"
            className="input"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-ink mb-1.5">
            Teléfono
          </label>
          <input
            type="tel"
            value={config.phone}
            onChange={(e) => setConfig({ ...config, phone: e.target.value })}
            placeholder="+54 11 1234-5678"
            className="input"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-ink mb-1.5">
              Moneda
            </label>
            <select
              value={config.settings.currency}
              onChange={(e) =>
                setConfig({
                  ...config,
                  settings: { ...config.settings, currency: e.target.value },
                })
              }
              className="input"
            >
              <option value="ARS">ARS — Peso argentino</option>
              <option value="USD">USD — Dólar</option>
              <option value="EUR">EUR — Euro</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-ink mb-1.5">
              Facturación
            </label>
            <select
              value={config.billing_config?.billing_type || "end_of_day"}
              onChange={(e) =>
                setConfig({
                  ...config,
                  billing_config: {
                    ...config.billing_config,
                    billing_type: e.target.value,
                  },
                })
              }
              className="input"
            >
              <option value="end_of_day">Al cierre del día</option>
              <option value="per_order">Por pedido</option>
            </select>
          </div>
        </div>
      </div>

      <button
        onClick={save}
        disabled={saving}
        className={`btn w-full py-3.5 text-sm font-semibold rounded-xl transition-all ${
          saved
            ? "bg-emerald-500 text-white"
            : "bg-slate-900 text-white hover:bg-slate-800"
        }`}
      >
        {saving ? (
          <span className="flex items-center gap-2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            Guardando...
          </span>
        ) : saved ? (
          <span className="flex items-center gap-2">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
              <path d="M20 6L9 17l-5-5" />
            </svg>
            Guardado
          </span>
        ) : (
          "Guardar cambios"
        )}
      </button>
    </main>
  );
}
