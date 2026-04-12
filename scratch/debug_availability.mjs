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

async function debug() {
    console.log("--- Debugging Assessment Availability ---")
    
    // 1. Check Assessment
    const { data: ass } = await supabase.from('assessments').select('*').eq('id', 'd531fc01-2c21-4171-b838-9029fd82ac0e').single()
    console.log("Assessment:", JSON.stringify(ass, null, 2))

    // 2. Check for student submission
    const studentEmail = "fabio.bpereira45@gmail.com"
    const { data: sub } = await supabase.from('student_submissions')
        .select('*')
        .eq('student_email', studentEmail)
        .eq('assessment_id', ass.id)
    console.log(`Submissions for ${studentEmail}:`, sub?.length || 0)

    // 3. Check if student is in the 'students' table and what class they are in
    const { data: student } = await supabase.from('students').select('*').eq('email', studentEmail).single()
    console.log("Student Profile:", JSON.stringify(student, null, 2))

    // 4. Check if the discipline Profetas is linked to this student's class
    if (student?.class_id && ass?.discipline_id) {
        const { data: sched } = await supabase.from('class_schedules')
            .select('*')
            .eq('class_id', student.class_id)
            .eq('discipline_id', ass.discipline_id)
        console.log("Class Schedule matches:", sched?.length || 0)
    }
}

debug()
