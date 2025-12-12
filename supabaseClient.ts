import { createClient } from '@supabase/supabase-js';

// As chaves agora são carregadas das Variáveis de Ambiente (Vite/Vercel)
// No Vercel, configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY

// Safe access to environment variables to avoid "Cannot read properties of undefined"
const getEnv = (key: string) => {
  try {
    // Check for Vite injected env
    if (import.meta && import.meta.env) {
      return import.meta.env[key] || '';
    }
  } catch (e) {
    // Ignore error
  }
  return '';
};

const supabaseUrl = getEnv('VITE_SUPABASE_URL');
const supabaseKey = getEnv('VITE_SUPABASE_ANON_KEY');

// Validação para garantir que estamos conectados
const isValidUrl = (url: string) => {
  try {
    return Boolean(new URL(url));
  } catch (e) {
    return false;
  }
};

const isConfigured = isValidUrl(supabaseUrl) && supabaseKey.length > 0;

// Exporta o cliente se configurado, ou null se estiver faltando chaves
export const supabase = isConfigured
  ? createClient(supabaseUrl, supabaseKey) 
  : null;