"use client";

import { useCallback, useRef } from "react";

type NotificationSound = "new-order" | "order-ready" | "cancel-request";

const FREQUENCIES: Record<NotificationSound, number[][]> = {
  "new-order": [[880, 150], [1100, 150], [1320, 200]],
  "order-ready": [[660, 120], [880, 120], [660, 120], [880, 200]],
  "cancel-request": [[440, 200], [330, 300]],
};

function playSound(type: NotificationSound) {
  try {
    const ctx = new AudioContext();
    const notes = FREQUENCIES[type];
    let time = ctx.currentTime;

    for (const [freq, duration] of notes) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.15, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + duration / 1000);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(time);
      osc.stop(time + duration / 1000);
      time += duration / 1000;
    }

    setTimeout(() => ctx.close(), time * 1000 + 500);
  } catch {
    // Web Audio not available
  }
}

function requestBrowserPermission() {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission === "default") {
    Notification.requestPermission();
  }
}

function sendBrowserNotification(title: string, body: string) {
  if (
    typeof window === "undefined" ||
    !("Notification" in window) ||
    Notification.permission !== "granted" ||
    document.hasFocus()
  ) {
    return;
  }
  new Notification(title, { body, icon: "/favicon.ico" });
}

export interface ToastNotification {
  id: string;
  title: string;
  body: string;
  type: "info" | "success" | "warning";
  createdAt: number;
}

export function useNotifications(
  onToast: (toast: ToastNotification) => void
) {
  const lastSeenRef = useRef<Set<string>>(new Set());
  const initializedRef = useRef(false);

  const initialize = useCallback(
    (currentIds: string[]) => {
      lastSeenRef.current = new Set(currentIds);
      initializedRef.current = true;
      requestBrowserPermission();
    },
    []
  );

  const checkForNewOrders = useCallback(
    (
      orders: { id: string; order_number: number; status: string; table?: { table_number: string } }[]
    ) => {
      if (!initializedRef.current) return;

      const currentIds = new Set(orders.map((o) => o.id));
      const prev = lastSeenRef.current;

      for (const order of orders) {
        if (!prev.has(order.id)) {
          const mesa = order.table?.table_number ?? "?";
          const title = `Nueva comanda #${order.order_number}`;
          const body = `Mesa ${mesa}`;

          playSound("new-order");
          sendBrowserNotification(title, body);
          onToast({
            id: `new-${order.id}`,
            title,
            body,
            type: "info",
            createdAt: Date.now(),
          });
        }
      }

      lastSeenRef.current = currentIds;
    },
    [onToast]
  );

  const checkForReadyOrders = useCallback(
    (
      orders: { id: string; order_number: number; status: string; table?: { table_number: string } }[],
      previousOrders: { id: string; status: string }[]
    ) => {
      const prevMap = new Map(previousOrders.map((o) => [o.id, o.status]));

      for (const order of orders) {
        const prevStatus = prevMap.get(order.id);
        if (prevStatus && prevStatus !== "ready" && order.status === "ready") {
          const mesa = order.table?.table_number ?? "?";
          const title = `Pedido #${order.order_number} listo`;
          const body = `Mesa ${mesa} — listo para servir`;

          playSound("order-ready");
          sendBrowserNotification(title, body);
          onToast({
            id: `ready-${order.id}-${Date.now()}`,
            title,
            body,
            type: "success",
            createdAt: Date.now(),
          });
        }
      }
    },
    [onToast]
  );

  const notifyCancelRequest = useCallback(
    (orderNumber: number, mesa: number | string) => {
      const title = "Solicitud de cancelación";
      const body = `Pedido #${orderNumber} — Mesa ${mesa}`;

      playSound("cancel-request");
      sendBrowserNotification(title, body);
      onToast({
        id: `cancel-${orderNumber}-${Date.now()}`,
        title,
        body,
        type: "warning",
        createdAt: Date.now(),
      });
    },
    [onToast]
  );

  return { initialize, checkForNewOrders, checkForReadyOrders, notifyCancelRequest };
}
