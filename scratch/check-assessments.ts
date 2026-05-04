import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.join(process.cwd(), '.env') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl!, supabaseKey!)

async function run() {
  const now = new Date().toISOString()
  console.log('Current time:', now)

  const { data: assessments } = await supabase
    .from('assessments')
    .select('*')
    .eq('is_published', true)
    .order('created_at', { ascending: false })

  if (!assessments) {
    console.log('No published assessments found.')
    return
  }

  console.log(`Found ${assessments.length} published assessments:`)
  assessments.forEach(a => {
    const isTakeable = (a.is_published) &&
      (!a.open_at || new Date(a.open_at) <= new Date(now)) &&
      (!a.close_at || new Date(a.close_at) >= new Date(now))
    
    console.log(`- [${a.id}] ${a.title}`)
    console.log(`  Published: ${a.is_published}, Open: ${a.open_at}, Close: ${a.close_at}`)
    console.log(`  Is Takeable (with old logic): ${isTakeable}`)
  })
}

run()
