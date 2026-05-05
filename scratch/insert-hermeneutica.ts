import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials")
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

const generateId = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
}

const questionsData = [
  {
    text: 'As duas regras áureas da hermenêutica são: a Bíblia explica a própria Bíblia e a Bíblia jamais se contradiz.',
    type: 'true_false',
    points: 1,
    choices: [{ id: generateId(), text: 'Verdadeiro' }, { id: generateId(), text: 'Falso' }],
    correctAnswer: 'Verdadeiro',
  },
  {
    text: 'A pergunta "QUANDO" é importante para entender o contexto de quê?',
    type: 'multiple_choice',
    points: 1,
    choices: ['O estilo literário do autor', 'A época em que o texto foi escrito', 'O idioma original do livro', 'O destinatário da carta'].map(t => ({ id: generateId(), text: t })),
    correctAnswer: 'A época em que o texto foi escrito',
  },
  {
    text: 'O Novo Testamento foi escrito principalmente em qual versão do grego?',
    type: 'multiple_choice',
    points: 1,
    choices: ['Grego clássico', 'Grego koiné', 'Grego arcaico', 'Grego medieval'].map(t => ({ id: generateId(), text: t })),
    correctAnswer: 'Grego koiné',
  },
  {
    text: 'O contexto histórico ajuda a entender por que os judeus não se davam com os samaritanos, pois estes eram um povo de origem mista.',
    type: 'true_false',
    points: 1,
    choices: [{ id: generateId(), text: 'Verdadeiro' }, { id: generateId(), text: 'Falso' }],
    correctAnswer: 'Verdadeiro',
  },
  {
    text: 'O que é Exegese?',
    type: 'multiple_choice',
    points: 1,
    choices: ['Inserir o pensamento do leitor no texto', 'Extrair o sentido que o texto quer comunicar', 'Uma tradução literal da Bíblia', 'O estudo das figuras de linguagem'].map(t => ({ id: generateId(), text: t })),
    correctAnswer: 'Extrair o sentido que o texto quer comunicar',
  },
  {
    text: 'O livro mais recente da Bíblia foi escrito há aproximadamente quantos anos?',
    type: 'multiple_choice',
    points: 1,
    choices: ['500 anos', '1.000 anos', '1.900 anos', '3.500 anos'].map(t => ({ id: generateId(), text: t })),
    correctAnswer: '1.900 anos',
  },
  {
    text: 'O que é Eisegese?',
    type: 'multiple_choice',
    points: 1,
    choices: ['A interpretação fiel ao texto original', 'Inserir o próprio pensamento no texto bíblico', 'O estudo do contexto histórico', 'A análise gramatical do texto'].map(t => ({ id: generateId(), text: t })),
    correctAnswer: 'Inserir o próprio pensamento no texto bíblico',
  },
  {
    text: 'João escreveu sua primeira carta para combater qual heresia?',
    type: 'multiple_choice',
    points: 1,
    choices: ['O arianismo', 'O donatismo', 'O gnosticismo do primeiro século', 'O pelagianismo'].map(t => ({ id: generateId(), text: t })),
    correctAnswer: 'O gnosticismo do primeiro século',
  },
  {
    text: 'O contexto remoto pode ser encontrado em qual lugar?',
    type: 'multiple_choice',
    points: 1,
    choices: ['Apenas no mesmo versículo', 'No mesmo livro ou até em outro livro bíblico', 'Somente em dicionários bíblicos', 'Apenas em comentários teológicos'].map(t => ({ id: generateId(), text: t })),
    correctAnswer: 'No mesmo livro ou até em outro livro bíblico',
  },
  {
    text: 'O que é Hermenêutica?',
    type: 'multiple_choice',
    points: 1,
    choices: ['A arte de pregar sermões', 'A ciência da interpretação de textos', 'O estudo da história da igreja', 'A tradução de línguas bíblicas'].map(t => ({ id: generateId(), text: t })),
    correctAnswer: 'A ciência da interpretação de textos',
  }
];

async function main() {
  console.log('Fetching discipline Hermenêutica...')
  let { data: disciplines } = await supabase
    .from('disciplines')
    .select('id, name')
    .ilike('name', '%Hermen%utica%')
  
  if (!disciplines || disciplines.length === 0) {
    console.log("Discipline Hermenêutica not found. Fetching all...")
    const { data: all } = await supabase.from('disciplines').select('id, name')
    console.log(all?.map(d => d.name))
    return
  }

  const disciplineId = disciplines[0].id
  console.log(`Found discipline: ${disciplines[0].name} (${disciplineId})`)

  console.log('Inserting questions...')
  const questionIds = []
  
  for (let i = 0; i < questionsData.length; i++) {
    const q = questionsData[i]
    // The correct_answer needs to match the choice ID! Let's map it.
    const correctChoice = q.choices.find(c => c.text === q.correctAnswer)
    if (!correctChoice) {
       console.error(`Correct answer not found in choices for Q${i+1}`)
       return
    }

    const { data: qData, error: qErr } = await supabase
      .from('questions')
      .insert({
        discipline_id: disciplineId,
        type: q.type,
        text: q.text,
        choices: q.choices,
        correct_answer: correctChoice.id,
        points: q.points,
        created_at: new Date().toISOString()
      })
      .select('id')
      .single()

    if (qErr) {
        console.error(`Error inserting question ${i + 1}:`, qErr)
        return
    } else {
        console.log(`Inserted question ${i + 1} with ID: ${qData.id}`)
        questionIds.push(qData.id)
    }
  }

  console.log('Creating assessment...')
  const assessmentId = generateId()
  const { data: assessment, error: assessmentErr } = await supabase
    .from('assessments')
    .insert({
      id: assessmentId,
      title: 'Avaliação de Hermenêutica',
      discipline_id: disciplineId,
      professor: 'Admin',
      institution: 'IBAD',
      question_ids: questionIds,
      points_per_question: 1,
      total_points: 10,
      is_published: true,
      archived: false,
      release_results: true,
      modality: 'public',
      created_at: new Date().toISOString()
    })
    .select()
    .single()

  if (assessmentErr) {
    console.error('Error creating assessment:', assessmentErr)
    return
  }

  console.log(`Assessment created with ID: ${assessment.id}`)

  console.log('Finished successfully!')
}

main()
