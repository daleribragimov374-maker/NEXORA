import { supabase } from './src/supabaseClient.js';

async function checkColumns() {
    try {
        const { data, error } = await supabase
            .from('experiences')
            .select('*')
            .limit(1);
        
        if (error) {
            console.error('Error fetching data:', error);
        } else {
            console.log('Available columns in experiences table:');
            if (data && data.length > 0) {
                console.log(Object.keys(data[0]));
            } else {
                console.log('Table is empty. Checking via empty insert attempt...');
                const { error: insertError } = await supabase
                    .from('experiences')
                    .insert([{}]);
                if (insertError) {
                    console.log('Insert error hints at columns:', insertError.message);
                }
            }
        }
    } catch (err) {
        console.error('Unexpected error:', err);
    }
}

checkColumns();
