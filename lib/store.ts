import { createClient } from "@/lib/supabase/client"
// CACHE-BUSTER: v1.2.3-purge - 2026-04-08 00:15
import { triggerN8nWebhook } from "@/lib/n8n"
export { triggerN8nWebhook }

// â€”â€”â€” Types â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”
export type QuestionType = "multiple-choice" | "true-false" | "discursive" | "incorrect-alternative" | "fill-in-the-blank" | "matching"
export interface Choice { id: string; text: string }
export interface MatchingPair { id: string; left: string; right: string }
export interface Semester { id: string; name: string; order: number; shift?: string; is_completed?: boolean; createdAt: string }
export interface Discipline { id: string; name: string; description?: string | null; semesterId?: string | null; professorName?: string | null; dayOfWeek?: string | null; shift?: string | null; order: number; is_realized?: boolean; createdAt: string }
export interface StudyMaterial { id: string; disciplineId: string; title: string; description?: string; fileUrl: string; createdAt: string }
export interface GradingSettings { id: string; pointsPerPresence: number; onlinePresencePoints: number; interactionPoints: number; bookActivityPoints: number; passingAverage: number; totalDivisor: number; updatedAt: string; }
export interface Question { id: string; disciplineId: string; type: QuestionType; text: string; choices: Choice[]; pairs?: MatchingPair[]; correctAnswer: string; points: number; createdAt: string }
export interface Assessment { id: string; title: string; disciplineId: string; professor: string; institution: string; questionIds: string[]; pointsPerQuestion: number; totalPoints: number; openAt: string | null; closeAt: string | null; isPublished: boolean; archived: boolean; shuffleVariants?: boolean; timeLimitMinutes?: number | null; logoBase64?: string; rules?: string; releaseResults?: boolean; modality?: "public" | "private"; createdAt: string }
export interface StudentAnswer { questionId: string; answer: string }
export interface StudentSubmission { id: string; assessmentId: string; studentName: string; studentEmail: string; answers: StudentAnswer[]; score: number; totalPoints: number; percentage: number; submittedAt: string; timeElapsedSeconds: number; focusLostCount?: number }
export interface ProfessorAccount { id: string; name: string; email: string; passwordHash: string; role: "master" | "professor"; avatar_url?: string | null; bio?: string | null; createdAt: string; active?: boolean }
export interface ProfessorSession { loggedIn: boolean; professorId: string; role: "master" | "professor"; avatar_url?: string | null; expiresAt: string }
export interface StudentSession { name: string; email: string; assessmentId: string; startedAt: string }
export interface StudentProfile { id: string; auth_user_id: string; name: string; cpf: string; enrollment_number: string; phone?: string; church?: string; pastor_name?: string; class_id?: string; avatar_url?: string | null; bio?: string | null; birth_date?: string; street?: string; number?: string; neighborhood?: string; city?: string; state?: string; status: "pending" | "active" | "inactive"; created_at: string; }
export interface ChatMessage { id: string; studentId: string; disciplineId: string; message: string; isFromStudent: boolean; read: boolean; createdAt: string; }
export interface Attendance { id: string; studentId: string; disciplineId: string; date: string; isPresent: boolean; type?: "presencial" | "ead"; createdAt: string; }
export interface BoardMember { id: string; name: string; role: string; category: string; avatar_url?: string | null; createdAt: string; }
export interface ProfessorDiscipline { id: string; professorId: string; disciplineId: string; createdAt: string; }
export interface ClassRoom { id: string; name: string; shift: "morning" | "afternoon" | "evening" | "ead" | "hibrido"; dayOfWeek?: string; maxStudents: number; studentCount?: number; createdAt: string; }
export interface ClassSchedule { id: string; classId: string; disciplineId: string; professorName: string; dayOfWeek: string; timeStart: string; timeEnd: string; lessonsCount: number; workload: number; startDate?: string; endDate?: string; createdAt: string; }
export interface StudentGrade {
  id: string;
  studentIdentifier: string; // CPF or Email
  studentName: string;
  disciplineId?: string;
  isPublic: boolean;
  examGrade: number;
  worksGrade: number;
  seminarGrade: number;
  participationBonus: number;
  attendanceScore: number;
  customDivisor: number;
  isReleased: boolean;
  createdAt: string;
}

export interface FinancialTransaction {
  id: string;
  category: string;
  type: "income" | "expense";
  description: string;
  amount: number;
  date: string;
  status: "planned" | "realized";
  competencia: string;
  disciplineId?: string;
  studentId?: string;
  createdAt: string;
}

export interface StudentTuition {
  id: string;
  studentId: string;
  disciplineId: string;
  amount: number;
  dueDate: string | null;
  status: "pending" | "paid" | "overdue";
  paidAt?: string;
  transactionId?: string;
  createdAt: string;
}

export function hashPassword(plain: string): string {
  if (typeof window !== "undefined") return btoa(unescape(encodeURIComponent(plain)))
  return Buffer.from(plain).toString("base64")
}
export function checkPassword(plain: string, hash: string): boolean { return hashPassword(plain) === hash }

const KEYS = {
  PROFESSOR_SESSION: "ibad_professor_session",
  STUDENT_SESSION: "ibad_current_session",
  DRAFT_ANSWERS: "ibad_draft_answers",
} as const

export const MASTER_CREDENTIALS = {
  email: "professor@ibad.com",
  password: "IBAD2026",
  name: "Corpo Docente",
  role: "master" as const,
}
export const PROFESSOR_CREDENTIALS = MASTER_CREDENTIALS

function readLocal<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch { return fallback }
}
function writeLocal<T>(key: string, value: T): void {
  if (typeof window === "undefined") return
  localStorage.setItem(key, JSON.stringify(value))
}

export function uid(): string {
  if (typeof window !== "undefined" && window.crypto?.randomUUID) {
    return window.crypto.randomUUID();
  }
  // Fallback for older environments/SSR
  return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (c: any) =>
    (c ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))).toString(16)
  );
}

// â€”â€”â€” Auth / Session â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”

export function getProfessorSession(): ProfessorSession | null {
  const s = readLocal<ProfessorSession | null>(KEYS.PROFESSOR_SESSION, null)
  if (!s?.loggedIn) return null
  if (new Date(s.expiresAt) < new Date()) { clearProfessorSession(); return null }
  return s
}
export function saveProfessorSession(professorId: string, role: "master" | "professor", avatar_url?: string | null): void {
  try {
    const expiresAt = new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString()
    writeLocal<ProfessorSession>(KEYS.PROFESSOR_SESSION, { loggedIn: true, professorId, role, avatar_url, expiresAt })
  } catch (err) {
    console.error("Erro ao salvar sessÃ£o do professor:", err)
  }
}
export function clearProfessorSession(): void {
  if (typeof window !== "undefined") localStorage.removeItem(KEYS.PROFESSOR_SESSION)
}

export async function registerStudentAuth(name: string, cpf: string, password: string) {
  const supabase = createClient()
  const cleanCpf = cpf.replace(/\D/g, '')
  const email = `${cleanCpf}@student.ibad.com`

  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name, type: 'student' } }
  })
  if (authError) throw new Error(authError.message)
  if (!authData.user) throw new Error("Erro ao criar usuÃ¡rio na base de dados.")

  const matricula = `2026${Math.floor(1000 + Math.random() * 9000)}`

  const { error: dbError } = await supabase.from('students').insert({
    auth_user_id: authData.user.id,
    name,
    cpf: cleanCpf,
    email,
    enrollment_number: matricula
  })

  if (dbError) throw new Error(dbError.message)
  return { matricula, name }
}

