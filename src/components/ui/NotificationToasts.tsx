"use client";

import { useState, useCallback, useEffect } from "react";
import type { ToastNotification } from "@/hooks/use-notifications";

const TOAST_DURATION = 5000;

const TYPE_STYLES = {
  info: "border-blue-500/30 bg-blue-500/10",
  success: "border-emerald-500/30 bg-emerald-500/10",
  warning: "border-amber-500/30 bg-amber-500/10",
} as const;

const TYPE_ICONS = {
  info: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-blue-400">
      <path d="M15 17H9l3-8 3 8z" />
      <path d="M12 3a9 9 0 100 18 9 9 0 000-18z" />
    </svg>
  ),
  success: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-emerald-400">
      <path d="M20 6L9 17l-5-5" />
    </svg>
  ),
  warning: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-amber-400">
      <path d="M12 9v4M12 17h.01" />
      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
    </svg>
  ),
} as const;

export function useToasts() {
  const [toasts, setToasts] = useState<ToastNotification[]>([]);

  const addToast = useCallback((toast: ToastNotification) => {
    setToasts((prev) => [toast, ...prev].slice(0, 5));
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return { toasts, addToast, removeToast };
}

export function NotificationToasts({
  toasts,
  onDismiss,
}: {
  toasts: ToastNotification[];
  onDismiss: (id: string) => void;
}) {
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 w-80 pointer-events-none">
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

function Toast({
  toast,
  onDismiss,
}: {
  toast: ToastNotification;
  onDismiss: (id: string) => void;
}) {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.id), TOAST_DURATION);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  return (
    <div
      className={`pointer-events-auto rounded-xl border px-4 py-3 shadow-lg backdrop-blur-sm animate-slide-in ${TYPE_STYLES[toast.type]}`}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 shrink-0">{TYPE_ICONS[toast.type]}</div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white">{toast.title}</p>
          <p className="text-xs text-white/60 mt-0.5">{toast.body}</p>
        </div>
        <button
          onClick={() => onDismiss(toast.id)}
          className="shrink-0 text-white/30 hover:text-white/60 transition-colors"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
