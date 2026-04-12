import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

// --- CONFIG ---
const OLD_DB = {
    url: "https://rvsfcrtvogbeayrmobbb.supabase.co",
    key: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ2c2ZjcnR2b2diZWF5cm1vYmJiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDgxMTM4OSwiZXhwIjoyMDkwMzg3Mzg5fQ.9MfMAx7RMJs4naaB28pGP0F4mdVZhbRY5ug7pjOXC8g"
}

// Load NEW DB from .env
const envContent = fs.readFileSync('.env', 'utf8')
const env = {}
envContent.split(/\r?\n/).forEach(line => {
    const [key, ...valueParts] = line.split('=')
    if (key && valueParts.length > 0) {
        env[key.trim()] = valueParts.join('=').trim().replace(/^"(.*)"$/, '$1')
    }
})

const NEW_DB = {
    url: env.NEXT_PUBLIC_SUPABASE_URL,
    key: env.SUPABASE_SERVICE_ROLE_KEY
}

const DISCIPLINE_ID = "2bdf61e3-e312-43e2-bcd0-e5ec912d9994" // Existing Profetas ID in NEW DB

// --- QUESTION DATA (Parsed from user request) ---
const rawQuestions = [
    {
        text: "Ageu e Zacarias profetizaram durante qual período?",
        choices: ["Antes do exílio.", "No meio do exílio.", "Pós-exílio, incentivando a reconstrução do Templo.", "No tempo do Rei Saul."],
        correct: "Pós-exílio, incentivando a reconstrução do Templo."
    },
    {
        text: "Qual destes objetivos NÃO é mencionado em Daniel 9:24 como propósito das 70 semanas?",
        choices: ["Extinguir a transgressão e dar fim aos pecados.", "Expiar a iniquidade e trazer a justiça eterna.", "Selar a visão e a profecia e ungir o Santo dos Santos.", "Construir um muro de fogo ao redor da Babilônia."],
        correct: "Construir um muro de fogo ao redor da Babilônia."
    },
    {
        text: "Daniel e seus amigos foram levados cativos por qual rei?",
        choices: ["Ciro", "Dario", "Nabucodonosor", "Xerxes"],
        correct: "Nabucodonosor"
    },
    {
        text: "Qual profeta escreveu sobre a destruição final de Nínive, cerca de um século após Jonas?",
        choices: ["Naum", "Habacuque", "Ageu", "Zacarias"],
        correct: "Naum"
    },
    {
        text: "Qual era a principal função do profeta no Antigo Testamento?",
        choices: ["Apenas prever o fim do mundo.", "Atuar como embaixador e porta-voz de Deus perante o povo e os reis.", "Administrar os sacrifícios no altar.", "Cobrar impostos para a construção do templo."],
        correct: "Atuar como embaixador e porta-voz de Deus perante o povo e os reis."
    },
    {
        text: "Jeremias profetizou que o cativeiro babilônico duraria:",
        choices: ["40 anos.", "100 anos.", "70 anos.", "50 anos."],
        correct: "70 anos."
    },
    {
        text: "O que deveria acontecer após as primeiras 69 semanas (7 + 62), segundo o texto de Daniel 9:26?",
        choices: ["O Templo seria destruído por fogo do céu.", "O Ungido (Messias) seria cortado (morto).", "O povo de Israel dominaria todas as nações.", "O profeta Daniel seria arrebatado."],
        correct: "O Ungido (Messias) seria cortado (morto)."
    },
    {
        text: "Ezequiel exerceu seu ministério profético em qual contexto?",
        choices: ["Durante o reinado de Davi.", "No exílio, entre os cativos na Babilônia.", "Em Jerusalém, antes da queda do primeiro templo.", "Após o retorno do exílio com Zorobabel."],
        correct: "No exílio, entre os cativos na Babilônia."
    },
    {
        text: "De acordo com Daniel 9:24, qual é o período total determinado sobre o povo de Daniel e a santa cidade?",
        choices: ["70 dias literais.", "490 dias.", "70 semanas (490 anos).", "7 anos proféticos."],
        correct: "70 semanas (490 anos)."
    },
    {
        text: "Qual frase famosa de Habacuque é citada por Paulo em Romanos para falar da salvação?",
        choices: ["'O Senhor é o meu pastor'.", "'O justo viverá pela sua fé'.", "'Arrependei-vos'.", "'Deus é amor'."],
        correct: "'O justo viverá pela sua fé'."
    },
    {
        text: "A distinção entre 'Profetas Maiores' e 'Profetas Menores' na Bíblia Cristã baseia-se em:",
        choices: ["No grau de santidade do profeta.", "Na extensão (tamanho) do conteúdo escrito.", "Na ordem cronológica de atuação.", "Na importância doutrinária de cada livro."],
        correct: "Na extensão (tamanho) do conteúdo escrito."
    },
    {
        text: "Onde Isaías recebeu sua visão e chamado profético 'No ano em que morreu o rei Uzias'?",
        choices: ["No deserto.", "No Templo.", "No palácio de Babilônia.", "Junto ao rio Quebar."],
        correct: "No Templo."
    },
    {
        text: "Qual profeta menciona a entrada do Messias em Jerusalém montado em um jumentinho?",
        choices: ["Malaquias", "Zacarias", "Naum", "Sofonias"],
        correct: "Zacarias"
    },
    {
        text: "Na interpretação escatológica clássica, a expressão 'uma semana' (a 70ª semana) refere-se a um período de quantos anos?",
        choices: ["1 ano.", "3 anos e meio.", "7 anos.", "70 anos."],
        correct: "7 anos."
    },
    {
        text: "Amós era um profeta originário de Tecoa e sua profissão original era:",
        choices: ["Sacerdote.", "Pescador.", "Boiadeiro e cultivador de sicômoros.", "Escriba do Rei."],
        correct: "Boiadeiro e cultivador de sicômoros."
    },
    {
        text: "Qual era a principal mensagem de Ageu ao povo?",
        choices: ["'Plantem mais vinhas'.", "'Priorizem a reconstrução da Casa de Deus em vez de suas próprias casas luxuosas'.", "'Fujam para o Egito'.", "'Não paguem impostos'."],
        correct: "'Priorizem a reconstrução da Casa de Deus em vez de suas próprias casas luxuosas'."
    },
    {
        text: "Qual foi a reação do povo de Nínive à pregação de Jonas?",
        choices: ["Expulsaram o profeta da cidade.", "Ignoraram a mensagem.", "Arrependeram-se com jejum e pano de saco.", "Mataram Jonas."],
        correct: "Arrependeram-se com jejum e pano de saco."
    },
    {
        text: "O 'Servo Sofredor' é um tema proeminente em qual livro?",
        choices: ["Ezequiel", "Daniel", "Isaías", "Lamentações"],
        correct: "Isaías"
    },
    {
        text: "Jonas tentou fugir da presença de Deus embarcando para:",
        choices: ["Nínive", "Jerusalém", "Társis", "Jope"],
        correct: "Társis"
    },
    {
        text: "Qual profeta é associado à fundação de 'escolas de profetas' em Israel?",
        choices: ["Amós", "Samuel", "Isaías", "Daniel"],
        correct: "Samuel"
    }
]