export async function registerStudentByAdmin(data: any): Promise<void> {
  const supabase = createClient()
  if (data.classId) {
    const { data: cls } = await supabase.from('classes').select('max_students').eq('id', data.classId).single()
    if (cls) {
      const { count } = await supabase.from('students').select('*', { count: 'exact', head: true }).eq('class_id', data.classId)
      if (count !== null && count >= cls.max_students) {
        throw new Error("Esta turma jÃ¡ estÃ¡ com as vagas esgotadas.")
      }
    }
  }

  const cleanCpf = data.cpf ? data.cpf.replace(/\D/g, '') : ""
  const email = data.email || `${cleanCpf || uid().slice(0, 11)}@student.ibad.com`
  const nameUC = (data.name || "").toUpperCase().trim()

  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password: data.password,
    options: { data: { name: nameUC, type: 'student' } }
  })
  if (authError) throw new Error(authError.message)
  if (!authData.user) throw new Error("Erro ao criar usuÃ¡rio na base de dados (Auth).")

  const matricula = `2026${Math.floor(1000 + Math.random() * 9000)}`

  const { error: dbError } = await supabase.from('students').insert({
    auth_user_id: authData.user.id,
    name: nameUC,
    cpf: cleanCpf,
    email,
    enrollment_number: matricula,
    phone: data.phone || null,
    church: data.church || null,
    pastor_name: data.pastor || null,
    birth_date: data.birth_date || null,
    street: data.street || null,
    number: data.number || null,
    neighborhood: data.neighborhood || null,
    city: data.city || null,
    state: data.state || null,
    status: 'active',
    class_id: data.classId || null
  })
  if (dbError) throw new Error(dbError.message)

  try {
    await triggerN8nWebhook('matricula_confirmada', {
      type: 'enrollment',
      name: data.name,
      phone: data.phone,
      matricula
    });
  } catch (err) {
    console.error("Erro ao disparar WhatsApp n8n de boas-vindas:", err);
  }
}

export async function loginStudentAuth(identifier: string, password: string) {
  const supabase = createClient()
  let email = ''
  const cleanPass = password.trim()

  if (identifier.includes('@')) {
    email = identifier.trim().toLowerCase()
    const { data: studentByEmail } = await supabase.from('students').select('email').eq('email', email).maybeSingle()
    if (studentByEmail) email = studentByEmail.email
  } else {
    const cleanId = identifier.replace(/\D/g, '')
    // Se for CPF (11 digitos)
    if (cleanId.length === 11) {
      const { data: studentData } = await supabase.from('students').select('email').eq('cpf', cleanId).maybeSingle()
      email = studentData?.email || `${cleanId}@student.ibad.com`
    } else {
      // Se for Matrícula (ex: 2026xxxx)
      const { data } = await supabase.from('students').select('email').eq('enrollment_number', cleanId).maybeSingle()
      if (!data) throw new Error("Identificador não encontrado (CPF, Matrícula ou E-mail). Verifique se digitou corretamente.")
      email = data.email
    }
  }

  const finalEmail = email.trim().toLowerCase()
  let { data, error } = await supabase.auth.signInWithPassword({ email: finalEmail, password: cleanPass })
  
  if (error) {
    // FALLBACK: Se falhou e a senha parece um CPF pontuado (14 chars), tenta limpar a senha e tentar de novo
    const digitsOnlyPass = cleanPass.replace(/\D/g, '')
    if (digitsOnlyPass !== cleanPass && digitsOnlyPass.length === 11) {
      console.log('[Auth] Tentando login com CPF limpo na senha...')
      const retry = await supabase.auth.signInWithPassword({ email: finalEmail, password: digitsOnlyPass })
      if (!retry.error) return retry.data
    }

    // FALLBACK 2: Tentativa com cashing do domínio (legado)
    if (finalEmail.endsWith('@student.ibad.com')) {
      const legacyEmail = finalEmail.replace('@student.ibad.com', '@student.IBAD.com')
      const { data: retryData, error: retryError } = await supabase.auth.signInWithPassword({ email: legacyEmail, password: cleanPass })
      if (!retryError) return retryData
      
      // Tenta também com senha limpa no legado
      if (digitsOnlyPass !== cleanPass && digitsOnlyPass.length === 11) {
        const retryLegacy = await supabase.auth.signInWithPassword({ email: legacyEmail, password: digitsOnlyPass })
        if (!retryLegacy.error) return retryLegacy.data
      }
    }

    throw new Error("Credenciais inválidas. Verifique seu CPF e senha (lembre-se: se usar o CPF como senha, tente apenas os números).")
  }

  if (data.user) {
    const { data: profile } = await supabase.from('students').select('id, auth_user_id').eq('email', finalEmail).maybeSingle()
    if (profile && !profile.auth_user_id) {
      await supabase.from('students').update({ auth_user_id: data.user.id }).eq('id', profile.id)
    }
  }
  return data
}

export async function getStudentProfileAuth(): Promise<StudentProfile | null> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.user_metadata?.type !== 'student') return null
  const { data } = await supabase.from('students').select('*').eq('auth_user_id', user.id).maybeSingle()
  return data ? (data as StudentProfile) : null
}

export async function logoutStudentAuth() {
  const supabase = createClient()
  await supabase.auth.signOut()
}

export function getStudentSession(): StudentSession | null { return readLocal<StudentSession | null>(KEYS.STUDENT_SESSION, null) }
export function saveStudentSession(s: StudentSession): void { writeLocal(KEYS.STUDENT_SESSION, s) }
export function clearStudentSession(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(KEYS.STUDENT_SESSION)
    localStorage.removeItem(KEYS.DRAFT_ANSWERS)
  }
}

export async function getActiveAssessment(): Promise<Assessment | null> {
  const supabase = createClient()
  const now = new Date().toISOString()
  const { data } = await supabase.from('assessments')
    .select('*')
    .eq('is_published', true)
    .lte('open_at', now)
    .gte('close_at', now)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  return data ? mapAssessment(data) : null
}

export async function hasStudentSubmitted(email: string, assessmentId: string): Promise<boolean> {
  const supabase = createClient()
  const { count } = await supabase.from('student_submissions')
    .select('*', { count: 'exact', head: true })
    .eq('student_email', email)
    .eq('assessment_id', assessmentId)
  return (count || 0) > 0
}

export function getDraftAnswers(): StudentAnswer[] { return readLocal<StudentAnswer[]>(KEYS.DRAFT_ANSWERS, []) }
export function saveDraftAnswers(answers: StudentAnswer[]): void { writeLocal(KEYS.DRAFT_ANSWERS, answers) }

