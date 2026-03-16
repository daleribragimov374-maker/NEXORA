import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bfqfnyuujdspaexaxsdz.supabase.co';
const supabaseAnonKey = 'sb_publishable_tRivVgVKbzNyNTuNKyfwzg_4_-FcnU3';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
