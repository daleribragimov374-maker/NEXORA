-- 1. Add tokens column to profiles table
alter table public.profiles 
add column if not exists tokens bigint default null;

-- Update existing 0 values to null for consistency
update public.profiles set tokens = null where tokens = 0;

-- 2. Create payments table if it doesn't exist
create table if not exists public.payments (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users on delete cascade not null,
    amount bigint not null,
    price decimal(10, 2) not null,
    status text default 'pending', -- 'pending', 'completed', 'rejected'
    payment_method text not null, -- 'card', 'manual'
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Enable RLS on payments
alter table public.payments enable row level security;

-- 4. Create policies for payments
do $$ 
begin
    -- Users can view their own payments
    if not exists (select 1 from pg_policies where tablename = 'payments' and policyname = 'Users can view their own payments.') then
        create policy "Users can view their own payments." on public.payments for select using (auth.uid() = user_id);
    end if;
    
    -- Users can insert their own payments
    if not exists (select 1 from pg_policies where tablename = 'payments' and policyname = 'Users can insert their own payments.') then
        create policy "Users can insert their own payments." on public.payments for insert with check (auth.uid() = user_id);
    end if;

    -- Admins can view and update all payments
    if not exists (select 1 from pg_policies where tablename = 'payments' and policyname = 'Admins can view and update all payments.') then
        create policy "Admins can view and update all payments." on public.payments 
        for all 
        using (
            exists (
                select 1 from public.profiles 
                where id = auth.uid() and is_admin = true
            )
        );
    end if;
end $$;

-- 5. Add is_admin to profiles
alter table public.profiles add column if not exists is_admin boolean default false;

-- 6. Set up RLS for profiles (allow users to update their own, and admins to update everyone's tokens)
do $$ 
begin
    if not exists (select 1 from pg_policies where tablename = 'profiles' and policyname = 'Users can update their own tokens.') then
        create policy "Users can update their own tokens." on public.profiles for update using (auth.uid() = id);
    end if;

    -- Admin policy for profiles
    if not exists (select 1 from pg_policies where tablename = 'profiles' and policyname = 'Admins can update anyone.') then
        create policy "Admins can update anyone." on public.profiles 
        for update 
        using (
            exists (
                select 1 from public.profiles 
                where id = auth.uid() and is_admin = true
            )
        );
    end if;
end $$;
