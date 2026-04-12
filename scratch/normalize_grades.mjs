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

async function normalize() {
    console.log("--- 🛠 NORMALIZING PROF ETAS ASSESSMENT ---")
    
    // 1. Find Assessment
    const { data: ass } = await supabase.from('assessments').select('id').eq('title', 'Avaliação Profetas').single()
    if (!ass) throw new Error("Assessment not found")
    
    // 2. Update Assessment Config to 10.0 scale (20 questions * 0.5)
    console.log("Updating assessment config...")
    const { error: aErr } = await supabase.from('assessments').update({
        points_per_question: 0.5,
        total_points: 10.0
    }).eq('id', ass.id)
    if (aErr) throw aErr

    // 3. Update all submissions
    const { data: subs } = await supabase.from('student_submissions').select('id, score').eq('assessment_id', ass.id)
    console.log(`Normalizing ${subs?.length || 0} submissions...`)
    
    for (const s of (subs || [])) {
        const percentage = (s.score / 10.0) * 100
        const { error: sErr } = await supabase.from('student_submissions').update({
            total_points: 10.0,
            percentage
        }).eq('id', s.id)
        if (sErr) console.error(`Error updating sub ${s.id}:`, sErr.message)
    }

    console.log("--- ✅ NORMALIZATION COMPLETE ---")
}

normalize().catch(err => {
    console.error("❌ ERROR:", err.message)
    process.exit(1)
})
