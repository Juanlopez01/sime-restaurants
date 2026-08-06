export type UserRole = 'owner' | 'admin' | 'waiter' | 'kitchen' | 'cashier';
export type TableShape = 'round' | 'square' | 'rect';
export type OrderStatus = 'pending' | 'in_kitchen' | 'ready' | 'delivered' | 'cancelled';
export type OrderItemStatus = 'pending' | 'preparing' | 'ready' | 'delivered';
export type PaymentMethod = 'cash' | 'card' | 'mp' | 'transfer' | 'split';
export type PaymentStatus = 'pending' | 'completed' | 'refunded';
export type InvoiceType = 'A' | 'B' | 'C';

export interface Restaurant {
  id: string;
  slug: string;
  name: string;
  address: string | null;
  phone: string | null;
  logo_url: string | null;
  billing_config: BillingConfig;
  mp_access_token: string | null;
  settings: RestaurantSettings;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface BillingConfig {
  cuit?: string;
  razon_social?: string;
  punto_venta?: number;
  cert_path?: string;
  key_path?: string;
  environment?: 'production' | 'testing';
}

export interface RestaurantSettings {
  currency: string;
  timezone: string;
}

export interface User {
  id: string;
  restaurant_id: string;
  email: string | null;
  pin: string;
  name: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  restaurant_id: string;
  name: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  restaurant_id: string;
  category_id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  is_available: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface Table {
  id: string;
  restaurant_id: string;
  table_number: string;
  x: number;
  y: number;
  width: number;
  height: number;
  shape: TableShape;
  capacity: number;
  assigned_waiter_id: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type CancelRequestStatus = 'pending' | 'approved' | 'denied';

export interface CancelRequest {
  id: string;
  restaurant_id: string;
  order_id: string;
  requested_by: string;
  resolved_by: string | null;
  status: CancelRequestStatus;
  reason: string | null;
  created_at: string;
  resolved_at: string | null;
}

export interface CancelRequestWithDetails extends CancelRequest {
  order?: OrderWithItems;
  requester?: Pick<User, 'id' | 'name'>;
  resolver?: Pick<User, 'id' | 'name'>;
}

export interface DailySummary {
  date: string;
  total_orders: number;
  total_sales: number;
  payments_by_method: Record<PaymentMethod, number>;
  invoiced_amount: number;
}

export interface Order {
  id: string;
  restaurant_id: string;
  table_id: string;
  waiter_id: string;
  order_number: number;
  status: OrderStatus;
  notes: string | null;
  subtotal: number;
  is_synced: boolean;
  synced_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  product_name: string;
  unit_price: number;
  quantity: number;
  notes: string | null;
  status: OrderItemStatus;
  created_at: string;
}

export interface Payment {
  id: string;
  restaurant_id: string;
  order_id: string;
  cashier_id: string;
  method: PaymentMethod;
  amount: number;
  mp_payment_id: string | null;
  status: PaymentStatus;
  created_at: string;
  updated_at: string;
}

export interface Invoice {
  id: string;
  restaurant_id: string;
  payment_id: string;
  invoice_type: InvoiceType;
  cae: string | null;
  cae_expiration: string | null;
  point_of_sale: number;
  invoice_number: number;
  customer_cuit: string | null;
  customer_name: string | null;
  total: number;
  raw_response: Record<string, unknown> | null;
  created_at: string;
}

export interface TableWithStatus extends Table {
  current_order?: Order | null;
  has_open_bill: boolean;
  assigned_waiter?: Pick<User, 'id' | 'name'> | null;
}

export interface OrderWithItems extends Order {
  items: OrderItem[];
  table?: Table;
  waiter?: Pick<User, 'id' | 'name'>;
}

export interface CategoryWithProducts extends Category {
  products: Product[];
}

export type SyncStatus = 'online' | 'offline' | 'syncing';

export interface SyncQueueEntry {
  id: number;
  entity_type: string;
  entity_id: string;
  action: 'create' | 'update';
  payload: Record<string, unknown>;
  status: 'pending' | 'synced' | 'error';
  retry_count: number;
  created_at: string;
}
