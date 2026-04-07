import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { resetAllStudentsMonthlyChargesBatch, getFinancialSettings } from "@/lib/store"

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // 1. Get current settings
    const settings = await getFinancialSettings()
    if (!settings) {
      return NextResponse.json({ error: "Configuracoes financeiras nao encontradas." }, { status: 404 })
    }

    // 2. Perform the global reset (Deletes all and recreates from curriculum)
    await resetAllStudentsMonthlyChargesBatch(settings)

    return NextResponse.json({ 
      success: true,
      message: "Reset global financeiro concluido com sucesso. Todas as cobrancas foram regeneradas baseadas na grade curricular (25 disciplinas)."
    })

  } catch (err: any) {
    console.error("Erro no reset global:", err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
