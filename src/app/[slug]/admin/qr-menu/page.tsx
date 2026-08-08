"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import QRCode from "qrcode";

interface TableData {
  id: string;
  table_number: string;
}

function getMenuURL(slug: string, tableNumber?: string): string {
  if (typeof window === "undefined") return "";
  const base = `${window.location.origin}/${slug}/menu`;
  return tableNumber ? `${base}?mesa=${tableNumber}` : base;
}

async function generateQR(text: string): Promise<string> {
  return QRCode.toDataURL(text, {
    width: 512,
    margin: 2,
    color: { dark: "#141414", light: "#ffffff" },
    errorCorrectionLevel: "M",
  });
}

function downloadQR(dataUrl: string, filename: string) {
  const link = document.createElement("a");
  link.download = filename;
  link.href = dataUrl;
  link.click();
}

async function downloadAllAsSinglePage(
  slug: string,
  restaurantName: string,
  tables: TableData[]
) {
  const entries: { label: string; url: string; dataUrl: string }[] = [];

  const generalUrl = getMenuURL(slug);
  const generalQR = await generateQR(generalUrl);
  entries.push({ label: "Menú General", url: generalUrl, dataUrl: generalQR });

  for (const table of tables) {
    const tableUrl = getMenuURL(slug, table.table_number);
    const tableQR = await generateQR(tableUrl);
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
  <title>QR Codes - ${restaurantName}</title>
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
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      padding: 8mm;
      text-align: center;
      break-inside: avoid;
    }
    .qr-card img { width: 45mm; height: 45mm; }
    .qr-card h3 { font-size: 14pt; margin-top: 4mm; color: #141414; }
    .qr-card p { font-size: 8pt; color: #999; margin-top: 2mm; word-break: break-all; }
    .restaurant-name {
      grid-column: 1 / -1;
      text-align: center;
      font-size: 18pt;
      font-weight: bold;
      color: #141414;
      padding: 5mm 0;
      border-bottom: 2px solid #b49a5a;
      margin-bottom: 5mm;
    }
    @media print {
      .page { padding: 10mm; }
      .qr-card { border: 1px solid #ccc; }
    }
  </style>
</head>
<body>
  <div class="page">
    <div class="restaurant-name">${restaurantName}</div>
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
  const [restaurantName, setRestaurantName] = useState("");
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
          setRestaurantName(data.config?.name ?? params.slug);
        }
      } catch {
        setRestaurantName(params.slug);
      }
    };
    fetchConfig();
  }, [params.slug]);

  useEffect(() => {
    const gen = async () => {
      if (typeof window === "undefined") return;
      setGenerating(true);

      const generalUrl = getMenuURL(params.slug);
      const generalDataUrl = await generateQR(generalUrl);
      setGeneralQR(generalDataUrl);

      const qrs = new Map<string, string>();
      for (const table of tables) {
        const url = getMenuURL(params.slug, table.table_number);
        const dataUrl = await generateQR(url);
        qrs.set(table.id, dataUrl);
      }
      setTableQRs(qrs);
      setGenerating(false);
    };
    gen();
  }, [params.slug, tables]);

  const handleDownloadAll = async () => {
    setGenerating(true);
    await downloadAllAsSinglePage(params.slug, restaurantName, tables);
    setGenerating(false);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="p-4 lg:p-0 space-y-6">
      {/* Header actions */}
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
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4"
            >
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
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4"
            >
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
          {/* General QR */}
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
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-3.5 w-3.5"
                  >
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  Descargar PNG
                </button>
              </div>
            </div>
          </div>

          {/* Per-table QRs */}
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
                        className="text-xs text-[#b49a5a] hover:text-[#8a7640] font-medium transition-colors disabled:opacity-50"
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
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-10 w-10 text-[#ccc] mx-auto mb-3"
              >
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

      {/* Print styles */}
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
