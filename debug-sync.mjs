import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://vevivqcluyutlatwsnjh.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZldml2cWNsdXl1dGxhdHdzbmpoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTY1NTYxOCwiZXhwIjoyMDkxMjMxNjE4fQ.42Gk_uOBezQfMpWp6mpPLjFYmwf_te13DEz9Pek1oj0'
)

async function checkStatus() {
  const { data } = await supabase.from('students').select('id, name, status').order('name')
  const statuses = {}
  data.forEach(s => { statuses[s.status || 'NULL'] = (statuses[s.status || 'NULL'] || 0) + 1 })
  console.log('Status distribution:', statuses)
  console.log('\nPrimeiros 5 alunos:')
  data.slice(0, 5).forEach(s => console.log(`  ${s.name} -> status: "${s.status}"`))
  
  // Forçar sync de todos os alunos direto no banco
  const { data: disciplines } = await supabase.from('disciplines').select('id, name, "order", execution_date').order('order')
  const { data: settings } = await supabase.from('financial_settings').select('*').limit(1).single()
  const tuitionRate = settings?.tuition_rate || 100
  
  console.log(`\nTaxa mensalidade: R$ ${tuitionRate}`)
  console.log(`Disciplinas: ${disciplines.length}`)
  
  // Buscar TODOS os registros existentes
  const { data: existing, count } = await supabase.from('student_tuition').select('student_id, discipline_id', { count: 'exact' })
  console.log(`Registros existentes: ${count || existing?.length}`)
  
  const existingSet = new Set(existing.map(e => `${e.student_id}-${e.discipline_id}`))
  
  // Gerar inserts para TODOS os alunos (não só active)
  const toInsert = []
  for (const s of data) {
    for (const d of disciplines) {
      if (!existingSet.has(`${s.id}-${d.id}`)) {
        toInsert.push({
          student_id: s.id,
          discipline_id: d.id,
          amount: tuitionRate,
          due_date: d.execution_date ? `${d.execution_date}-10` : null,
          status: 'pending',
          created_at: new Date().toISOString()
        })
      }
    }
  }
  
  console.log(`\nRegistros a inserir: ${toInsert.length}`)
  
  if (toInsert.length > 0) {
    // Inserir em chunks de 500
    for (let i = 0; i < toInsert.length; i += 500) {
      const chunk = toInsert.slice(i, i + 500)
      const { error } = await supabase.from('student_tuition').insert(chunk)
      if (error) {
        console.error(`Erro no chunk ${i}-${i + chunk.length}:`, error.message)
      } else {
        console.log(`Chunk ${i}-${i + chunk.length}: OK`)
      }
    }
  }
  
  // Conferir total final
  const { count: finalCount } = await supabase.from('student_tuition').select('*', { count: 'exact', head: true })
  console.log(`\nTotal final de registros: ${finalCount}`)
}

checkStatus().catch(console.error)
