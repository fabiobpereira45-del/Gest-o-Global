'use server'

import { createClient } from '@/lib/supabase/server'
import { Decimal } from 'decimal.js'

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface FinancialSettings {
  id: string
  enrollmentFee: number
  monthlyFee: number
  secondCallFee: number
  finalExamFee: number
  disciplinePrice: number
  paymentDueDay: number
  professorSalaryPerDiscipline: number
  periodStartMonth: string
  periodEndMonth: string
  totalMonths: number
  creditCardUrl?: string
  pixKey?: string
  updatedAt: string
}

export interface StudentPaymentSchedule {
  id: string
  studentId: string
  disciplineId: string
  paymentMonth: number
  monthYear: string
  dueDate: string
  amount: number
  discountPercentage: number
  finalAmount: number
  status: 'pending' | 'paid' | 'overdue' | 'cancelled' | 'scholarship_100' | 'scholarship_50'
  boletoNumber?: string
  boletoPdfUrl?: string
  pixQrcodeUrl?: string
  pixCopyPaste?: string
  receiptNumber?: string
  receiptPdfUrl?: string
  createdAt: string
  updatedAt: string
}

export interface TeacherPaymentSchedule {
  id: string
  teacherId: string
  disciplineId: string
  paymentMonth: number
  monthYear: string
  studentCount: number
  salaryAmount: number
  bonusAmount: number
  totalAmount: number
  status: 'pending' | 'paid' | 'cancelled'
  paymentDate?: string
  paymentMethod?: string
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface FinancialTransaction {
  id: string
  type: 'income' | 'expense' | 'teacher_payment'
  category: string
  description: string
  amount: number
  transactionDate: string
  dueDate?: string
  monthReference: string
  status: 'pending' | 'completed' | 'overdue' | 'cancelled'
  relatedStudentId?: string
  relatedTeacherId?: string
  relatedDisciplineId?: string
  paymentMethod?: string
  paymentDate?: string
  receiptNumber?: string
  createdAt: string
  updatedAt: string
}

export interface ExpenseCategory {
  id: string
  name: string
  description?: string
  monthlyBudget?: number
  colorHex: string
  iconName: string
  status: 'active' | 'inactive'
}

export interface FinancialProjection {
  id: string
  periodStart: string
  periodEnd: string
  optimisticIncome?: number
  optimisticExpenses?: number
  optimisticBalance?: number
  realisticIncome?: number
  realisticExpenses?: number
  realisticBalance?: number
  pessimisticIncome?: number
  pessimisticExpenses?: number
  pessimisticBalance?: number
  actualIncome: number
  actualExpenses: number
  actualBalance: number
  calculatedAt: string
}

export interface ReceiptRegistry {
  id: string
  receiptNumber: string
  transactionId?: string
  studentId?: string
  amount: number
  paymentDate: string
  issuedAt: string
  pdfUrl?: string
  issuedBy: string
}

export interface FinancialKPIs {
  totalIncome: number
  totalExpense: number
  balance: number
  delinquencyRate: number
  pendingPayments: number
  overduePayments: number
  projectedBalance: number
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function mapFinancialSettings(raw: any): FinancialSettings {
  return {
    id: raw.id,
    enrollmentFee: raw.enrollment_fee,
    monthlyFee: raw.monthly_fee,
    secondCallFee: raw.second_call_fee,
    finalExamFee: raw.final_exam_fee,
    disciplinePrice: raw.discipline_price,
    paymentDueDay: raw.payment_due_day,
    professorSalaryPerDiscipline: raw.professor_salary_per_discipline,
    periodStartMonth: raw.period_start_month,
    periodEndMonth: raw.period_end_month,
    totalMonths: raw.total_months,
    creditCardUrl: raw.credit_card_url,
    pixKey: raw.pix_key,
    updatedAt: raw.updated_at,
  }
}

function mapStudentPaymentSchedule(raw: any): StudentPaymentSchedule {
  return {
    id: raw.id,
    studentId: raw.student_id,
    disciplineId: raw.discipline_id,
    paymentMonth: raw.payment_month,
    monthYear: raw.month_year,
    dueDate: raw.due_date,
    amount: raw.amount,
    discountPercentage: raw.discount_percentage,
    finalAmount: raw.final_amount,
    status: raw.status,
    boletoNumber: raw.boleto_number,
    boletoPdfUrl: raw.boleto_pdf_url,
    pixQrcodeUrl: raw.pix_qrcode_url,
    pixCopyPaste: raw.pix_copy_paste,
    receiptNumber: raw.receipt_number,
    receiptPdfUrl: raw.receipt_pdf_url,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
  }
}

function mapTeacherPaymentSchedule(raw: any): TeacherPaymentSchedule {
  return {
    id: raw.id,
    teacherId: raw.teacher_id,
    disciplineId: raw.discipline_id,
    paymentMonth: raw.payment_month,
    monthYear: raw.month_year,
    studentCount: raw.student_count,
    salaryAmount: raw.salary_amount,
    bonusAmount: raw.bonus_amount,
    totalAmount: raw.total_amount,
    status: raw.status,
    paymentDate: raw.payment_date,
    paymentMethod: raw.payment_method,
    notes: raw.notes,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
  }
}

function mapFinancialTransaction(raw: any): FinancialTransaction {
  return {
    id: raw.id,
    type: raw.type,
    category: raw.category,
    description: raw.description,
    amount: raw.amount,
    transactionDate: raw.transaction_date,
    dueDate: raw.due_date,
    monthReference: raw.month_reference,
    status: raw.status,
    relatedStudentId: raw.related_student_id,
    relatedTeacherId: raw.related_teacher_id,
    relatedDisciplineId: raw.related_discipline_id,
    paymentMethod: raw.payment_method,
    paymentDate: raw.payment_date,
    receiptNumber: raw.receipt_number,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
  }
}

function mapExpenseCategory(raw: any): ExpenseCategory {
  return {
    id: raw.id,
    name: raw.name,
    description: raw.description,
    monthlyBudget: raw.monthly_budget,
    colorHex: raw.color_hex,
    iconName: raw.icon_name,
    status: raw.status,
  }
}

function mapReceiptRegistry(raw: any): ReceiptRegistry {
  return {
    id: raw.id,
    receiptNumber: raw.receipt_number,
    transactionId: raw.transaction_id,
    studentId: raw.student_id,
    amount: raw.amount,
    paymentDate: raw.payment_date,
    issuedAt: raw.issued_at,
    pdfUrl: raw.pdf_url,
    issuedBy: raw.issued_by,
  }
}

// ============================================================================
// CONFIGURAÇÕES FINANCEIRAS
// ============================================================================

export async function getFinancialSettings(): Promise<FinancialSettings> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('financial_settings')
    .select('*')
    .single()

