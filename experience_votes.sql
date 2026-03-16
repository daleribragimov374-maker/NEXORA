-- Create experience_votes table to track user votes
create table if not exists public.experience_votes (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users on delete cascade not null,
    experience_id uuid references public.experiences on delete cascade not null,
    vote_type text check (vote_type in ('like', 'dislike')),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    unique(user_id, experience_id)
);

-- Enable RLS
alter table public.experience_votes enable row level security;

-- Policies
do $$ 
begin
    if not exists (select 1 from pg_policies where tablename = 'experience_votes' and policyname = 'Users can view all votes.') then
        create policy "Users can view all votes." on public.experience_votes for select using (true);
    end if;
    if not exists (select 1 from pg_policies where tablename = 'experience_votes' and policyname = 'Users can insert their own votes.') then
        create policy "Users can insert their own votes." on public.experience_votes for insert with check (auth.uid() = user_id);
    end if;
    if not exists (select 1 from pg_policies where tablename = 'experience_votes' and policyname = 'Users can update their own votes.') then
        create policy "Users can update their own votes." on public.experience_votes for update using (auth.uid() = user_id);
    end if;
    if not exists (select 1 from pg_policies where tablename = 'experience_votes' and policyname = 'Users can delete their own votes.') then
        create policy "Users can delete their own votes." on public.experience_votes for delete using (auth.uid() = user_id);
    end if;
end $$;

-- Create function to update experience stats
create or replace function public.update_experience_stats()
returns trigger as $$
begin
    if (tg_op = 'INSERT') then
        if (new.vote_type = 'like') then
            update public.experiences set likes = likes + 1 where id = new.experience_id;
        elsif (new.vote_type = 'dislike') then
            update public.experiences set dislikes = dislikes + 1 where id = new.experience_id;
        end if;
    elsif (tg_op = 'DELETE') then
        if (old.vote_type = 'like') then
            update public.experiences set likes = likes - 1 where id = old.experience_id;
        elsif (old.vote_type = 'dislike') then
            update public.experiences set dislikes = dislikes - 1 where id = old.experience_id;
        end if;
    elsif (tg_op = 'UPDATE') then
        if (old.vote_type = 'like' and new.vote_type = 'dislike') then
            update public.experiences set likes = likes - 1, dislikes = dislikes + 1 where id = new.experience_id;
        elsif (old.vote_type = 'dislike' and new.vote_type = 'like') then
            update public.experiences set likes = likes + 1, dislikes = dislikes - 1 where id = new.experience_id;
        end if;
    end if;
    
    -- Update rating percentage
    update public.experiences 
    set rating = case 
        when (likes + dislikes) > 0 then round((likes::float / (likes + dislikes)::float) * 100)
        else 0
    end
    where id = coalesce(new.experience_id, old.experience_id);
    
    return null;
end;
$$ language plpgsql security definer;

-- Create trigger
drop trigger if exists on_experience_vote_change on public.experience_votes;
create trigger on_experience_vote_change
    after insert or update or delete on public.experience_votes
    for each row execute procedure public.update_experience_stats();
