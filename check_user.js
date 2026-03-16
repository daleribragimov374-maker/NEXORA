import { supabase } from './src/supabaseClient.js';

async function checkUserAndProfile() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        console.log('No user logged in.');
        return;
    }
    console.log('User ID:', user.id);

    const { data: profile, error } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    if (error) {
        console.log('Profile Check Error:', error.message);
        if (error.code === 'PGRST116') {
            console.log('Profile does not exist for this user!');
        }
    } else {
        console.log('Profile exists:', profile);
    }
}

checkUserAndProfile();
