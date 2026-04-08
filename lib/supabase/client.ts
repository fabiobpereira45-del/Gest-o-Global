import { createBrowserClient } from '@supabase/ssr'

let supabaseInstance: any = null

export function createClient() {
  if (!supabaseInstance) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
    
    if (!supabaseUrl || !supabaseKey) {
      console.warn('⚠️ Supabase environment variables are missing! The client will not be able to connect.')
    }
    
    supabaseInstance = createBrowserClient(
      supabaseUrl,
      supabaseKey
    )
  }
  return supabaseInstance
}
