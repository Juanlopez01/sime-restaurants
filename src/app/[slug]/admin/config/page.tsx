"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ImageUpload } from "@/components/ui/ImageUpload";

interface RestaurantConfig {
  name: string;
  address: string;
  phone: string;
  logo_url: string;
  settings: {
    currency: string;
    timezone: string;
    brand_color?: string;
    brand_bg?: string;
    brand_text?: string;
  };
  billing_config: {
    billing_type?: string;
    cuit?: string;
    razon_social?: string;
    punto_venta?: string | number;
    environment?: string;
    has_cert?: boolean;
    has_key?: boolean;
    cert?: string;
    key?: string;
  };
  has_mp: boolean;
  mp_access_token?: string;
}

const PRESET_PALETTES = [
  { name: "Dorado", color: "#b49a5a", bg: "#141414", text: "#ffffff" },
  { name: "Rojo", color: "#c0392b", bg: "#1a1212", text: "#ffffff" },
  { name: "Verde", color: "#27ae60", bg: "#121a14", text: "#ffffff" },
  { name: "Azul", color: "#2980b9", bg: "#121418", text: "#ffffff" },
  { name: "Naranja", color: "#e67e22", bg: "#1a1610", text: "#ffffff" },
  { name: "Rosa", color: "#e84393", bg: "#1a1018", text: "#ffffff" },
  { name: "Clásico", color: "#8b7355", bg: "#faf8f5", text: "#1a1a1a" },
  { name: "Moderno", color: "#2d3436", bg: "#ffffff", text: "#2d3436" },
];

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
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#e8e6e1] border-t-[#b49a5a]" />
      </main>
    );
  }

  const brandColor = config.settings.brand_color || "#b49a5a";
  const brandBg = config.settings.brand_bg || "#141414";
  const brandText = config.settings.brand_text || "#ffffff";

  return (
    <main className="p-5 lg:p-0 space-y-5 max-w-2xl lg:max-w-3xl mx-auto">
      <div>
        <h2 className="text-lg font-semibold text-ink tracking-tight">Configuración</h2>
        <p className="text-sm text-ink-muted mt-0.5">Datos generales y personalización visual</p>
      </div>

      {/* Logo + Name */}
      <div className="card card-body space-y-5">
        <h3 className="text-sm font-semibold text-ink uppercase tracking-wider">Identidad</h3>

        <div className="flex items-start gap-5">
          <ImageUpload
            slug={params.slug}
            folder="logo"
            currentUrl={config.logo_url}
            onUpload={(url) => setConfig({ ...config, logo_url: url })}
            shape="circle"
            size="lg"
            label="Logo"
          />
          <div className="flex-1 space-y-4">
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
          </div>
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
      </div>

      {/* Brand Colors */}
      <div className="card card-body space-y-5">
        <h3 className="text-sm font-semibold text-ink uppercase tracking-wider">Colores de marca</h3>
        <p className="text-xs text-ink-muted -mt-3">
          Estos colores se aplican al menú público y a los códigos QR
        </p>

        {/* Presets */}
        <div>
          <label className="block text-xs font-medium text-ink-muted mb-2 uppercase tracking-wider">
            Paletas predefinidas
          </label>
          <div className="flex flex-wrap gap-2">
            {PRESET_PALETTES.map((p) => {
              const isActive =
                brandColor === p.color && brandBg === p.bg;
              return (
                <button
                  key={p.name}
                  onClick={() =>
                    setConfig({
                      ...config,
                      settings: {
                        ...config.settings,
                        brand_color: p.color,
                        brand_bg: p.bg,
                        brand_text: p.text,
                      },
                    })
                  }
                  className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium transition-all ${
                    isActive
                      ? "border-[#b49a5a] bg-[#b49a5a]/10 text-ink"
                      : "border-[#e8e6e1] text-ink-muted hover:border-[#ccc]"
                  }`}
                >
                  <span className="flex gap-0.5">
                    <span
                      className="h-4 w-4 rounded-full border border-black/10"
                      style={{ backgroundColor: p.bg }}
                    />
                    <span
                      className="h-4 w-4 rounded-full border border-black/10"
                      style={{ backgroundColor: p.color }}
                    />
                  </span>
                  {p.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Custom colors */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-ink-muted mb-1.5">
              Color principal
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={brandColor}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    settings: { ...config.settings, brand_color: e.target.value },
                  })
                }
                className="h-9 w-9 rounded-lg border border-[#e8e6e1] cursor-pointer p-0.5"
              />
              <input
                type="text"
                value={brandColor}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    settings: { ...config.settings, brand_color: e.target.value },
                  })
                }
                className="input text-xs font-mono flex-1"
                maxLength={7}
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-ink-muted mb-1.5">
              Fondo
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={brandBg}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    settings: { ...config.settings, brand_bg: e.target.value },
                  })
                }
                className="h-9 w-9 rounded-lg border border-[#e8e6e1] cursor-pointer p-0.5"
              />
              <input
                type="text"
                value={brandBg}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    settings: { ...config.settings, brand_bg: e.target.value },
                  })
                }
                className="input text-xs font-mono flex-1"
                maxLength={7}
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-ink-muted mb-1.5">
              Texto
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={brandText}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    settings: { ...config.settings, brand_text: e.target.value },
                  })
                }
                className="h-9 w-9 rounded-lg border border-[#e8e6e1] cursor-pointer p-0.5"
              />
              <input
                type="text"
                value={brandText}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    settings: { ...config.settings, brand_text: e.target.value },
                  })
                }
                className="input text-xs font-mono flex-1"
                maxLength={7}
              />
            </div>
          </div>
        </div>

        {/* Preview */}
        <div>
          <label className="block text-xs font-medium text-ink-muted mb-2 uppercase tracking-wider">
            Vista previa del menú
          </label>
          <div
            className="rounded-xl overflow-hidden border border-[#e8e6e1]"
            style={{ backgroundColor: brandBg }}
          >
            <div className="px-6 py-5 text-center">
              {config.logo_url && (
                <img
                  src={config.logo_url}
                  alt=""
                  className="h-12 w-12 rounded-full object-cover mx-auto mb-2 border-2"
                  style={{ borderColor: brandColor }}
                />
              )}
              <p
                className="text-lg font-bold"
                style={{ color: brandText }}
              >
                {config.name || "Mi Restaurante"}
              </p>
              <div
                className="mx-auto mt-2 h-px w-12"
                style={{ backgroundColor: brandColor, opacity: 0.5 }}
              />
              <p
                className="mt-2 text-[10px] uppercase tracking-[0.2em]"
                style={{ color: brandColor }}
              >
                Carta
              </p>
            </div>
            <div className="px-4 pb-4">
              <div
                className="rounded-lg p-3"
                style={{ backgroundColor: `${brandText}08` }}
              >
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium" style={{ color: brandText }}>
                    Hamburguesa clásica
                  </span>
                  <span className="text-sm font-bold" style={{ color: brandColor }}>
                    $5.000
                  </span>
                </div>
                <p className="text-xs mt-0.5" style={{ color: `${brandText}99` }}>
                  Pan artesanal, carne 200g, queso
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Other settings */}
      <div className="card card-body space-y-5">
        <h3 className="text-sm font-semibold text-ink uppercase tracking-wider">Operación</h3>

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

      {/* Integraciones */}
      <div className="card card-body space-y-5">
        <h3 className="text-sm font-semibold text-ink uppercase tracking-wider">Integraciones</h3>

        <div className="space-y-4">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-[#009ee3]/10">
              <svg viewBox="0 0 24 24" fill="none" stroke="#009ee3" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                <rect x="5" y="2" width="14" height="20" rx="2" />
                <path d="M12 18h.01" />
              </svg>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-ink">MercadoPago</p>
                {config.has_mp && !config.mp_access_token && (
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">Conectado</span>
                )}
              </div>
              <p className="text-xs text-ink-faint mt-0.5">
                Recibí pagos desde la caja con link de MercadoPago
              </p>
              <div className="mt-3">
                <label className="block text-xs font-medium text-ink-muted mb-1.5">Access Token</label>
                <input
                  type="password"
                  value={config.mp_access_token ?? ""}
                  onChange={(e) => setConfig({ ...config, mp_access_token: e.target.value })}
                  placeholder={config.has_mp ? "••••••••••••••••" : "APP_USR-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"}
                  className="input font-mono text-xs"
                />
                <p className="text-[11px] text-ink-faint mt-1.5">
                  Encontralo en{" "}
                  <a
                    href="https://www.mercadopago.com.ar/developers/panel/app"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#009ee3] hover:underline"
                  >
                    mercadopago.com/developers
                  </a>
                  {" "}→ Tu aplicación → Credenciales de producción
                </p>
              </div>
            </div>
          </div>

          {/* ARCA */}
          <div className="flex items-start gap-4 pt-4 border-t border-[#e8e6e1]">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-[#2d5aa0]/10">
              <svg viewBox="0 0 24 24" fill="none" stroke="#2d5aa0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
            </div>
            <div className="flex-1 space-y-3">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-ink">ARCA (ex-AFIP)</p>
                {config.billing_config?.has_cert && config.billing_config?.has_key && config.billing_config?.cuit && (
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">Configurado</span>
                )}
              </div>
              <p className="text-xs text-ink-faint">
                Facturación electrónica — emitir facturas B y C con CAE
              </p>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-ink-muted mb-1.5">CUIT</label>
                  <input
                    type="text"
                    value={config.billing_config?.cuit ?? ""}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        billing_config: { ...config.billing_config, cuit: e.target.value },
                      })
                    }
                    placeholder="20-12345678-9"
                    className="input text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-ink-muted mb-1.5">Razón social</label>
                  <input
                    type="text"
                    value={config.billing_config?.razon_social ?? ""}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        billing_config: { ...config.billing_config, razon_social: e.target.value },
                      })
                    }
                    placeholder="Mi Restaurante SRL"
                    className="input text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-ink-muted mb-1.5">Punto de venta</label>
                  <input
                    type="number"
                    value={config.billing_config?.punto_venta ?? ""}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        billing_config: {
                          ...config.billing_config,
                          punto_venta: e.target.value ? Number(e.target.value) : "",
                        },
                      })
                    }
                    placeholder="1"
                    min={1}
                    className="input text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-ink-muted mb-1.5">Entorno</label>
                  <select
                    value={config.billing_config?.environment ?? "testing"}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        billing_config: { ...config.billing_config, environment: e.target.value },
                      })
                    }
                    className="input text-xs"
                  >
                    <option value="testing">Testing (homologación)</option>
                    <option value="production">Producción</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-ink-muted mb-1.5">
                  Certificado (.crt / .pem)
                  {config.billing_config?.has_cert && !config.billing_config?.cert && (
                    <span className="ml-2 text-emerald-600 font-normal">ya cargado</span>
                  )}
                </label>
                <textarea
                  value={config.billing_config?.cert ?? ""}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      billing_config: { ...config.billing_config, cert: e.target.value },
                    })
                  }
                  placeholder="-----BEGIN CERTIFICATE-----&#10;...&#10;-----END CERTIFICATE-----"
                  rows={3}
                  className="input text-[11px] font-mono resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-ink-muted mb-1.5">
                  Clave privada (.key)
                  {config.billing_config?.has_key && !config.billing_config?.key && (
                    <span className="ml-2 text-emerald-600 font-normal">ya cargada</span>
                  )}
                </label>
                <textarea
                  value={config.billing_config?.key ?? ""}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      billing_config: { ...config.billing_config, key: e.target.value },
                    })
                  }
                  placeholder="-----BEGIN PRIVATE KEY-----&#10;...&#10;-----END PRIVATE KEY-----"
                  rows={3}
                  className="input text-[11px] font-mono resize-none"
                />
              </div>

              <p className="text-[11px] text-ink-faint">
                Generá el certificado desde{" "}
                <a
                  href="https://auth.afip.gob.ar/contribuyente_/login.xhtml"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#2d5aa0] hover:underline"
                >
                  ARCA/AFIP
                </a>
                {" "}→ Mis Aplicaciones Web → Administración de Certificados Digitales
              </p>
            </div>
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
          <span className="flex items-center justify-center gap-2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            Guardando...
          </span>
        ) : saved ? (
          <span className="flex items-center justify-center gap-2">
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
