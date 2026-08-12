export type Locale = "es" | "en" | "pt";

export const LOCALES: { code: Locale; label: string; flag: string }[] = [
  { code: "es", label: "Español", flag: "🇦🇷" },
  { code: "en", label: "English", flag: "🇺🇸" },
  { code: "pt", label: "Português", flag: "🇧🇷" },
];

const translations: Record<Locale, Record<string, string>> = {
  es: {
    menu: "Carta",
    table: "Mesa",
    add: "Agregar",
    view_order: "Ver pedido",
    your_order: "Tu pedido",
    notes: "Notas para la cocina",
    confirm_order: "Confirmar pedido",
    sending: "Enviando...",
    order_sent: "Pedido enviado",
    order_sent_desc: "Tu pedido fue recibido y está siendo preparado.",
    order_number: "N° de pedido",
    new_order: "Hacer otro pedido",
    total: "Total",
    empty_cart: "No hay productos en tu pedido",
    menu_coming_soon: "El menú estará disponible próximamente.",
    close: "Cerrar",
    item: "producto",
    items: "productos",
    category_all: "Todo",
  },
  en: {
    menu: "Menu",
    table: "Table",
    add: "Add",
    view_order: "View order",
    your_order: "Your order",
    notes: "Notes for the kitchen",
    confirm_order: "Confirm order",
    sending: "Sending...",
    order_sent: "Order sent",
    order_sent_desc: "Your order was received and is being prepared.",
    order_number: "Order #",
    new_order: "Place another order",
    total: "Total",
    empty_cart: "No items in your order",
    menu_coming_soon: "Menu coming soon.",
    close: "Close",
    item: "item",
    items: "items",
    category_all: "All",
  },
  pt: {
    menu: "Cardápio",
    table: "Mesa",
    add: "Adicionar",
    view_order: "Ver pedido",
    your_order: "Seu pedido",
    notes: "Observações para a cozinha",
    confirm_order: "Confirmar pedido",
    sending: "Enviando...",
    order_sent: "Pedido enviado",
    order_sent_desc: "Seu pedido foi recebido e está sendo preparado.",
    order_number: "N° do pedido",
    new_order: "Fazer outro pedido",
    total: "Total",
    empty_cart: "Nenhum produto no seu pedido",
    menu_coming_soon: "O cardápio estará disponível em breve.",
    close: "Fechar",
    item: "produto",
    items: "produtos",
    category_all: "Tudo",
  },
};

export function t(locale: Locale, key: string): string {
  return translations[locale]?.[key] ?? translations.es[key] ?? key;
}

export function detectLocale(): Locale {
  if (typeof navigator === "undefined") return "es";
  const lang = navigator.language.slice(0, 2).toLowerCase();
  if (lang === "en") return "en";
  if (lang === "pt") return "pt";
  return "es";
}
