import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

// Simple .env.local parser
const envPath = path.resolve(process.cwd(), '.env.local')
const envContent = fs.readFileSync(envPath, 'utf8')
const env = {}
envContent.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=')
  if (key && valueParts.length > 0) {
    env[key.trim()] = valueParts.join('=').trim().replace(/^"(.*)"$/, '$1')
  }
})

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

const expectedDisciplines = [
  "Cristologia", "Epístolas Paulinas", "Escatologia", "Escola Dominical",
  "Evangelhos e Atos", "Evangelismo", "Evidência Cristã",
  "Fundamentos da Psicologia e do Aconselhamento", "Geografia Bíblica",
  "Hebreus e Epístolas Gerais", "Hermenêutica", "História da Igreja",
  "Homilética", "Introdução ao Novo Testamento", "Introdução Bíblica",
  "Livros Históricos", "Livros Poéticos", "Maneiras e Costumes Bíblicos",
  "Missiologia", "Pentateuco", "Profetas Maiores e Menores",
  "Religiões Comparadas", "Teologia Pastoral", "Teologia Sistemática",
  "Administração Eclesiástica"
]

async function audit() {
  console.log('--- 🔍 AUDIT: FINANCEIRO (DETETIVE CONTÁBIL) ---')
  
  // 1. Audit Disciplines
  const { data: disciplines } = await supabase.from('disciplines').select('id, name')
  const foundNames = new Set(disciplines?.map(d => d.name) || [])
  
  console.log(`\n1. Disciplinas na Tabela: ${disciplines?.length || 0} de ${expectedDisciplines.length}`)
  
  console.log('\n   ❌ DISCIPLINAS FALTANTES NO BANCO:')
  let missingCount = 0
  expectedDisciplines.forEach(name => {
    if (!foundNames.has(name)) {
      console.log(`      - ${name}`)
      missingCount++
    }
  })
  if (missingCount === 0) console.log('      Nenhuma disciplina faltante.')

  // 2. Audit Students & Charges
  const { data: students } = await supabase.from('students').select('id, name').eq('status', 'active').limit(5)
  console.log(`\n2. Amostra de Alunos Ativos e Cobranças (Mensalidades):`)
  
  for (const st of students || []) {
    const { data: charges } = await supabase.from('financial_charges').select('*').eq('student_id', st.id).eq('type', 'monthly')
    const total = charges?.reduce((acc, c) => acc + c.amount, 0) || 0
    console.log(`   - ${st.name.padEnd(20)}: ${charges?.length || 0} parcelas | Total: R$ ${total.toFixed(2)}`)
    
    if (charges?.length && charges.length < 25) {
        console.log(`     ⚠️  ALERTA: Faltam ${25 - charges.length} parcelas.`)
    }
  }

  // 3. Audit Settings
  const { data: settings } = await supabase.from('financial_settings').select('*').single()
  console.log(`\n3. Configurações Financeiras:`)
  console.log(`   - Monthly Fee: R$ ${settings?.monthly_fee || 0}`)
}

audit()
