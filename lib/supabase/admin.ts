import { createClient } from "@supabase/supabase-js"

export function createAdminClient() {
    const supabaseUrl = 'https://rvsfcrtvogbeayrmobbb.supabase.co'
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ2c2ZjcnR2b2diZWF5cm1vYmJiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDgxMTM4OSwiZXhwIjoyMDkwMzg3Mzg5fQ.9MfMAx7RMJs4naaB28pGP0F4mdVZhbRY5ug7pjOXC8g'

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
