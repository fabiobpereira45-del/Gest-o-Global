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

function aggressiveNormalize(str) {
    if (!str) return '';
    // This removes EVERYTHING that isn't a-z or 0-9
    return str.toLowerCase().replace(/[^a-z0-9]/g, '');
}

async function runCleanup() {
    console.log('--- 🧹 DETETIVE CONTÁBIL: EXECUTANDO DEDUPLICAÇÃO AGRESSIVA ---')
    
    // 1. Get all disciplines
    const { data: dbDisciplines } = await supabase.from('disciplines').select('*')
    console.log(`Encontradas ${dbDisciplines.length || 0} disciplinas no banco.`)

    const groups = new Map();
    dbDisciplines.forEach(d => {
        const norm = aggressiveNormalize(d.name);
        if (!groups.has(norm)) groups.set(norm, []);
        groups.get(norm).push(d);
    });

    console.log(`Mapeadas em ${groups.size} grupos únicos. Iniciando mesclagem...`)

    for (const [norm, items] of groups.entries()) {
        if (items.length > 1) {
            console.log(`\n⚠️  Deduplicando: "${norm}"`)
            // Sort to keep the cleanest name (no Ã artifacts)
            const sorted = items.sort((a,b) => {
                const b1 = a.name.includes('Ã') || a.name.includes('Â') ? 1 : 0;
                const b2 = b.name.includes('Ã') || b.name.includes('Â') ? 1 : 0;
                return b1 - b2;
            });

            const keep = sorted[0];
            const toRemove = sorted.slice(1);

            console.log(`   MANTER: id=${keep.id} name="${keep.name}"`)
            for (const rem of toRemove) {
                console.log(`   REMOVER: id=${rem.id} name="${rem.name}"`)
                
                // 1. Migrar Assessments
                const { count: assCount } = await supabase.from('assessments').update({ discipline_id: keep.id }).eq('discipline_id', rem.id)
                console.log(`      Migradas ${assCount || 0} avaliações.`)
                
                // 2. Deletar Disciplina
                const { error: delError } = await supabase.from('disciplines').delete().eq('id', rem.id)
                if (delError) console.error(`      Erro ao deletar: ${delError.message}`)
            }
        }
    }

    console.log(`\n--- 🧼 LIMPEZA DE DUPLICATAS CONCLUÍDA ---`)
}

runCleanup()
