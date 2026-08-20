create extension if not exists pgcrypto;

create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  price numeric(12, 2) not null check (price > 0),
  stock integer not null check (stock >= 0),
  image_url text,
  image_key text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table products add column if not exists image_url text;
alter table products add column if not exists image_key text;

create table if not exists carts (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now()
);

create table if not exists cart_items (
  cart_id uuid not null references carts (id) on delete cascade,
  product_id uuid not null references products (id) on delete cascade,
  name text not null,
  unit_price numeric(12, 2) not null,
  quantity integer not null check (quantity > 0),
  primary key (cart_id, product_id)
);

alter table products enable row level security;
alter table carts enable row level security;
alter table cart_items enable row level security;

drop policy if exists "products_all" on products;
create policy "products_all" on products for all using (true) with check (true);

drop policy if exists "carts_all" on carts;
create policy "carts_all" on carts for all using (true) with check (true);

drop policy if exists "cart_items_all" on cart_items;
create policy "cart_items_all" on cart_items for all using (true) with check (true);
