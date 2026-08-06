"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import type { CancelRequestWithDetails } from "@/types";

export function CancelRequestBanner({ cashierId }: { cashierId: string }) {
  const params = useParams<{ slug: string }>();
  const [requests, setRequests] = useState<CancelRequestWithDetails[]>([]);

  const fetchRequests = useCallback(async () => {
    try {
      const res = await fetch(`/api/${params.slug}/cancel-requests`);
      if (res.ok) {
        const data = await res.json();
        setRequests(data.requests);
      }
    } catch {
      // offline
    }
  }, [params.slug]);

  useEffect(() => {
    fetchRequests();
    const interval = setInterval(fetchRequests, 5000);
    return () => clearInterval(interval);
  }, [fetchRequests]);

  async function resolve(requestId: string, approved: boolean) {
    setRequests((prev) => prev.filter((r) => r.id !== requestId));

    try {
      await fetch(`/api/${params.slug}/cancel-requests`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: requestId,
          resolved_by: cashierId,
          approved,
        }),
      });
    } catch {
      // offline
    }

    fetchRequests();
  }

  if (requests.length === 0) return null;

  return (
    <div className="space-y-2 px-4 pt-3">
      {requests.map((req) => (
        <div
          key={req.id}
          className="card border border-red-200 bg-red-50 p-4"
        >
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-red-700">
              Solicitud de cancelación
            </p>
            <p className="text-sm text-ink mt-1">
              <span className="font-semibold">
                {req.requester?.name ?? "Mozo"}
              </span>
              {" quiere cancelar "}
              <span className="font-semibold">
                Mesa {req.order?.table?.table_number ?? "?"} — #{req.order?.order_number ?? "?"}
              </span>
            </p>
            {req.reason && (
              <p className="text-xs text-ink-muted mt-1 italic">
                &quot;{req.reason}&quot;
              </p>
            )}
            {req.order && (
              <div className="mt-1.5 flex flex-wrap gap-x-2 text-xs text-ink-muted">
                {req.order.items.map((item) => (
                  <span key={item.id}>
                    {item.quantity}x {item.product_name}
                  </span>
                ))}
                <span className="font-semibold text-ink">
                  · ${req.order.subtotal.toLocaleString("es-AR")}
                </span>
              </div>
            )}
          </div>
          <div className="flex gap-2 mt-3">
            <button
              onClick={() => resolve(req.id, true)}
              className="btn-primary flex-1 bg-red-600 hover:bg-red-700 text-sm py-2.5"
            >
              Aprobar
            </button>
            <button
              onClick={() => resolve(req.id, false)}
              className="btn-secondary flex-1 text-sm py-2.5"
            >
              Rechazar
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
