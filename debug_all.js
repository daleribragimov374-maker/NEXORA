import { supabase } from './src/supabaseClient.js';

async function debugDatabase() {
    console.log('--- Checking Profiles ---');
    const { data: profileData, error: profileError } = await supabase.from('profiles').select('*').limit(1);
    if (profileError) console.error('Profiles Error:', profileError);
    else console.log('Profiles columns:', Object.keys(profileData[0] || {}));

    console.log('\n--- Checking Payments ---');
    const { data: paymentData, error: paymentError } = await supabase.from('payments').select('*, profiles(*)').limit(1);
    if (paymentError) {
        console.error('Payments Join Error:', paymentError.message);
        console.log('Trying without join...');
        const { data: pData, error: pError } = await supabase.from('payments').select('*').limit(1);
        if (pError) console.error('Payments Basic Error:', pError);
        else console.log('Payments columns:', Object.keys(pData[0] || {}));
    } else {
        console.log('Payments Join Successful');
        console.log('Payment 1:', paymentData[0]);
    }
}

debugDatabase();
