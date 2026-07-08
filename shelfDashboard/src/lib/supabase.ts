import { createClient  } from '@supabase/supabase-js'
import type {SupabaseClient} from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

let client: SupabaseClient | null = null

export function getSupabase(): SupabaseClient {
  if (!url || !anonKey) {
    throw new Error('Faltan VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY')
  }
  client ??= createClient(url, anonKey, {
    auth: {
      detectSessionInUrl: true,
      persistSession: true,
    },
  })
  return client
}

export function supabaseConfigured(): boolean {
  return Boolean(url && anonKey)
}
