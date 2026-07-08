import { createBrowserClient } from '@supabase/ssr';
import { getCookieDomain } from '@/utils/domain';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const globalForSupabase = globalThis

export function createClient() {
  if (!globalForSupabase.__supabaseBrowserClient) {
    globalForSupabase.__supabaseBrowserClient = createBrowserClient(
      supabaseUrl, 
      supabaseAnonKey,
      {
        cookieOptions: {
          domain: getCookieDomain(),
          path: '/',
          sameSite: 'lax',
          secure: process.env.NODE_ENV === 'production',
        }
      }
    )
  }

  return globalForSupabase.__supabaseBrowserClient
}
