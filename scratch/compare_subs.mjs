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

async function compare() {
    const { data: s } = await supabase.from('student_submissions').select('*').eq('student_email', 'sn2001886@gmail.com').maybeSingle()
    const { data: f } = await supabase.from('student_submissions').select('*').eq('student_email', 'fabio.bpereira40@gmail.com').maybeSingle()
    
    console.log("--- Silvana (Migrated) ---")
    console.log(JSON.stringify(s, null, 2))
    
    console.log("\n--- Fabio (New) ---")
    console.log(JSON.stringify(f, null, 2))
}

compare()
