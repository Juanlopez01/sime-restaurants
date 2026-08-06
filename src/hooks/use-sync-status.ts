"use client";

import { useState, useEffect, useCallback } from "react";
import type { SyncStatus } from "@/types";

export function useSyncStatus() {
  const [status, setStatus] = useState<SyncStatus>("online");

  const updateStatus = useCallback(() => {
    setStatus(navigator.onLine ? "online" : "offline");
  }, []);

  useEffect(() => {
    updateStatus();
    window.addEventListener("online", updateStatus);
    window.addEventListener("offline", updateStatus);
    return () => {
      window.removeEventListener("online", updateStatus);
      window.removeEventListener("offline", updateStatus);
    };
  }, [updateStatus]);

  return { status, setStatus };
}