// â€”â€”â€” DB Mappers â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”
function mapSemester(row: any): Semester { return { id: row.id, name: row.name, order: row.order, shift: row.shift || undefined, is_completed: row.is_completed || false, createdAt: row.created_at } }
function mapStudyMaterial(row: any): StudyMaterial { return { id: row.id, disciplineId: row.discipline_id, title: row.title, description: row.description || undefined, fileUrl: row.file_url, createdAt: row.created_at } }
function mapDiscipline(row: any): Discipline { 
  return { 
    id: row.id, 
    name: row.name, 
    description: row.description || undefined, 
    semesterId: row.semester_id || undefined, 
    professorName: row.professor_name || undefined, 
    dayOfWeek: row.day_of_week || undefined, 
    shift: row.shift || undefined, 
    order: Number(row.order || 0), 
    is_realized: !!row.is_realized,
    createdAt: row.created_at 
  } 
}
function mapQuestion(row: any): Question {
  const choices = Array.isArray(row.choices) ? row.choices : (row.choices?.options || [])
  const pairs = row.pairs || row.choices?.matchingPairs || undefined
  return { id: row.id, disciplineId: row.discipline_id, type: row.type, text: row.text, choices, pairs, correctAnswer: row.correct_answer, points: row.points, createdAt: row.created_at }
}
function mapAssessment(row: any): Assessment {
  const modality = (row.modality || "public") as string
  const isArchived = !!row.archived || modality.includes("_archived")
  const cleanModality = modality.replace("_archived", "") as "public" | "private"
  return {
    id: row.id,
    title: row.title,
    disciplineId: row.discipline_id,
    professor: row.professor,
    institution: row.institution,
    questionIds: row.question_ids,
    pointsPerQuestion: row.points_per_question,
    totalPoints: row.total_points,
    openAt: row.open_at,
    closeAt: row.close_at,
    isPublished: row.is_published,
    archived: isArchived,
    shuffleVariants: row.shuffle_variants,
    timeLimitMinutes: row.time_limit_minutes,
    logoBase64: row.logo_base64,
    rules: row.rules,
    releaseResults: row.release_results,
    modality: cleanModality,
    createdAt: row.created_at
  }
}
function mapSubmission(row: any): StudentSubmission { return { id: row.id, assessmentId: row.assessment_id, studentName: row.student_name, studentEmail: row.student_email, answers: row.answers, score: row.score, totalPoints: row.total_points, percentage: row.percentage, submittedAt: row.submitted_at, timeElapsedSeconds: row.time_elapsed_seconds, focusLostCount: row.focus_lost_count || 0 } }
function mapProfessor(p: any): ProfessorAccount {
  if (!p) return { id: "unknown", name: "Professor", email: "", passwordHash: "", role: "professor", createdAt: new Date().toISOString(), active: false }
  return { id: p.id || "unknown", name: p.name || "Professor", email: p.email || "", passwordHash: p.password_hash || "", role: p.role || "professor", avatar_url: p.avatar_url, bio: p.bio || null, createdAt: p.created_at || new Date().toISOString(), active: p.active !== false }
}
function mapGradingSettings(row: any): GradingSettings { return { id: row.id, pointsPerPresence: Number(row.points_per_presence || 0), onlinePresencePoints: Number(row.online_presence_points || 0), interactionPoints: Number(row.interaction_points || 0), bookActivityPoints: Number(row.book_activity_points || 0), passingAverage: Number(row.passing_average || 70), totalDivisor: Number(row.total_divisor || 4), updatedAt: row.updated_at } }
function mapStudentProfile(row: any): StudentProfile { return { id: row.id, auth_user_id: row.auth_user_id, name: row.name, cpf: row.cpf, enrollment_number: row.enrollment_number, phone: row.phone || undefined, church: row.church || undefined, pastor_name: row.pastor_name || undefined, class_id: row.class_id || undefined, avatar_url: row.avatar_url || null, bio: row.bio || null, birth_date: row.birth_date, street: row.street, number: row.number, neighborhood: row.neighborhood, city: row.city, state: row.state, status: row.status || 'pending', created_at: row.created_at } }
function mapChatMessage(row: any): ChatMessage { return { id: row.id, studentId: row.student_id, disciplineId: row.discipline_id, message: row.message, isFromStudent: row.is_from_student, read: row.read, createdAt: row.created_at } }
function mapAttendance(row: any): Attendance { return { id: row.id, studentId: row.student_id, disciplineId: row.discipline_id, date: row.date, isPresent: row.is_present, type: row.type || "presencial", createdAt: row.created_at } }
function mapClassRoom(row: any): ClassRoom { return { id: row.id, name: row.name, shift: row.shift as ClassRoom['shift'], dayOfWeek: row.day_of_week || undefined, maxStudents: Number(row.max_students), studentCount: row.student_count !== undefined ? Number(row.student_count) : undefined, createdAt: row.created_at } }
function mapClassSchedule(row: any): ClassSchedule { return { id: row.id, classId: row.class_id, disciplineId: row.discipline_id, professorName: row.professor_name, dayOfWeek: row.day_of_week, timeStart: row.time_start, timeEnd: row.time_end, lessonsCount: Number(row.lessons_count || 1), workload: Number(row.workload || 0), startDate: row.start_date || undefined, endDate: row.end_date || undefined, createdAt: row.created_at } }
function mapStudentGrade(row: any): StudentGrade { return { id: row.id, studentIdentifier: row.student_identifier, studentName: row.student_name, disciplineId: row.discipline_id || undefined, isPublic: row.is_public, examGrade: Number(row.exam_grade), worksGrade: Number(row.works_grade), seminarGrade: Number(row.seminar_grade), participationBonus: Number(row.participation_bonus), attendanceScore: Number(row.attendance_score), customDivisor: Number(row.custom_divisor), isReleased: !!row.is_released, createdAt: row.created_at } }
function mapBoardMember(row: any): BoardMember { return { id: row.id, name: row.name, role: row.role, category: row.category, avatar_url: row.avatar_url, createdAt: row.created_at } }
function mapProfessorDiscipline(row: any): ProfessorDiscipline { return { id: row.id, professorId: row.professor_id, disciplineId: row.discipline_id, createdAt: row.created_at } }
function mapFinancialTransaction(row: any): FinancialTransaction {
  return { id: row.id, category: row.category, type: row.type, description: row.description, amount: Number(row.amount), date: row.date, status: row.status, competencia: row.competencia, disciplineId: row.discipline_id, studentId: row.student_id, createdAt: row.created_at }
}
function mapStudentTuition(row: any): StudentTuition {
  return { id: row.id, studentId: row.student_id, disciplineId: row.discipline_id, amount: Number(row.amount), dueDate: row.due_date, status: row.status, paidAt: row.paid_at, transactionId: row.transaction_id, createdAt: row.created_at }
}

// â€”â€”â€” Core Functions â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”

export async function getGradingSettings(): Promise<GradingSettings> {
  const supabase = createClient()
  const { data } = await supabase.from('grading_settings').select('*').limit(1).maybeSingle()
  if (data) return mapGradingSettings(data)
  return { id: 'default', pointsPerPresence: 10, onlinePresencePoints: 10, interactionPoints: 10, bookActivityPoints: 10, passingAverage: 70, totalDivisor: 4, updatedAt: new Date().toISOString() }
}

export async function updateGradingSettings(settings: Omit<GradingSettings, "id" | "updatedAt">): Promise<void> {
  const supabase = createClient()
  const updateData = { points_per_presence: settings.pointsPerPresence, online_presence_points: settings.onlinePresencePoints, interaction_points: settings.interactionPoints, book_activity_points: settings.bookActivityPoints, passing_average: settings.passingAverage, total_divisor: settings.totalDivisor, updated_at: new Date().toISOString() }
  const { data: existing } = await supabase.from('grading_settings').select('id').limit(1).maybeSingle()
  if (existing) await supabase.from('grading_settings').update(updateData).eq('id', existing.id)
  else await supabase.from('grading_settings').insert({ id: uid(), ...updateData })
}

export async function getClasses(): Promise<ClassRoom[]> {
  const supabase = createClient()
  const { data: classes } = await supabase.from('classes').select('*').order('created_at', { ascending: false })
  const { data: counts } = await supabase.from('students').select('class_id')
  const studentCounts: Record<string, number> = {}
  counts?.forEach((s: { class_id: string | null }) => { if (s.class_id) studentCounts[s.class_id || ''] = (studentCounts[s.class_id || ''] || 0) + 1 })
  return (classes || []).map((c: any) => ({ ...mapClassRoom(c), studentCount: studentCounts[c.id] || 0 }))
}

export async function addClass(cls: Omit<ClassRoom, 'id' | 'createdAt' | 'studentCount'>): Promise<ClassRoom> {
  const supabase = createClient()
  const { data, error } = await supabase.from('classes').insert({ name: cls.name, shift: cls.shift, day_of_week: cls.dayOfWeek || null, max_students: cls.maxStudents }).select().single()
  if (error) throw error
  return mapClassRoom(data)
}

export async function updateClass(id: string, cls: Partial<Omit<ClassRoom, 'id' | 'createdAt'>>): Promise<void> {
  const supabase = createClient()
  const dbData: any = {}
  if (cls.name !== undefined) dbData.name = cls.name
  if (cls.shift !== undefined) dbData.shift = cls.shift
  if (cls.maxStudents !== undefined) dbData.max_students = cls.maxStudents
  if (cls.dayOfWeek !== undefined) dbData.day_of_week = cls.dayOfWeek || null
  await supabase.from('classes').update(dbData).eq('id', id)
}

export async function deleteClass(id: string): Promise<void> {
  const supabase = createClient()
  await supabase.from('classes').delete().eq('id', id)
}

export async function getSemesters(): Promise<Semester[]> {
  const supabase = createClient()
  const { data } = await supabase.from('semesters').select('*').order('order', { ascending: true })
  return (data || []).map(mapSemester)
}

export async function addSemester(name: string, order: number, shift?: string): Promise<Semester> {
  const s = { name, order, shift: shift || null, created_at: new Date().toISOString() }
  const supabase = createClient()
  const { data, error } = await supabase.from('semesters').insert(s).select().single()
  if (error) throw new Error(error.message)
  return mapSemester(data)
}

