export const ORDER_STATUS_LABELS: Record<string, string> = {
  pending: 'Pendiente',
  in_kitchen: 'En cocina',
  ready: 'Listo',
  delivered: 'Entregado',
  cancelled: 'Cancelado',
};

export const TABLE_STATUS_COLORS = {
  free: '#22c55e',
  has_order: '#eab308',
  open_bill: '#ef4444',
} as const;

export const COORD_MAX = 1000;
