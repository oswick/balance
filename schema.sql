-- Create Products table
create table products (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) not null,
  name text not null,
  purchase_price numeric not null,
  selling_price numeric not null,
  quantity integer not null,
  created_at timestamptz default now()
);

-- Create Suppliers table
create table suppliers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) not null,
  name text not null,
  product_types text,
  purchase_days text,
  created_at timestamptz default now()
);

-- Create Purchases table
create table purchases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) not null,
  date timestamptz not null,
  product_id uuid references products(id) on delete cascade,
  supplier_id uuid references suppliers(id) on delete set null,
  quantity integer not null,
  total_cost numeric not null,
  created_at timestamptz default now()
);

-- Create Sales table
create table sales (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) not null,
  date timestamptz not null,
  product_id uuid references products(id) on delete set null, -- Changed to on delete set null
  product_name text, -- For ad-hoc sales
  quantity integer not null,
  amount numeric not null,
  created_at timestamptz default now(),
  constraint check_sale_product_details
    check ( (product_id is not null and product_name is null) or (product_id is null and product_name is not null) )
);

-- Create Expenses table
create table expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) not null,
  date timestamptz not null,
  category text not null,
  description text,
  amount numeric not null,
  created_at timestamptz default now()
);

-- Enable Row Level Security (RLS) for all tables
alter table products enable row level security;
alter table suppliers enable row level security;
alter table purchases enable row level security;
alter table sales enable row level security;
alter table expenses enable row level security;

-- Create policies to allow users to manage their own data
create policy "Users can manage their own products" on products for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can manage their own suppliers" on suppliers for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can manage their own purchases" on purchases for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can manage their own sales" on sales for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can manage their own expenses" on expenses for all using (auth.uid() = user_id) with check (auth.uid() = user_id);