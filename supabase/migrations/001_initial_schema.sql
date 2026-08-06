-- ============================================================
-- SISTEMA MULTI-TENANT DE GESTIÓN DE RESTAURANTES
-- Migración inicial: schema completo
-- ============================================================

-- Extensiones
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ============================================================
-- ENUMS
-- ============================================================

create type user_role as enum ('owner', 'admin', 'waiter', 'kitchen', 'cashier');
create type table_shape as enum ('round', 'square', 'rect');
create type order_status as enum ('pending', 'in_kitchen', 'ready', 'delivered', 'cancelled');
create type order_item_status as enum ('pending', 'preparing', 'ready', 'delivered');
create type payment_method as enum ('cash', 'card', 'mp', 'transfer', 'split');
create type payment_status as enum ('pending', 'completed', 'refunded');
create type invoice_type as enum ('A', 'B', 'C');

-- ============================================================
-- RESTAURANTS (tenant root)
-- ============================================================

create table restaurants (
  id uuid primary key default uuid_generate_v4(),
  slug varchar(100) not null unique,
  name varchar(255) not null,
  address text,
  phone varchar(50),
  logo_url text,
  billing_config jsonb default '{}',
  mp_access_token text,
  settings jsonb default '{}',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_restaurants_slug on restaurants(slug);

-- ============================================================
-- USERS
-- ============================================================

create table users (
  id uuid primary key default uuid_generate_v4(),
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  email varchar(255),
  pin varchar(6) not null,
  name varchar(255) not null,
  role user_role not null default 'waiter',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(restaurant_id, pin),
  unique(restaurant_id, email)
);

create index idx_users_restaurant on users(restaurant_id);
create index idx_users_pin on users(restaurant_id, pin) where is_active = true;

-- ============================================================
-- CATEGORIES
-- ============================================================

create table categories (
  id uuid primary key default uuid_generate_v4(),
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  name varchar(255) not null,
  display_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_categories_restaurant on categories(restaurant_id);

-- ============================================================
-- PRODUCTS
-- ============================================================

create table products (
  id uuid primary key default uuid_generate_v4(),
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  category_id uuid not null references categories(id) on delete cascade,
  name varchar(255) not null,
  description text,
  price decimal(10,2) not null,
  image_url text,
  is_available boolean not null default true,
  display_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_products_restaurant on products(restaurant_id);
create index idx_products_category on products(category_id);
create index idx_products_available on products(restaurant_id, is_available) where is_available = true;

-- ============================================================
-- TABLES (mapa de salón)
-- Coordenadas x,y en rango 0-1000 (relativas, se escalan al viewport)
-- ============================================================

create table tables (
  id uuid primary key default uuid_generate_v4(),
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  table_number varchar(20) not null,
  x int not null default 0,
  y int not null default 0,
  width int not null default 80,
  height int not null default 80,
  shape table_shape not null default 'square',
  capacity int not null default 4,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(restaurant_id, table_number)
);

create index idx_tables_restaurant on tables(restaurant_id);

-- ============================================================
-- ORDERS
-- ============================================================

create table orders (
  id uuid primary key default uuid_generate_v4(),
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  table_id uuid not null references tables(id),
  waiter_id uuid not null references users(id),
  order_number serial,
  status order_status not null default 'pending',
  notes text,
  subtotal decimal(10,2) not null default 0,
  is_synced boolean not null default true,
  synced_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_orders_restaurant on orders(restaurant_id);
create index idx_orders_table on orders(table_id);
create index idx_orders_status on orders(restaurant_id, status);
create index idx_orders_active on orders(restaurant_id, status)
  where status not in ('delivered', 'cancelled');

-- ============================================================
-- ORDER ITEMS
-- ============================================================

create table order_items (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid not null references orders(id) on delete cascade,
  product_id uuid not null references products(id),
  product_name varchar(255) not null,
  unit_price decimal(10,2) not null,
  quantity int not null default 1,
  notes text,
  status order_item_status not null default 'pending',
  created_at timestamptz not null default now()
);

create index idx_order_items_order on order_items(order_id);
create index idx_order_items_status on order_items(status)
  where status in ('pending', 'preparing');

-- ============================================================
-- PAYMENTS
-- ============================================================

create table payments (
  id uuid primary key default uuid_generate_v4(),
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  order_id uuid not null references orders(id),
  cashier_id uuid not null references users(id),
  method payment_method not null,
  amount decimal(10,2) not null,
  mp_payment_id varchar(255),
  status payment_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_payments_restaurant on payments(restaurant_id);
create index idx_payments_order on payments(order_id);

-- ============================================================
-- INVOICES (facturación ARCA)
-- ============================================================

create table invoices (
  id uuid primary key default uuid_generate_v4(),
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  payment_id uuid not null references payments(id),
  invoice_type invoice_type not null default 'B',
  cae varchar(20),
  cae_expiration date,
  point_of_sale int not null,
  invoice_number int not null,
  customer_cuit varchar(13),
  customer_name varchar(255),
  total decimal(10,2) not null,
  raw_response jsonb,
  created_at timestamptz not null default now()
);

create index idx_invoices_restaurant on invoices(restaurant_id);
create index idx_invoices_payment on invoices(payment_id);

-- ============================================================
-- UPDATED_AT TRIGGER
-- ============================================================

create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_restaurants_updated before update on restaurants
  for each row execute function update_updated_at();

create trigger trg_users_updated before update on users
  for each row execute function update_updated_at();

create trigger trg_categories_updated before update on categories
  for each row execute function update_updated_at();

create trigger trg_products_updated before update on products
  for each row execute function update_updated_at();

create trigger trg_tables_updated before update on tables
  for each row execute function update_updated_at();

create trigger trg_orders_updated before update on orders
  for each row execute function update_updated_at();

create trigger trg_payments_updated before update on payments
  for each row execute function update_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- Cada tabla filtrada por restaurant_id
-- ============================================================

alter table restaurants enable row level security;
alter table users enable row level security;
alter table categories enable row level security;
alter table products enable row level security;
alter table tables enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table payments enable row level security;
alter table invoices enable row level security;

-- ============================================================
-- SEED: Parrilla La Ribera Caminito
-- ============================================================

insert into restaurants (slug, name, address, phone, settings) values (
  'la-ribera',
  'Parrilla La Ribera Caminito',
  'Caminito, La Boca, Buenos Aires',
  null,
  '{"currency": "ARS", "timezone": "America/Argentina/Buenos_Aires"}'
);

-- Owner inicial
insert into users (restaurant_id, pin, name, email, role) values (
  (select id from restaurants where slug = 'la-ribera'),
  '0001',
  'Admin La Ribera',
  'admin@laribera.com',
  'owner'
);
