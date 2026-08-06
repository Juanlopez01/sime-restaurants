import type { OrderWithItems, OrderStatus, OrderItemStatus } from "@/types";
import { DEMO_TABLES } from "./demo-data";

let orderCounter = 0;
let itemCounter = 0;

const orders: OrderWithItems[] = [];

export function getDemoOrders(statuses?: OrderStatus[]): OrderWithItems[] {
  if (!statuses) return orders;
  return orders.filter((o) => statuses.includes(o.status));
}

export function getDemoOrdersByTable(tableId: string): OrderWithItems[] {
  return orders.filter(
    (o) => o.table_id === tableId && o.status !== "cancelled" && o.status !== "delivered"
  );
}

export function createDemoOrder(
  tableId: string,
  items: {
    product_id: string;
    product_name: string;
    unit_price: number;
    quantity: number;
    notes: string;
  }[],
  notes?: string
): OrderWithItems {
  const now = new Date().toISOString();
  const table = DEMO_TABLES.find((t) => t.id === tableId);
  orderCounter++;

  const orderItems = items.map((item) => ({
    id: `oi-${++itemCounter}`,
    order_id: `order-${orderCounter}`,
    product_id: item.product_id,
    product_name: item.product_name,
    unit_price: item.unit_price,
    quantity: item.quantity,
    notes: item.notes || null,
    status: "pending" as OrderItemStatus,
    created_at: now,
  }));

  const subtotal = items.reduce(
    (sum, i) => sum + i.unit_price * i.quantity,
    0
  );

  const order: OrderWithItems = {
    id: `order-${orderCounter}`,
    restaurant_id: "demo-la-ribera",
    table_id: tableId,
    waiter_id: "u2",
    order_number: orderCounter,
    status: "pending",
    notes: notes || null,
    subtotal,
    is_synced: true,
    synced_at: now,
    created_at: now,
    updated_at: now,
    items: orderItems,
    table: table ?? undefined,
    waiter: { id: "u2", name: "Carlos (Mozo)" },
  };

  orders.push(order);
  return order;
}

export function updateDemoOrderStatus(
  orderId: string,
  status: OrderStatus
): OrderWithItems | null {
  const order = orders.find((o) => o.id === orderId);
  if (!order) return null;
  order.status = status;
  order.updated_at = new Date().toISOString();

  if (status === "in_kitchen" || status === "ready") {
    const itemStatus: OrderItemStatus =
      status === "in_kitchen" ? "preparing" : "ready";
    order.items.forEach((item) => {
      item.status = itemStatus;
    });
  }

  return order;
}

export function getTableOrderStatus(
  tableId: string
): "free" | "has_order" | "open_bill" {
  const active = orders.filter(
    (o) =>
      o.table_id === tableId &&
      o.status !== "cancelled" &&
      o.status !== "delivered"
  );
  if (active.length === 0) return "free";
  if (active.some((o) => o.status === "ready" || o.status === "in_kitchen"))
    return "has_order";
  if (active.some((o) => o.status === "pending")) return "has_order";
  return "free";
}
