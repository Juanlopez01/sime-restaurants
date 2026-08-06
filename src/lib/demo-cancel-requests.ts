import type { CancelRequestWithDetails, CancelRequestStatus } from "@/types";
import { getDemoOrders, updateDemoOrderStatus } from "./demo-orders";
import { DEMO_USERS } from "./demo-data";

let counter = 0;
const requests: CancelRequestWithDetails[] = [];

export function getDemoCancelRequests(
  status?: CancelRequestStatus
): CancelRequestWithDetails[] {
  if (!status) return requests;
  return requests.filter((r) => r.status === status);
}

export function createDemoCancelRequest(
  orderId: string,
  requestedBy: string,
  reason?: string
): CancelRequestWithDetails | null {
  const allOrders = getDemoOrders();
  const order = allOrders.find((o) => o.id === orderId);
  if (!order) return null;

  const existing = requests.find(
    (r) => r.order_id === orderId && r.status === "pending"
  );
  if (existing) return existing;

  const requester = DEMO_USERS.find((u) => u.id === requestedBy);
  counter++;

  const req: CancelRequestWithDetails = {
    id: `cr-${counter}`,
    restaurant_id: "demo-la-ribera",
    order_id: orderId,
    requested_by: requestedBy,
    resolved_by: null,
    status: "pending",
    reason: reason || null,
    created_at: new Date().toISOString(),
    resolved_at: null,
    order,
    requester: requester
      ? { id: requester.id, name: requester.name }
      : undefined,
  };

  requests.push(req);
  return req;
}

export function resolveDemoCancelRequest(
  requestId: string,
  resolvedBy: string,
  approved: boolean
): CancelRequestWithDetails | null {
  const req = requests.find((r) => r.id === requestId);
  if (!req || req.status !== "pending") return null;

  const resolver = DEMO_USERS.find((u) => u.id === resolvedBy);

  req.status = approved ? "approved" : "denied";
  req.resolved_by = resolvedBy;
  req.resolved_at = new Date().toISOString();
  req.resolver = resolver
    ? { id: resolver.id, name: resolver.name }
    : undefined;

  if (approved) {
    updateDemoOrderStatus(req.order_id, "cancelled");
  }

  return req;
}
