-- Mini Marketplace schema. Run in the Supabase SQL editor (or `supabase db push`).

create type user_role as enum ('buyer', 'seller', 'admin');
create type profile_status as enum ('pending', 'approved', 'hidden');
create type product_status as enum ('active', 'hidden');
create type option_type as enum ('swatch', 'select', 'checkbox');
create type order_status as enum ('new', 'confirmed', 'shipped', 'delivered');

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  role user_role not null default 'buyer',
  status profile_status not null default 'approved',
  created_at timestamptz not null default now()
);

create table categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  parent_id uuid references categories(id)
);

create table products (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references profiles(id) on delete cascade,
  category_id uuid references categories(id),
  title text not null,
  description text,
  base_price numeric(10,2) not null check (base_price >= 0),
  compare_at_price numeric(10,2) check (compare_at_price >= 0),
  status product_status not null default 'active',
  created_at timestamptz not null default now()
);
create index on products (seller_id);

create table product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  url text not null,
  position int not null default 0
);
create index on product_images (product_id);

create table option_groups (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  name text not null,
  type option_type not null default 'select',
  required boolean not null default true,
  position int not null default 0
);
create index on option_groups (product_id);

create table option_values (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references option_groups(id) on delete cascade,
  label text not null,
  price_delta numeric(10,2) not null default 0,
  color_hex text,
  image_url text,
  position int not null default 0
);
create index on option_values (group_id);

create table orders (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid not null references profiles(id),
  seller_id uuid not null references profiles(id),
  status order_status not null default 'new',
  total numeric(10,2) not null,
  shipping_name text not null,
  shipping_address text not null,
  shipping_phone text,
  created_at timestamptz not null default now()
);
create index on orders (buyer_id);
create index on orders (seller_id);

create table order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  product_id uuid references products(id) on delete set null,
  title text not null,
  image_url text,
  qty int not null check (qty > 0),
  unit_price numeric(10,2) not null,
  options jsonb not null default '[]'
);
create index on order_items (order_id);

-- All data access goes through the Next.js API (service role key), so lock the tables
-- down for anon/authenticated clients.
alter table profiles enable row level security;
alter table categories enable row level security;
alter table products enable row level security;
alter table product_images enable row level security;
alter table option_groups enable row level security;
alter table option_values enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;

-- Public bucket for product photos (uploads go through the API).
insert into storage.buckets (id, name, public) values ('product-images', 'product-images', true)
on conflict (id) do nothing;

-- Single category for the test.
with f as (insert into categories (name, slug) values ('Furniture', 'furniture') returning id)
insert into categories (name, slug, parent_id) select 'Divan Beds', 'divan-beds', id from f;
