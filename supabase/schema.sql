-- Mise en Place - Database Schema

-- Owners (linked to Supabase Auth)
create table if not exists owners (
  id uuid primary key default gen_random_uuid(),
  auth_id uuid unique references auth.users(id) on delete cascade,
  email text unique not null,
  name text not null,
  phone text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Restaurants
create table if not exists restaurants (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references owners(id) on delete cascade,
  slug text unique not null,
  name text not null,
  address text,
  phone text,
  logo_url text,
  billing_config jsonb default '{}',
  mp_access_token text,
  settings jsonb default '{"currency": "ARS", "timezone": "America/Argentina/Buenos_Aires"}',
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Staff users (PIN-based auth)
create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  email text,
  pin text not null,
  name text not null,
  role text not null check (role in ('owner', 'admin', 'waiter', 'kitchen', 'cashier')),
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Menu categories
create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  name text not null,
  display_order int default 0,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Products
create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  category_id uuid not null references categories(id) on delete cascade,
  name text not null,
  description text,
  price numeric(10,2) not null,
  image_url text,
  is_available boolean default true,
  display_order int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Tables (floor map)
create table if not exists tables (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  table_number text not null,
  x int default 0,
  y int default 0,
  width int default 80,
  height int default 80,
  shape text default 'square' check (shape in ('round', 'square', 'rect')),
  capacity int default 4,
  assigned_waiter_id uuid references users(id) on delete set null,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Orders
create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  table_id uuid not null references tables(id),
  waiter_id uuid not null references users(id),
  order_number serial,
  status text default 'pending' check (status in ('pending', 'in_kitchen', 'ready', 'delivered', 'cancelled')),
  notes text,
  subtotal numeric(10,2) default 0,
  is_synced boolean default true,
  synced_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Order items
create table if not exists order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  product_id uuid not null references products(id),
  product_name text not null,
  unit_price numeric(10,2) not null,
  quantity int not null default 1,
  notes text,
  status text default 'pending' check (status in ('pending', 'preparing', 'ready', 'delivered')),
  created_at timestamptz default now()
);

-- Payments
create table if not exists payments (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  order_id uuid not null references orders(id),
  cashier_id uuid not null references users(id),
  method text not null check (method in ('cash', 'card', 'mp', 'transfer', 'split')),
  amount numeric(10,2) not null,
  mp_payment_id text,
  status text default 'pending' check (status in ('pending', 'completed', 'refunded')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Invoices (ARCA)
create table if not exists invoices (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  payment_id uuid not null references payments(id),
  invoice_type text not null check (invoice_type in ('A', 'B', 'C')),
  cae text,
  cae_expiration timestamptz,
  point_of_sale int not null,
  invoice_number int not null,
  customer_cuit text,
  customer_name text,
  total numeric(10,2) not null,
  raw_response jsonb,
  created_at timestamptz default now()
);

-- Cancel requests
create table if not exists cancel_requests (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  order_id uuid not null references orders(id),
  requested_by uuid not null references users(id),
  resolved_by uuid references users(id),
  status text default 'pending' check (status in ('pending', 'approved', 'denied')),
  reason text,
  created_at timestamptz default now(),
  resolved_at timestamptz
);

-- Indexes
create index if not exists idx_restaurants_slug on restaurants(slug);
create index if not exists idx_restaurants_owner on restaurants(owner_id);
create index if not exists idx_users_restaurant on users(restaurant_id);
create index if not exists idx_categories_restaurant on categories(restaurant_id);
create index if not exists idx_products_restaurant on products(restaurant_id);
create index if not exists idx_products_category on products(category_id);
create index if not exists idx_tables_restaurant on tables(restaurant_id);
create index if not exists idx_orders_restaurant on orders(restaurant_id);
create index if not exists idx_orders_table on orders(table_id);
create index if not exists idx_order_items_order on order_items(order_id);
create index if not exists idx_payments_order on payments(order_id);
create index if not exists idx_cancel_requests_order on cancel_requests(order_id);

-- RLS (Row Level Security)
alter table owners enable row level security;
alter table restaurants enable row level security;
alter table users enable row level security;
alter table categories enable row level security;
alter table products enable row level security;
alter table tables enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table payments enable row level security;
alter table invoices enable row level security;
alter table cancel_requests enable row level security;

-- Public read for menu (categories + products)
create policy "Public can read active categories" on categories
  for select using (is_active = true);

create policy "Public can read available products" on products
  for select using (is_available = true);

-- Public can read active restaurants by slug
create policy "Public can read active restaurants" on restaurants
  for select using (is_active = true);

-- Service role has full access (used by API routes via SUPABASE_SERVICE_ROLE_KEY)
-- No additional policies needed for service role as it bypasses RLS

-- Updated_at trigger
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create or replace trigger owners_updated_at before update on owners
  for each row execute function update_updated_at();
create or replace trigger restaurants_updated_at before update on restaurants
  for each row execute function update_updated_at();
create or replace trigger users_updated_at before update on users
  for each row execute function update_updated_at();
create or replace trigger categories_updated_at before update on categories
  for each row execute function update_updated_at();
create or replace trigger products_updated_at before update on products
  for each row execute function update_updated_at();
create or replace trigger tables_updated_at before update on tables
  for each row execute function update_updated_at();
create or replace trigger orders_updated_at before update on orders
  for each row execute function update_updated_at();
create or replace trigger payments_updated_at before update on payments
  for each row execute function update_updated_at();
