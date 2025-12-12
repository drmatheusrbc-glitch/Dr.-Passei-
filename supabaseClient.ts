import { createClient } from '@supabase/supabase-js';

// Configuração fornecida pelo usuário
// Prioriza o localStorage se o usuário tiver alterado nas configurações,
// senão usa as credenciais padrão fornecidas.
const DEFAULT_URL = 'https://socqpmyzbtheeldbklri.supabase.co';
const DEFAULT_KEY = 'sb_publishable_deNW2Qo6_kN0nBy_QV0YnA_knv7kF8X';

const getUrl = () => localStorage.getItem('supabase_url') || DEFAULT_URL;
const getKey = () => localStorage.getItem('supabase_key') || DEFAULT_KEY;

export const supabase = createClient(getUrl(), getKey(), {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  }
});