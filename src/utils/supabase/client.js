import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const globalForSupabase = globalThis

export function createClient() {
  if (!globalForSupabase.__supabaseBrowserClient) {
    globalForSupabase.__supabaseBrowserClient = createBrowserClient(supabaseUrl, supabaseAnonKey)
  }

  return globalForSupabase.__supabaseBrowserClient
}
