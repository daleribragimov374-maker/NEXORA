import { supabase } from './src/supabaseClient.js';

async function debugVotes() {
    try {
        console.log('--- Debugging Votes and Stats ---');
        
        // 1. Get all experiences with their stats
        const { data: experiences, error: expError } = await supabase
            .from('experiences')
            .select('id, title, likes, dislikes, rating');
        
        if (expError) throw expError;
        console.log('Experiences Stats:', experiences);

        // 2. Get all votes
        const { data: votes, error: voteError } = await supabase
            .from('experience_votes')
            .select('*');
        
        if (voteError) throw voteError;
        console.log('Total Votes in table:', votes.length);
        
        // 3. Compare stats with votes table
        for (const exp of experiences) {
            const expVotes = votes.filter(v => v.experience_id === exp.id);
            const actualLikes = expVotes.filter(v => v.vote_type === 'like').length;
            const actualDislikes = expVotes.filter(v => v.vote_type === 'dislike').length;
            
            console.log(`\nGame: ${exp.title} (${exp.id})`);
            console.log(`- DB Stats: likes=${exp.likes}, dislikes=${exp.dislikes}`);
            console.log(`- Calculated from votes table: likes=${actualLikes}, dislikes=${actualDislikes}`);
            
            if (exp.likes !== actualLikes || exp.dislikes !== actualDislikes) {
                console.warn('!!! MISMATCH DETECTED !!!');
            }
        }

    } catch (err) {
        console.error('Debug error:', err);
    }
}

debugVotes();
