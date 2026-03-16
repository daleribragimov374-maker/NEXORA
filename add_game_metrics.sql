-- Add rating and votes columns to the experiences table
alter table public.experiences 
add column if not exists likes int default 0,
add column if not exists dislikes int default 0,
add column if not exists rating int default 0; -- Percentage 0-100

-- Note: 'plays' already exists and will be used as 'visits'.
