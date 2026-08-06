"use client";

import { useSyncStatus } from "@/hooks/use-sync-status";

const STATUS_CONFIG = {
  online: { label: "Conectado", color: "bg-green-500" },
  offline: { label: "Sin conexión", color: "bg-red-500" },
  syncing: { label: "Sincronizando...", color: "bg-yellow-500" },
} as const;

export function SyncIndicator() {
  const { status } = useSyncStatus();
  const config = STATUS_CONFIG[status];

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-stone-800/90 text-white text-sm">
      <span className={`h-2.5 w-2.5 rounded-full ${config.color} ${status === "syncing" ? "animate-pulse" : ""}`} />
      {config.label}
    </div>
  );
}
