"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase-client";
import type { OrderWithItems } from "@/types";

export function useRealtimeOrders(restaurantId: string) {
  const [orders, setOrders] = useState<OrderWithItems[]>([]);

  useEffect(() => {
    const channel = supabase
      .channel(`orders:${restaurantId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
          filter: `restaurant_id=eq.${restaurantId}`,
        },
        () => {
          fetchOrders();
        }
      )
      .subscribe();

    fetchOrders();

    async function fetchOrders() {
      const { data } = await supabase
        .from("orders")
        .select("*, order_items(*)")
        .eq("restaurant_id", restaurantId)
        .not("status", "in", '("delivered","cancelled")')
        .order("created_at", { ascending: true });

      if (data) {
        setOrders(data as unknown as OrderWithItems[]);
      }
    }

    return () => {
      supabase.removeChannel(channel);
    };
  }, [restaurantId]);

  return orders;
}
