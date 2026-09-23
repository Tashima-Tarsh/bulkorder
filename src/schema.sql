create extension if not exists pgcrypto;

create table if not exists imports (
  id uuid primary key default gen_random_uuid(),
  filename text not null,
  status text not null check (status in ('PROCESSING','COMPLETED','COMPLETED_WITH_ERRORS','FAILED')),
  total_rows integer not null default 0,
  valid_rows integer not null default 0,
  invalid_rows integer not null default 0,
  queued_rows integer not null default 0,
  processed_rows integer not null default 0,
  failed_rows integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists import_rows (
  id uuid primary key default gen_random_uuid(),
  import_id uuid not null references imports(id) on delete cascade,
  row_number integer not null,
  user_id text not null,
  full_name text,
  mobile text,
  address_line1 text not null,
  address_line2 text,
  city text not null,
  state text not null,
  pincode text not null,
  product_url text not null,
  quantity integer not null,
  max_price_minor bigint not null,
  status text not null check (status in ('INVALID','QUEUED','PROCESSING','READY_FOR_EXECUTION','DISPATCHED','FAILED')),
  error_message text,
  idempotency_key text not null unique,
  downstream_ref text,
  raw_row jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(import_id,row_number)
);

create index if not exists import_rows_import_status_idx on import_rows(import_id,status);
