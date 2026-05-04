import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.join(process.cwd(), '.env') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl!, supabaseKey!)

async function run() {
  const updates = [
    // --- Fill-in-the-blank ---
    {
      id: 'da0ca982-398c-4f0a-99c4-4a98fdc93786',
      type: 'fill-in-the-blank',
      text: 'Filhos são [[herança]] do Senhor.',
      choices: [],
      correct_answer: ''
    },
    {
      id: 'eadb4015-48cd-4d70-9b68-b7b9ccf8d7ca',
      type: 'fill-in-the-blank',
      text: 'A família é base da [[sociedade]].',
      choices: [],
      correct_answer: ''
    },
    {
      id: 'ef33ebe1-46fd-4e4f-9774-7618e9fc7f0f',
      type: 'fill-in-the-blank',
      text: 'O casamento é uma [[instituição]] divina.',
      choices: [],
      correct_answer: ''
    },
    {
      id: 'f6034ddb-47dd-40bc-8dd4-2397ead93a36',
      type: 'fill-in-the-blank',
      text: 'O pai exerce [[autoridade]] familiar.',
      choices: [],
      correct_answer: ''
    },

    // --- Matching ---
    {
      id: 'a8457677-f0c4-4cdb-868e-6f1fe2d9ccdb',
      type: 'matching',
      text: 'Relacione as colunas corretamente sobre as condições sociais:',
      choices: [],
      correct_answer: '',
      pairs: [
        { id: 'p1', left: 'Hospitabilidade', right: 'Virtude cristã' },
        { id: 'p2', left: 'Pobreza', right: 'Provação' },
        { id: 'p3', left: 'Riqueza', right: 'Benção' }
      ]
    },
    {
      id: '620f571c-642b-4e47-999a-70fa789e08ab',
      type: 'matching',
      text: 'Relacione os papéis na família hebraica:',
      choices: [],
      correct_answer: '',
      pairs: [
        { id: 'p1', left: 'Primogênito', right: 'Herdeiro' },
        { id: 'p2', left: 'Pai', right: 'Autoridade' },
        { id: 'p3', left: 'Mãe', right: 'Educação' }
      ]
    },
    {
      id: 'a26dc6a0-0e02-4084-b017-5c258b136549',
      type: 'matching',
      text: 'Relacione os lugares e seus significados:',
      choices: [],
      correct_answer: '',
      pairs: [
        { id: 'p1', left: 'Betel', right: 'Casa de Deus' },
        { id: 'p2', left: 'Jerusalém', right: 'Cidade da Paz' },
        { id: 'p3', left: 'Sinai', right: 'Monte de Deus' }
      ]
    },
    {
      id: '9491ec19-c8cc-4b96-b1c4-7fbf20c06e25',
      type: 'matching',
      text: 'Relacione as festas bíblicas e seus propósitos:',
      choices: [],
      correct_answer: '',
      pairs: [
        { id: 'p1', left: 'Páscoa', right: 'Libertação' },
        { id: 'p2', left: 'Pentecostes', right: 'Colheita' },
        { id: 'p3', left: 'Tabernáculos', right: 'Habitação' }
      ]
    },
    {
      id: '357f52b9-fb1b-4874-8ee1-5ee47f276c90',
      type: 'matching',
      text: 'Relacione os sentimentos e situações:',
      choices: [],
      correct_answer: '',
      pairs: [
        { id: 'p1', left: 'Luto', right: 'Dor' },
        { id: 'p2', left: 'Festa', right: 'Alegria' },
        { id: 'p3', left: 'Culto', right: 'Adoração' }
      ]
    }
  ]

  for (const update of updates) {
    const payload: any = {
      type: update.type,
      text: update.text,
      points: update.points || 1,
      correct_answer: update.correct_answer || ''
    }

    if (update.type === 'matching') {
      payload.choices = {
        options: update.choices || [],
        matchingPairs: (update as any).pairs || []
      }
    } else {
      payload.choices = update.choices || []
    }

    const { error } = await supabase
      .from('questions')
      .update(payload)
      .eq('id', update.id)

    if (error) {
      console.error(`Error updating question ${update.id}:`, error)
    } else {
      console.log(`Updated question ${update.id} successfully.`)
    }
  }
}

run()
