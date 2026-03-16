-- Function to safely increment game plays (Visits)
-- This uses 'security definer' to bypass RLS policies
create or replace function public.increment_plays(exp_id uuid)
returns void as $$
begin
    update public.experiences
    set plays = coalesce(plays, 0) + 1
    where id = exp_id;
end;
$$ language plpgsql security definer;

-- Grant execution to authenticated and anonymous users
grant execute on function public.increment_plays(uuid) to authenticated;
grant execute on function public.increment_plays(uuid) to anon;
