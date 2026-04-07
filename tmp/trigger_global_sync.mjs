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

function uid() { return Math.random().toString(36).substr(2, 16); }

async function insertDisciplines() {
    console.log('   Re-inserting canonical disciplines...')
    const { data: existing } = await supabase.from('disciplines').select('name')
    const existingNames = new Set(existing?.map(d => d.name) || [])

    for (let i = 0; i < canonicalNames.length; i++) {
        const name = canonicalNames[i];
        if (!existingNames.has(name)) {
            await supabase.from('disciplines').insert({
                id: uid(),
                name: name,
                order: 100 + i,
                created_at: new Date().toISOString()
            })
        }
    }
}

async function triggerGlobalSync() {
    console.log('--- 🚀 CFO DIGITAL: TRIGGERING GLOBAL SYNC ---')

    // 1. Re-insert missing canonicals
    await insertDisciplines();

    // 2. Get students
    const { data: students } = await supabase.from('students').select('id, name').eq('status', 'active')
    const { data: settings } = await supabase.from('financial_settings').select('*').single()
    const monthlyFee = settings?.monthly_fee || 100

    // 3. Get all clean disciplines
    const { data: disciplines } = await supabase.from('disciplines').select('*').order('order', { ascending: true })
    console.log(`\n   Loaded ${disciplines.length} clean disciplines.`)

    for (const st of students || []) {
        console.log(`   Syncing student: ${st.name} (id=${st.id})`)
        const toInsert = []
        
        let targetMonth = 7 // August 2025
        let targetYear = 2025

        for (let i = 0; i < disciplines.length; i++) {
            const disc = disciplines[i]
            const expectedDesc = `MENSALIDADE: ${disc.name}`
            const mo = String(targetMonth + 1).padStart(2, '0')
            const dueDate = `${targetYear}-${mo}-10`

            const isPast = dueDate < '2026-04-01'

            toInsert.push({
                student_id: st.id,
                type: 'monthly',
                description: expectedDesc,
                amount: monthlyFee,
                due_date: dueDate,
                status: isPast ? 'paid' : 'pending',
                payment_date: isPast ? new Date().toISOString() : null,
                created_at: new Date().toISOString()
            })

            // Stagger next month
            targetMonth++
            if (targetMonth === 11) { // Skip December
                targetMonth = 0
                targetYear++
            }
            if (targetMonth === 12) {
                targetMonth = 0
                targetYear++
            }
        }
        
        const { error } = await supabase.from('financial_charges').insert(toInsert)
        if (error) console.error(`      Error syncing ${st.name}:`, error.message)
    }

    console.log('\n--- ✅ GLOBAL SYNC COMPLETE ---')
}

triggerGlobalSync()
