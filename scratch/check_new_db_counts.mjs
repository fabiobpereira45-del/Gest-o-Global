import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

const envPath = path.resolve(process.cwd(), '.env.local')
const envContent = fs.readFileSync(envPath, 'utf8')
const env = {}
envContent.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=')
  if (key && valueParts.length > 0) {
    env[key.trim()] = valueParts.join('=').trim().replace(/^"(.*)"$/, '$1')
  }
})

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)

async function checkTables() {
    console.log("--- Checking NEW DB Tables ---")
    const { data, error } = await supabase.from('disciplines').select('count', { count: 'exact', head: true })
    if (error) console.error("Error disciplines:", error)
    else console.log("Disciplines count:", data)

    const { data: students, error: sErr } = await supabase.from('students').select('count', { count: 'exact', head: true })
    if (sErr) console.error("Error students:", sErr)
    else console.log("Students count:", students)
}

checkTables()
