import { createClient } from '@supabase/supabase-js'

const DB1 = {
    name: "OLD (rvsfcrtvogbeayrmobbb)",
    url: "https://rvsfcrtvogbeayrmobbb.supabase.co",
    key: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ2c2ZjcnR2b2diZWF5cm1vYmJiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDgxMTM4OSwiZXhwIjoyMDkwMzg3Mzg5fQ.9MfMAx7RMJs4naaB28pGP0F4mdVZhbRY5ug7pjOXC8g"
}

const DB2 = {
    name: "NEW (vevivqcluyutlatwsnjh)",
    url: "https://vevivqcluyutlatwsnjh.supabase.co",
    key: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZldml2cWNsdXl1dGxhdHdzbmpoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTY1NTYxOCwiZXhwIjoyMDkwMzg3Mzg5fQ.42Gk_uOBezQfMpWp6mpPLjFYmwf_te13DEz9Pek1oj0"
}

async function checkDB(db) {
    console.log(`\n--- Checking ${db.name} ---`)
    const supabase = createClient(db.url, db.key)
    
    // Check disciplines
    const { data: discs } = await supabase.from('disciplines').select('id, name')
    console.log(`Disciplines: ${discs?.length || 0}`)
    const profetas = discs?.filter(d => d.name.toLowerCase().includes('profeta'))
    console.log("Profetas matches:", profetas)

    // Check assessments
    const { data: asss } = await supabase.from('assessments').select('id, title, discipline_id')
    console.log(`Assessments: ${asss?.length || 0}`)
    const profetasAss = asss?.filter(a => a.title.toLowerCase().includes('profeta'))
    console.log("Profetas assessments:", profetasAss)

    // Check submissions if assessment found
    if (profetasAss?.length > 0) {
        for (const ass of profetasAss) {
            const { count } = await supabase.from('student_submissions').select('*', { count: 'exact', head: true }).eq('assessment_id', ass.id)
            console.log(`Submissions for "${ass.title}": ${count || 0}`)
        }
    }
}

async function run() {
    await checkDB(DB1).catch(e => console.error(`Error DB1: ${e.message}`))
    await checkDB(DB2).catch(e => console.error(`Error DB2: ${e.message}`))
}

run()
