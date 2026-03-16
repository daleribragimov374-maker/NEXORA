-- 1. Fix relationships for joins
-- Fix Experiences table relationship to Profiles
ALTER TABLE public.experiences 
DROP CONSTRAINT IF EXISTS experiences_user_id_fkey;

ALTER TABLE public.experiences
ADD CONSTRAINT experiences_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Fix Payments table relationship to Profiles
ALTER TABLE public.payments 
DROP CONSTRAINT IF EXISTS payments_user_id_fkey;

ALTER TABLE public.payments
ADD CONSTRAINT payments_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- 2. Ensure Profiles has all necessary columns for Admin and Premium features
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS tokens INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS username TEXT;

-- 3. Update existing payments to ensure they are linked to profiles
-- (This assumes profiles and auth.users IDs are identical, which they are in this setup)
UPDATE public.payments SET user_id = user_id WHERE user_id IS NOT NULL;

-- 4. Enable RLS and verify policies
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own payments" ON public.payments;
CREATE POLICY "Users can view their own payments" ON public.payments
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own payments" ON public.payments;
CREATE POLICY "Users can insert their own payments" ON public.payments
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view and update all payments" ON public.payments;
CREATE POLICY "Admins can view and update all payments" ON public.payments
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND is_admin = true
        )
    );
