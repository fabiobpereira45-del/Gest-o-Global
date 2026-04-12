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

async function checkSchema() {
    console.log("--- Checking Questions Table Schema ---")
    // We can't query information_schema directly via PostgREST usually, 
    // but we can try to fetch one row and see the columns.
    const { data, error } = await supabase.from('questions').select('*').limit(1)
    if (error) console.error("Error:", error)
    else console.log("Columns:", Object.keys(data[0] || {}))

    // Let's try to get the foreign keys if possible via rpc or just check what's there
    const { data: q1 } = await supabase.from('questions').select('discipline_id').limit(1)
    console.log("Existing discipline_id in questions:", q1)
    
    // Also check if the 'Profetas' discipline is visible to this user
    const { data: d } = await supabase.from('disciplines').select('id, name').eq('name', 'Profetas')
    console.log("Profetas disciplines found:", d)
}

checkSchema()
