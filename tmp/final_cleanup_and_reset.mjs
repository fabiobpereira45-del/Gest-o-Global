import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

// Simple .env.local parser
const envContent = fs.readFileSync('.env.local', 'utf8')
const env = {}
envContent.split('\n').map(l => l.split('=')).forEach(([k, ...v]) => {
  if (k) env[k.trim()] = v.join('=').trim().replace(/^"(.*)"$/, '$1')
})

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

const canonicalNames = [
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

const canonicalSet = new Set(canonicalNames);

async function finalCleanupAndReset() {
    console.log('--- 🛡️  CFO DIGITAL: FINAL CLEANUP & RESET ---')

    // 1. Delete extra disciplines (like 'Português')
    const { data: currentDiscs } = await supabase.from('disciplines').select('id, name')
    for (const d of currentDiscs || []) {
        if (!canonicalSet.has(d.name)) {
            console.log(`   Deleting non-canonical discipline: ${d.name}`)
            await supabase.from('disciplines').delete().eq('id', d.id)
        }
    }

    // 2. Wipe ALL monthly financial charges for ALL students
    console.log('\n   Wiping all monthly financial charges...')
    const { error: delError } = await supabase.from('financial_charges').delete().eq('type', 'monthly')
    if (delError) console.error('   Error wiping charges:', delError.message)
    else console.log('   All monthly charges wiped successfully.')

    // NOTE: The synchronizing logic will be triggered in the next step via the UI or by calling its logic.
    // For now, I've cleaned the data structure.
    
    console.log('\n--- ✅ FINAL CLEANUP COMPLETE ---')
}

finalCleanupAndReset()
