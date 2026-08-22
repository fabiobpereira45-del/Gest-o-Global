import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url)
    const cpf = searchParams.get('cpf')
    
    if (!cpf) return NextResponse.json({ error: "Informe o CPF" }, { status: 400 })

    const supabase = createAdminClient()

    const cleanCpf = cpf.replace(/\D/g, '')

    const { data: student, error } = await supabase
        .from('students')
        .select('id, name, cpf, email, enrollment_number, status, auth_user_id')
        .or(`cpf.eq.${cleanCpf},cpf.eq.${cpf}`)
        .maybeSingle()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    if (!student) return NextResponse.json({ found: false, message: "Aluno não encontrado" })

    return NextResponse.json({
        found: true,
        student
    })
}
