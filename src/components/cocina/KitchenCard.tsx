"use client";

import { useEffect, useState } from "react";
import type { OrderWithItems } from "@/types";

interface KitchenCardProps {
  order: OrderWithItems;
  onMarkPreparing: (orderId: string) => void;
  onMarkReady: (orderId: string) => void;
}

function timeAgo(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
  if (diff < 1) return "ahora";
  if (diff < 60) return `${diff}min`;
  return `${Math.floor(diff / 60)}h ${diff % 60}m`;
}

export function KitchenCard({ order, onMarkPreparing, onMarkReady }: KitchenCardProps) {
  const [elapsed, setElapsed] = useState(() => timeAgo(order.created_at));

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(timeAgo(order.created_at));
    }, 30000);
    return () => clearInterval(interval);
  }, [order.created_at]);

  const isPending = order.status === "pending";
  const isInKitchen = order.status === "in_kitchen";

  const borderColor = isPending
    ? "border-amber-500"
    : isInKitchen
      ? "border-orange-500"
      : "border-green-500";

  const bgColor = isPending
    ? "bg-amber-500/10"
    : isInKitchen
      ? "bg-orange-500/10"
      : "bg-green-500/10";

  return (
    <div className={`rounded-2xl border-2 p-5 ${borderColor} ${bgColor}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold text-white">
            Mesa {order.table?.table_number ?? "?"}
          </span>
          <span className="text-sm text-stone-500 font-medium">
            #{order.order_number}
          </span>
        </div>
        <span className="rounded-full bg-white/10 px-3 py-1 text-sm font-mono font-bold text-stone-400">
          {elapsed}
        </span>
      </div>

      <div className="space-y-2.5 mb-4">
        {order.items.map((item) => (
          <div key={item.id} className="flex items-start gap-3">
            <span className="text-xl font-bold text-white/80 w-8 text-right tabular-nums">
              {item.quantity}×
            </span>
            <div className="flex-1">
              <span className="text-xl font-semibold text-white">
                {item.product_name}
              </span>
              {item.notes && (
                <p className="text-sm text-[#b49a5a] font-medium mt-0.5">
                  → {item.notes}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {order.notes && (
        <p className="text-sm text-[#b49a5a] mb-4 border-t border-white/10 pt-3">
          Nota: {order.notes}
        </p>
      )}

      <div className="flex gap-2">
        {isPending && (
          <button
            onClick={() => onMarkPreparing(order.id)}
            className="flex-1 rounded-xl bg-orange-600 px-4 py-4 text-lg font-bold text-white active:bg-orange-700 transition-colors"
          >
            En preparación
          </button>
        )}
        {isInKitchen && (
          <button
            onClick={() => onMarkReady(order.id)}
            className="flex-1 rounded-xl bg-green-600 px-4 py-4 text-lg font-bold text-white active:bg-green-700 transition-colors"
          >
            Listo para servir
          </button>
        )}
      </div>
    </div>
  );
}
