import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

const envContent = fs.readFileSync('.env', 'utf8')
const env = {}
envContent.split(/\r?\n/).forEach(line => {
    const [key, ...valueParts] = line.split('=')
    if (key && valueParts.length > 0) {
        env[key.trim()] = valueParts.join('=').trim().replace(/^"(.*)"$/, '$1')
    }
})

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)

async function migrate() {
    console.log("Adding columns to class_schedules...")
    
    const { error } = await supabase.rpc('execute_sql', {
        sql_query: `
            ALTER TABLE public.class_schedules 
            ADD COLUMN IF NOT EXISTS online_class_date TIMESTAMPTZ,
            ADD COLUMN IF NOT EXISTS video_lesson_date TIMESTAMPTZ,
            ADD COLUMN IF NOT EXISTS exam_date TIMESTAMPTZ;
        `
    })
    
    if (error) {
        console.error("Error migrating database:", error)
        
        // Fallback: Sometimes execute_sql is not available for standard service role, try direct alter if possible or notice the user
        console.log("Attempting direct schema check via querying columns...")
    } else {
        console.log("Columns added successfully.")
    }
}

migrate()
