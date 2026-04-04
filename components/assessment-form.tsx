"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { CheckCircle2, AlertTriangle, Clock, BookOpenCheck, RotateCcw, ChevronLeft, ChevronRight, LayoutGrid, Flag, Check, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Textarea } from "@/components/ui/textarea"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  getAssessmentById, getQuestionsByDiscipline, saveDraftAnswers, getDraftAnswers,
  saveSubmission, calculateScore, clearStudentSession, getDisciplines,
  getSubmissionByEmailAndAssessment,
  type StudentSession, type StudentAnswer, type StudentSubmission, uid,
  type Assessment, type Question, type Discipline,
} from "@/lib/store"
import { cn } from "@/lib/utils"

const SCROLL_HIDE_STYLE = {
  msOverflowStyle: 'none',
  scrollbarWidth: 'none',
  '&::-webkit-scrollbar': { display: 'none' }
} as any

function PortraitGuard() {
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white p-8 text-center lg:hidden portrait:hidden">
      <div className="mb-6 flex animate-bounce h-20 w-20 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100 shadow-sm">
        <RotateCcw className="h-10 w-10" />
      </div>
      <h2 className="text-2xl font-bold mb-3 font-serif text-slate-900">Modo Retrato Recomendado</h2>
      <p className="text-slate-500 text-base max-w-[300px] leading-relaxed">
        Para uma melhor leitura das questões e foco total na prova, por favor gire seu dispositivo para o <strong>modo retrato</strong> (vertical).
      </p>
    </div>
  )
}

interface Props {
  session: StudentSession
  onSubmit: (sub: StudentSubmission) => void
}

