-- Fix RLS policy for experiences table to allow public viewing
-- This is necessary so that all users can see the likes and plays counts

DO $$ 
BEGIN
    -- Drop the restrictive policy if it exists
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'experiences' AND policyname = 'Users can view their own experiences.') THEN
        DROP POLICY "Users can view their own experiences." ON public.experiences;
    END IF;

    -- Create a new policy that allows everyone to view experiences
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'experiences' AND policyname = 'Experiences are viewable by everyone.') THEN
        CREATE POLICY "Experiences are viewable by everyone." ON public.experiences FOR SELECT USING (true);
    END IF;
END $$;