export async function updateSemester(id: string, data: Partial<Pick<Semester, "name" | "order" | "shift" | "is_completed">>): Promise<void> {
  const supabase = createClient()
  const updatePayload: any = {}
  if (data.name !== undefined) updatePayload.name = data.name
  if (data.order !== undefined) updatePayload.order = data.order
  if (data.shift !== undefined) updatePayload.shift = data.shift || null
  if (data.is_completed !== undefined) updatePayload.is_completed = data.is_completed
  await supabase.from('semesters').update(updatePayload).eq('id', id)
}

export async function deleteSemester(id: string): Promise<void> {
  const supabase = createClient()
  await supabase.from('semesters').delete().eq('id', id)
}

export async function getDisciplines(): Promise<Discipline[]> {
  const supabase = createClient()
  const { data } = await supabase.from('disciplines').select('*').order('order', { ascending: true })
  return (data || []).map(mapDiscipline).sort((a: Discipline, b: Discipline) => a.order !== b.order ? a.order - b.order : a.name.localeCompare(b.name))
}

export async function getDisciplinesByProfessor(professorId: string): Promise<Discipline[]> {
  const supabase = createClient()
  const { data: links } = await supabase.from('professor_disciplines').select('discipline_id').eq('professor_id', professorId)
  if (!links || links.length === 0) return []
  const ids = links.map((l: { discipline_id: string }) => l.discipline_id)
  const { data } = await supabase.from('disciplines').select('*').in('id', ids)
  return (data || []).map(mapDiscipline).sort((a: Discipline, b: Discipline) => a.name.localeCompare(b.name))
}

export async function linkProfessorToDiscipline(professorId: string, disciplineId: string): Promise<void> {
  const supabase = createClient()
  await supabase.from('professor_disciplines').upsert({ professor_id: professorId, discipline_id: disciplineId }, { onConflict: 'professor_id,discipline_id' })
}

export async function unlinkProfessorFromDiscipline(professorId: string, disciplineId: string): Promise<void> {
  const supabase = createClient()
  await supabase.from('professor_disciplines').delete().match({ professor_id: professorId, discipline_id: disciplineId })
}

export async function getBoardMembers(): Promise<BoardMember[]> {
  const supabase = createClient()
  const { data } = await supabase.from('board_members').select('*').order('category', { ascending: false })
  return (data || []).map(mapBoardMember)
}

export async function addDiscipline(name: string, description?: string | null, semesterId?: string | null, professorName?: string | null, dayOfWeek?: string | null, shift?: string | null, order?: number): Promise<Discipline> {
  const d = { id: uid(), name, description: description || null, semester_id: semesterId || null, professor_name: professorName || null, day_of_week: dayOfWeek || null, shift: shift || null, "order": order || 0, created_at: new Date().toISOString() }
  const supabase = createClient()
  await supabase.from('disciplines').insert(d)
  return mapDiscipline(d)
}

export async function updateDiscipline(id: string, data: Partial<Pick<Discipline, "name" | "description" | "semesterId" | "professorName" | "dayOfWeek" | "shift" | "order" | "is_realized">>): Promise<void> {
  const updateData: any = {}
  if (data.name !== undefined) updateData.name = data.name
  if (data.description !== undefined) updateData.description = data.description || null
  if (data.semesterId !== undefined) updateData.semester_id = data.semesterId || null
  if (data.professorName !== undefined) updateData.professor_name = data.professorName || null
  if (data.dayOfWeek !== undefined) updateData.day_of_week = data.dayOfWeek || null
  if (data.shift !== undefined) updateData.shift = data.shift || null
  if (data.order !== undefined) updateData.order = data.order
  if (data.is_realized !== undefined) updateData.is_realized = data.is_realized
  const supabase = createClient()
  await supabase.from('disciplines').update(updateData).eq('id', id)
}

