const CURRENCY_CONFIG: Record<string, { symbol: string; locale: string }> = {
  ARS: { symbol: "$", locale: "es-AR" },
  USD: { symbol: "US$", locale: "en-US" },
  EUR: { symbol: "€", locale: "de-DE" },
  BRL: { symbol: "R$", locale: "pt-BR" },
  CLP: { symbol: "$", locale: "es-CL" },
  MXN: { symbol: "$", locale: "es-MX" },
  COP: { symbol: "$", locale: "es-CO" },
  PEN: { symbol: "S/", locale: "es-PE" },
  UYU: { symbol: "$", locale: "es-UY" },
};

export function formatPrice(amount: number, currency: string = "ARS"): string {
  const config = CURRENCY_CONFIG[currency] || CURRENCY_CONFIG.ARS;
  return `${config.symbol}${amount.toLocaleString(config.locale)}`;
}
