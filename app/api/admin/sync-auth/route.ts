import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function POST(request: Request) {
    try {
        const supabase = createAdminClient()

        // 1. Buscar todos os estudantes que não têm auth_user_id
        const { data: students, error: fetchError } = await supabase
            .from('students')
            .select('id, name, email, cpf')
            .is('auth_user_id', null)

        if (fetchError) throw fetchError

        if (!students || students.length === 0) {
            return NextResponse.json({ message: "Todos os estudantes já possuem conta de acesso." })
        }

        const stats = {
            total: students.length,
            success: 0,
            failed: 0,
            alreadyExisted: 0,
            errors: [] as string[]
        }

        // 2. Iterar e criar as contas
        for (const student of students) {
            try {
                const password = "IBAD2026"
                const email = student.email || `${student.cpf}@student.ibad.com`

                const { data: authData, error: authError } = await supabase.auth.admin.createUser({
                    email,
                    password,
                    email_confirm: true,
                    user_metadata: {
                        full_name: student.name,
                        type: 'student'
                    }
                })

                if (authError) {
                    if (authError.message.includes("already registered") || authError.status === 422) {
                        // Se já existe no Auth mas não no vínculo, tentamos buscar o ID
                        const { data: { users }, error: listError } = await supabase.auth.admin.listUsers()
                        const existingUser = users?.find(u => u.email?.toLowerCase() === email.toLowerCase())
                        
                        if (existingUser) {
                            await supabase.from('students').update({ auth_user_id: existingUser.id }).eq('id', student.id)
                            stats.alreadyExisted++
                            continue
                        }
                    }
                    throw authError
                }

                if (authData.user) {
                    await supabase.from('students').update({ auth_user_id: authData.user.id }).eq('id', student.id)
                    stats.success++
                }
            } catch (err: any) {
                stats.failed++
                stats.errors.push(`Erro no aluno ${student.name}: ${err.message}`)
            }
        }

        return NextResponse.json({
            message: `Sincronização concluída: ${stats.success} criados, ${stats.alreadyExisted} vinculados, ${stats.failed} falhas.`,
            stats
        })

    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
