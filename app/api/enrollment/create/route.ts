import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { triggerN8nWebhook } from "@/lib/n8n"

export async function POST(req: Request) {
    try {
        const body = await req.json()
        const { name, cpf, phone, address, church, pastor, classId } = body

        if (!name || !cpf || !phone || !address || !church || !pastor) {
            return NextResponse.json({ error: "Todos os campos são obrigatórios." }, { status: 400 })
        }

        const supabase = createAdminClient()

        // Check if CPF already enrolled and CONFIRMED
        const cleanCpf = cpf.replace(/\D/g, '')
        const { data: existing } = await supabase
            .from('students')
            .select('id, status')
            .eq('cpf', cleanCpf)
            .not('status', 'eq', 'pending')
            .maybeSingle()

        if (existing) {
            return NextResponse.json({ error: "Este CPF já possui uma matrícula confirmada." }, { status: 409 })
        }

        // Clean up any abandoned pending enrollment for this CPF
        await supabase
            .from('students')
            .delete()
            .eq('cpf', cleanCpf)
            .eq('status', 'pending')

        // Vacancy check
        if (classId) {
            const { data: cls } = await supabase.from('classes').select('max_students').eq('id', classId).single()
            if (cls) {
                const { count } = await supabase.from('students').select('*', { count: 'exact', head: true }).eq('class_id', classId)
                if (count !== null && count >= cls.max_students) {
                    return NextResponse.json({ error: "Esta turma já está com as vagas esgotadas." }, { status: 403 })
                }
            }
        }

        // Generate enrollment number
        const enrollmentNumber = `IBAD-2026-${Math.floor(1000 + Math.random() * 9000)}`
        const email = `${cleanCpf}@student.ibad.com`

        // Create Auth User
        let authUserId: string | undefined
        const nameUC = (name || "").toUpperCase().trim()

        const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
            email,
            password: "123456",
            email_confirm: true,
            user_metadata: { name: nameUC, type: 'student' }
        })

        if (authError) {
            if (authError.message === 'User already registered' || authError.code === 'email_exists') {
                const { data: users } = await supabase.auth.admin.listUsers()
                const existingUser = users?.users.find(u => u.email === email)
                authUserId = existingUser?.id
            } else {
                console.error("Erro ao criar usuário Auth:", authError)
            }
        } else {
            authUserId = authUser?.user?.id
        }

        // Create student record with status 'active' directly (no financial flow)
        const { data: student, error: studentErr } = await supabase
            .from('students')
            .insert({
                auth_user_id: authUserId,
                name: nameUC,
                cpf: cleanCpf,
                enrollment_number: enrollmentNumber,
                phone: phone.trim(),
                address: address.trim(),
                church: church.trim(),
                pastor_name: pastor.trim(),
                class_id: classId || null,
                status: 'active'
            })
            .select()
            .single()

        if (studentErr) {
            console.error("Erro ao criar aluno:", studentErr)
            return NextResponse.json({ error: `Erro ao registrar candidato: ${studentErr.message}` }, { status: 500 })
        }

        // Trigger n8n (Optional)
        try {
            await triggerN8nWebhook('matricula_confirmada', {
                type: 'online_enrollment',
                name: nameUC,
                phone: phone.trim(),
                matricula: enrollmentNumber
            });
        } catch (err) {
            console.error("Erro ao disparar n8n:", err);
        }

        return NextResponse.json({
            studentId: student.id,
            enrollmentNumber,
            success: true
        })
    } catch (error: any) {
        console.error("Enrollment Error:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
