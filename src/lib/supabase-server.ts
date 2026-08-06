import { createClient, SupabaseClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const isSupabaseConfigured = !!(url && key);

export const supabaseAdmin: SupabaseClient = isSupabaseConfigured
  ? createClient(url!, key!)
  : (null as unknown as SupabaseClient);
