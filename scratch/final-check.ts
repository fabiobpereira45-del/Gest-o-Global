import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.join(process.cwd(), '.env') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl!, supabaseKey!)

async function run() {
  const { data: questions } = await supabase
    .from('questions')
    .select('*')
    .eq('discipline_id', '6dfc5a86-f2a5-4f91-83ed-5bfef721697e')

  if (!questions) return

  const discursiveWithUnderscores = questions.filter(q => q.type === 'discursive' && q.text.includes('_'))
  const mcWithMatchingFormat = questions.filter(q => q.type === 'multiple-choice' && q.text.toLowerCase().includes('relacione'))

  console.log('Discursive with underscores:', discursiveWithUnderscores.length)
  discursiveWithUnderscores.forEach(q => console.log(`- ${q.id}: ${q.text}`))

  console.log('Multiple choice with matching keywords:', mcWithMatchingFormat.length)
  mcWithMatchingFormat.forEach(q => console.log(`- ${q.id}: ${q.text}`))
}

run()
