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

function normalize(str) {
    if (!str) return '';
    return str
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // remove accents
        .replace(/[^a-z0-9]/g, "") // REMOVE EVERYTHING ELSE (extremely aggressive)
        .replace(/actos/g, 'atos')
        .trim();
}

async function checkNormalization() {
    const { data: dbDisciplines } = await supabase.from('disciplines').select('name')
    const results = dbDisciplines.map(d => ({ original: d.name, normalized: normalize(d.name) }))
    
    const groups = {}
    results.forEach(r => {
        if (!groups[r.normalized]) groups[r.normalized] = []
        groups[r.normalized].push(r.original)
    })

    for (const [norm, originals] of Object.entries(groups)) {
        if (originals.length > 1) {
            console.log(`Match for "${norm}":`, originals)
        }
    }
}

checkNormalization()
