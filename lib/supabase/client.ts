import { createBrowserClient } from '@supabase/ssr'
import { supabaseSafeStorage } from '../storage-safety'

let supabaseInstance: any = null

export function createClient() {
  if (!supabaseInstance) {
    // Bypassing process.env completely for the public vars to avoid string injection 'undefined' bugs on Vercel
    const supabaseUrl = 'https://vevivqcluyutlatwsnjh.supabase.co'
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZldml2cWNsdXl1dGxhdHdzbmpoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2NTU2MTgsImV4cCI6MjA5MTIzMTYxOH0.te2bkSjxjU5ZQ5tzGPAInKaHjc--KX4lOL_M1vgYlNg'
    
    supabaseInstance = createBrowserClient(
      supabaseUrl,
      supabaseKey,
      {
        auth: {
          storage: supabaseSafeStorage,
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true
        },
        global: {
          storage: supabaseSafeStorage
        },
        realtime: {
          params: {
            eventsPerSecond: 10
          }
        }
      }
    )
  }
  return supabaseInstance
}
