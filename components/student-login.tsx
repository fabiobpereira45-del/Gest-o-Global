"use client"

import { useState, useEffect } from "react"
import { Mail, User, ArrowRight, BookOpenCheck, AlertCircle, CheckCircle2, ShieldCheck, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/client"
import {
  getActiveAssessment,
  hasStudentSubmitted,
  saveStudentSession,
  getQuestionsByDiscipline,
  getDisciplines,
  getSubmissionByEmailAndAssessment,
  type Assessment,
  type Question,
  type Discipline,
  type StudentSession,
  type StudentSubmission,
} from "@/lib/store"
import { cn } from "@/lib/utils"

interface Props {
  onLogin: (session: StudentSession) => void
  onResult?: (submission: StudentSubmission) => void
  onBack?: () => void
  preloadedAssessmentId?: string
}

export function StudentLogin({ onLogin, onResult, onBack, preloadedAssessmentId }: Props) {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [initError, setInitError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [isForgot, setIsForgot] = useState(false)

  const [assessment, setAssessment] = useState<Assessment | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [disc, setDisc] = useState<Discipline | null>(null)
  const [isInitializing, setIsInitializing] = useState(true)

  const supabase = createClient()

  useEffect(() => {
    let mounted = true
    async function init() {
      try {
        const a = await getActiveAssessment(preloadedAssessmentId)
        if (!mounted) return
        setAssessment(a)
        if (a) {
          const [allQs, allDs] = await Promise.all([
            getQuestionsByDiscipline(a.disciplineId),
            getDisciplines()
          ])
          if (!mounted) return
          setQuestions(allQs.filter(q => a.questionIds.includes(q.id)))
          setDisc(allDs.find(d => d.id === a.disciplineId) || null)
        }
      } catch (err: any) {
        console.error("Init error:", err)
        setInitError(err.message || "Erro desconhecido ao carregar avaliação")
      } finally {
        if (mounted) setIsInitializing(false)
      }
    }
    init()
    return () => { mounted = false }
  }, [preloadedAssessmentId])

  async function processLogin(isQuery: boolean) {
    setError(null)
    const trimName = name.trim()
    const trimEmail = email.trim().toLowerCase()
    if (trimName.length < 3) { setError("Informe seu nome completo (mínimo 3 caracteres)."); return }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimEmail)) { setError("Informe um e-mail válido."); return }
    setLoading(true)
    if (!assessment) {
      setError("Não foi possível carregar a avaliação.")
      setLoading(false); return
    }
    const now = new Date()
    const isTakeable = assessment.isPublished &&
      (!assessment.openAt || new Date(assessment.openAt) <= now) &&
      (!assessment.closeAt || new Date(assessment.closeAt) >= now)

    const submitted = await hasStudentSubmitted(trimEmail, assessment.id)

    if (!isQuery && !isTakeable) {
      setError("Esta avaliação está encerrada ou não disponível para novos envios.")
      setLoading(false); return
    }

    if (isQuery && !submitted) {
      setError("Nenhuma avaliação finalizada foi encontrada para este e-mail.")
      setLoading(false); return
    }
    if (!isQuery && submitted) {
      setError("ACESSO BLOQUEADO: Você já finalizou esta prova anteriormente. Não é permitido refazer a avaliação.")
      setLoading(false); return
    }

    // ── Ver resultado: fetch submission and show result directly ──────────────
    if (isQuery && submitted) {
      const sub = await getSubmissionByEmailAndAssessment(trimEmail, assessment.id)
      if (!sub) {
        setError("Não foi possível carregar o resultado. Tente novamente.")
        setLoading(false); return
      }
      setLoading(false)
      if (onResult) onResult(sub)
      return
    }

    // ── Normal login: start assessment ────────────────────────────────────────
    const session: StudentSession = { name: trimName, email: trimEmail, assessmentId: assessment.id, startedAt: new Date().toISOString() }
    saveStudentSession(session)
    onLogin(session)
    setLoading(false)
  }

  const hasDiscursive = questions.some(q => q.type === "discursive")
  const hasTrueFalse = questions.some(q => q.type === "true-false")
  const hasMultiple = questions.some(q => q.type === "multiple-choice")
  const formats = [hasMultiple && "Objetiva", hasTrueFalse && "V/F", hasDiscursive && "Discursiva"].filter(Boolean).join(" • ")

  if (isInitializing) {
    return (
      <div className="flex flex-col justify-center items-center py-32 gap-4">
        <div className="relative flex h-16 w-16">
          <div className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-20" />
          <div className="relative inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary text-white shadow-xl">
            <BookOpenCheck className="h-8 w-8 animate-pulse" />
          </div>
        </div>
        <p className="text-muted-foreground font-medium animate-pulse">Carregando portal...</p>
      </div>
    )
  }

  const now = new Date()
  const isTakeable = assessment ? assessment.isPublished &&
    (!assessment.openAt || new Date(assessment.openAt) <= now) &&
    (!assessment.closeAt || new Date(assessment.closeAt) >= now) : false

  return (
    <div className="flex flex-col items-center max-w-xl mx-auto w-full gap-8 relative z-10">
      {/* Premium Hero Card */}
      {assessment ? (
        <div className="w-full rounded-[2rem] premium-gradient text-white p-8 sm:p-10 flex flex-col items-center gap-6 text-center premium-shadow border border-white/10 relative overflow-hidden group">
          {/* Decorative background objects */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-accent/20 rounded-full blur-[80px] -mr-32 -mt-32 transition-transform duration-700 group-hover:scale-110" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/20 rounded-full blur-[60px] -ml-24 -mb-24 transition-transform duration-700 group-hover:scale-110" />
          
          <div className="relative flex h-24 w-24 items-center justify-center rounded-2xl shadow-2xl overflow-hidden mb-2 bg-white/95 ring-4 ring-white/10 backdrop-blur-sm transform transition-transform duration-500 group-hover:-translate-y-2">
            <img src="/ibad-logo.png" alt="Logo" className="w-[85%] h-[85%] object-contain" />
          </div>

          <div className="relative z-10 w-full flex flex-col items-center">
            {assessment.institution && (
              <div className="mb-4">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-white/90 text-xs font-bold uppercase tracking-widest border border-white/20 backdrop-blur-md shadow-inner">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  {assessment.institution}
                </span>
              </div>
            )}
            <h1 className="text-3xl font-bold tracking-tight text-balance leading-tight drop-shadow-md font-serif">{assessment.title}</h1>
            <p className="mt-3 text-white/80 text-sm font-medium bg-black/20 px-4 py-1.5 rounded-full backdrop-blur-sm">
              <span className="font-semibold">{disc?.name ?? "Disciplina Geral"}</span>
              <span className="mx-2 opacity-40">|</span> 
              Prof. {assessment.professor}
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-3 text-sm font-semibold text-white/90 border-t border-white/10 pt-6 w-full mt-2">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/10 backdrop-blur-sm border border-white/5 shadow-sm">
              <BookOpenCheck className="h-4 w-4 text-accent-gold" />
              <span>{assessment.questionIds.length} Questões</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/10 backdrop-blur-sm border border-white/5 shadow-sm">
              <Sparkles className="h-4 w-4 text-accent-gold" />
              <span>{assessment.totalPoints.toFixed(1)} Pontos</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="w-full rounded-[2rem] bg-white border border-border p-10 flex flex-col items-center gap-4 text-center premium-shadow">
          <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-2">
            <AlertCircle className="h-8 w-8 text-muted-foreground opacity-50" />
          </div>
          <p className="text-xl font-bold text-foreground">Nenhuma avaliação disponível</p>
          <p className="text-base text-muted-foreground max-w-xs">
            {initError ? `Erro: ${initError}` : "Aguarde o professor publicar a avaliação para acessá-la."}
          </p>
        </div>
      )}

      {/* Main Form Box */}
      <div className="w-full rounded-[2rem] bg-white border border-slate-200/60 premium-shadow p-8 sm:p-10 relative overflow-hidden transition-all duration-300 hover:shadow-xl">
        {/* Subtle decorative accent */}
        <div className="absolute top-0 left-0 w-full h-1 accent-gradient" />

        {isForgot ? (
          <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="flex items-center gap-3 mb-2 hidden">
              {/* Optional header */}
            </div>
            <div className="bg-amber-50 border border-amber-200 text-amber-900 p-5 rounded-2xl text-sm leading-relaxed shadow-sm">
              <span className="font-bold flex items-center gap-2 mb-2 text-base">
                <ShieldCheck className="h-5 w-5 text-amber-600" />
                Recuperação Segura
              </span>
              A recuperação de acesso para alunos é controlada internamente. Por favor, solicite a verificação dos seus dados diretamente no atendimento.
            </div>

            <a href="https://wa.me/5571987483103?text=Olá, preciso recuperar meu login de estudante." target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#128C7E] text-white font-bold h-14 rounded-xl transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5">
              <CheckCircle2 className="h-5 w-5" /> Acionar Secretaria (WhatsApp)
            </a>

            <button type="button" onClick={() => setIsForgot(false)} className="text-sm font-medium text-slate-500 hover:text-primary transition-colors mt-2">
              ← Cancelar e Voltar
            </button>
          </div>
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-2 text-slate-900">Acesse sua Prova</h2>
              <p className="text-sm text-slate-500 leading-relaxed">
                Digite suas credenciais abaixo para iniciar. O sistema registrará seu progresso automaticamente.
              </p>
            </div>
            
            <form onSubmit={e => { e.preventDefault(); processLogin(false) }} className="flex flex-col gap-6">
              <div className="group relative z-0 w-full transition-all">
                <div className="relative flex items-center">
                  <User className="absolute left-4 z-10 h-5 w-5 text-slate-400 transition-colors group-focus-within:text-primary" />
                  <Input 
                    id="student-name" 
                    placeholder=" " 
                    className="peer block w-full appearance-none rounded-xl border border-slate-300 bg-transparent px-4 pl-12 pt-6 pb-2 text-sm text-slate-900 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary shadow-sm h-14 transition-all" 
                    value={name} 
                    onChange={e => setName(e.target.value)} 
                    autoFocus 
                  />
                  <Label 
                    htmlFor="student-name" 
                    className="absolute left-12 top-4 -z-10 origin-[0] -translate-y-3 scale-75 transform text-sm text-slate-500 duration-300 peer-placeholder-shown:translate-y-0 peer-placeholder-shown:scale-100 peer-focus:left-12 peer-focus:-translate-y-3 peer-focus:scale-75 peer-focus:text-primary peer-focus:font-medium"
                  >
                    Nome Completo
                  </Label>
                </div>
              </div>

              <div className="group relative z-0 w-full transition-all">
                <div className="relative flex items-center">
                  <Mail className="absolute left-4 z-10 h-5 w-5 text-slate-400 transition-colors group-focus-within:text-primary" />
                  <Input 
                    id="student-email" 
                    type="email" 
                    placeholder=" " 
                    className="peer block w-full appearance-none rounded-xl border border-slate-300 bg-transparent px-4 pl-12 pt-6 pb-2 text-sm text-slate-900 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary shadow-sm h-14 transition-all" 
                    value={email} 
                    onChange={e => setEmail(e.target.value)} 
                  />
                  <Label 
                    htmlFor="student-email" 
                    className="absolute left-12 top-4 -z-10 origin-[0] -translate-y-3 scale-75 transform text-sm text-slate-500 duration-300 peer-placeholder-shown:translate-y-0 peer-placeholder-shown:scale-100 peer-focus:left-12 peer-focus:-translate-y-3 peer-focus:scale-75 peer-focus:text-primary peer-focus:font-medium"
                  >
                    E-mail Institucional ou Pessoal
                  </Label>
                </div>
              </div>

              {error && (
                <div className="flex items-start gap-3 rounded-xl bg-red-50 p-4 border border-red-100 animate-in fade-in slide-in-from-top-2">
                  <AlertCircle className="h-5 w-5 shrink-0 text-red-600 mt-0.5" />
                  <p className="text-sm font-medium text-red-800 leading-snug">{error}</p>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Button 
                  type="submit" 
                  disabled={loading || !assessment || !isTakeable} 
                  className="bg-primary hover:bg-primary/90 text-white font-bold h-14 text-base flex-1 rounded-xl shadow-md hover:shadow-lg transition-all"
                >
                  {isTakeable ? "Iniciar Prova Agora" : "Avaliação Indisponível"} <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <button 
                  type="button" 
                  disabled={loading || !assessment} 
                  onClick={() => processLogin(true)} 
                  className={cn("text-sm font-semibold transition-colors flex items-center gap-1.5", loading || !assessment ? "text-slate-300" : "text-primary hover:text-primary/80")}
                >
                  Ver Resultado Anterior
                </button>
                <button 
                  type="button" 
                  onClick={() => setIsForgot(true)} 
                  className="text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors"
                >
                  Problemas no acesso?
                </button>
              </div>
            </form>

            {onBack && (
              <div className="absolute top-6 right-6">
                <button 
                  type="button" 
                  onClick={onBack} 
                  className="text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-slate-800 transition-colors px-3 py-1.5 rounded-lg hover:bg-slate-100"
                >
                  Sair
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground bg-white/50 px-4 py-2 rounded-full border border-slate-200">
        <ShieldCheck className="h-4 w-4 text-green-600" />
        Sessão segura e monitorada. Respostas salvas automaticamente.
      </div>
    </div>
  )
}
