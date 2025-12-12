import { createClient } from '@supabase/supabase-js';

// As chaves agora são carregadas das Variáveis de Ambiente (Vite/Vercel)
// OU do LocalStorage (Configuração Manual do Usuário)

const getEnv = (key: string) => {
  let value = '';
  
  // 1. Tenta pegar do ambiente (Vite)
  try {
    if (import.meta && import.meta.env) {
      value = import.meta.env[key] || '';
    }
  } catch (e) {
    // Ignore error
  }

  // Se encontrou no env, retorna
  if (value) return value;

  // 2. Tenta pegar do LocalStorage (caso o usuário tenha configurado manualmente)
  if (typeof window !== 'undefined') {
    if (key === 'VITE_SUPABASE_URL') return localStorage.getItem('supabase_url') || '';
    if (key === 'VITE_SUPABASE_ANON_KEY') return localStorage.getItem('supabase_key') || '';
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

// Verifica se tem URL válida e uma chave (mesmo que básica)
const isConfigured = isValidUrl(supabaseUrl) && supabaseKey.length > 20;

export const supabase = isConfigured
  ? createClient(supabaseUrl, supabaseKey) 
  : null;
