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

async function checkData() {
    console.log("--- Checking Restored Data Integrity ---")
    
    // 1. Check Assessment
    const { data: ass } = await supabase.from('assessments').select('id, title, question_ids').eq('title', 'Avaliação Profetas').single()
    console.log("Assessment Question IDs:", ass?.question_ids)

    // 2. Check Submissions
    const { data: subs } = await supabase.from('student_submissions').select('id, answers').eq('assessment_id', ass?.id).limit(1)
    console.log("Submission Answers sample:", subs?.[0]?.answers)

    // 3. Check for any submission with NULL answers
    const { count: nullAnswers } = await supabase.from('student_submissions').select('*', { count: 'exact', head: true }).is('answers', null)
    console.log("Submissions with NULL answers:", nullAnswers)
}

checkData()
