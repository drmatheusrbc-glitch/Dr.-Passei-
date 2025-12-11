import { createClient } from '@supabase/supabase-js';

// TODO: Substitua pelas chaves do seu projeto Supabase
// Você encontra em: Settings > API
const supabaseUrl = 'SUA_SUPABASE_URL_AQUI';
const supabaseKey = 'SUA_SUPABASE_ANON_KEY_AQUI';

// Validation to prevent "Invalid URL" error during development/template usage
// This prevents the app from crashing if the user hasn't set up the keys yet
const isValidUrl = (url: string) => {
  try {
    // Check if it's a valid URL structure AND not the placeholder
    return Boolean(new URL(url)) && !url.includes('SUA_SUPABASE_URL_AQUI');
  } catch (e) {
    return false;
  }
};

// Create a single supabase client for interacting with your database
// We export null if configuration is missing so the app defaults to localStorage
export const supabase = isValidUrl(supabaseUrl) 
  ? createClient(supabaseUrl, supabaseKey) 
  : null;