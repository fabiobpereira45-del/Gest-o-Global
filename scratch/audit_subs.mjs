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

async function checkThree() {
    const emails = ['sn2001886@gmail.com', 'fabio.bpereira40@gmail.com', 'plancojta@gmail.com']
    const { data: subs } = await supabase.from('student_submissions').select('*').in('student_email', emails)
    
    subs.forEach(s => {
        console.log(`Student: ${s.student_name}, Email: ${s.student_email}`)
        console.log(`Score: ${s.score}, Total: ${s.total_points}, Pct: ${s.percentage}`)
        console.log("---")
    })
}

checkThree()
