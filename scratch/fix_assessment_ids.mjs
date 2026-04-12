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

async function fix() {
    console.log("--- 🛠 FIXING ASSESSMENT QUESTION IDS ---")
    
    // 1. Find the Profetas discipline
    const { data: disc } = await supabase.from('disciplines').select('id').ilike('name', 'Profetas').single()
    if (!disc) throw new Error("Discipline not found")
    const disciplineId = disc.id
    console.log("Discipline ID:", disciplineId)

    // 2. Find the assessment
    const { data: ass } = await supabase.from('assessments').select('id').eq('title', 'Avaliação Profetas').single()
    if (!ass) throw new Error("Assessment not found")
    const assessmentId = ass.id
    console.log("Assessment ID:", assessmentId)

    // 3. Get all questions for this discipline
    const { data: questions } = await supabase.from('questions').select('id').eq('discipline_id', disciplineId)
    if (!questions || questions.length === 0) throw new Error("No questions found for discipline")
    
    const questionIds = questions.map(q => q.id)
    console.log(`Found ${questionIds.length} questions.`)

    // 4. Update assessment
    const { error: uErr } = await supabase.from('assessments').update({ question_ids: questionIds }).eq('id', assessmentId)
    if (uErr) throw new Error("Error updating assessment: " + uErr.message)
    
    console.log("--- ✅ FIXED SUCCESSFULLY ---")
}

fix().catch(err => {
    console.error("❌ ERROR:", err.message)
    process.exit(1)
})