  if (error) {
    console.error('Erro ao buscar configurações financeiras:', error)
    throw new Error(`Erro ao buscar configurações: ${error.message}`)
  }

  return mapFinancialSettings(data)
}

export async function updateFinancialSettings(
  updates: Partial<FinancialSettings>,
  updatedByMasterId: string
): Promise<void> {
  const supabase = createClient()

  const dbData: any = {}
  if (updates.disciplinePrice !== undefined) dbData.discipline_price = updates.disciplinePrice
  if (updates.paymentDueDay !== undefined) dbData.payment_due_day = updates.paymentDueDay
  if (updates.professorSalaryPerDiscipline !== undefined) dbData.professor_salary_per_discipline = updates.professorSalaryPerDiscipline
  if (updates.periodStartMonth !== undefined) dbData.period_start_month = updates.periodStartMonth
  if (updates.periodEndMonth !== undefined) dbData.period_end_month = updates.periodEndMonth
  if (updates.pixKey !== undefined) dbData.pix_key = updates.pixKey
  if (updates.creditCardUrl !== undefined) dbData.credit_card_url = updates.creditCardUrl

  dbData.updated_by = updatedByMasterId
  dbData.updated_at = new Date().toISOString()

  const { error } = await supabase
    .from('financial_settings')
    .update(dbData)
    .eq('id', (await getFinancialSettings()).id)

  if (error) {
    throw new Error(`Erro ao atualizar configurações: ${error.message}`)
  }
}

// ============================================================================
// CATEGORIAS DE DESPESA
// ============================================================================

export async function getExpenseCategories(): Promise<ExpenseCategory[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('expense_categories')
    .select('*')
    .eq('status', 'active')
    .order('name')

  if (error) {
    throw new Error(`Erro ao buscar categorias: ${error.message}`)
  }

  return (data || []).map(mapExpenseCategory)
}

export async function updateExpenseCategory(
  categoryId: string,
  updates: Partial<ExpenseCategory>,
  updatedByMasterId: string
): Promise<void> {
  const supabase = createClient()

  const dbData: any = {}
  if (updates.monthlyBudget !== undefined) dbData.monthly_budget = updates.monthlyBudget
  if (updates.status !== undefined) dbData.status = updates.status
  dbData.updated_at = new Date().toISOString()

  const { error } = await supabase
    .from('expense_categories')
    .update(dbData)
    .eq('id', categoryId)

  if (error) {
    throw new Error(`Erro ao atualizar categoria: ${error.message}`)
  }
}

// ============================================================================
// RECEITAS (ALUNOS)
// ============================================================================

export async function createPaymentScheduleForStudent(
  studentId: string,
  disciplineIds: string[],
  createdByMasterId: string
): Promise<void> {
  const supabase = createClient()
  const settings = await getFinancialSettings()

  const schedules = []
  const startMonth = parseInt(settings.periodStartMonth.split('-')[1])
  const startYear = parseInt(settings.periodStartMonth.split('-')[0])

  // Gerar 26 meses de cronograma
  for (let month = 1; month <= 26; month++) {
    const totalMonths = startMonth + month - 1
    const year = startYear + Math.floor((totalMonths - 1) / 12)
    const monthNumber = ((totalMonths - 1) % 12) + 1
    const monthStr = String(monthNumber).padStart(2, '0')
    const monthYear = `${year}-${monthStr}`

    // Calcular data de vencimento (dia configurado)
    const dueDate = new Date(year, monthNumber - 1, settings.paymentDueDay)
    const dueDateStr = dueDate.toISOString().split('T')[0]

    for (const disciplineId of disciplineIds) {
      schedules.push({
        student_id: studentId,
        discipline_id: disciplineId,
        payment_month: month,
        month_year: monthYear,
        due_date: dueDateStr,
        amount: settings.disciplinePrice,
        discount_percentage: 0,
        status: 'pending',
        created_by: createdByMasterId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
    }
  }

  const { error } = await supabase
    .from('student_payment_schedule')
    .insert(schedules)

  if (error) {
    throw new Error(`Erro ao criar cronograma de pagamento: ${error.message}`)
  }
}

export async function getStudentPaymentSchedule(
  studentId: string,
  month?: number
): Promise<StudentPaymentSchedule[]> {
  const supabase = createClient()

  let query = supabase
    .from('student_payment_schedule')
    .select('*')
    .eq('student_id', studentId)

  if (month) {
    query = query.eq('payment_month', month)
  }

  const { data, error } = await query.order('payment_month')

  if (error) {
    throw new Error(`Erro ao buscar cronograma: ${error.message}`)
  }

  return (data || []).map(mapStudentPaymentSchedule)
}

export async function getAllPaymentSchedules(filters: {
  status?: string
  dueDateStart?: string
  dueDateEnd?: string
  disciplineId?: string
}): Promise<StudentPaymentSchedule[]> {
  const supabase = createClient()

  let query = supabase.from('student_payment_schedule').select('*')

  if (filters.status) {
    query = query.eq('status', filters.status)
  }
  if (filters.dueDateStart) {
    query = query.gte('due_date', filters.dueDateStart)
  }
  if (filters.dueDateEnd) {
    query = query.lte('due_date', filters.dueDateEnd)
  }
  if (filters.disciplineId) {
    query = query.eq('discipline_id', filters.disciplineId)
  }

  const { data, error } = await query.order('due_date', { ascending: false })

  if (error) {
    throw new Error(`Erro ao buscar cronogramas: ${error.message}`)
  }

  return (data || []).map(mapStudentPaymentSchedule)
}

export async function recordStudentPayment(
  scheduleId: string,
  paymentMethod: 'pix' | 'boleto' | 'bank_transfer' | 'cash',
  notes?: string,
  recordedByMasterId?: string
): Promise<void> {
  const supabase = createClient()
  const now = new Date().toISOString()

  const { data: schedule, error: scheduleError } = await supabase
    .from('student_payment_schedule')
    .select('*')
    .eq('id', scheduleId)
    .single()

  if (scheduleError) {
    throw new Error(`Cronograma não encontrado: ${scheduleError.message}`)
  }

  // Atualizar cronograma
  const { error: updateError } = await supabase
    .from('student_payment_schedule')
    .update({
      status: 'paid',
      payment_date: now,
      updated_at: now,
    })
    .eq('id', scheduleId)

  if (updateError) {
    throw new Error(`Erro ao atualizar cronograma: ${updateError.message}`)
  }

  // Criar transação financeira
  const monthDate = new Date(`${schedule.month_year}-01`)
  const receipt_number = await generateReceiptNumber()

  const { error: transactionError } = await supabase
    .from('financial_transactions')
    .insert({
      type: 'income',
      category: 'tuition',
      description: `Mensalidade - Aluno ${schedule.student_id} - ${schedule.month_year}`,
      amount: schedule.final_amount,
      transaction_date: new Date().toISOString().split('T')[0],
      month_reference: schedule.month_year,
      status: 'completed',
      related_student_id: schedule.student_id,
      related_discipline_id: schedule.discipline_id,
      payment_method: paymentMethod,
      payment_date: now,
      receipt_number: receipt_number,
      created_by: recordedByMasterId || 'system',
      created_at: now,
    })
}

export async function updatePaymentStatus(
  scheduleId: string,
  newStatus: 'paid' | 'cancelled' | 'overdue',
  updatedByMasterId: string
): Promise<void> {
  const supabase = createClient()

  const { error } = await supabase
    .from('student_payment_schedule')
    .update({
      status: newStatus,
      updated_at: new Date().toISOString(),
    })
    .eq('id', scheduleId)

  if (error) {
    throw new Error(`Erro ao atualizar status: ${error.message}`)
  }
}

export async function applyDiscount(
  scheduleId: string,
  discountPercentage: number,
  reason: string,
  updatedByMasterId: string
): Promise<void> {
  const supabase = createClient()

  if (discountPercentage < 0 || discountPercentage > 100) {
    throw new Error('Percentual de desconto inválido')
  }

  const reasonMap: { [key: number]: string } = {
    50: 'scholarship_50',
    100: 'scholarship_100',
  }

  const newStatus = reasonMap[discountPercentage] || 'pending'

  const { error } = await supabase
    .from('student_payment_schedule')
    .update({
      discount_percentage: discountPercentage,
      discount_reason: reason,
      status: newStatus,
      updated_at: new Date().toISOString(),
    })
    .eq('id', scheduleId)

  if (error) {
    throw new Error(`Erro ao aplicar desconto: ${error.message}`)
  }
}

// ============================================================================
// DESPESAS
// ============================================================================

export async function recordExpense(
  categoryId: string,
  amount: number,
  description: string,
  transactionDate: string,
  createdByMasterId: string,
  notes?: string
): Promise<void> {
  const supabase = createClient()

  // Validar categoria
  const { data: category, error: categoryError } = await supabase
    .from('expense_categories')
    .select('*')
    .eq('id', categoryId)
    .single()

  if (categoryError) {
    throw new Error(`Categoria não encontrada: ${categoryError.message}`)
  }

  const now = new Date().toISOString()
  const monthReference = transactionDate.substring(0, 7) // YYYY-MM

  const { error } = await supabase
    .from('financial_transactions')
    .insert({
      type: 'expense',
      category: category.name,
      description: description,
      amount: amount,
      transaction_date: transactionDate,
      month_reference: monthReference,
      status: 'completed',
      created_by: createdByMasterId,
      created_at: now,
    })

  if (error) {
    throw new Error(`Erro ao registrar despesa: ${error.message}`)
  }
}

export async function getExpenses(filters: {
  categoryId?: string
  dateStart?: string
  dateEnd?: string
  monthReference?: string
}): Promise<FinancialTransaction[]> {
  const supabase = createClient()

  let query = supabase
    .from('financial_transactions')
    .select('*')
    .eq('type', 'expense')

  if (filters.categoryId) {
    // Buscar categoria por ID para pegar nome
    const { data: category } = await supabase
      .from('expense_categories')
      .select('name')
      .eq('id', filters.categoryId)
      .single()

    if (category) {
      query = query.eq('category', category.name)
    }
  }

  if (filters.dateStart) {
    query = query.gte('transaction_date', filters.dateStart)
  }

  if (filters.dateEnd) {
    query = query.lte('transaction_date', filters.dateEnd)
  }

  if (filters.monthReference) {
    query = query.eq('month_reference', filters.monthReference)
  }

  const { data, error } = await query.order('transaction_date', { ascending: false })

  if (error) {
    throw new Error(`Erro ao buscar despesas: ${error.message}`)
  }

  return (data || []).map(mapFinancialTransaction)
}

export async function analyzeBudgetVariance(monthReference: string): Promise<
  Array<{
    category: string
    budget: number
    actual: number
    variance: number
    variancePercentage: number
  }>
> {
  const supabase = createClient()
  const categories = await getExpenseCategories()

  // Obter despesas do mês
  const expenses = await getExpenses({ monthReference })

  const result = categories.map((category) => {
    const categoryExpenses = expenses
      .filter((e) => e.category === category.name)
      .reduce((sum, e) => sum + e.amount, 0)

    const budget = category.monthlyBudget || 0
    const variance = budget - categoryExpenses
    const variancePercentage = budget > 0 ? (variance / budget) * 100 : 0

    return {
      category: category.name,
      budget,
      actual: categoryExpenses,
      variance,
      variancePercentage,
    }
  })

  return result
}

export async function updateExpense(
  transactionId: string,
  updates: Partial<FinancialTransaction>,
  updatedByMasterId: string
): Promise<void> {
  const supabase = createClient()

  const dbData: any = {}
  if (updates.description !== undefined) dbData.description = updates.description
  if (updates.amount !== undefined) dbData.amount = updates.amount
  if (updates.status !== undefined) dbData.status = updates.status

  dbData.updated_by = updatedByMasterId
  dbData.updated_at = new Date().toISOString()

  const { error } = await supabase
    .from('financial_transactions')
    .update(dbData)
    .eq('id', transactionId)

  if (error) {
    throw new Error(`Erro ao atualizar despesa: ${error.message}`)
  }
}

export async function cancelExpense(
  transactionId: string,
  reason: string,
  cancelledByMasterId: string
): Promise<void> {
  const supabase = createClient()

  const { error } = await supabase
    .from('financial_transactions')
    .update({
      status: 'cancelled',
      description: `CANCELADO - ${reason}`,
      updated_by: cancelledByMasterId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', transactionId)

  if (error) {
    throw new Error(`Erro ao cancelar despesa: ${error.message}`)
  }
}

// ============================================================================
// PROFESSORES
// ============================================================================

export async function calculateTeacherPayroll(
  teacherId: string,
  monthYear: string
): Promise<{
  disciplineId: string
  disciplineName: string
  studentCount: number
  baseSalary: number
  bonus: number
  total: number
}> {
  const supabase = createClient()
  const settings = await getFinancialSettings()

  // Obter disciplinas do professor
  const { data: teacherDisciplines, error: discError } = await supabase
    .from('professor_disciplines')
    .select('discipline_id')
    .eq('professor_id', teacherId)

  if (discError) {
    throw new Error(`Erro ao buscar disciplinas do professor: ${discError.message}`)
  }

  const results = []

  for (const td of teacherDisciplines || []) {
    // Contar alunos inscritos naquela disciplina naquele mês
    const { count: studentCount } = await supabase
      .from('student_payment_schedule')
      .select('*', { count: 'exact' })
      .eq('discipline_id', td.discipline_id)
      .eq('month_year', monthYear)
      .eq('status', 'pending')

    // Verificar se existe bônus registrado
    const { data: bonus } = await supabase
      .from('teacher_payment_schedule')
      .select('bonus_amount')
      .eq('teacher_id', teacherId)
      .eq('discipline_id', td.discipline_id)
      .eq('month_year', monthYear)
      .single()

    // Obter nome da disciplina
    const { data: discipline } = await supabase
      .from('disciplines')
      .select('name')
      .eq('id', td.discipline_id)
      .single()

    const baseSalary = settings.professorSalaryPerDiscipline
    const bonusAmount = bonus?.bonus_amount || 0

    results.push({
      disciplineId: td.discipline_id,
      disciplineName: discipline?.name || 'Desconhecida',
      studentCount: studentCount || 0,
      baseSalary,
      bonus: bonusAmount,
      total: baseSalary + bonusAmount,
    })
  }

  return results[0] || { disciplineId: '', disciplineName: '', studentCount: 0, baseSalary: 0, bonus: 0, total: 0 }
}

export async function getPayrollForMonth(monthYear: string): Promise<TeacherPaymentSchedule[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('teacher_payment_schedule')
    .select('*')
    .eq('month_year', monthYear)
    .order('teacher_id')

  if (error) {
    throw new Error(`Erro ao buscar folha de pagamento: ${error.message}`)
  }

  return (data || []).map(mapTeacherPaymentSchedule)
}

export async function recordTeacherPayment(
  scheduleId: string,
  paymentMethod: string,
  paymentDate: string,
  paidByMasterId: string,
  notes?: string
): Promise<void> {
  const supabase = createClient()

  const { error } = await supabase
    .from('teacher_payment_schedule')
    .update({
      status: 'paid',
      payment_date: new Date(paymentDate).toISOString(),
      payment_method: paymentMethod,
      notes: notes,
      updated_by: paidByMasterId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', scheduleId)

  if (error) {
    throw new Error(`Erro ao registrar pagamento: ${error.message}`)
  }
}

export async function applyBonusToTeacher(
  teacherId: string,
  disciplineId: string,
  monthYear: string,
  bonusAmount: number,
  reason: string,
  appliedByMasterId: string
): Promise<void> {
  const supabase = createClient()

  const { data: existing, error: checkError } = await supabase
    .from('teacher_payment_schedule')
    .select('*')
    .eq('teacher_id', teacherId)
    .eq('discipline_id', disciplineId)
    .eq('month_year', monthYear)
    .single()

  if (checkError && checkError.code !== 'PGRST116') {
    throw new Error(`Erro ao verificar agendamento: ${checkError.message}`)
  }

  if (!existing) {
    throw new Error('Agendamento de pagamento não encontrado para este professor/disciplina/mês')
  }

  const { error: updateError } = await supabase
    .from('teacher_payment_schedule')
    .update({
      bonus_amount: bonusAmount,
      updated_by: appliedByMasterId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', existing.id)

  if (updateError) {
    throw new Error(`Erro ao aplicar bônus: ${updateError.message}`)
  }
}

// ============================================================================
// PROJEÇÕES
// ============================================================================

export async function calculateProjectedIncome(
  startMonth: number,
  endMonth: number,
  scenarioType: 'optimistic' | 'realistic' | 'pessimistic' = 'realistic'
): Promise<{
  total: number
  byMonth: Array<{ month: number; revenue: number }>
  byDiscipline: Array<{ discipline: string; revenue: number }>
}> {
  const supabase = createClient()
  const settings = await getFinancialSettings()

  const byMonth = []
  let totalIncome = 0

  // Simular alunos ativos por mês
  const { count: totalStudents } = await supabase
    .from('students')
    .select('*', { count: 'exact' })
    .eq('status', 'active')

  let projectedStudents = totalStudents || 50

  // Aplicar cenário
  if (scenarioType === 'optimistic') {
    projectedStudents = Math.floor(projectedStudents * 1.15) // +15%
  } else if (scenarioType === 'pessimistic') {
    projectedStudents = Math.floor(projectedStudents * 0.85) // -15%
  }

  // Obter disciplinas
  const { data: disciplines } = await supabase
    .from('disciplines')
    .select('id, name')
    .limit(25)

  const byDiscipline = (disciplines || []).map((d) => ({
    discipline: d.name,
    revenue: projectedStudents * settings.disciplinePrice * (endMonth - startMonth + 1),
  }))

  for (let month = startMonth; month <= endMonth; month++) {
    const monthRevenue = projectedStudents * settings.disciplinePrice * (disciplines?.length || 25)
    byMonth.push({
      month,
      revenue: monthRevenue,
    })
    totalIncome += monthRevenue
  }

  return {
    total: totalIncome,
    byMonth,
    byDiscipline,
  }
}

export async function calculateProjectedExpenses(
  startMonth: number,
  endMonth: number,
  scenarioType: 'optimistic' | 'realistic' | 'pessimistic' = 'realistic'
): Promise<{
  total: number
  byMonth: Array<{ month: number; expense: number }>
  byCategory: Array<{ category: string; expense: number }>
}> {
  const categories = await getExpenseCategories()

  const byMonth = []
  const byCategory = categories.map((c) => ({
    category: c.name,
    expense: c.monthlyBudget || 0,
  }))

  const monthlyTotal = categories.reduce((sum, c) => sum + (c.monthlyBudget || 0), 0)

  let projectedTotal = monthlyTotal

  if (scenarioType === 'optimistic') {
    projectedTotal = monthlyTotal * 0.95 // -5%
  } else if (scenarioType === 'pessimistic') {
    projectedTotal = monthlyTotal * 1.1 // +10%
  }

  let totalExpense = 0
  for (let month = startMonth; month <= endMonth; month++) {
    byMonth.push({
      month,
      expense: projectedTotal,
    })
    totalExpense += projectedTotal
  }

  return {
    total: totalExpense,
    byMonth,
    byCategory,
  }
}

export async function generateScenarioAnalysis(): Promise<{
  optimistic: { income: number; expense: number; balance: number }
  realistic: { income: number; expense: number; balance: number }
  pessimistic: { income: number; expense: number; balance: number }
}> {
  const optimisticIncome = await calculateProjectedIncome(1, 26, 'optimistic')
  const optimisticExpenses = await calculateProjectedExpenses(1, 26, 'optimistic')

  const realisticIncome = await calculateProjectedIncome(1, 26, 'realistic')
  const realisticExpenses = await calculateProjectedExpenses(1, 26, 'realistic')

  const pessimisticIncome = await calculateProjectedIncome(1, 26, 'pessimistic')
  const pessimisticExpenses = await calculateProjectedExpenses(1, 26, 'pessimistic')

  return {
    optimistic: {
      income: optimisticIncome.total,
      expense: optimisticExpenses.total,
      balance: optimisticIncome.total - optimisticExpenses.total,
    },
    realistic: {
      income: realisticIncome.total,
      expense: realisticExpenses.total,
      balance: realisticIncome.total - realisticExpenses.total,
    },
    pessimistic: {
      income: pessimisticIncome.total,
      expense: pessimisticExpenses.total,
      balance: pessimisticIncome.total - pessimisticExpenses.total,
    },
  }
}

// ============================================================================
// RECIBOS
// ============================================================================

async function generateReceiptNumber(): Promise<string> {
  const supabase = createClient()
  const now = new Date()
  const year = now.getFullYear()

  // Obter último recibo do ano
  const { data: lastReceipt } = await supabase
    .from('receipt_registry')
    .select('receipt_number')
    .like('receipt_number', `SEQ-${year}-%`)
    .order('receipt_number', { ascending: false })
    .limit(1)

  let nextNumber = 1
  if (lastReceipt && lastReceipt.length > 0) {
    const lastNumber = parseInt(lastReceipt[0].receipt_number.split('-')[2])
    nextNumber = lastNumber + 1
  }

  return `SEQ-${year}-${String(nextNumber).padStart(6, '0')}`
}

export async function generateReceipt(
  transactionId: string,
  pdfUrl: string,
  generatedByMasterId: string
): Promise<{
  receiptNumber: string
  pdfUrl: string
}> {
  const supabase = createClient()

  const { data: transaction } = await supabase
    .from('financial_transactions')
    .select('*')
    .eq('id', transactionId)
    .single()

  if (!transaction) {
    throw new Error('Transação não encontrada')
  }

  const receiptNumber = await generateReceiptNumber()

  const { error } = await supabase
    .from('receipt_registry')
    .insert({
      receipt_number: receiptNumber,
      transaction_id: transactionId,
      student_id: transaction.related_student_id,
      amount: transaction.amount,
      payment_date: transaction.payment_date || new Date().toISOString(),
      pdf_url: pdfUrl,
      issued_by: generatedByMasterId,
      issued_at: new Date().toISOString(),
    })

  if (error) {
    throw new Error(`Erro ao gerar recibo: ${error.message}`)
  }

  return {
    receiptNumber,
    pdfUrl,
  }
}

export async function getReceiptHistory(filters: {
  studentId?: string
  issuedAtStart?: string
  issuedAtEnd?: string
}): Promise<ReceiptRegistry[]> {
  const supabase = createClient()

  let query = supabase.from('receipt_registry').select('*')

  if (filters.studentId) {
    query = query.eq('student_id', filters.studentId)
  }

  if (filters.issuedAtStart) {
    query = query.gte('issued_at', filters.issuedAtStart)
  }

  if (filters.issuedAtEnd) {
    query = query.lte('issued_at', filters.issuedAtEnd)
  }

  const { data, error } = await query.order('issued_at', { ascending: false })

  if (error) {
    throw new Error(`Erro ao buscar histórico de recibos: ${error.message}`)
  }

  return (data || []).map(mapReceiptRegistry)
}

// ============================================================================
// DASHBOARD
// ============================================================================

export async function getFinancialKPIs(month?: string): Promise<FinancialKPIs> {
  const supabase = createClient()

  const now = new Date()
  const currentMonth = month || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

  // Total de receita
  const { data: incomeData } = await supabase
    .from('financial_transactions')
    .select('amount')
    .eq('type', 'income')
    .eq('status', 'completed')

  const totalIncome = (incomeData || []).reduce((sum, t) => sum + t.amount, 0)

  // Total de despesa
  const { data: expenseData } = await supabase
    .from('financial_transactions')
    .select('amount')
    .eq('type', 'expense')
    .eq('status', 'completed')

  const totalExpense = (expenseData || []).reduce((sum, t) => sum + t.amount, 0)

  // Pagamentos pendentes
  const { count: pendingPayments } = await supabase
    .from('student_payment_schedule')
    .select('*', { count: 'exact' })
    .eq('status', 'pending')
    .lt('due_date', now.toISOString().split('T')[0])

  // Pagamentos atrasados
  const { count: overduePayments } = await supabase
    .from('student_payment_schedule')
    .select('*', { count: 'exact' })
    .eq('status', 'overdue')

  // Taxa de inadimplência
  const { count: totalSchedules } = await supabase
    .from('student_payment_schedule')
    .select('*', { count: 'exact' })

  const delinquencyRate = totalSchedules ? ((overduePayments || 0) / totalSchedules) * 100 : 0

  // Projeção realista
  const projection = await calculateProjectedIncome(1, 26, 'realistic')
  const expenses = await calculateProjectedExpenses(1, 26, 'realistic')
  const projectedBalance = projection.total - expenses.total

  return {
    totalIncome,
    totalExpense,
    balance: totalIncome - totalExpense,
    delinquencyRate,
    pendingPayments: pendingPayments || 0,
    overduePayments: overduePayments || 0,
    projectedBalance,
  }
}

export async function getFinancialSummary(
  startDate: string,
  endDate: string
): Promise<{
  income: { byMonth: object; byDiscipline: object }
  expense: { byMonth: object; byCategory: object }
  teacherPayroll: object
}> {
  const supabase = createClient()

  // Receita por mês
  const { data: incomeByDate } = await supabase
    .from('financial_transactions')
    .select('amount, month_reference, related_discipline_id')
    .eq('type', 'income')
    .eq('status', 'completed')
    .gte('transaction_date', startDate)
    .lte('transaction_date', endDate)

  const incomeByMonth: { [key: string]: number } = {}
  const incomeByDiscipline: { [key: string]: number } = {}

  ;(incomeByDate || []).forEach((income) => {
    const month = income.month_reference
    incomeByMonth[month] = (incomeByMonth[month] || 0) + income.amount
    incomeByDiscipline[income.related_discipline_id || 'Desconhecida'] =
      (incomeByDiscipline[income.related_discipline_id || 'Desconhecida'] || 0) + income.amount
  })

  // Despesa por mês
  const { data: expenseByDate } = await supabase
    .from('financial_transactions')
    .select('amount, month_reference, category')
    .eq('type', 'expense')
    .eq('status', 'completed')
    .gte('transaction_date', startDate)
    .lte('transaction_date', endDate)

  const expenseByMonth: { [key: string]: number } = {}
  const expenseByCategory: { [key: string]: number } = {}

  ;(expenseByDate || []).forEach((expense) => {
    const month = expense.month_reference
    expenseByMonth[month] = (expenseByMonth[month] || 0) + expense.amount
    expenseByCategory[expense.category] = (expenseByCategory[expense.category] || 0) + expense.amount
  })

  // Folha de pagamento
  const { data: payroll } = await supabase
    .from('teacher_payment_schedule')
    .select('month_year, total_amount, teacher_id')
    .eq('status', 'paid')

  const teacherPayroll: { [key: string]: number } = {}
  ;(payroll || []).forEach((p) => {
    teacherPayroll[p.month_year] = (teacherPayroll[p.month_year] || 0) + p.total_amount
  })

  return {
    income: {
      byMonth: incomeByMonth,
      byDiscipline: incomeByDiscipline,
    },
    expense: {
      byMonth: expenseByMonth,
      byCategory: expenseByCategory,
    },
    teacherPayroll,
  }
}
