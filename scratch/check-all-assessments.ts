import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.join(process.cwd(), '.env') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl!, supabaseKey!)

async function run() {
  const { data: assessments } = await supabase
    .from('assessments')
    .select('*')
    .order('created_at', { ascending: false })

  if (!assessments) {
    console.log('No assessments found.')
    return
  }

  console.log(`Found ${assessments.length} total assessments:`)
  assessments.forEach(a => {
    console.log(`- [${a.id}] ${a.title}`)
    console.log(`  Published: ${a.is_published}, Archived: ${a.archived}, Results Released: ${a.release_results}`)
    console.log(`  Open: ${a.open_at}, Close: ${a.close_at}`)
  })
}

run()