export async function deleteDiscipline(id: string): Promise<void> {
  const supabase = createClient()
  const { data: assessments } = await supabase.from('assessments').select('id').eq('discipline_id', id)
  if (assessments && assessments.length > 0) {
    const assessmentIds = assessments.map((a: { id: string }) => a.id)
    await supabase.from('student_submissions').delete().in('assessment_id', assessmentIds)
  }
  await supabase.from('questions').delete().eq('discipline_id', id)
  await supabase.from('study_materials').delete().eq('discipline_id', id)
  await supabase.from('chats').delete().eq('discipline_id', id)
  await supabase.from('attendances').delete().eq('discipline_id', id)
  await supabase.from('student_grades').delete().eq('discipline_id', id)
  await supabase.from('class_schedules').delete().eq('discipline_id', id)
  await supabase.from('professor_disciplines').delete().eq('discipline_id', id)
  await supabase.from('assessments').delete().eq('discipline_id', id)
  const { error } = await supabase.from('disciplines').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

export async function getStudyMaterials(disciplineId?: string): Promise<StudyMaterial[]> {
  const supabase = createClient()
  let query = supabase.from('study_materials').select('*').order('created_at', { ascending: false })
  if (disciplineId) query = query.eq('discipline_id', disciplineId)
  const { data } = await query
  return (data || []).map(mapStudyMaterial)
}

export async function addStudyMaterial(material: Omit<StudyMaterial, "id" | "createdAt">): Promise<StudyMaterial> {
  const supabase = createClient()
  const dbData = { discipline_id: material.disciplineId, title: material.title, description: material.description, file_url: material.fileUrl, created_at: new Date().toISOString() }
  const { data, error } = await supabase.from('study_materials').insert(dbData).select().single()
  if (error) throw new Error(error.message)
  return mapStudyMaterial(data)
}

export async function deleteStudyMaterial(id: string): Promise<void> {
  const supabase = createClient()
  await supabase.from('study_materials').delete().eq('id', id)
}

export async function getQuestions(): Promise<Question[]> {
  const supabase = createClient()
  const { data } = await supabase.from('questions').select('*')
  return (data || []).map(mapQuestion)
}

export async function getQuestionsByDiscipline(disciplineId: string): Promise<Question[]> {
  const supabase = createClient()
  const { data } = await supabase.from('questions').select('*').eq('discipline_id', disciplineId)
  return (data || []).map(mapQuestion)
}

export async function getDisciplineQuestionCounts(): Promise<Record<string, number>> {
  const supabase = createClient()
  const { data } = await supabase.from('questions').select('discipline_id')
  const counts: Record<string, number> = {}
  data?.forEach((q: { discipline_id: string | null }) => { if (q.discipline_id) counts[q.discipline_id] = (counts[q.discipline_id] || 0) + 1 })
  return counts
}

export const getPublicClasses = getClasses

export async function addQuestion(data: Omit<Question, "id" | "createdAt">): Promise<Question> {
  const supabase = createClient()
  const q: any = { discipline_id: data.disciplineId, type: data.type, text: data.text, choices: data.choices, correct_answer: data.correctAnswer, points: data.points, created_at: new Date().toISOString() }
  if (data.pairs && data.pairs.length > 0) q.choices = { options: data.choices || [], matchingPairs: data.pairs }
  const { error } = await supabase.from('questions').insert(q)
  if (error) throw new Error(`Erro ao salvar questÃ£o: ${error.message}`)
  return mapQuestion(q)
}

export async function updateQuestion(id: string, data: Partial<Omit<Question, "id" | "createdAt">>): Promise<void> {
  const supabase = createClient()
  const val: any = {}
  if (data.disciplineId !== undefined) val.discipline_id = data.disciplineId
  if (data.type !== undefined) val.type = data.type
  if (data.text !== undefined) val.text = data.text
  if (data.points !== undefined) val.points = data.points
  if (data.correctAnswer !== undefined) val.correct_answer = data.correctAnswer
  if (data.choices !== undefined || data.pairs !== undefined) {
    if (data.pairs && data.pairs.length > 0) val.choices = { options: data.choices || [], matchingPairs: data.pairs }
    else val.choices = data.choices
  }
  await supabase.from('questions').update(val).eq('id', id)
}

export async function deleteQuestion(id: string): Promise<void> {
  const supabase = createClient()
  await supabase.from('questions').delete().eq('id', id)
}

export async function getAssessments(): Promise<Assessment[]> {
  const supabase = createClient()
  const { data } = await supabase.from('assessments').select('*').order('created_at', { ascending: false })
  return (data || []).map(mapAssessment)
}

export async function getAssessmentById(id: string): Promise<Assessment | null> {
  const supabase = createClient()
  const { data } = await supabase.from('assessments').select('*').eq('id', id).single()
  return data ? mapAssessment(data) : null
}

export async function addAssessment(data: Omit<Assessment, "id" | "createdAt" | "releaseResults" | "archived">): Promise<Assessment> {
  const a = { ...data, id: uid(), createdAt: new Date().toISOString(), releaseResults: false, archived: false }
  const dbData = { id: a.id, title: a.title, discipline_id: a.disciplineId, professor: a.professor, institution: a.institution, question_ids: a.questionIds, points_per_question: a.pointsPerQuestion, total_points: a.totalPoints, open_at: a.openAt, close_at: a.closeAt, is_published: a.isPublished, shuffle_variants: a.shuffleVariants, time_limit_minutes: a.timeLimitMinutes, logo_base64: a.logoBase64, rules: a.rules, release_results: a.releaseResults, modality: a.modality ?? "public", created_at: a.createdAt }
  const supabase = createClient()
  const { error } = await supabase.from('assessments').insert(dbData)
  if (error) throw new Error(error.message)
  return a
}

export async function updateAssessment(id: string, data: Partial<Omit<Assessment, "id" | "createdAt">>): Promise<void> {
  const supabase = createClient()
  const dbData: any = {}
  if (data.title !== undefined) dbData.title = data.title
  if (data.disciplineId !== undefined) dbData.discipline_id = data.disciplineId
  if (data.professor !== undefined) dbData.professor = data.professor
  if (data.institution !== undefined) dbData.institution = data.institution
  if (data.questionIds !== undefined) dbData.question_ids = data.questionIds
  if (data.pointsPerQuestion !== undefined) dbData.points_per_question = data.pointsPerQuestion
  if (data.totalPoints !== undefined) dbData.total_points = data.totalPoints
  if (data.openAt !== undefined) dbData.open_at = data.openAt
  if (data.closeAt !== undefined) dbData.close_at = data.closeAt
  if (data.isPublished !== undefined) dbData.is_published = data.isPublished
  if (data.shuffleVariants !== undefined) dbData.shuffle_variants = data.shuffleVariants
  if (data.timeLimitMinutes !== undefined) dbData.time_limit_minutes = data.timeLimitMinutes
  if (data.logoBase64 !== undefined) dbData.logo_base64 = data.logoBase64
  if (data.rules !== undefined) dbData.rules = data.rules
  if (data.releaseResults !== undefined) dbData.release_results = data.releaseResults
  if (data.modality !== undefined) dbData.modality = data.modality
  if (data.archived !== undefined) dbData.archived = data.archived
  await supabase.from('assessments').update(dbData).eq('id', id)
}

export async function deleteAssessment(id: string): Promise<void> {
  const supabase = createClient()
  await supabase.from('assessments').delete().eq('id', id)
}

export async function getSubmissions(): Promise<StudentSubmission[]> {
  const supabase = createClient()
  const { data } = await supabase.from('student_submissions').select('*')
  return (data || []).map(mapSubmission)
}

export async function saveSubmission(sub: StudentSubmission): Promise<StudentSubmission> {
  const supabase = createClient()
  const record = { id: sub.id, assessment_id: sub.assessmentId, student_name: sub.studentName, student_email: sub.studentEmail, answers: sub.answers, score: sub.score, total_points: sub.totalPoints, percentage: sub.percentage, submitted_at: sub.submittedAt, time_elapsed_seconds: sub.timeElapsedSeconds, focus_lost_count: sub.focusLostCount || 0 }
  const { data, error } = await supabase.from('student_submissions').insert(record).select().single()
  if (error) throw new Error(error.message)
  return mapSubmission(data)
}

export async function getSubmissionByEmailAndAssessment(email: string, assessmentId: string): Promise<StudentSubmission | null> {
  const supabase = createClient()
  const { data } = await supabase.from('student_submissions').select('*').eq('student_email', email.trim().toLowerCase()).eq('assessment_id', assessmentId).maybeSingle()
  return data ? mapSubmission(data) : null
}

export async function getSubmissionsByAssessment(assessmentId: string): Promise<StudentSubmission[]> {
  const supabase = createClient()
  const { data } = await supabase.from('student_submissions').select('*').eq('assessment_id', assessmentId)
  return (data || []).map(mapSubmission)
}

export async function deleteSubmission(id: string): Promise<void> {
  const supabase = createClient()
  await supabase.from('student_submissions').delete().eq('id', id)
}

export async function updateSubmissionScore(id: string, score: number, percentage: number): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('student_submissions').update({ score, percentage }).eq('id', id)
  if (error) throw new Error(error.message)
}

export function calculateScore(answers: StudentAnswer[], questions: Question[], pointsPerQuestion: number = 1): { score: number; totalPoints: number; percentage: number } {
  const gradable = questions.filter((q) => q.type !== "discursive")
  let totalPoints = 0
  let score = 0
  for (const q of gradable) {
    const pts = (q.points !== undefined && q.points > 0) ? q.points : pointsPerQuestion
    totalPoints += pts
    const ans = answers.find((a) => a.questionId === q.id)
    if (ans && ans.answer === q.correctAnswer) score += pts
  }
  const percentage = totalPoints > 0 ? Math.round((score / totalPoints) * 100) : 0
  return { score, totalPoints, percentage }
}

export async function getProfessorAccounts(): Promise<ProfessorAccount[]> {
  const supabase = createClient()
  const { data, error } = await supabase.from('professor_accounts').select('*')
  if (error) throw new Error(error.message)
  return (data || []).map(mapProfessor)
}

export async function getProfessorDisciplines(professorId: string): Promise<ProfessorDiscipline[]> {
  const supabase = createClient()
  const { data, error } = await supabase.from('professor_disciplines').select('*').eq('professor_id', professorId)
  if (error) throw new Error(error.message)
  return (data || []).map(mapProfessorDiscipline)
}

export async function getAllProfessorDisciplines(): Promise<ProfessorDiscipline[]> {
  const supabase = createClient()
  const { data, error } = await supabase.from('professor_disciplines').select('*')
  if (error) throw new Error(error.message)
  return (data || []).map(mapProfessorDiscipline)
}

export async function addProfessorAccount(data: Omit<ProfessorAccount, "id" | "createdAt" | "passwordHash"> & { password: string; id?: string }): Promise<ProfessorAccount> {
  const nameUC = (data.name || "").toUpperCase().trim()
  const account = { 
    id: data.id || uid(), 
    name: nameUC, 
    email: data.email.toLowerCase().trim(), 
    password_hash: hashPassword(data.password), 
    role: data.role, 
    created_at: new Date().toISOString(),
    active: true
  }
  const supabase = createClient()
  const { error } = await supabase.from('professor_accounts').insert(account)
  
  if (error) {
    console.error("DB Error adding professor:", error)
    throw new Error(`Erro ao salvar no banco de dados: ${error.message}`)
  }
  
  return mapProfessor(account)
}

export async function getProfessorByEmail(email: string): Promise<ProfessorAccount | null> {
  const supabase = createClient()
  const { data, error } = await supabase.from('professor_accounts').select('*').eq('email', email.toLowerCase().trim()).maybeSingle()
  if (error && error.code !== 'PGRST116') throw new Error(error.message)
  if (!data && email === MASTER_CREDENTIALS.email) return { id: 'master', name: 'Administrador Master', email: MASTER_CREDENTIALS.email, role: 'master', active: true, avatar_url: null, passwordHash: '', createdAt: new Date().toISOString() }
  return data ? mapProfessor(data) : null
}

