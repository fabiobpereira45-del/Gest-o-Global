import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.join(process.cwd(), '.env') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase credentials missing')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function run() {
  // 1. Find the discipline
  const { data: disciplines, error: dError } = await supabase
    .from('disciplines')
    .select('*')
    .ilike('name', '%Maneiras e Costumes%')

  if (dError || !disciplines || disciplines.length === 0) {
    console.error('Discipline not found', dError)
    return
  }

  const discipline = disciplines[0]
  console.log(`Found discipline: ${discipline.name} (${discipline.id})`)

  // 2. Fetch questions
  const { data: questions, error: qError } = await supabase
    .from('questions')
    .select('*')
    .eq('discipline_id', discipline.id)

  if (qError || !questions) {
    console.error('Error fetching questions', qError)
    return
  }

  console.log(`Total questions: ${questions.length}`)

  // 3. Filter incomplete or wrongly typed questions
  const lacunaQuestions = questions.filter(q => q.text.includes('___') || q.type === 'fill-in-the-blank' || q.type === 'discursive' && q.text.includes('___'))
  const matchingQuestions = questions.filter(q => q.type === 'matching' || (q.text.toLowerCase().includes('relacione') || q.text.toLowerCase().includes('correlacione')))

  console.log('\n--- Possible Fill-in-the-blank Questions ---')
  lacunaQuestions.forEach(q => console.log(`[${q.type}] ${q.id}: ${q.text}`))

  console.log('\n--- Possible Matching Questions ---')
  matchingQuestions.forEach(q => console.log(`[${q.type}] ${q.id}: ${q.text}`))
}

run()
