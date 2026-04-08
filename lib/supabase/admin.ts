import { createClient } from "@supabase/supabase-js"

export function createAdminClient() {
    const supabaseUrl = 'https://vevivqcluyutlatwsnjh.supabase.co'
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZldml2cWNsdXl1dGxhdHdzbmpoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTY1NTYxOCwiZXhwIjoyMDkxMjMxNjE4fQ.42Gk_uOBezQfMpWp6mpPLjFYmwf_te13DEz9Pek1oj0'

    return createClient(
        supabaseUrl,
        supabaseKey,
        {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        }
    )
}