export async function ensureProfessorSync(email: string, authId: string): Promise<void> {
  const supabase = createClient()
  const { data: existing } = await supabase.from('professor_accounts').select('id').eq('email', email.toLowerCase().trim()).maybeSingle()
  if (!existing) {
    const name = email.split('@')[0].toUpperCase()
    await supabase.from('professor_accounts').insert({
      id: authId,
      email: email.toLowerCase().trim(),
      name,
      role: 'professor',
      active: true,
      created_at: new Date().toISOString()
    })
  }
}

export async function updateProfessorAccount(id: string, data: Partial<Omit<ProfessorAccount, 'id' | 'createdAt'>> & { password?: string }): Promise<ProfessorAccount | null> {
  const supabase = createClient()
  const updateData: any = {}
  if (data.name !== undefined) updateData.name = data.name.toUpperCase().trim()
  if (data.email !== undefined) updateData.email = data.email.toLowerCase().trim()
  if (data.role !== undefined) updateData.role = data.role
  if (data.bio !== undefined) updateData.bio = data.bio || null
  if (data.active !== undefined) updateData.active = data.active
  if (data.password) updateData.password_hash = hashPassword(data.password)
  
  const { data: updated } = await supabase.from('professor_accounts').update(updateData).eq('id', id).select().maybeSingle()
  return updated ? mapProfessor(updated) : null
}

export async function deleteProfessorAccount(id: string): Promise<void> {
  const supabase = createClient()
  await supabase.from('professor_accounts').delete().eq('id', id)
}

export async function getStudentProfile(id: string): Promise<StudentProfile | null> {
  const supabase = createClient()
  const { data } = await supabase.from('students').select('*').eq('id', id).maybeSingle()
  return data ? mapStudentProfile(data) : null
}

export async function getStudents(): Promise<StudentProfile[]> {
  const supabase = createClient()
  const { data } = await supabase.from('students').select('*').order('name', { ascending: true })
  return (data || []).map(mapStudentProfile)
}

export async function updateStudent(id: string, data: any): Promise<void> {
  const supabase = createClient()
  const updateData: any = {}
  if (data.name !== undefined) updateData.name = data.name.toUpperCase().trim()
  if (data.cpf !== undefined) updateData.cpf = data.cpf.replace(/\D/g, '')
  if (data.phone !== undefined) updateData.phone = data.phone || null
  if (data.church !== undefined) updateData.church = data.church || null
  if (data.pastor_name !== undefined) updateData.pastor_name = data.pastor_name || null
  if (data.class_id !== undefined) updateData.class_id = data.class_id || null
  if (data.birth_date !== undefined) updateData.birth_date = data.birth_date || null
  if (data.street !== undefined) updateData.street = data.street || null
  if (data.number !== undefined) updateData.number = data.number || null
  if (data.neighborhood !== undefined) updateData.neighborhood = data.neighborhood || null
  if (data.city !== undefined) updateData.city = data.city || null
  if (data.state !== undefined) updateData.state = data.state || null
  if (data.status !== undefined) updateData.status = data.status
  const { error } = await supabase.from('students').update(updateData).eq('id', id)
  if (error) throw new Error(error.message)
}

export async function deleteStudent(id: string): Promise<void> {
  const supabase = createClient()
  await supabase.from('students').delete().eq('id', id)
}

export async function getChatMessages(disciplineId: string, studentId: string): Promise<ChatMessage[]> {
  const supabase = createClient()
  const { data } = await supabase.from('chats').select('*').match({ discipline_id: disciplineId, student_id: studentId }).order('created_at', { ascending: true })
  return (data || []).map(mapChatMessage)
}

export async function sendChatMessage(studentId: string, disciplineId: string, message: string, isFromStudent: boolean): Promise<ChatMessage> {
  const supabase = createClient()
  const dbData = { student_id: studentId, discipline_id: disciplineId, message, is_from_student: isFromStudent, read: false, created_at: new Date().toISOString() }
  const { data, error } = await supabase.from('chats').insert(dbData).select().single()
  if (error) throw new Error(error.message)
  return mapChatMessage(data)
}

export async function markChatAsRead(studentId: string, disciplineId: string): Promise<void> {
  const supabase = createClient()
  await supabase.from('chats')
    .update({ read: true })
    .match({ student_id: studentId, discipline_id: disciplineId, is_from_student: true, read: false })
}

export async function getAttendances(disciplineId: string): Promise<Attendance[]> {
  const supabase = createClient()
  const { data } = await supabase.from('attendance').select('*').eq('discipline_id', disciplineId).order('date', { ascending: false })
  return (data || []).map(mapAttendance)
}

export async function saveAttendance(studentId: string, disciplineId: string, date: string, isPresent: boolean, type: "presencial" | "ead" = "presencial"): Promise<void> {
  const supabase = createClient()
  const { data: existing } = await supabase.from('attendance').select('id').match({ student_id: studentId, discipline_id: disciplineId, date }).maybeSingle()
  if (existing) await supabase.from('attendance').update({ is_present: isPresent, type }).eq('id', existing.id)
  else await supabase.from('attendance').insert({ student_id: studentId, discipline_id: disciplineId, date, is_present: isPresent, type, created_at: new Date().toISOString() })
}

export async function saveBatchAttendances(data: Array<{studentId: string, disciplineId: string, date: string, isPresent: boolean, type: "presencial"|"ead"}>, onProgress?: (current: number, total: number) => void): Promise<void> {
  if (data.length === 0) return
  
  // Check if finalized
  try {
    const isFinalized = await getAttendanceFinalization(data[0].disciplineId, data[0].date)
    if (isFinalized) {
      const session = getProfessorSession()
      if (session?.role !== 'master') {
        throw new Error("Esta chamada está trancada e não pode ser modificada.")
      }
    }
  } catch (e: any) {
    if (e.message?.includes("trancada")) throw e
  }

  let count = 0
  for (const a of data) {
    await saveAttendance(a.studentId, a.disciplineId, a.date, a.isPresent, a.type)
    count++
    if (onProgress) onProgress(count, data.length)
  }
}

export async function getAttendanceFinalization(disciplineId: string, date: string): Promise<boolean> {
  try {
    const supabase = createClient()
    const { data, error } = await supabase.from('attendance_finalizations')
      .select('id')
      .match({ discipline_id: disciplineId, date })
      .maybeSingle()
    
    // ERROR CODE PGRST204 or 404 indicates table might not be in cache
    if (error) {
       console.error("Supabase error in getAttendanceFinalization:", error)
       return false 
    }
    return !!data
  } catch (err) {
    return false
  }
}

export async function getAttendancesByDate(disciplineId: string, date: string): Promise<Attendance[]> {
  try {
    const supabase = createClient()
    const { data, error } = await supabase.from('attendances')
      .select('*')
      .match({ discipline_id: disciplineId, date })
    
    if (error) {
      console.error("Erro ao buscar presenças por data:", error)
      return []
    }
    
    return (data || []).map(mapAttendance)
  } catch (err) {
    console.error("Erro crítico em getAttendancesByDate:", err)
    return []
  }
}


export async function finalizeAttendance(disciplineId: string, date: string, finalizedBy: string): Promise<void> {
  try {
    const supabase = createClient()
    
    let finalizedByValue = finalizedBy;

    // Validate if finalizedBy is a valid UUID. 
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    
    if (!uuidRegex.test(finalizedBy)) {
        // If it's "master" or something else, try to find a real ID from professor_accounts
        const { data: prof } = await supabase.from('professor_accounts')
            .select('id')
            .eq('role', 'master')
            .limit(1)
            .maybeSingle();
            
        finalizedByValue = prof?.id || "00000000-0000-0000-0000-000000000000";
    }

    const { error } = await supabase.from('attendance_finalizations').insert({
      discipline_id: disciplineId,
      date,
      finalized_by: finalizedByValue,
      created_at: new Date().toISOString()
    })

    if (error) {
        console.error("Supabase Error (Finalize):", error);
        
        if (error.message?.includes("security policy")) {
            const err: any = new Error("RLS_ERROR")
            err.cause = error.message
            throw err
        }

        if (error.message?.includes("not found")) {
            throw new Error("O mecanismo de trancamento ainda não foi ativado no seu banco de dados. Por favor, execute o script SQL fornecido.")
        }
        throw new Error(error.message)
    }

    // Auto-sync grades after finalization
    await syncGradesForDiscipline(disciplineId)
  } catch (err: any) {
    throw err
  }
}

