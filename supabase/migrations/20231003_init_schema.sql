-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Profiles Table
create table public.profiles (
    id uuid references auth.users on delete cascade primary key,
    email text unique not null,
    full_name text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Function to handle new user registration
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
    insert into public.profiles (id, email, full_name)
    values (new.id, new.email, new.raw_user_meta_data->>'full_name');
    return new;
end;
$$;

-- Trigger for new user
create trigger on_auth_user_created
    after insert on auth.users
    for each row execute procedure public.handle_new_user();

-- 2. Products Table
create table public.products (
    id uuid default extensions.uuid_generate_v4() primary key,
    user_id uuid references public.profiles(id) on delete cascade not null,
    name text not null,
    url text not null,
    image_url text,
    source text default 'custom',
    current_price numeric(12, 2),
    previous_price numeric(12, 2),
    target_price numeric(12, 2),
    check_interval_minutes integer default 60 not null,
    last_checked_at timestamp with time zone,
    next_check_at timestamp with time zone,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index idx_products_user_id on public.products(user_id);
create index idx_products_next_check on public.products(next_check_at);

-- 3. Price History Table
create table public.price_history (
    id uuid default extensions.uuid_generate_v4() primary key,
    product_id uuid references public.products(id) on delete cascade not null,
    price numeric(12, 2) not null,
    checked_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index idx_price_history_product_id on public.price_history(product_id);
create index idx_price_history_checked_at on public.price_history(checked_at);

-- 4. Price Alerts Table
create table public.price_alerts (
    id uuid default extensions.uuid_generate_v4() primary key,
    product_id uuid references public.products(id) on delete cascade not null,
    user_id uuid references public.profiles(id) on delete cascade not null,
    target_price numeric(12, 2) not null,
    enabled boolean default true not null,
    last_notified_at timestamp with time zone,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index idx_price_alerts_user_id on public.price_alerts(user_id);
create index idx_price_alerts_product_id on public.price_alerts(product_id);

-- 5. Notifications Table
create table public.notifications (
    id uuid default extensions.uuid_generate_v4() primary key,
    user_id uuid references public.profiles(id) on delete cascade not null,
    product_id uuid references public.products(id) on delete cascade,
    type text not null,
    message text not null,
    sent_at timestamp with time zone,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index idx_notifications_user_id on public.notifications(user_id);
create index idx_notifications_created_at on public.notifications(created_at);


-- Row Level Security (RLS) Policies

alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.price_history enable row level security;
alter table public.price_alerts enable row level security;
alter table public.notifications enable row level security;

-- Profiles: Users can read and update their own profile
create policy "Users can view own profile"
    on public.profiles for select
    using ( auth.uid() = id );

create policy "Users can update own profile"
    on public.profiles for update
    using ( auth.uid() = id );

-- Products: Users can perform all operations on their own products
create policy "Users can view own products"
    on public.products for select
    using ( auth.uid() = user_id );

create policy "Users can insert own products"
    on public.products for insert
    with check ( auth.uid() = user_id );

create policy "Users can update own products"
    on public.products for update
    using ( auth.uid() = user_id );

create policy "Users can delete own products"
    on public.products for delete
    using ( auth.uid() = user_id );

-- Price History: Users can read price history for their products
create policy "Users can view own product price history"
    on public.price_history for select
    using ( exists (
        select 1 from public.products
        where products.id = price_history.product_id
        and products.user_id = auth.uid()
    ));

-- Price Alerts: Users can perform all operations on their own alerts
create policy "Users can view own alerts"
    on public.price_alerts for select
    using ( auth.uid() = user_id );

create policy "Users can insert own alerts"
    on public.price_alerts for insert
    with check ( auth.uid() = user_id );

create policy "Users can update own alerts"
    on public.price_alerts for update
    using ( auth.uid() = user_id );

create policy "Users can delete own alerts"
    on public.price_alerts for delete
    using ( auth.uid() = user_id );

-- Notifications: Users can view their own notifications
create policy "Users can view own notifications"
    on public.notifications for select
    using ( auth.uid() = user_id );

create policy "Users can delete own notifications"
    on public.notifications for delete
    using ( auth.uid() = user_id );

create policy "Users can insert own product price history"
    on public.price_history for insert
    with check ( exists (
        select 1 from public.products
        where products.id = price_history.product_id
        and products.user_id = auth.uid()
    ));

create policy "Users can insert own notifications"
    on public.notifications for insert
    with check ( auth.uid() = user_id );

