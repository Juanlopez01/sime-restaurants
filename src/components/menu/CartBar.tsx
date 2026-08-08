"use client";

import { useState } from "react";
import type { Product } from "@/types";

interface CartItem {
  product_id: string;
  product_name: string;
  unit_price: number;
  quantity: number;
}

interface CartBarProps {
  items: CartItem[];
  slug: string;
  tableNumber: string;
  onClear: () => void;
  onRemove: (productId: string) => void;
  onAdd: (product: Product) => void;
  products: Product[];
}

type OrderState = "idle" | "review" | "sending" | "sent" | "error";

export function CartBar({
  items,
  slug,
  tableNumber,
  onClear,
  onRemove,
  onAdd,
  products,
}: CartBarProps) {
  const [state, setState] = useState<OrderState>("idle");
  const [notes, setNotes] = useState("");
  const [orderNumber, setOrderNumber] = useState<number | null>(null);

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const totalPrice = items.reduce((sum, i) => sum + i.unit_price * i.quantity, 0);

  if (totalItems === 0 && state !== "sent") return null;

  const handleSubmit = async () => {
    setState("sending");
    try {
      const res = await fetch(`/api/${slug}/customer-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          table_number: tableNumber,
          items: items.map((i) => ({
            product_id: i.product_id,
            product_name: i.product_name,
            unit_price: i.unit_price,
            quantity: i.quantity,
          })),
          notes: notes || undefined,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setOrderNumber(data.order.order_number);
        setState("sent");
        onClear();
      } else {
        setState("error");
      }
    } catch {
      setState("error");
    }
  };

  if (state === "sent") {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
        <div className="w-full max-w-sm rounded-2xl bg-white p-8 text-center shadow-xl">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-50">
            <svg viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-[#1a1a1a]">
            Pedido enviado
          </h3>
          {orderNumber && (
            <p className="mt-1 text-3xl font-bold text-[#b49a5a] tabular-nums">
              #{orderNumber}
            </p>
          )}
          <p className="mt-3 text-sm text-[#777]">
            Tu pedido fue recibido y ya está siendo preparado. Te lo llevaremos
            a la mesa {tableNumber}.
          </p>
          <button
            onClick={() => {
              setState("idle");
              setNotes("");
              setOrderNumber(null);
            }}
            className="mt-6 w-full rounded-xl bg-[#141414] py-3 text-sm font-semibold text-white hover:bg-[#2a2a2a] transition-colors"
          >
            Hacer otro pedido
          </button>
        </div>
      </div>
    );
  }

  if (state === "review" || state === "sending" || state === "error") {
    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-black/50">
        <div className="flex-1" onClick={() => state !== "sending" && setState("idle")} />
        <div className="w-full max-h-[85vh] rounded-t-2xl bg-white shadow-xl flex flex-col">
          <div className="flex items-center justify-between border-b border-[#e8e6e1] px-5 py-4">
            <h3 className="text-lg font-bold text-[#1a1a1a]">Tu pedido</h3>
            <button
              onClick={() => setState("idle")}
              disabled={state === "sending"}
              className="text-[#999] hover:text-[#1a1a1a] transition-colors disabled:opacity-50"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="h-5 w-5">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
            {items.map((item) => {
              const product = products.find((p) => p.id === item.product_id);
              return (
                <div key={item.product_id} className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#1a1a1a] truncate">
                      {item.product_name}
                    </p>
                    <p className="text-xs text-[#999] tabular-nums">
                      ${item.unit_price.toLocaleString("es-AR")} c/u
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onRemove(item.product_id)}
                      disabled={state === "sending"}
                      className="flex h-7 w-7 items-center justify-center rounded-full bg-[#f0ede6] text-[#777] hover:bg-[#e8e5dd] transition-colors disabled:opacity-50"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="h-3.5 w-3.5">
                        <line x1="5" y1="12" x2="19" y2="12" />
                      </svg>
                    </button>
                    <span className="w-6 text-center text-sm font-bold tabular-nums">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => product && onAdd(product)}
                      disabled={state === "sending"}
                      className="flex h-7 w-7 items-center justify-center rounded-full bg-[#b49a5a] text-white hover:bg-[#a08848] transition-colors disabled:opacity-50"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="h-3.5 w-3.5">
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                      </svg>
                    </button>
                  </div>
                  <span className="w-20 text-right text-sm font-semibold text-[#1a1a1a] tabular-nums">
                    ${(item.unit_price * item.quantity).toLocaleString("es-AR")}
                  </span>
                </div>
              );
            })}

            <div className="pt-3">
              <label className="text-xs font-medium text-[#999] uppercase tracking-wider">
                Notas (opcional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                disabled={state === "sending"}
                placeholder="Sin sal, bien cocido, etc."
                className="mt-1 w-full rounded-lg border border-[#e8e6e1] px-3 py-2 text-sm text-[#1a1a1a] placeholder:text-[#ccc] focus:border-[#b49a5a] focus:outline-none resize-none disabled:opacity-50"
                rows={2}
              />
            </div>

            {state === "error" && (
              <p className="text-sm text-red-600 font-medium">
                Hubo un error al enviar el pedido. Intentá de nuevo.
              </p>
            )}
          </div>

          <div className="border-t border-[#e8e6e1] px-5 py-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-[#777]">Total</span>
              <span className="text-xl font-bold text-[#1a1a1a] tabular-nums">
                ${totalPrice.toLocaleString("es-AR")}
              </span>
            </div>
            <button
              onClick={handleSubmit}
              disabled={state === "sending"}
              className="w-full rounded-xl bg-[#b49a5a] py-3.5 text-sm font-bold text-white hover:bg-[#a08848] active:bg-[#8a7640] transition-colors disabled:opacity-70"
            >
              {state === "sending" ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Enviando...
                </span>
              ) : (
                "Confirmar pedido"
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-0 inset-x-0 z-40 px-4 pb-4 safe-bottom">
      <button
        onClick={() => setState("review")}
        className="w-full flex items-center justify-between rounded-2xl bg-[#141414] px-5 py-4 shadow-lg shadow-black/20 hover:bg-[#1e1e1e] active:bg-[#252525] transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#b49a5a] text-xs font-bold text-white tabular-nums">
            {totalItems}
          </span>
          <span className="text-sm font-semibold text-white">Ver pedido</span>
        </div>
        <span className="text-sm font-bold text-white tabular-nums">
          ${totalPrice.toLocaleString("es-AR")}
        </span>
      </button>
    </div>
  );
}