export async function unfinalizeAttendance(disciplineId: string, date: string): Promise<void> {
  try {
    const supabase = createClient()
    const { error } = await supabase.from('attendance_finalizations')
      .delete()
      .match({ discipline_id: disciplineId, date })
    if (error) {
        if (error.message?.includes("not found")) {
            return // Ignore if table doesn't exist, as it's definitely not finalized
        }
        throw new Error(error.message)
    }
    
    // Auto-sync grades after unfinalization (to reflect changes if any)
    const { data: remains } = await supabase.from('attendance_finalizations').select('discipline_id').eq('discipline_id', disciplineId).limit(1)
    if (remains) {
        await syncGradesForDiscipline(disciplineId)
    }
  } catch (err) {
    // Ignore errors for unfinalizing
  }
}



export async function getClassSchedules(): Promise<ClassSchedule[]> {
  const supabase = createClient()
  const { data } = await supabase.from('class_schedules').select('*')
  return (data || []).map(mapClassSchedule)
}

export async function addClassSchedule(data: Pick<ClassSchedule, 'classId' | 'disciplineId' | 'professorName' | 'dayOfWeek' | 'timeStart' | 'timeEnd' | 'lessonsCount' | 'workload' | 'startDate' | 'endDate'>): Promise<ClassSchedule> {
  const supabase = createClient()
  const dbData = { class_id: data.classId, discipline_id: data.disciplineId, professor_name: data.professorName, day_of_week: data.dayOfWeek, time_start: data.timeStart, time_end: data.timeEnd, lessons_count: data.lessonsCount, workload: data.workload, start_date: data.startDate || null, end_date: data.endDate || null, created_at: new Date().toISOString() }
  const { data: result, error } = await supabase.from('class_schedules').insert(dbData).select().single()
  if (error) throw new Error(error.message)
  return mapClassSchedule(result)
}

export async function updateClassSchedule(id: string, data: Partial<Pick<ClassSchedule, 'classId' | 'disciplineId' | 'professorName' | 'dayOfWeek' | 'timeStart' | 'timeEnd' | 'lessonsCount' | 'workload' | 'startDate' | 'endDate'>>): Promise<void> {
  const supabase = createClient()
  const dbData: any = {}
  if (data.classId !== undefined) dbData.class_id = data.classId
  if (data.disciplineId !== undefined) dbData.discipline_id = data.disciplineId
  if (data.professorName !== undefined) dbData.professor_name = data.professorName
  if (data.dayOfWeek !== undefined) dbData.day_of_week = data.dayOfWeek
  if (data.timeStart !== undefined) dbData.time_start = data.timeStart
  if (data.timeEnd !== undefined) dbData.time_end = data.timeEnd
  if (data.lessonsCount !== undefined) dbData.lessons_count = data.lessonsCount
  if (data.workload !== undefined) dbData.workload = data.workload
  if (data.startDate !== undefined) dbData.start_date = data.startDate || null
  if (data.endDate !== undefined) dbData.end_date = data.endDate || null
  await supabase.from('class_schedules').update(dbData).eq('id', id)
}

export async function deleteClassSchedule(id: string): Promise<void> {
  const supabase = createClient()
  await supabase.from('class_schedules').delete().eq('id', id)
}

export async function getClassmates(classId: string): Promise<StudentProfile[]> {
  const supabase = createClient()
  const { data } = await supabase.from('students').select('*').eq('class_id', classId)
  return (data || []).map(mapStudentProfile)
}

export async function getStudentGrades(): Promise<StudentGrade[]> {
  const supabase = createClient()
  const { data, error } = await supabase.from('student_grades').select('*').order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return (data || []).map(mapStudentGrade)
}

export async function saveStudentGrade(grade: Omit<StudentGrade, 'id' | 'createdAt'>, id?: string): Promise<void> {
  const supabase = createClient()
  const dbData = { student_identifier: grade.studentIdentifier, student_name: grade.studentName, discipline_id: grade.disciplineId || null, is_public: grade.isPublic, exam_grade: grade.examGrade, works_grade: grade.worksGrade, seminar_grade: grade.seminarGrade, participation_bonus: grade.participationBonus, attendance_score: grade.attendanceScore, custom_divisor: grade.customDivisor, is_released: grade.isReleased }
  if (id) await supabase.from('student_grades').update(dbData).eq('id', id)
  else await supabase.from('student_grades').insert({ ...dbData, created_at: new Date().toISOString() })
}

export async function deleteStudentGrade(id: string): Promise<void> {
  const supabase = createClient()
  await supabase.from('student_grades').delete().eq('id', id)
}

export async function releaseAllGrades(isReleased: boolean = true): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('student_grades')
    .update({ is_released: isReleased })
    .neq('is_released', isReleased)

  if (error) throw new Error(error.message)
}

/** Sincroniza notas de submissÃµes e frequÃªncia para uma disciplina e aluno. */
export async function syncGradesForDiscipline(disciplineId: string) {
  const supabase = createClient()

  // 1. Buscar Avaliações da Disciplina
  const { data: assessments } = await supabase
    .from('assessments')
    .select('id, points_per_question, question_ids')
    .eq('discipline_id', disciplineId)
  
  const assessmentIds = (assessments || []).map((a: any) => a.id) || []
  
  // 2. Buscar Submissões destas Avaliações
  const { data: submissions } = assessmentIds.length > 0 ? await supabase
    .from('student_submissions')
    .select('student_email, student_name, score, assessment_id')
    .in('assessment_id', assessmentIds) : { data: [] }

  // 3. Buscar Frequência da Disciplina
  const { data: attendances } = await supabase
    .from('attendance')
    .select('student_id, is_present, date')
    .eq('discipline_id', disciplineId)

  // 4. Calcular Total de Aulas (Datas Únicas)
  const totalClasses = new Set((attendances || []).map((a: any) => a.date)).size

  // 5. Buscar Estudantes para vincular ID -> Email
  const { data: studentProfiles } = await supabase.from('students').select('id, email, name, cpf')

  // Agrupar Resultados por Aluno (Email é o identificador comum)
  const syncResults: Record<string, { examGrade: number; attendanceScore: number; name: string }> = {};

  // Processar Notas de Prova
  (submissions || []).forEach((sub: any) => {
    const key = (sub.student_email || "").toLowerCase().trim();
    if (!key) return;
    if (!syncResults[key]) syncResults[key] = { examGrade: 0, attendanceScore: 0, name: sub.student_name };
    syncResults[key].examGrade += Number(sub.score || 0);
  });

  // Processar Frequência
  if (totalClasses > 0) {
    (attendances || []).forEach((att: any) => {
      const profile = (studentProfiles || []).find((p: any) => p.id === att.student_id)
      if (profile) {
        const key = (profile.email || "").toLowerCase().trim()
        if (!key) return
        if (!syncResults[key]) syncResults[key] = { examGrade: 0, attendanceScore: 0, name: profile.name }
        if (att.is_present) syncResults[key].attendanceScore += (10 / totalClasses)
      }
    })
  }

  // 6. PERSISTIR NO BANCO DE DADOS (student_grades)
  const { data: existingGrades } = await supabase.from('student_grades').select('*').eq('discipline_id', disciplineId)
  
  const savePromises = Object.entries(syncResults).map(async ([identifier, data]) => {
    const existing = (existingGrades || []).find((g: any) => 
        g.student_identifier.toLowerCase().trim() === identifier
    )

    const gradeData = {
        student_identifier: identifier,
        student_name: data.name,
        discipline_id: disciplineId,
        exam_grade: data.examGrade,
        attendance_score: data.attendanceScore,
        is_released: true,
        is_public: false,
        custom_divisor: 4,
        created_at: new Date().toISOString()
    }

    if (existing) {
        // Atualizar se mudou
        if (existing.exam_grade !== data.examGrade || existing.attendance_score !== data.attendanceScore) {
            await supabase.from('student_grades').update({
                exam_grade: data.examGrade,
                attendance_score: data.attendanceScore
            }).eq('id', existing.id)
        }
    } else {
        // Inserir novo
        await supabase.from('student_grades').insert(gradeData)
    }
  })

  await Promise.all(savePromises)

  return syncResults
}

