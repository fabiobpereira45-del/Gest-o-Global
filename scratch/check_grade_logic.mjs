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

async function checkLogic() {
    console.log("--- Checking Grade Logic ---")
    
    // 1. Assessment
    const { data: ass } = await supabase.from('assessments').select('*').eq('title', 'Avaliação Profetas').single()
    console.log("Assessment Config:", {
        title: ass.title,
        pointsPerQuestion: ass.points_per_question,
        totalPoints: ass.total_points
    })

    // 2. Migrated Submission (Silvana sn2001886@gmail.com)
    const { data: migrated } = await supabase.from('student_submissions').select('*').eq('student_email', 'sn2001886@gmail.com').maybeSingle()
    console.log("Migrated Sub (Silvana):", {
        score: migrated?.score,
        total: migrated?.total_points,
        percentage: migrated?.percentage
    })

    // 3. Fabio (fabio.bpereira40@gmail.com)
    const { data: fabio } = await supabase.from('student_submissions').select('*').eq('student_email', 'fabio.bpereira40@gmail.com').maybeSingle()
    console.log("Fabio Sub:", {
        score: fabio?.score,
        total: fabio?.total_points,
        percentage: fabio?.percentage
    })
}

checkLogic()
