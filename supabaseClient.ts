import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://mwcoppeobvreewaqxspw.supabase.co';
const SUPABASE_KEY = 'sb_publishable_2j_eLzSpMHNQlmVYRys1qA_IlMOUW2V';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  }
});