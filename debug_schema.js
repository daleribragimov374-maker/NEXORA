import { supabase } from './src/supabaseClient.js';

async function checkProfiles() {
    const { data, error } = await supabase.from('profiles').select('*').limit(1);
    if (error) {
        console.error('Error checking profiles:', error);
    } else {
        console.log('Profiles columns:', data.length > 0 ? Object.keys(data[0]) : 'No data found in profiles');
    }
    
    // Check if payments table exists
    const { error: paymentError } = await supabase.from('payments').select('*').limit(1);
    if (paymentError) {
        console.error('Payments table check error:', paymentError.message);
    } else {
        console.log('Payments table exists and is accessible.');
    }
}

checkProfiles();
