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

async function inspect() {
    console.log("--- 🕵️ Inspecting Database ---")
    
    // 1. Check disciplines
    const { data: discs, error: dErr } = await supabase.from('disciplines').select('id, name')
    if (dErr) console.error("Error fetching disciplines:", dErr)
    else {
        console.log(`Found ${discs.length} disciplines.`)
        const profetas = discs.filter(d => d.name.toLowerCase().includes('profeta'))
        console.log("Profetas matches:", profetas)
    }

    // 2. Check assessments
    const { data: asss, error: aErr } = await supabase.from('assessments').select('id, title, discipline_id')
    if (aErr) console.error("Error fetching assessments:", aErr)
    else {
        console.log(`Found ${asss.length} assessments.`)
        const profetasAss = asss.filter(a => a.title.toLowerCase().includes('profeta'))
        console.log("Profetas assessments:", profetasAss)
    }

    // 3. Check for questions count per discipline
    const { data: qCounts, error: qErr } = await supabase.rpc('get_questions_count_per_discipline') 
    // If rpc fails, we do a manual check for a few
    if (qErr) {
        console.log("RPC get_questions_count_per_discipline failed, checking manually...")
        const { data: questions } = await supabase.from('questions').select('id, discipline_id')
        const counts = {}
        questions?.forEach(q => counts[q.discipline_id] = (counts[q.discipline_id] || 0) + 1)
        console.log("Question counts by discipline ID:", counts)
    } else {
        console.log("Question counts:", qCounts)
    }
}

inspect()
