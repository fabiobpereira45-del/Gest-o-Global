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

async function checkAna() {
    const name = "ANA LIMA DE OLIVEIRA SANTOS"
    const { data: ana } = await supabase.from('students').select('*').eq('name', name).maybeSingle()
    
    if (!ana) {
        console.log("Student Ana not found")
        return
    }
    
    console.log(`Ana: ID=${ana.id}, ClassID=${ana.class_id}`)
    
    if (ana.class_id) {
        const { data: classmates } = await supabase.from('students').select('name').eq('class_id', ana.class_id)
        console.log(`Classmates (${classmates.length}):`, classmates.map(c => c.name).join(', '))
        
        const { data: schedules } = await supabase.from('class_schedules').select('*').eq('class_id', ana.class_id)
        console.log(`Schedules (${schedules.length}):`, JSON.stringify(schedules, null, 2))
    } else {
        console.log("Ana is not enrolled in any class (class_id is null)")
    }
    
    // Check all disciplines regardless of class (Grade Curricular do Sistema)
    const { data: d } = await supabase.from('disciplines').select('name, execution_date, semester_id')
    console.log(`Global Disciplines (${d.length}):`, d.map(x => `${x.name} (${x.execution_date})`).join(' | '))
}

checkAna()
