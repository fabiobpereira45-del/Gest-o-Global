import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

// Simple .env.local parser
const envContent = fs.readFileSync('.env.local', 'utf8')
const env = {}
envContent.split('\n').map(l => l.split('=')).forEach(([k, ...v]) => {
  if (k) env[k.trim()] = v.join('=').trim().replace(/^"(.*)"$/, '$1')
})

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

function aggressiveNormalize(str) {
    if (!str) return '';
    // This removes ANYTHING that isn't a-z or 0-9
    return str.toLowerCase().replace(/[^a-z0-9]/g, '');
}

async function listAll() {
    const { data: dbDisciplines } = await supabase.from('disciplines').select('name')
    const results = dbDisciplines.map(d => ({ original: d.name, normalized: aggressiveNormalize(d.name) }))
    
    results.sort((a,b) => a.normalized.localeCompare(b.normalized))
    results.forEach(r => console.log(`${r.normalized.padEnd(30)} | ${r.original}`))
}

listAll()