async function restore() {
    console.log("--- 🚀 RESTORING AVALIAÇÃO PROFETAS ---")
    
    const oldSupabase = createClient(OLD_DB.url, OLD_DB.key)
    const newSupabase = createClient(NEW_DB.url, NEW_DB.key)

    // 1. Prepare Questions
    console.log("Adding questions...")
    const questionsToInsert = rawQuestions.map(rq => {
        const choices = rq.choices.map(c => ({ id: Math.random().toString(36).slice(2, 6), text: c }))
        const correctAnswerObj = choices.find(c => c.text === rq.correct)
        return {
            discipline_id: DISCIPLINE_ID,
            type: 'multiple-choice',
            text: rq.text,
            choices: choices,
            correct_answer: correctAnswerObj ? correctAnswerObj.id : "",
            points: 1,
            created_at: new Date().toISOString()
        }
    })

    const { data: insertedQuestions, error: qErr } = await newSupabase.from('questions').insert(questionsToInsert).select()
    if (qErr) throw new Error("Error inserting questions: " + qErr.message)
    console.log(`Successfully inserted ${insertedQuestions.length} questions.`)

    // 2. Create Assessment
    console.log("Creating assessment...")
    const assessment = {
        title: "Avaliação Profetas",
        discipline_id: DISCIPLINE_ID,
        professor: "PB. AISLAN BASTOS",
        institution: "IBAD",
        points_per_question: 1,
        total_points: 20,
        is_published: true,
        open_at: new Date().toISOString(),
        close_at: null,
        created_at: new Date().toISOString(),
        shuffle_variants: true,
        release_results: true,
        modality: "public"
    }

    const { data: insertedAss, error: aErr } = await newSupabase.from('assessments').insert(assessment).select().single()
    if (aErr) throw new Error("Error creating assessment: " + aErr.message)
    const assessmentId = insertedAss.id
    console.log(`Assessment created with ID: ${assessmentId}`)

    // 3. Migrate Submissions
    console.log("Fetching submissions from OLD DB...")
    const { data: oldSubmissions, error: osErr } = await oldSupabase.from('student_submissions').select('*').eq('assessment_id', '1oz4vjylmniyb1u1')
    if (osErr) throw new Error("Error fetching old submissions: " + osErr.message)
    console.log(`Found ${oldSubmissions.length} submissions to migrate.`)

    if (oldSubmissions.length > 0) {
        console.log("Migrating submissions...")
        // Note: We keep original data but link to NEW assessment ID.
        // We omit 'id' to let it generate new ones, or keep if we want to preserve IDs.
        // Better generate new ones to avoid conflicts if IDs were used elsewhere.
        const subsToMigrate = oldSubmissions.map(os => ({
            assessment_id: assessmentId,
            student_name: os.student_name,
            student_email: os.student_email,
            answers: os.answers,
            score: os.score,
            total_points: os.total_points,
            percentage: os.percentage,
            submitted_at: os.submitted_at,
            time_elapsed_seconds: os.time_elapsed_seconds,
            focus_lost_count: os.focus_lost_count
        }))

        const { data: insertedSubs, error: isErr } = await newSupabase.from('student_submissions').insert(subsToMigrate)
        if (isErr) console.error("Error migrating submissions:", isErr.message)
        else console.log(`Migrated ${insertedSubs?.length || subsToMigrate.length} submissions successfully.`)
    }

    console.log("\n--- ✅ RESTORATION COMPLETE ---")
}

restore().catch(err => {
    console.error("\n❌ FATAL ERROR:", err.message)
    process.exit(1)
})
