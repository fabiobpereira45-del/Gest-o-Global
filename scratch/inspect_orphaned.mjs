import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = "https://rvsfcrtvogbeayrmobbb.supabase.co"
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ2c2ZjcnR2b2diZWF5cm1vYmJiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDgxMTM4OSwiZXhwIjoyMDkwMzg3Mzg5fQ.9MfMAx7RMJs4naaB28pGP0F4mdVZhbRY5ug7pjOXC8g"
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

async function inspectAssessment() {
    console.log("--- Inspecting Orphaned Assessment in Old DB ---")
    
    // 1. Get assessment details
    const { data: ass, error: aErr } = await supabase.from('assessments').select('*').eq('id', '1oz4vjylmniyb1u1').single()
    if (aErr) console.error("Error fetching assessment:", aErr)
    else console.log("Assessment data:", JSON.stringify(ass, null, 2))

    // 2. Get questions linked to this assessment
    // Note: If assessment handles question linkage via a many-to-many table, we check that.
    // Based on store.ts.bak, it has questionIds field. Let's check the schema again.
    // In supabase-schema.sql, questions are linked to discipline_id, and assessments are linked to discipline_id.
    // Wait, the current schema might be different.
    
    const { data: questions, error: qErr } = await supabase.from('questions').select('id, text, discipline_id').eq('discipline_id', ass?.discipline_id) 
    // Wait, if discipline_id is null, this won't work.
    
    // Let's search for questions containing "Profetas" context
    const { data: allQ } = await supabase.from('questions').select('id, text, discipline_id').limit(1000)
    const profetasQ = allQ?.filter(q => q.text.toLowerCase().includes('daniel') || q.text.toLowerCase().includes('isaías') || q.text.toLowerCase().includes('jeremias'))
    console.log(`Found ${profetasQ?.length || 0} potential Profetas questions.`)
}

inspectAssessment()
