export const ORDER_STATUS_LABELS: Record<string, string> = {
  pending: 'Pendiente',
  in_kitchen: 'En cocina',
  ready: 'Listo',
  delivered: 'Entregado',
  cancelled: 'Cancelado',
};

export const ORDER_STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-500',
  in_kitchen: 'bg-orange-500',
  ready: 'bg-green-500',
  delivered: 'bg-gray-400',
  cancelled: 'bg-red-500',
};

export const TABLE_STATUS_COLORS = {
  free: '#22c55e',
  has_order: '#eab308',
  open_bill: '#ef4444',
} as const;

export const CAMINITO_PALETTE = {
  blue: '#1e40af',
  yellow: '#ca8a04',
  red: '#b91c1c',
  green: '#15803d',
  cream: '#fef9ef',
  charcoal: '#1c1917',
} as const;

export const COORD_MAX = 1000;
