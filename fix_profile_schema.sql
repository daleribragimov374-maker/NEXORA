-- Add missing column to profiles table and clean up
-- Ensure current_activity exists to track active players

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS current_activity JSONB DEFAULT NULL;

-- Ensure tokens column exists if it was missed
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS tokens BIGINT DEFAULT 1000;
