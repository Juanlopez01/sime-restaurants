import Afip from "@afipsdk/afip.js";
import type { BillingConfig, InvoiceType } from "@/types";

export interface InvoiceRequest {
  amount: number;
  invoice_type: InvoiceType;
  customer_cuit?: string;
  customer_name?: string;
  concept?: number;
}

export interface InvoiceResult {
  cae: string;
  cae_expiration: string;
  invoice_number: number;
  point_of_sale: number;
  invoice_type: InvoiceType;
  total: number;
  raw_response: Record<string, unknown>;
}

function getAfipClient(config: BillingConfig): Afip {
  if (!config.cuit || !config.cert || !config.key) {
    throw new Error("Faltan datos de facturación (CUIT, certificado o clave)");
  }

  return new Afip({
    CUIT: Number(config.cuit),
    cert: config.cert,
    key: config.key,
    production: config.environment === "production",
  } as ConstructorParameters<typeof Afip>[0]);
}

function getInvoiceTypeId(type: InvoiceType): number {
  // Factura B = 6, Factura C = 11, Factura A = 1
  const map: Record<InvoiceType, number> = { A: 1, B: 6, C: 11 };
  return map[type];
}

export async function getLastInvoiceNumber(
  config: BillingConfig,
  invoiceType: InvoiceType
): Promise<number> {
  const afip = getAfipClient(config);
  const puntoVenta = config.punto_venta ?? 1;
  const tipoComprobante = getInvoiceTypeId(invoiceType);

  const lastVoucher = await afip.ElectronicBilling.getLastVoucher(
    puntoVenta,
    tipoComprobante
  );

  return lastVoucher;
}

export async function createInvoice(
  config: BillingConfig,
  request: InvoiceRequest
): Promise<InvoiceResult> {
  const afip = getAfipClient(config);
  const puntoVenta = config.punto_venta ?? 1;
  const tipoComprobante = getInvoiceTypeId(request.invoice_type);

  const lastVoucher = await afip.ElectronicBilling.getLastVoucher(
    puntoVenta,
    tipoComprobante
  );
  const nextNumber = lastVoucher + 1;

  const today = new Date();
  const dateStr = today.toISOString().split("T")[0].replace(/-/g, "");

  const voucherData: Record<string, unknown> = {
    CantReg: 1,
    PtoVta: puntoVenta,
    CbteTipo: tipoComprobante,
    Concepto: request.concept ?? 1, // 1 = Productos
    DocTipo: request.customer_cuit ? 80 : 99, // 80 = CUIT, 99 = Consumidor Final
    DocNro: request.customer_cuit ? Number(request.customer_cuit) : 0,
    CbteDesde: nextNumber,
    CbteHasta: nextNumber,
    CbteFch: dateStr,
    ImpTotal: request.amount,
    ImpTotConc: 0,
    ImpNeto: request.amount,
    ImpOpEx: 0,
    ImpIVA: 0,
    ImpTrib: 0,
    MonId: "PES",
    MonCotiz: 1,
  };

  const result = await afip.ElectronicBilling.createVoucher(voucherData);

  return {
    cae: result.CAE,
    cae_expiration: result.CAEFchVto,
    invoice_number: nextNumber,
    point_of_sale: puntoVenta,
    invoice_type: request.invoice_type,
    total: request.amount,
    raw_response: result as Record<string, unknown>,
  };
}

export function isArcaConfigured(config: BillingConfig | null | undefined): boolean {
  if (!config) return false;
  return !!(config.cuit && config.cert && config.key && config.punto_venta);
}
