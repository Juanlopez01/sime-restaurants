-- ============================================================
-- Migration 002: Table assignment + Cancel requests
-- ============================================================

-- Asignación de mesas a mozos
alter table tables add column assigned_waiter_id uuid references users(id);
create index idx_tables_assigned_waiter on tables(assigned_waiter_id) where assigned_waiter_id is not null;

-- Enum para estados de solicitud de cancelación
create type cancel_request_status as enum ('pending', 'approved', 'denied');

-- Solicitudes de cancelación (mozo pide, cajero aprueba/rechaza)
create table cancel_requests (
  id uuid primary key default uuid_generate_v4(),
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  order_id uuid not null references orders(id),
  requested_by uuid not null references users(id),
  resolved_by uuid references users(id),
  status cancel_request_status not null default 'pending',
  reason text,
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create index idx_cancel_requests_restaurant on cancel_requests(restaurant_id);
create index idx_cancel_requests_pending on cancel_requests(restaurant_id, status)
  where status = 'pending';

alter table cancel_requests enable row level security;

-- Invoices: desacoplar de payments individuales para facturación diaria
-- La tabla invoices existente queda, pero ahora payment_id es nullable
-- para soportar facturas que cubren múltiples pagos
alter table invoices alter column payment_id drop not null;
alter table invoices add column date_from date;
alter table invoices add column date_to date;
