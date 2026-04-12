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

async function checkSubmissions() {
    console.log("--- Checking Submissions for Percentage Logic ---")
    
    // Find Profetas assessment
    const { data: ass } = await supabase.from('assessments').select('*').eq('title', 'Avaliação Profetas').single()
    if (!ass) return console.log("Assessment not found")
    
    console.log(`Assessment: ${ass.title}, Total Points: ${ass.total_points}`)

    const { data: subs } = await supabase.from('student_submissions').select('*').eq('assessment_id', ass.id)
    console.log(`Checking ${subs?.length} submissions...`)

    const issues = subs?.filter(s => {
        const expected = (s.score / s.total_points) * 100
        return Math.abs(s.percentage - expected) > 0.1
    })

    console.log(`Found ${issues?.length} submissions with incorrect percentages.`)
    if (issues?.length) {
        console.log("Example issue:", {
            student: issues[0].student_name,
            score: issues[0].score,
            total: issues[0].total_points,
            percentage: issues[0].percentage,
            expected: (issues[0].score / issues[0].total_points) * 100
        })
    }
}

checkSubmissions()