export function AssessmentForm({ session, onSubmit }: Props) {
  const [assessment, setAssessment] = useState<Assessment | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [disc, setDisc] = useState<Discipline | null>(null)
  const [isInitializing, setIsInitializing] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const hasSubmittedRef = useRef(false)

  const [answers, setAnswers] = useState<StudentAnswer[]>(() => getDraftAnswers())
  const [currentStep, setCurrentStep] = useState(0) // 0 to questions.length (last is review)
  const [showGrid, setShowGrid] = useState(false)
  const [flagged, setFlagged] = useState<Set<string>>(new Set()) // Questions marked for review

  const [elapsed, setElapsed] = useState(0)
  const [timeLeft, setTimeLeft] = useState<number | null>(null)
  const [focusLostCount, setFocusLostCount] = useState(0)
  const startedAt = useRef<Date>(new Date(session.startedAt))

  useEffect(() => {
    let mounted = true
    async function load() {
      // Double-check if student already submitted (Security Block)
      const existing = await getSubmissionByEmailAndAssessment(session.email, session.assessmentId)
      if (existing && existing.submittedAt) {
          console.log("Aluno já realizou esta prova. Redirecionando para o resultado.");
          onSubmit(existing);
          return;
      }

      const a = await getAssessmentById(session.assessmentId)
      if (!mounted) return
      setAssessment(a)
      if (a) {
        const [allQs, allDs] = await Promise.all([
          getQuestionsByDiscipline(a.disciplineId),
          getDisciplines()
        ])
        if (!mounted) return
        let selectedQs = a.questionIds.map(id => allQs.find(q => q.id === id)).filter(Boolean) as Question[]
        
        if (selectedQs.length < a.questionIds.length) {
            console.warn(`Aviso: Esta prova deveria ter ${a.questionIds.length} questões, mas apenas ${selectedQs.length} foram encontradas no banco de dados da disciplina.`);
        }
        
        // Shuffle questions and choices if enabled
        if (a.shuffleVariants) {
          selectedQs = [...selectedQs].sort(() => Math.random() - 0.5)
          selectedQs = selectedQs.map(q => {
            if (q.type === "multiple-choice" && q.choices) {
              return { ...q, choices: [...q.choices].sort(() => Math.random() - 0.5) }
            }
            return q
          })
        }
        
        setQuestions(selectedQs)
        if (allDs.length > 0) {
            setDisc(allDs.find(d => d.id === a.disciplineId) || null)
        }

        // Initialize timer
        if (a.timeLimitMinutes) {
          const totalSecs = a.timeLimitMinutes * 60
          const currentElapsed = Math.floor((Date.now() - startedAt.current.getTime()) / 1000)
          setTimeLeft(Math.max(0, totalSecs - currentElapsed))
        }
      }
      setIsInitializing(false)
    }
    load()
    return () => { mounted = false }
  }, [session.assessmentId])

  const handleFinalize = useCallback(async () => {
    if (!assessment || isSubmitting || hasSubmittedRef.current) return
    
    setIsSubmitting(true)
    hasSubmittedRef.current = true

    try {
      const elapsedSecs = Math.floor((Date.now() - startedAt.current.getTime()) / 1000)
      const { score, totalPoints, percentage } = calculateScore(answers, questions, assessment.pointsPerQuestion)

      const sub: StudentSubmission = {
        id: uid(),
        assessmentId: assessment.id,
        studentName: session.name,
        studentEmail: session.email,
        answers,
        score,
        totalPoints,
        percentage,
        submittedAt: new Date().toISOString(),
        timeElapsedSeconds: elapsedSecs,
        focusLostCount,
      }
      await saveSubmission(sub)
      clearStudentSession()
      onSubmit(sub)
    } catch (err) {
      console.error("Erro ao salvar submissão:", err)
      setIsSubmitting(false)
      hasSubmittedRef.current = false
      alert("Ocorreu um erro ao enviar suas respostas. Por favor, tente novamente.")
    }
  }, [answers, assessment, questions, session, onSubmit, focusLostCount, isSubmitting])

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startedAt.current.getTime()) / 1000))
      setTimeLeft(prev => {
        if (prev === null) return null
        if (prev <= 1) {
          clearInterval(interval)
          handleFinalize()
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [handleFinalize])

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setFocusLostCount(prev => prev + 1)
      }
    }
    document.addEventListener("visibilitychange", handleVisibilityChange)
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange)
  }, [])

  useEffect(() => {
    if (isInitializing || !assessment?.closeAt) return
    const ms = new Date(assessment.closeAt).getTime() - Date.now()
    if (ms <= 0) { handleFinalize(); return }
    const t = setTimeout(() => handleFinalize(), ms)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assessment, isInitializing])

  const getAnswer = (questionId: string) =>
    answers.find((a) => a.questionId === questionId)?.answer ?? ""

  const handleAnswer = useCallback((questionId: string, answer: string) => {
    setAnswers((prev) => {
      const filtered = prev.filter((a) => a.questionId !== questionId)
      const updated = answer ? [...filtered, { questionId, answer }] : filtered
      saveDraftAnswers(updated)
      return updated
    })
  }, [])

  const handleSubAnswer = useCallback((questionId: string, key: string, value: string) => {
    setAnswers((prev) => {
      const existing = prev.find(a => a.questionId === questionId)
      let currentData: Record<string, string> = {}
      if (existing) {
        try { currentData = JSON.parse(existing.answer) } catch { }
      }
      currentData[key] = value
      const answerStr = JSON.stringify(currentData)
      
      const filtered = prev.filter((a) => a.questionId !== questionId)
      const updated = [...filtered, { questionId, answer: answerStr }]
      saveDraftAnswers(updated)
      return updated
    })
  }, [])

  const toggleFlag = (questionId: string) => {
    setFlagged(prev => {
      const newSet = new Set(prev)
      if (newSet.has(questionId)) newSet.delete(questionId)
      else newSet.add(questionId)
      return newSet
    })
  }

  if (isInitializing) {
    return (
      <div className="flex flex-col items-center justify-center py-32 min-h-[70vh]">
        <div className="relative flex h-20 w-20">
          <div className="absolute inline-flex h-full w-full animate-ping rounded-full bg-indigo-500 opacity-20" />
          <div className="relative inline-flex h-20 w-20 items-center justify-center rounded-full bg-white text-indigo-600 shadow-xl border border-indigo-100">
            <Clock className="h-10 w-10 animate-pulse" />
          </div>
        </div>
        <p className="text-slate-500 font-serif font-medium mt-6 text-lg animate-pulse tracking-wide">Inibindo distrações...</p>
      </div>
    )
  }

  if (!assessment) {
    return (
      <div className="flex flex-col items-center justify-center p-12 sm:p-20 text-center bg-white rounded-[2rem] m-4 border border-rose-100 shadow-2xl">
        <div className="h-24 w-24 bg-rose-50 rounded-full flex items-center justify-center mb-6 border border-rose-100">
          <AlertTriangle className="h-12 w-12 text-rose-500" />
        </div>
        <h2 className="text-3xl font-bold font-serif text-slate-900">Avaliação não encontrada</h2>
        <p className="text-slate-500 mt-4 max-w-md mx-auto leading-relaxed">
          O link pode ter expirado ou o ID informado está incorreto. 
          <span className="block mt-2 text-xs opacity-50 font-mono bg-slate-100 py-1.5 rounded-md">ID: {session.assessmentId}</span>
        </p>
        <Button className="mt-8 px-8 py-6 text-lg rounded-xl premium-shadow font-bold bg-primary hover:bg-primary/90" onClick={() => window.location.href = "/"}>
          Sair e Voltar
        </Button>
      </div>
    )
  }

  const answeredCount = answers.length
  const totalQs = questions.length
  const progress = Math.round((answeredCount / totalQs) * 100)

  const formatTime = (secs: number) => {
    const h = Math.floor(secs / 3600)
    const m = Math.floor((secs % 3600) / 60)
    const s = secs % 60
    if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
  }

  const isReviewStep = currentStep === totalQs
  const currentQ = isReviewStep ? null : questions[currentStep]
  const currentAns = currentQ ? getAnswer(currentQ.id) : null
  const isAnswered = !!currentAns
  const isLastQuestion = currentStep === totalQs - 1
  
  // RENDER QUESTION GRID 
  if (showGrid) {
    return (
      <div className="flex flex-col min-h-[85vh] bg-slate-50 rounded-2xl overflow-hidden border border-slate-200 premium-shadow">
        <div className="p-6 border-b border-slate-200 bg-white flex items-center justify-between sticky top-0 z-10 shadow-sm">
          <div>
            <h2 className="text-xl font-bold text-slate-900 font-serif">Navegação da Prova</h2>
            <p className="text-sm text-slate-500 mt-1">{answeredCount} de {totalQs} respondidas</p>
          </div>
          <Button variant="outline" className="rounded-xl font-semibold hover:bg-slate-100 border-slate-300" onClick={() => setShowGrid(false)}>
            Voltar à Questão Atual
          </Button>
        </div>

        <div className="p-6 sm:p-8 flex-1 overflow-y-auto">
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-4 sm:gap-6">
            {questions.map((q, idx) => {
              const ans = getAnswer(q.id)
              const hasAns = !!ans
              const isMarked = flagged.has(q.id)
              const isActive = currentStep === idx

              return (
                <button
                  key={q.id}
                  onClick={() => {
                    setCurrentStep(idx)
                    setShowGrid(false)
                  }}
                  className={cn(
                    "relative flex flex-col items-center justify-center w-full aspect-square rounded-2xl border-2 transition-all hover:-translate-y-1 hover:shadow-md",
                    isActive ? "ring-4 ring-primary/20 bg-white border-primary" : 
                    hasAns ? "border-green-500 bg-green-50/50" : "border-slate-200 bg-white hover:border-slate-300"
                  )}
                >
                  <span className={cn(
                    "text-lg font-bold", 
                    hasAns ? "text-green-700" : "text-slate-600",
                    isActive && "text-primary text-xl"
                  )}>{idx + 1}</span>
                  {hasAns && <CheckCircle2 className="h-4 w-4 text-green-500 absolute bottom-2" />}
                  {isMarked && <Flag className="h-4 w-4 text-amber-500 absolute top-2 right-2 fill-amber-500" />}
                </button>
              )
            })}
          </div>

          <div className="mt-12 flex justify-center">
            <Button size="lg" className="rounded-xl px-10 py-6 text-lg font-bold bg-slate-900 hover:bg-slate-800 text-white" onClick={() => {
              setCurrentStep(totalQs)
              setShowGrid(false)
            }}>
              Ir para Tela de Revisão Final
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-[85vh] bg-white rounded-3xl overflow-hidden border border-slate-200 premium-shadow">
      <PortraitGuard />
      
      {/* Dynamic Header */}
      <header className="px-4 py-3 sm:px-8 border-b border-slate-100 bg-white sticky top-0 z-30 shadow-sm flex flex-col gap-3">
        {/* Row 1: Context & Meta */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="h-9 w-9 shrink-0 flex items-center justify-center rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600">
              <BookOpenCheck className="h-4.5 w-4.5" />
            </div>
            <div className="min-w-0">
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 line-clamp-1 mb-0.5">
                {disc?.name ?? "Disciplina"} <span className="mx-1 opacity-50">|</span> Prof. {disc?.professorName || assessment.professor}
              </p>
              <h1 className="font-extrabold text-slate-800 line-clamp-1 text-sm sm:text-base leading-tight uppercase tracking-tight">
                {assessment.title}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShowGrid(true)}
              className="hidden sm:flex items-center gap-2 h-9 rounded-xl border-slate-200 text-slate-600 font-bold text-xs ring-offset-white transition-all hover:bg-slate-50"
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              Mapa da Prova
            </Button>

            <div className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-xl font-mono text-xs sm:text-sm font-black transition-all border shadow-sm",
              timeLeft !== null && timeLeft < 300 
                ? "bg-red-50 text-red-600 border-red-200 animate-pulse ring-2 ring-red-500/20" 
                : "bg-slate-50 text-slate-700 border-slate-200"
            )}>
              <Clock className={cn("h-3.5 w-3.5 sm:h-4 sm:w-4", timeLeft !== null && timeLeft < 300 ? "text-red-500" : "text-slate-400")} />
              {timeLeft !== null ? <span>{formatTime(timeLeft)}</span> : formatTime(elapsed)}
            </div>
          </div>
        </div>

        {/* Row 2: Main Navigation Row (Requested Layout) */}
        <div className="flex items-center gap-2 w-full pt-1">
           <Button 
            variant="outline" 
            size="sm" 
            className="h-10 px-2.5 rounded-xl border-slate-200 text-slate-600 shrink-0 hover:bg-slate-50 disabled:opacity-30"
            disabled={currentStep === 0}
            onClick={() => setCurrentStep(prev => prev - 1)}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>

          <div className="flex-1 overflow-x-auto py-1 mx-1" style={SCROLL_HIDE_STYLE}>
            <div className="flex items-center gap-1.5 px-0.5 min-w-max">
              {questions.map((q, i) => {
                const isActive = i === currentStep
                const isAns = !!getAnswer(q.id)
                const isFlg = flagged.has(q.id)
                
                return (
                  <button 
                    key={q.id}
                    onClick={() => setCurrentStep(i)}
                    className={cn(
                      "w-9 h-9 rounded-xl flex items-center justify-center text-[12px] font-black transition-all relative shrink-0 border-2",
                      isActive ? "bg-primary text-white border-primary shadow-md ring-2 ring-primary/20 scale-105 z-10" :
                      isAns ? "bg-green-50 text-green-700 border-green-100 hover:bg-green-100" : 
                      isFlg ? "bg-amber-50 text-amber-700 border-amber-100" :
                      "bg-white text-slate-400 border-slate-100 hover:bg-slate-50"
                    )}
                  >
                    {i + 1}
                  </button>
                )
              })}
            </div>
          </div>

          <Button 
            size="sm" 
            className={cn(
              "h-10 px-4 rounded-xl font-black transition-all shrink-0 shadow-sm",
              isAnswered && !isLastQuestion && !isReviewStep 
                ? "bg-primary text-white hover:bg-primary/90 shadow-primary/20" 
                : "bg-slate-900 text-white hover:bg-slate-800"
            )}
            onClick={() => setCurrentStep(prev => Math.min(prev + 1, totalQs))}
          >
            <span className="hidden xs:inline mr-1">{isLastQuestion ? "Revisar" : isReviewStep ? "Fim" : "Próxima"}</span>
            {!isLastQuestion && !isReviewStep ? <ChevronRight className="h-5 w-5" /> : <Check className="h-5 w-5" />}
          </Button>
        </div>

        {/* Progress Bar moved slightly more discrete */}
        <div className="w-full bg-slate-50 h-1 rounded-full overflow-hidden mt-1">
          <div className="bg-primary/40 h-full transition-all duration-700" style={{ width: `${progress}%` }} />
        </div>
      </header>

      {/* Main Question Execution Area */}
      <main className="flex-1 bg-slate-50/50 flex flex-col relative overflow-hidden">
        
        {/* REVIEW STEP */}
        {isReviewStep ? (
          <div className="flex-1 p-6 sm:p-10 overflow-y-auto animate-in fade-in zoom-in-95 duration-300">
            <div className="max-w-3xl mx-auto bg-white rounded-3xl p-8 sm:p-12 border border-slate-200 shadow-xl text-center">
              <div className="h-24 w-24 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-6 border border-indigo-100">
                <CheckCircle2 className="h-12 w-12 text-indigo-500" />
              </div>
              <h2 className="text-3xl font-bold font-serif text-slate-900 mb-4">Revisão Final</h2>
              <p className="text-slate-500 leading-relaxed mb-8 max-w-lg mx-auto">
                Você chegou ao fim da prova. Confira o status abaixo antes de enviar suas respostas definitivamente.
              </p>

              <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto mb-10">
                 <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-center">
                    <div className="text-4xl font-black text-slate-900 mb-1">{answeredCount}</div>
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-500">Respondidas</div>
                 </div>
                 <div className={cn(
                   "border rounded-2xl p-4 text-center transition-colors",
                   answeredCount < totalQs ? "bg-amber-50 border-amber-200" : "bg-slate-50 border-slate-200"
                 )}>
                    <div className={cn("text-4xl font-black mb-1", answeredCount < totalQs ? "text-amber-600" : "text-slate-900")}>
                      {totalQs - answeredCount}
                    </div>
                    <div className={cn("text-xs font-bold uppercase tracking-wider", answeredCount < totalQs ? "text-amber-700" : "text-slate-500")}>
                      Em Branco
                    </div>
                 </div>
              </div>

              {flagged.size > 0 && (
                <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 mb-8 text-rose-800 text-sm font-medium flex items-center justify-center gap-2 max-w-md mx-auto">
                  <Flag className="h-4 w-4 fill-rose-600 text-rose-600" />
                  Você tem {flagged.size} questão(ões) marcada(s) para revisão.
                </div>
              )}

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 border-t border-slate-100 pt-8">
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="rounded-xl font-bold h-14 px-8 border-slate-300 text-slate-700 w-full sm:w-auto"
                  onClick={() => setShowGrid(true)}
                >
                  <LayoutGrid className="mr-2 h-5 w-5" />
                  Voltar ao Mapa
                </Button>
                <Button 
                  size="lg" 
                  className={cn(
                    "rounded-xl font-bold h-14 px-8 text-white shadow-lg shadow-slate-300 transition-all w-full sm:w-auto",
                    isSubmitting ? "bg-slate-400 cursor-not-allowed" : "bg-black hover:bg-slate-800"
                  )}
                  onClick={() => handleFinalize()}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <span className="flex items-center">
                      <Clock className="mr-2 h-5 w-5 animate-spin" /> Enviando...
                    </span>
                  ) : (
                    <span className="flex items-center">
                      Entregar Avaliação <Check className="ml-2 h-5 w-5" />
                    </span>
                  )}
                </Button>
              </div>
            </div>
          </div>
        ) : currentQ && (
          /* SINGLE QUESTION RENDERER */
          <div key={currentQ.id} className="flex-1 flex flex-col overflow-hidden animate-in slide-in-from-right-8 fade-in duration-300">
            {/* Content Body */}
            <div className="flex-1 flex flex-col overflow-y-auto w-full max-w-4xl mx-auto px-4 sm:px-10 pb-32 pt-6 sm:pt-10">
              
              <div className="flex items-center justify-between mb-6">
                <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600 font-bold text-sm tracking-wide border border-slate-200 shadow-sm">
                  Questão {currentStep + 1} 
                  <span className="opacity-40">/</span> 
                  {totalQs}
                </span>

                <button 
                  onClick={() => toggleFlag(currentQ.id)}
                  className={cn(
                    "flex items-center gap-1.5 text-sm font-semibold px-3 py-1.5 rounded-lg transition-colors border",
                    flagged.has(currentQ.id) 
                      ? "text-amber-700 bg-amber-50 border-amber-200 hover:bg-amber-100" 
                      : "text-slate-500 border-transparent hover:bg-slate-100"
                  )}
                >
                  <Flag className={cn("h-4 w-4", flagged.has(currentQ.id) && "fill-amber-600 text-amber-600")} />
                  {flagged.has(currentQ.id) ? "Desmarcar Revisão" : "Pular / Marcar para Revisão"}
                </button>
              </div>

              <div className="flex gap-2 mb-4 items-center px-1">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  {currentQ.type === "multiple-choice" ? "Múltipla Escolha" : 
                   currentQ.type === "true-false" ? "Julgamento" : 
                   currentQ.type === "fill-in-the-blank" ? "Preenchimento" : 
                   currentQ.type === "incorrect-alternative" ? "Escolha a Incorreta" : 
                   currentQ.type === "matching" ? "Relacionar Colunas" :
                   "Discursiva"}
                </span>
                <span className="h-1 w-1 bg-slate-300 rounded-full"></span>
                <span className="text-xs font-bold text-slate-400">{assessment.pointsPerQuestion} ponto{assessment.pointsPerQuestion !== 1 && 's'}</span>
              </div>

              {/* Question Text */}
              <h3 className="text-xl sm:text-2xl font-medium text-slate-900 leading-snug text-pretty mb-8 font-serif">
                {currentQ.text}
              </h3>

              {/* Múltipla Escolha & Escolha a Incorreta */}
              {(currentQ.type === "multiple-choice" || currentQ.type === "incorrect-alternative") && (
                <div className="flex flex-col gap-3 sm:gap-4">
                  {currentQ.choices?.map((c, idx) => {
                    const isSelected = currentAns === c.id
                    return (
                      <button
                        key={c.id}
                        onClick={() => handleAnswer(currentQ.id, c.id)}
                        className={cn(
                          "group relative flex items-start sm:items-center gap-4 p-4 sm:p-5 text-left rounded-2xl border-2 transition-all overflow-hidden",
                          isSelected 
                            ? "border-primary bg-indigo-50/50 shadow-md ring-4 ring-primary/5" 
                            : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                        )}
                      >
                        <div className={cn(
                          "flex h-8 w-8 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl font-bold shadow-sm transition-all text-sm sm:text-base border-2",
                          isSelected 
                            ? "bg-primary text-white border-primary" 
                            : "bg-slate-100 text-slate-500 border-slate-200 group-hover:bg-slate-200"
                        )}>
                          {String.fromCharCode(65 + idx)}
                        </div>
                        <span className={cn(
                          "text-base sm:text-lg leading-relaxed pt-1 sm:pt-0 pb-0.5 relative z-10", 
                          isSelected ? "text-primary font-semibold" : "text-slate-700"
                        )}>
                          {c.text}
                        </span>
                        
                        {isSelected && (
                          <div className="absolute right-5 top-1/2 -translate-y-1/2 hidden sm:flex">
                            <CheckCircle2 className="h-6 w-6 text-primary" />
                          </div>
                        )}
                      </button>
                    )
                  })}
                </div>
              )}

              {/* Verdadeiro ou Falso */}
              {currentQ.type === "true-false" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { val: "true", label: "Verdadeiro", icon: <CheckCircle2 className="h-6 w-6 opacity-80" /> },
                    { val: "false", label: "Falso", icon: <AlertTriangle className="h-6 w-6 opacity-80" /> },
                  ].map(({ val, label, icon }) => {
                    const isSelected = currentAns === val
                    return (
                      <button
                        key={val}
                        onClick={() => handleAnswer(currentQ.id, val)}
                        className={cn(
                          "flex flex-col items-center gap-3 p-8 rounded-3xl border-2 transition-all text-lg font-bold",
                          isSelected 
                            ? "border-primary bg-indigo-50 shadow-lg ring-4 ring-primary/5 text-primary scale-[1.02]" 
                            : "border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:bg-slate-50"
                        )}
                      >
                        {icon}
                        {label}
                      </button>
                    )
                  })}
                </div>
              )}

              {/* Discursiva */}
              {currentQ.type === "discursive" && (
                <div className="animate-in fade-in duration-500">
                  <Textarea
                    placeholder="Elabore sua resposta com argumentação teológica..."
                    rows={8}
                    value={currentAns || ""}
                    onChange={(e) => handleAnswer(currentQ.id, e.target.value)}
                    className="resize-y text-base p-5 rounded-2xl border-slate-300 focus:border-primary focus:ring-primary/20 shadow-inner bg-white leading-relaxed"
                  />
                  <p className="text-right text-xs text-slate-400 font-medium mt-2">Sua resposta será avaliada no módulo subjetivo pela correção automatizada / professor.</p>
                </div>
              )}

               {/* Preenchimento de Lacunas */}
               {currentQ.type === "fill-in-the-blank" && (
                <div className="text-lg leading-[2.5] text-slate-800 bg-white p-6 sm:p-10 rounded-3xl border border-slate-200 premium-shadow">
                  {(() => {
                    const parts = currentQ.text.split(/(\[\[.*?\]\])/g)
                    let blankIdx = 0
                    let currentData: Record<string, string> = {}
                    try { currentData = JSON.parse(currentAns || "") } catch { }
                    
                    return parts.map((part, pi) => {
                      if (part.startsWith("[[") && part.endsWith("]]")) {
                        const idx = blankIdx++
                        const key = `blank_${idx}`
                        const hasValue = !!currentData[key]
                        return (
                          <input
                            key={pi}
                            type="text"
                            value={currentData[key] || ""}
                            onChange={(e) => handleSubAnswer(currentQ.id, key, e.target.value)}
                            className={cn(
                              "mx-1 px-3 py-1 border-b-2 bg-slate-50 shadow-inner focus:outline-none focus:bg-white transition-all min-w-[120px] text-center rounded-t-lg font-semibold text-primary",
                              hasValue ? "border-primary" : "border-slate-300 focus:border-primary"
                            )}
                            placeholder="digite aqui"
                          />
                        )
                      }
                      return <span key={pi}>{part}</span>
                    })
                  })()}
                </div>
              )}

              {/* Associação de colunas */}
              {currentQ.type === "matching" && currentQ.pairs && (
                <div className="flex flex-col gap-4 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200">
                  {(() => {
                    let currentData: Record<string, string> = {}
                    try { currentData = JSON.parse(currentAns || "") } catch { }

                    const allRights = currentQ.pairs.map(p => p.right).sort()

                    return currentQ.pairs.map((p, pi) => (
                      <div key={p.id} className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 p-4 rounded-xl border border-slate-100 bg-slate-50 transition-colors focus-within:bg-indigo-50/30 focus-within:border-primary/30">
                        <div className="flex-1 text-base font-semibold text-slate-900 text-center sm:text-left">{p.left}</div>
                        <div className="hidden sm:block text-slate-300">
                          <ArrowRight className="h-5 w-5" />
                        </div>
                        <div className="w-full sm:w-[350px]">
                          <Select
                            value={currentData[p.id] || ""}
                            onValueChange={(val: string) => handleSubAnswer(currentQ.id, p.id, val)}
                          >
                            <SelectTrigger className="h-12 bg-white border-slate-300 font-medium">
                              <SelectValue placeholder="Selecione..." />
                            </SelectTrigger>
                            <SelectContent>
                              {allRights.map((r, ri) => (
                                <SelectItem key={ri} value={r} className="py-2.5 cursor-pointer">{r}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    ))
                  })()}
                </div>
              )}

            </div>
          </div>
        )}
      </main>

      {/* Rodapé simplificado apenas para o botão de Finalizar quando estiver na Revisão */}
      {isReviewStep && (
        <footer className="bg-white border-t border-slate-200 p-4 sm:p-6 sticky bottom-0 z-30 shadow-[0_-10px_40px_rgba(0,0,0,0.04)] flex items-center justify-center">
          <Button
              size="lg"
              className="rounded-2xl h-16 px-12 font-black text-lg bg-primary text-white hover:bg-primary/90 shadow-xl shadow-primary/20 transition-all hover:scale-105 active:scale-95"
              onClick={handleFinalize}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Enviando..." : "Finalizar Avaliação"}
          </Button>
        </footer>
      )}
    </div>
  )
}
