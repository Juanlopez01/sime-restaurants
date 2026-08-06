"use client";

import { useEffect, useRef } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase-client";

interface UseRealtimeOptions {
  table: string;
  filter?: string;
  onUpdate: () => void;
  pollingMs?: number;
}

export function useRealtime({ table, filter, onUpdate, pollingMs = 10000 }: UseRealtimeOptions) {
  const onUpdateRef = useRef(onUpdate);
  onUpdateRef.current = onUpdate;

  useEffect(() => {
    if (isSupabaseConfigured && supabase) {
      const channelName = `${table}:${filter ?? "all"}`;
      const channel = supabase
        .channel(channelName)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table,
            ...(filter ? { filter } : {}),
          },
          () => onUpdateRef.current()
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }

    // Fallback: polling when Supabase is not configured
    const interval = setInterval(() => onUpdateRef.current(), pollingMs);
    return () => clearInterval(interval);
  }, [table, filter, pollingMs]);
}
