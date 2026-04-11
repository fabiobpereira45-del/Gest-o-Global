import { createBrowserClient } from '@supabase/ssr'

let supabaseInstance: any = null

export function createClient() {
  if (!supabaseInstance) {
    // Bypassing process.env completely for the public vars to avoid string injection 'undefined' bugs on Vercel
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    
    supabaseInstance = createBrowserClient(
      supabaseUrl,
      supabaseKey
    )
  }
  return supabaseInstance
}
