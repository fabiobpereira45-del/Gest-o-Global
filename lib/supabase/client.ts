import { createBrowserClient } from '@supabase/ssr'
import { supabaseSafeStorage } from '../storage-safety'

let supabaseInstance: any = null

export function createClient() {
  if (!supabaseInstance) {
    // Bypassing process.env completely for the public vars to avoid string injection 'undefined' bugs on Vercel
    const supabaseUrl = 'https://rvsfcrtvogbeayrmobbb.supabase.co'
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ2c2ZjcnR2b2diZWF5cm1vYmJiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ4MTEzODksImV4cCI6MjA5MDM4NzM4OX0.mB6cN4gr0XtfOOZoZBs4yEHgmVf_dRS-bU_qgUcluSY'
    
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
