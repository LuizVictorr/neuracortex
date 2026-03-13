import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

/**
 * Client for standard usage (Browser/Server components), using the anon key.
 * Respects Row Level Security (RLS).
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

/**
 * Service Role Client for server-only operations that need to bypass RLS.
 * **DO NOT USE IN BROWSER.**
 */
export const supabaseAdmin = createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey)