export async function uploadAvatar(file: File, userId: string, folder: 'students' | 'professors' | 'board'): Promise<string> {
  const supabase = createClient()
  const filePath = `${folder}/${userId}-${uid()}.${file.name.split('.').pop()}`
  const { error } = await supabase.storage.from('avatars').upload(filePath, file)
  if (error) throw error
  const { data } = supabase.storage.from('avatars').getPublicUrl(filePath)
  return data.publicUrl
}

export async function updateProfileAvatar(userId: string, avatarUrl: string, type: 'student' | 'professor' | 'board'): Promise<void> {
  const supabase = createClient()
  const table = type === 'student' ? 'students' : (type === 'professor' ? 'professor_accounts' : 'board_members')
  await supabase.from(table).update({ avatar_url: avatarUrl }).eq('id', userId)
}

export async function insertIBADDisciplines(): Promise<void> {
  const officialNames = [
    "HermenÃªutica", "IntroduÃ§Ã£o BÃ­blica", "Teologia SistemÃ¡tica", "Pentateuco",
    "Livros HistÃ³ricos", "Livros PoÃ©ticos", "Profetas", "HistÃ³ria da Igreja",
    "Maneiras e Costumes", "Cristologia", "Geografia BÃ­blica", "IntroduÃ§Ã£o ao Novo Testamento",
    "Evangelhos e Atos", "EpÃ­stolas PaulÃ­neas", "Hebreus e EpÃ­stolas Gerais", "Escatologia",
    "ReligiÃµes Comparadas", "Missiologia", "Evangelismo", "Fundamentos da Psicologia e do Aconselhamento",
    "Teologia Pastoral", "HomilÃ©tica", "Escola BÃ­blica Dominical", "EvidÃªncia CristÃ£", "PortuguÃªs"
  ]
  const supabase = createClient()
  const norm = (s: string) => (s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().trim()
  const officialNormalized = officialNames.map(norm)
  const { data: allDb } = await supabase.from('disciplines').select('id, name, semester_id, order')
  if (!allDb) return
  const toDelete: string[] = []
  const existingMap = new Map<string, any[]>()
  allDb.forEach((d: any) => {
    const n = norm(d.name)
    if (!officialNormalized.includes(n)) toDelete.push(d.id)
    else { const list = existingMap.get(n) || []; list.push(d); existingMap.set(n, list) }
  })
  for (const list of existingMap.values()) {
    if (list.length > 1) {
      list.sort((a,b) => (a.semester_id && !b.semester_id) ? -1 : ( (!a.semester_id && b.semester_id) ? 1 : 0 ))
      for (let i = 1; i < list.length; i++) toDelete.push(list[i].id)
    }
  }
  if (toDelete.length > 0) await supabase.from('disciplines').delete().in('id', toDelete)
  const toInsert: any[] = []
  const updates: any[] = []
  officialNames.forEach((name, index) => {
    const canonicalOrder = 100 + index
    const normName = norm(name)
    const existingGroup = (existingMap.get(normName) || []).filter((r: any) => !toDelete.includes(r.id))
    const existing = existingGroup[0]
    if (!existing) toInsert.push({ id: uid(), name, order: canonicalOrder, created_at: new Date().toISOString() })
    else if (existing.order !== canonicalOrder || existing.name !== name) updates.push({ id: existing.id, name, order: canonicalOrder })
  })
  if (toInsert.length > 0) await supabase.from('disciplines').insert(toInsert)
  for (const up of updates) await supabase.from('disciplines').update({ name: up.name, order: up.order }).eq('id', up.id)
}

// â€”â€”â€” Financial 2.0 Functions â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”

export async function getFinancialTransactions(filters?: { competencia?: string; type?: "income" | "expense"; status?: "planned" | "realized" }): Promise<FinancialTransaction[]> {
  const supabase = createClient()
  let query = supabase.from('financial_transactions').select('*').order('date', { ascending: false })
  if (filters?.competencia) query = query.eq('competencia', filters.competencia)
  if (filters?.type) query = query.eq('type', filters.type)
  if (filters?.status) query = query.eq('status', filters.status)
  const { data } = await query
  return (data || []).map(mapFinancialTransaction)
}

export async function addFinancialTransaction(data: Omit<FinancialTransaction, "id" | "createdAt">): Promise<FinancialTransaction> {
  const supabase = createClient()
  const dbData = { category: data.category, type: data.type, description: data.description, amount: data.amount, date: data.date, status: data.status, competencia: data.competencia, discipline_id: data.disciplineId || null, student_id: data.studentId || null, created_at: new Date().toISOString() }
  const { data: res, error } = await supabase.from('financial_transactions').insert(dbData).select().single()
  if (error) throw error
  return mapFinancialTransaction(res)
}

export async function updateFinancialTransaction(id: string, data: Partial<FinancialTransaction>): Promise<void> {
  const supabase = createClient()
  const dbData: any = {}
  if (data.category) dbData.category = data.category
  if (data.status) dbData.status = data.status
  if (data.amount !== undefined) dbData.amount = data.amount
  if (data.date) dbData.date = data.date
  if (data.description) dbData.description = data.description
  await supabase.from('financial_transactions').update(dbData).eq('id', id)
}

export async function deleteFinancialTransaction(id: string): Promise<void> {
  const supabase = createClient()
  await supabase.from('financial_transactions').delete().eq('id', id)
}

export async function getStudentTuitions(studentId?: string): Promise<StudentTuition[]> {
  const supabase = createClient()
  let query = supabase.from('student_tuition').select('*').order('created_at', { ascending: true })
  if (studentId) query = query.eq('student_id', studentId)
  const { data } = await query
  return (data || []).map(mapStudentTuition)
}

export async function syncStudentTuition(studentId: string): Promise<void> {
  const supabase = createClient()
  const disciplines = await getDisciplines()
  const sorted = disciplines.sort((a, b) => a.order - b.order)
  
  // Get existing to avoid duplicates
  const { data: existing } = await supabase.from('student_tuition').select('discipline_id').eq('student_id', studentId)
  const existingIds = (existing || []).map((e: { discipline_id: string }) => e.discipline_id)

  const toInsert = sorted
    .filter(d => !existingIds.includes(d.id))
    .map(d => ({
      student_id: studentId,
      discipline_id: d.id,
      amount: 300.00,
      status: 'pending',
      created_at: new Date().toISOString()
    }))

  if (toInsert.length > 0) {
    await supabase.from('student_tuition').insert(toInsert)
  }
}

export async function updateTuition(id: string, data: Partial<StudentTuition>): Promise<void> {
  const supabase = createClient()
  const dbData: any = {}
  if (data.dueDate !== undefined) dbData.due_date = data.dueDate
  if (data.status) dbData.status = data.status
  if (data.amount !== undefined) dbData.amount = data.amount
  if (data.paidAt !== undefined) dbData.paid_at = data.paidAt
  await supabase.from('student_tuition').update(dbData).eq('id', id)
}

export async function processTuitionPayment(tuitionId: string, paymentDate: string): Promise<void> {
  const supabase = createClient()
  const { data: tuition } = await supabase.from('student_tuition').select('*').eq('id', tuitionId).single()
  if (!tuition) return

  // 1. Create realized income transaction
  const transaction = await addFinancialTransaction({
    category: 'Mensalidade',
    type: 'income',
    description: `Mensalidade paga - ID: ${tuitionId}`,
    amount: Number(tuition.amount),
    date: paymentDate,
    status: 'realized',
    competencia: paymentDate.substring(0, 7),
    studentId: tuition.student_id,
    disciplineId: tuition.discipline_id
  })

  // 2. Update tuition record
  await supabase.from('student_tuition').update({
    status: 'paid',
    paid_at: new Date().toISOString(),
    transaction_id: transaction.id
  }).eq('id', tuitionId)
}
// Version 2.0.1 - Force Deploy
