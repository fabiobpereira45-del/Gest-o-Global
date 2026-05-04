import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.join(process.cwd(), '.env') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl!, supabaseKey!)

async function run() {
  const ids = [
    'da0ca982-398c-4f0a-99c4-4a98fdc93786', // Filhos são ______ do Senhor.
    'eadb4015-48cd-4d70-9b68-b7b9ccf8d7ca', // A família é base da ______.
    'ef33ebe1-46fd-4e4f-9774-7618e9fc7f0f', // O casamento é uma ______ divina.
    'f6034ddb-47dd-40bc-8dd4-2397ead93a36', // O pai exerce ______ familiar.
    'a8457677-f0c4-4cdb-868e-6f1fe2d9ccdb', // Relacione correctly
    '620f571c-642b-4e47-999a-70fa789e08ab',
    'a26dc6a0-0e02-4084-b017-5c258b136549',
    '9491ec19-c8cc-4b96-b1c4-7fbf20c06e25',
    '357f52b9-fb1b-4874-8ee1-5ee47f276c90'
  ]

  const { data: questions } = await supabase
    .from('questions')
    .select('*')
    .in('id', ids)

  console.log(JSON.stringify(questions, null, 2))
}

run()
