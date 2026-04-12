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

async function debugFabio() {
    const { data: sub } = await supabase.from('student_submissions').select('*').eq('student_email', 'fabio.bpereira40@gmail.com').maybeSingle()
    console.log("Fabio Submission:", JSON.stringify(sub, null, 2))
}

debugFabio()
