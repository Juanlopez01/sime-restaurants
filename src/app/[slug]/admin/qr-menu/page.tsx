"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import QRCode from "qrcode";

interface TableData {
  id: string;
  table_number: string;
}

interface BrandConfig {
  name: string;
  logo_url?: string;
  brand_color: string;
  brand_bg: string;
}

function getMenuURL(slug: string, tableNumber?: string): string {
  if (typeof window === "undefined") return "";
  const base = `${window.location.origin}/${slug}/menu`;
  return tableNumber ? `${base}?mesa=${tableNumber}` : base;
}

async function generateQR(
  text: string,
  color: string = "#141414",
  bg: string = "#ffffff"
): Promise<string> {
  return QRCode.toDataURL(text, {
    width: 512,
    margin: 2,
    color: { dark: color, light: bg },
    errorCorrectionLevel: "H",
  });
}

function downloadQR(dataUrl: string, filename: string) {
  const link = document.createElement("a");
  link.download = filename;
  link.href = dataUrl;
  link.click();
}

async function generateQRWithLogo(
  text: string,
  color: string,
  bg: string,
  logoUrl?: string
): Promise<string> {
  const qrDataUrl = await generateQR(text, color, bg);

  if (!logoUrl) return qrDataUrl;

  return new Promise((resolve) => {
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext("2d")!;

    const qrImg = new Image();
    qrImg.onload = () => {
      ctx.drawImage(qrImg, 0, 0, 512, 512);

      const logoImg = new Image();
      logoImg.crossOrigin = "anonymous";
      logoImg.onload = () => {
        const logoSize = 100;
        const x = (512 - logoSize) / 2;
        const y = (512 - logoSize) / 2;

        ctx.beginPath();
        ctx.arc(x + logoSize / 2, y + logoSize / 2, logoSize / 2 + 6, 0, Math.PI * 2);
        ctx.fillStyle = bg;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(x + logoSize / 2, y + logoSize / 2, logoSize / 2 + 3, 0, Math.PI * 2);
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.save();
        ctx.beginPath();
        ctx.arc(x + logoSize / 2, y + logoSize / 2, logoSize / 2, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(logoImg, x, y, logoSize, logoSize);
        ctx.restore();

        resolve(canvas.toDataURL("image/png"));
      };
      logoImg.onerror = () => resolve(qrDataUrl);
      logoImg.src = logoUrl;
    };
    qrImg.src = qrDataUrl;
  });
}

async function downloadAllAsSinglePage(
  slug: string,
  brand: BrandConfig,
  tables: TableData[]
) {
  const entries: { label: string; url: string; dataUrl: string }[] = [];

  const generalUrl = getMenuURL(slug);
  const generalQR = await generateQRWithLogo(generalUrl, brand.brand_color, "#ffffff", brand.logo_url);
  entries.push({ label: "Menú General", url: generalUrl, dataUrl: generalQR });

  for (const table of tables) {
    const tableUrl = getMenuURL(slug, table.table_number);
    const tableQR = await generateQRWithLogo(tableUrl, brand.brand_color, "#ffffff", brand.logo_url);
    entries.push({
      label: `Mesa ${table.table_number}`,
      url: tableUrl,
      dataUrl: tableQR,
    });
  }

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>QR Codes - ${brand.name}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: system-ui, sans-serif; background: #fff; }
    .page {
      width: 210mm;
      min-height: 297mm;
      margin: 0 auto;
      padding: 15mm;
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 10mm;
      align-content: start;
    }
    .qr-card {
      border: 2px solid ${brand.brand_color}30;
      border-radius: 12px;
      padding: 8mm;
      text-align: center;
      break-inside: avoid;
    }
    .qr-card img { width: 45mm; height: 45mm; }
    .qr-card h3 { font-size: 14pt; margin-top: 4mm; color: ${brand.brand_bg}; }
    .qr-card p { font-size: 8pt; color: #999; margin-top: 2mm; word-break: break-all; }
    .restaurant-name {
      grid-column: 1 / -1;
      text-align: center;
      font-size: 18pt;
      font-weight: bold;
      color: ${brand.brand_bg};
      padding: 5mm 0;
      border-bottom: 2px solid ${brand.brand_color};
      margin-bottom: 5mm;
    }
    @media print {
      .page { padding: 10mm; }
    }
  </style>
</head>
<body>
  <div class="page">
    <div class="restaurant-name">${brand.name}</div>
    ${entries
      .map(
        (e) => `
    <div class="qr-card">
      <img src="${e.dataUrl}" alt="${e.label}" />
      <h3>${e.label}</h3>
      <p>${e.url}</p>
    </div>`
      )
      .join("")}
  </div>
</body>
</html>`;

  const blob = new Blob([html], { type: "text/html" });
  const link = document.createElement("a");
  link.download = `qr-codes-${slug}.html`;
  link.href = URL.createObjectURL(blob);
  link.click();
  URL.revokeObjectURL(link.href);
}

export default function QRMenuPage() {
  const params = useParams<{ slug: string }>();
  const [tables, setTables] = useState<TableData[]>([]);
  const [generalQR, setGeneralQR] = useState<string>("");
  const [tableQRs, setTableQRs] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [brand, setBrand] = useState<BrandConfig>({
    name: "",
    brand_color: "#141414",
    brand_bg: "#141414",
  });
  const printRef = useRef<HTMLDivElement>(null);

  const fetchTables = useCallback(async () => {
    try {
      const res = await fetch(`/api/${params.slug}/tables`);
      if (res.ok) {
        const data = await res.json();
        setTables(data.tables ?? []);
      }
    } catch {}
    setLoading(false);
  }, [params.slug]);

  useEffect(() => {
    fetchTables();
  }, [fetchTables]);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const res = await fetch(`/api/${params.slug}/config`);
        if (res.ok) {
          const data = await res.json();
          const r = data.restaurant;
          setBrand({
            name: r?.name ?? params.slug,
            logo_url: r?.logo_url || undefined,
            brand_color: r?.settings?.brand_color || "#141414",
            brand_bg: r?.settings?.brand_bg || "#141414",
          });
        }
      } catch {
        setBrand({ name: params.slug, brand_color: "#141414", brand_bg: "#141414" });
      }
    };
    fetchConfig();
  }, [params.slug]);

  useEffect(() => {
    const gen = async () => {
      if (typeof window === "undefined") return;
      setGenerating(true);

      const generalUrl = getMenuURL(params.slug);
      const generalDataUrl = await generateQRWithLogo(
        generalUrl,
        brand.brand_color,
        "#ffffff",
        brand.logo_url
      );
      setGeneralQR(generalDataUrl);

      const qrs = new Map<string, string>();
      for (const table of tables) {
        const url = getMenuURL(params.slug, table.table_number);
        const dataUrl = await generateQRWithLogo(url, brand.brand_color, "#ffffff", brand.logo_url);
        qrs.set(table.id, dataUrl);
      }
      setTableQRs(qrs);
      setGenerating(false);
    };
    gen();
  }, [params.slug, tables, brand]);

  const handleDownloadAll = async () => {
    setGenerating(true);
    await downloadAllAsSinglePage(params.slug, brand, tables);
    setGenerating(false);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="p-4 lg:p-0 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-[#777]">
            Generá códigos QR para que tus clientes accedan al menú digital
            desde sus celulares.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handlePrint}
            disabled={generating}
            className="flex items-center gap-2 rounded-lg border border-[#e8e6e1] bg-white px-4 py-2 text-sm font-medium text-[#1a1a1a] hover:bg-[#f5f3ee] transition-colors disabled:opacity-50"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
              <polyline points="6 9 6 2 18 2 18 9" />
              <path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2" />
              <rect x="6" y="14" width="12" height="8" />
            </svg>
            Imprimir
          </button>
          <button
            onClick={handleDownloadAll}
            disabled={generating}
            className="flex items-center gap-2 rounded-lg bg-[#141414] px-4 py-2 text-sm font-medium text-white hover:bg-[#2a2a2a] transition-colors disabled:opacity-50"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Descargar todos
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#e8e6e1] border-t-[#b49a5a]" />
        </div>
      ) : (
        <div ref={printRef}>
          <div className="card card-body mb-6">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="shrink-0">
                {generalQR ? (
                  <img
                    src={generalQR}
                    alt="QR Menú General"
                    className="w-48 h-48 rounded-lg border border-[#e8e6e1]"
                  />
                ) : (
                  <div className="w-48 h-48 rounded-lg bg-[#f5f3ee] animate-pulse" />
                )}
              </div>
              <div className="flex-1 text-center sm:text-left">
                <h3 className="text-lg font-semibold text-[#1a1a1a]">
                  QR del Menú General
                </h3>
                <p className="text-sm text-[#777] mt-1">
                  Este código lleva directamente al menú digital del
                  restaurante. Ideal para la entrada, barra, o redes sociales.
                </p>
                {brand.logo_url && (
                  <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3">
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                    Logo incluido en el QR
                  </p>
                )}
                <p className="text-xs text-[#999] mt-2 font-mono break-all">
                  {getMenuURL(params.slug)}
                </p>
                <button
                  onClick={() =>
                    generalQR &&
                    downloadQR(generalQR, `qr-menu-${params.slug}.png`)
                  }
                  disabled={!generalQR}
                  className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-[#e8e6e1] px-3 py-1.5 text-sm font-medium text-[#1a1a1a] hover:bg-[#f5f3ee] transition-colors disabled:opacity-50"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  Descargar PNG
                </button>
              </div>
            </div>
          </div>

          {tables.length > 0 && (
            <>
              <h3 className="text-sm font-semibold text-[#1a1a1a] mb-3">
                QR por mesa ({tables.length})
              </h3>
              <p className="text-sm text-[#777] mb-4">
                Cada mesa tiene su propio QR con el número de mesa incluido en
                el link. Así podés saber desde qué mesa escanean.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 print:grid-cols-3">
                {tables.map((table) => {
                  const qrUrl = tableQRs.get(table.id);
                  return (
                    <div
                      key={table.id}
                      className="card card-body flex flex-col items-center gap-3 print:break-inside-avoid"
                    >
                      {qrUrl ? (
                        <img
                          src={qrUrl}
                          alt={`QR Mesa ${table.table_number}`}
                          className="w-32 h-32 rounded border border-[#e8e6e1]"
                        />
                      ) : (
                        <div className="w-32 h-32 rounded bg-[#f5f3ee] animate-pulse" />
                      )}
                      <span className="text-sm font-semibold text-[#1a1a1a]">
                        Mesa {table.table_number}
                      </span>
                      <button
                        onClick={() =>
                          qrUrl &&
                          downloadQR(
                            qrUrl,
                            `qr-mesa-${table.table_number}-${params.slug}.png`
                          )
                        }
                        disabled={!qrUrl}
                        className="text-xs font-medium transition-colors disabled:opacity-50"
                        style={{ color: brand.brand_color !== "#141414" ? brand.brand_color : "#b49a5a" }}
                      >
                        Descargar
                      </button>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {tables.length === 0 && (
            <div className="card card-body text-center py-12">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-10 w-10 text-[#ccc] mx-auto mb-3">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <path d="M3 9h18M9 21V9" />
              </svg>
              <p className="text-sm text-[#999]">
                No hay mesas configuradas. Agregá mesas desde la sección{" "}
                <span className="font-medium text-[#1a1a1a]">Salón</span> para
                generar QR individuales por mesa.
              </p>
            </div>
          )}
        </div>
      )}

      <style jsx global>{`
        @media print {
          body > *:not(.print-content) {
            visibility: hidden;
          }
          aside,
          header,
          nav {
            display: none !important;
          }
          .lg\\:pl-\\[260px\\] {
            padding-left: 0 !important;
          }
        }
      `}</style>
    </div>
  );
}
