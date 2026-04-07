$path = "e:\Projetos AntiGrafity\TEOLOGIA GLOBAL\Escola de Teologia\TEO GLOBAL\lib\store.ts"
$content = Get-Content $path
$safeContent = $content[0..1820] # Lines 1 to 1821 (0-indexed)

$rpcCode = @"

/**
 * DEFINITIVE: Calls RPC to reset and generate student monthly charges.
 */
export async function resetAndGenerateStudentMonthlyCharges(studentId: string, settings: FinancialSettings -any): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.rpc('reset_single_student_financials', {
    p_student_id: studentId,
    p_total_months: settings.totalMonths,
    p_monthly_fee: settings.monthlyFee
  })
  
  if (error) throw new Error("Erro definitivo ao limpar registros: " + error.message)
}

/**
 * DEFINITIVE: Calls RPC to reset ALL active students' monthly charges.
 */
export async function resetAllStudentsMonthlyChargesBatch(settings: FinancialSettings -any): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.rpc('reset_all_active_students_financials', {
    p_total_months: settings.totalMonths,
    p_monthly_fee: settings.monthlyFee
  })

  if (error) throw new Error("Erro Crítico no Reset Global: " + error.message)
}
"@

$finalContent = $safeContent + $rpcCode
$finalContent | Set-Content $path -Encoding UTF8 -Force
