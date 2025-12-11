import { createClient } from '@supabase/supabase-js';

// TODO: Substitua pelas chaves do seu projeto Supabase
// Você encontra em: Settings > API
const supabaseUrl = 'SUA_SUPABASE_URL_AQUI';
const supabaseKey = 'SUA_SUPABASE_ANON_KEY_AQUI';

// Validation to prevent "Invalid URL" error during development/template usage
// This prevents the app from crashing if the user hasn't set up the keys yet
const isValidUrl = (url: string) => {
  try {
    return Boolean(new URL(url));
  } catch (e) {
    return false;
  }
};

// Create a single supabase client for interacting with your database
// We export null if configuration is missing so the app doesn't crash on boot
export const supabase = isValidUrl(supabaseUrl) 
  ? createClient(supabaseUrl, supabaseKey) 
  : null;