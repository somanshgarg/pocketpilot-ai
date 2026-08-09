import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey && supabaseUrl.startsWith('http'));

if (!isSupabaseConfigured) {
  console.warn(
    '⚠️ Supabase environment variables VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY / VITE_SUPABASE_PUBLISHABLE_KEY are missing. The application will run in local demo mode with sample data.'
  );
}

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;
