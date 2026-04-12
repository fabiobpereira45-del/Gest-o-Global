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

console.log("Checking DB Connection for:", env.NEXT_PUBLIC_SUPABASE_URL)
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)

async function run() {
    const { data, error } = await supabase.from('disciplines').select('id, name')
    if (error) {
        console.error("Connection failed:", error.message)
    } else {
        console.log(`Success! Found ${data.length} disciplines.`)
        console.log(JSON.stringify(data, null, 2))
    }
}

run()
