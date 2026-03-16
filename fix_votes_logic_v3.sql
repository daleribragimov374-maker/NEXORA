-- Consolidated SQL for Voting System
-- 1. Ensure columns exist and have default values
ALTER TABLE public.experiences 
ADD COLUMN IF NOT EXISTS likes BIGINT DEFAULT 0,
ADD COLUMN IF NOT EXISTS dislikes BIGINT DEFAULT 0,
ADD COLUMN IF NOT EXISTS rating DECIMAL DEFAULT 0;

UPDATE public.experiences 
SET likes = COALESCE(likes, 0),
    dislikes = COALESCE(dislikes, 0),
    rating = COALESCE(rating, 0);

-- 2. Create experience_votes table
CREATE TABLE IF NOT EXISTS public.experience_votes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    experience_id UUID REFERENCES public.experiences(id) ON DELETE CASCADE NOT NULL,
    vote_type TEXT CHECK (vote_type IN ('like', 'dislike')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, experience_id)
);

-- 3. Enable RLS
ALTER TABLE public.experience_votes ENABLE ROW LEVEL SECURITY;

-- 4. Policies for experience_votes
DROP POLICY IF EXISTS "Users can view all votes." ON public.experience_votes;
CREATE POLICY "Users can view all votes." ON public.experience_votes FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert their own votes." ON public.experience_votes;
CREATE POLICY "Users can insert their own votes." ON public.experience_votes FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own votes." ON public.experience_votes;
CREATE POLICY "Users can update their own votes." ON public.experience_votes FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own votes." ON public.experience_votes;
CREATE POLICY "Users can delete their own votes." ON public.experience_votes FOR DELETE USING (auth.uid() = user_id);

-- 5. Trigger Function to sync stats
CREATE OR REPLACE FUNCTION public.update_experience_stats()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        IF (NEW.vote_type = 'like') THEN
            UPDATE public.experiences SET likes = likes + 1 WHERE id = NEW.experience_id;
        ELSIF (NEW.vote_type = 'dislike') THEN
            UPDATE public.experiences SET dislikes = dislikes + 1 WHERE id = NEW.experience_id;
        END IF;
    ELSIF (TG_OP = 'DELETE') THEN
        IF (OLD.vote_type = 'like') THEN
            UPDATE public.experiences SET likes = GREATEST(0, likes - 1) WHERE id = OLD.experience_id;
        ELSIF (OLD.vote_type = 'dislike') THEN
            UPDATE public.experiences SET dislikes = GREATEST(0, dislikes - 1) WHERE id = OLD.experience_id;
        END IF;
    ELSIF (TG_OP = 'UPDATE') THEN
        -- Change from like to dislike
        IF (OLD.vote_type = 'like' AND NEW.vote_type = 'dislike') THEN
            UPDATE public.experiences SET likes = GREATEST(0, likes - 1), dislikes = dislikes + 1 WHERE id = NEW.experience_id;
        -- Change from dislike to like
        ELSIF (OLD.vote_type = 'dislike' AND NEW.vote_type = 'like') THEN
            UPDATE public.experiences SET likes = likes + 1, dislikes = GREATEST(0, dislikes - 1) WHERE id = NEW.experience_id;
        END IF;
    END IF;
    
    -- Update rating percentage
    UPDATE public.experiences 
    SET rating = CASE 
        WHEN (likes + dislikes) > 0 THEN ROUND((likes::float / (likes + dislikes)::float) * 100)
        else 0
    END
    WHERE id = COALESCE(NEW.experience_id, OLD.experience_id);
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Attach Trigger
DROP TRIGGER IF EXISTS on_experience_vote_change ON public.experience_votes;
CREATE TRIGGER on_experience_vote_change
    AFTER INSERT OR UPDATE OR DELETE ON public.experience_votes
    FOR EACH ROW EXECUTE PROCEDURE public.update_experience_stats();
