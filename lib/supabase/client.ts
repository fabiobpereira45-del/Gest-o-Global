import { createBrowserClient } from '@supabase/ssr'

let supabaseInstance: any = null

export function createClient() {
  if (!supabaseInstance) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://vevivqcluyutlatwsnjh.supabase.co'
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZldml2cWNsdXl1dGxhdHdzbmpoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2NTU2MTgsImV4cCI6MjA5MTIzMTYxOH0.te2bkSjxjU5ZQ5tzGPAInKaHjc--KX4lOL_M1vgYlNg'
    
    supabaseInstance = createBrowserClient(
      supabaseUrl,
      supabaseKey
    )
  }
  return supabaseInstance
}
