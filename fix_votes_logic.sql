-- Fix existing NULL values in experiences table
update public.experiences 
set likes = coalesce(likes, 0),
    dislikes = coalesce(dislikes, 0),
    rating = coalesce(rating, 0);

-- Enforce NOT NULL constraints
alter table public.experiences 
    alter column likes set not null,
    alter column dislikes set not null,
    alter column rating set not null;

-- Update the trigger function to be more robust
create or replace function public.update_experience_stats()
returns trigger as $$
begin
    if (tg_op = 'INSERT') then
        if (new.vote_type = 'like') then
            update public.experiences set likes = coalesce(likes, 0) + 1 where id = new.experience_id;
        elsif (new.vote_type = 'dislike') then
            update public.experiences set dislikes = coalesce(dislikes, 0) + 1 where id = new.experience_id;
        end if;
    elsif (tg_op = 'DELETE') then
        if (old.vote_type = 'like') then
            update public.experiences set likes = greatest(0, coalesce(likes, 0) - 1) where id = old.experience_id;
        elsif (old.vote_type = 'dislike') then
            update public.experiences set dislikes = greatest(0, coalesce(dislikes, 0) - 1) where id = old.experience_id;
        end if;
    elsif (tg_op = 'UPDATE') then
        if (old.vote_type = 'like' and new.vote_type = 'dislike') then
            update public.experiences set 
                likes = greatest(0, coalesce(likes, 0) - 1), 
                dislikes = coalesce(dislikes, 0) + 1 
            where id = new.experience_id;
        elsif (old.vote_type = 'dislike' and new.vote_type = 'like') then
            update public.experiences set 
                likes = coalesce(likes, 0) + 1, 
                dislikes = greatest(0, coalesce(dislikes, 0) - 1) 
            where id = new.experience_id;
        end if;
    end if;
    
    -- Update rating percentage safely
    update public.experiences 
    set rating = case 
        when (likes + dislikes) > 0 then round((likes::float / (likes + dislikes)::float) * 100)
        else 0
    end
    where id = coalesce(new.experience_id, old.experience_id);
    
    return null;
end;
$$ language plpgsql security definer;
