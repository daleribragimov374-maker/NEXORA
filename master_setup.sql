-- 1. Profiles Table (Ensure all columns)
alter table public.profiles add column if not exists current_activity jsonb default null;
alter table public.profiles add column if not exists username text;
alter table public.profiles add column if not exists avatar_url text;
alter table public.profiles add column if not exists bio text;
alter table public.profiles add column if not exists tokens integer default 0;
alter table public.profiles add column if not exists is_admin boolean default false;

-- 2. Experiences Table (Ensure all columns)
create table if not exists public.experiences (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users(id) on delete cascade not null,
    title text not null,
    image_url text,
    file_url text,
    plays bigint default 0,
    likes bigint default 0,
    rating decimal default 0,
    category text default 'All',
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Connections Table
create table if not exists public.connections (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users(id) on delete cascade not null,
    friend_id uuid references auth.users(id) on delete cascade not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    unique(user_id, friend_id)
);

-- 4. User Settings Table
create table if not exists public.user_settings (
    user_id uuid references auth.users(id) on delete cascade primary key,
    dark_mode boolean default false,
    notifications_enabled boolean default true,
    language text default 'Uzbek',
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. Payments Table
create table if not exists public.payments (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references public.profiles(id) on delete cascade not null,
    amount integer not null,
    price integer not null,
    payment_method text not null,
    status text default 'pending' check (status in ('pending', 'completed', 'rejected')),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 6. RLS Policies for Profiles
alter table public.profiles enable row level security;

drop policy if exists "Profiles are viewable by everyone" on public.profiles;
create policy "Profiles are viewable by everyone" on public.profiles
    for select using (true);

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile" on public.profiles
    for update using (auth.uid() = id);

drop policy if exists "Admins can update any profile" on public.profiles;
create policy "Admins can update any profile" on public.profiles
    for update using (
        exists (
            select 1 from public.profiles
            where id = auth.uid() and is_admin = true
        )
    );

-- 7. RLS Policies for Experiences (Public view, owner manage)
alter table public.experiences enable row level security;

drop policy if exists "Experiences are viewable by everyone" on public.experiences;
create policy "Experiences are viewable by everyone" on public.experiences
    for select using (true);

drop policy if exists "Users can create their own experiences" on public.experiences;
create policy "Users can create their own experiences" on public.experiences
    for insert with check (auth.uid() = user_id);

drop policy if exists "Users can update their own experiences" on public.experiences;
create policy "Users can update their own experiences" on public.experiences
    for update using (auth.uid() = user_id);

drop policy if exists "Users can delete their own experiences" on public.experiences;
create policy "Users can delete their own experiences" on public.experiences
    for delete using (auth.uid() = user_id);

-- 8. RLS Policies for Connections
alter table public.connections enable row level security;

drop policy if exists "Users can view their own connections" on public.connections;
create policy "Users can view their own connections" on public.connections
    for select using (auth.uid() = user_id or auth.uid() = friend_id);

drop policy if exists "Users can manage their own connections" on public.connections;
create policy "Users can manage their own connections" on public.connections
    for all using (auth.uid() = user_id);

-- 9. RLS Policies for User Settings
alter table public.user_settings enable row level security;

drop policy if exists "Users can view and update their own settings" on public.user_settings;
create policy "Users can view and update their own settings" on public.user_settings
    for all using (auth.uid() = user_id);

-- 10. RLS Policies for Payments
alter table public.payments enable row level security;

drop policy if exists "Users can view their own payments" on public.payments;
create policy "Users can view their own payments" on public.payments
    for select using (auth.uid() = user_id);

drop policy if exists "Users can insert their own payments" on public.payments;
create policy "Users can insert their own payments" on public.payments
    for insert with check (auth.uid() = user_id);

drop policy if exists "Admins can view all payments" on public.payments;
create policy "Admins can view all payments" on public.payments
    for select using (
        exists (
            select 1 from public.profiles
            where id = auth.uid() and is_admin = true
        )
    );

drop policy if exists "Admins can update all payments" on public.payments;
create policy "Admins can update all payments" on public.payments
    for update using (
        exists (
            select 1 from public.profiles
            where id = auth.uid() and is_admin = true
        )
    );
