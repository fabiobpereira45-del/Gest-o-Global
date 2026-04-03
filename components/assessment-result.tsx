"use client"

import { useState, useEffect } from "react"
import { Download, CheckCircle2, XCircle, Clock, Award, Minus, BookOpenCheck, AlertTriangle, ArrowRight, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  getAssessmentById, getQuestionsByDiscipline, getDisciplines, getSubmissionsByAssessment,
  type StudentSubmission, type Assessment, type Question, type Discipline,
} from "@/lib/store"
import { printStudentPDF } from "@/lib/pdf"
import { cn } from "@/lib/utils"

interface Props {
  submission: StudentSubmission
  onBack?: () => void
}

export function AssessmentResult({ submission, onBack }: Props) {
  const [assessment, setAssessment] = useState<Assessment | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [disc, setDisc] = useState<Discipline | null>(null)
  const [classAverageScore, setClassAverageScore] = useState<number>(submission.score)
  const [classSubmissions, setClassSubmissions] = useState<StudentSubmission[]>([])
  const [isInitializing, setIsInitializing] = useState(true)

  useEffect(() => {
    let mounted = true
    async function load() {
      const [a, subs] = await Promise.all([
        getAssessmentById(submission.assessmentId),
        getSubmissionsByAssessment(submission.assessmentId)
      ])
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
      setClassSubmissions(subs)
      if (subs.length > 0) {
        setClassAverageScore(subs.reduce((acc, curr) => acc + curr.score, 0) / subs.length)
      }
      setIsInitializing(false)
    }
    load()
    return () => { mounted = false }
  }, [submission.assessmentId, submission.score])

  const passed = submission.percentage >= 60

  function formatTime(secs: number) {
    const h = Math.floor(secs / 3600)
    const m = Math.floor((secs % 3600) / 60)
    const s = secs % 60
    if (h > 0) return `${h}h ${m}min ${s}s`
    if (m > 0) return `${m}min ${s}s`
    return `${s}s`
  }

  function formatDate(iso: string) {
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit",
    }).format(new Date(iso))
  }

  function handlePDF() {
    if (!assessment) return
    printStudentPDF({ submission, assessment, questions })
  }

  // Build answer key (gabarito) — only for non-discursive
  const gabaritoItems = questions
    .filter((q) => q.type !== "discursive")
    .map((q) => {
      const globalIdx = questions.findIndex((gq) => gq.id === q.id)
      const studentAns = submission.answers.find((a) => a.questionId === q.id)
      
      let isCorrect = false
      let label = "—"

      if (q.type === "multiple-choice" || q.type === "true-false" || q.type === "incorrect-alternative") {
        const isDirectMatch = studentAns?.answer === q.correctAnswer
        const studentText = (q.choices?.find(c => c.id === studentAns?.answer)?.text || "").trim()
        const correctText = (q.choices?.find(c => c.id === q.correctAnswer)?.text || "").trim()
        const isTextMatch = studentText && correctText && studentText === correctText
        isCorrect = isDirectMatch || isTextMatch
        label = q.type === "true-false"
          ? (q.correctAnswer === "true" ? "Verdadeiro" : "Falso")
          : q.choices?.find((c) => c.id === q.correctAnswer)?.text ?? "—"
      } else if (q.type === "fill-in-the-blank") {
        const matches = q.text.match(/\[\[(.*?)\]\]/g)
        const correctWords = matches?.map(m => m.slice(2, -2).trim().toLowerCase()) || []
        try {
          const studentData = JSON.parse(studentAns?.answer || "{}")
          let correctCount = 0
          correctWords.forEach((word, idx) => {
            if ((studentData[`blank_${idx}`] || "").trim().toLowerCase() === word) correctCount++
          })
          isCorrect = correctCount === correctWords.length
          label = `${correctWords.length} lacuna(s)`
        } catch { }
      } else if (q.type === "matching" && q.pairs) {
        try {
          const studentData = JSON.parse(studentAns?.answer || "{}")
          let correctCount = 0
          q.pairs.forEach(p => {
            if (studentData[p.id] === p.right) correctCount++
          })
          isCorrect = correctCount === q.pairs.length
          label = `${q.pairs.length} associação(ões)`
        } catch { }
      }

      return { num: globalIdx + 1, text: q.text, correctLabel: label, isCorrect, type: q.type }
    })

  if (isInitializing) {
    return (
      <div className="flex flex-col justify-center items-center py-32 gap-4">
        <div className="animate-spin h-12 w-12 border-4 border-indigo-500 border-t-transparent rounded-full shadow-lg" />
        <p className="text-slate-500 font-medium animate-pulse">Calculando resultados...</p>
      </div>
    )
  }

  const resultsReleased = assessment?.releaseResults === true

  return (
    <div className="flex flex-col gap-8 max-w-4xl mx-auto w-full pb-10">
      
      {/* Dynamic Header */}
      {assessment && (
        <div className={cn(
          "rounded-[2.5rem] p-8 sm:p-12 text-center text-white relative overflow-hidden shadow-2xl transition-all duration-700",
          !resultsReleased ? "bg-slate-800" : passed ? "premium-gradient" : "bg-gradient-to-br from-rose-900 to-rose-700"
        )}>
           <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-[80px] -mr-32 -mt-32" />
           <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/20 rounded-full blur-[60px] -ml-24 -mb-24" />

           <div className="relative z-10 flex flex-col items-center gap-6">
              <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-white/20 backdrop-blur-md shadow-xl border border-white/30 ring-4 ring-white/10">
                {passed && resultsReleased ? (
                   <Award className="h-10 w-10 text-accent-gold" />
                ) : !resultsReleased ? (
                   <Clock className="h-10 w-10 text-white" />
                ) : (
                   <Award className="h-10 w-10 text-white/80" />
                )}
              </div>

              <div>
                <span className="inline-block px-4 py-1.5 rounded-full bg-white/10 text-white/90 text-xs font-bold uppercase tracking-widest border border-white/20 backdrop-blur-md shadow-inner mb-4">
                  Desempenho Profissional
                </span>
                
                {resultsReleased ? (
                  <>
                    <div className="flex items-baseline justify-center gap-2 mb-2">
                       <h2 className="text-7xl font-black tracking-tight drop-shadow-lg font-serif">{submission.score.toFixed(1)}</h2>
                       <span className="text-2xl font-bold opacity-70"> / {submission.totalPoints.toFixed(1)}</span>
                    </div>
                    
                    <div className="flex items-center justify-center gap-3 mt-4">
                      <div className="px-5 py-2 rounded-full bg-white font-bold shadow-md flex items-center gap-2">
                        {passed ? (
                          <><Sparkles className="h-4 w-4 text-green-600" /> <span className="text-green-700">Aprovado ({submission.percentage}%)</span></>
                        ) : (
                          <><AlertTriangle className="h-4 w-4 text-rose-600" /> <span className="text-rose-700">Reprovado ({submission.percentage}%)</span></>
                        )}
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <h2 className="text-3xl font-bold font-serif my-4">Em Avaliação</h2>
                    <p className="text-white/80 max-w-sm mx-auto">Sua prova foi salva com sucesso. Aguarde a liberação do gabarito oficial pelo professor responsável.</p>
                  </>
                )}
              </div>

              {resultsReleased && (
                <Button
                  variant="outline"
                  onClick={handlePDF}
                  className="bg-white/10 border-white/20 text-white hover:bg-white/30 hover:text-white transition-all rounded-xl mt-4 px-6 shadow-sm"
                >
                  <Download className="h-4 w-4 mr-2" /> Baixar Certificado/Boletim
                </Button>
              )}
           </div>
        </div>
      )}

      {/* Modern Metadata Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 px-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition-all group">
          <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-2">Candidato</p>
          <p className="text-sm font-semibold text-slate-800 line-clamp-2">{submission.studentName}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition-all">
          <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-2">Disciplina</p>
          <p className="text-sm font-semibold text-slate-800 line-clamp-2">{disc?.name ?? "Geral"}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition-all">
          <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-2">Envio</p>
          <p className="text-sm font-semibold text-slate-800">{formatDate(submission.submittedAt)}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition-all">
          <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-2">Tempo Execução</p>
          <div className="flex items-center gap-1.5">
            <Clock className="h-4 w-4 text-indigo-500" />
            <p className="text-sm font-bold text-slate-800">{formatTime(submission.timeElapsedSeconds)}</p>
          </div>
        </div>
      </div>

      {(submission.focusLostCount ?? 0) > 0 && (
         <div className={cn(
          "rounded-2xl p-4 sm:p-5 flex items-center gap-4 mx-2 text-sm font-medium",
          submission.focusLostCount! > 3 ? "bg-rose-50 text-rose-800 border-2 border-rose-200" : "bg-amber-50 text-amber-800 border border-amber-200"
        )}>
           <AlertTriangle className={cn("h-6 w-6 shrink-0", submission.focusLostCount! > 3 ? "text-rose-500" : "text-amber-500")} />
           <p>
             O sistema de Proctoring detectou <strong className="mx-1">{submission.focusLostCount} troca(s) de tela/foco</strong> durante a prova.
             {submission.focusLostCount! > 3 && " Isso pode sinalizar violação das regras sob auditoria do professor."}
           </p>
         </div>
      )}

      {/* Gamified Review Section */}
      {resultsReleased && (
        <div className="mt-8">
           <div className="flex items-center gap-3 mb-6 px-2">
              <div className="h-8 w-1 bg-primary rounded-full" />
              <h2 className="text-2xl font-bold font-serif text-slate-900">Análise Detalhada</h2>
              <div className="h-px bg-slate-200 flex-1 ml-4" />
           </div>

           <div className="flex flex-col gap-6">
            {questions.map((q, idx) => {
              const studentAns = submission.answers.find((a) => a.questionId === q.id)
              const isDiscursive = q.type === "discursive"
              
              const isDirectMatch = studentAns?.answer === q.correctAnswer
              const studentText = (q.choices?.find(c => c.id === studentAns?.answer)?.text || "").trim()
              const correctText = (q.choices?.find(c => c.id === q.correctAnswer)?.text || "").trim()
              const isTextMatch = studentText && correctText && studentText === correctText
              const isCorrect = !isDiscursive && (isDirectMatch || isTextMatch)

              const studentLabel = isDiscursive
                ? (studentAns?.answer || "Em branco")
                : q.type === "true-false"
                  ? (studentAns?.answer === "true" ? "Verdadeiro" : studentAns?.answer === "false" ? "Falso" : "—")
                  : q.choices?.find((c) => c.id === studentAns?.answer)?.text ?? "Em branco"

              const correctLabel = q.type === "true-false"
                ? (q.correctAnswer === "true" ? "Verdadeiro" : "Falso")
                : q.choices?.find((c) => c.id === q.correctAnswer)?.text

              return (
                <div
                  key={q.id}
                  className={cn(
                    "rounded-3xl border-2 p-6 sm:p-8 relative overflow-hidden transition-all shadow-sm",
                    isDiscursive ? "bg-white border-slate-200" :
                      isCorrect ? "bg-white border-green-200 hover:shadow-md hover:border-green-300" :
                        "bg-white border-rose-200 hover:shadow-md hover:border-rose-300"
                  )}
                >
                  {/* Watermark icon */}
                  <div className="absolute -right-8 -top-8 opacity-[0.03] pointer-events-none">
                     {isDiscursive ? <Minus className="h-48 w-48" /> : isCorrect ? <CheckCircle2 className="h-48 w-48 text-green-900" /> : <XCircle className="h-48 w-48 text-rose-900" />}
                  </div>

                  <div className="relative z-10 flex flex-col sm:flex-row gap-6">
                    {/* Status Badge */}
                    <div className="flex-shrink-0">
                       <div className={cn(
                          "flex h-12 w-12 items-center justify-center rounded-2xl shadow-sm border-2",
                          isDiscursive ? "bg-slate-50 border-slate-200 text-slate-400" :
                          isCorrect ? "bg-green-50 border-green-200 text-green-600" : "bg-rose-50 border-rose-200 text-rose-500"
                       )}>
                         <span className="font-bold">{idx + 1}</span>
                       </div>
                    </div>

                    <div className="flex-1 w-full min-w-0">
                      <div className="flex items-center gap-2 mb-3">
                         <span className="text-xs font-bold uppercase tracking-wider text-slate-400 bg-slate-100 px-2 py-1 rounded">
                           {q.type === "multiple-choice" ? "Múltipla Escolha" : q.type === "true-false" ? "Julgamento" : q.type === "fill-in-the-blank" ? "Preenchimento" : q.type === "matching" ? "Associação" : "Discursiva"}
                         </span>
                         {isDiscursive && <span className="text-xs font-bold uppercase tracking-wider text-indigo-500 bg-indigo-50 px-2 py-1 rounded">Revisão Manual</span>}
                         <span className="font-bold text-slate-300 ml-auto">{assessment?.pointsPerQuestion ?? 1} pt</span>
                      </div>

                      <p className="text-base sm:text-lg font-medium text-slate-800 leading-relaxed mb-6 font-serif">{q.text}</p>

                      <div className="rounded-2xl overflow-hidden border border-slate-100 bg-slate-50/50">
                        {isDiscursive ? (
                          <div className="p-5 text-sm text-slate-700 leading-relaxed italic border-l-4 border-indigo-400">
                            {studentLabel}
                          </div>
                        ) : q.type === "fill-in-the-blank" ? (
                          <div className="p-5 flex flex-col gap-3">
                            {(() => {
                              const matches = q.text.match(/\[\[(.*?)\]\]/g)
                              if (!matches) return null
                              const correctWords = matches.map(m => m.slice(2, -2).trim())
                              let studentData: Record<string, string> = {}
                              try { studentData = JSON.parse(studentAns?.answer || "{}") } catch { }

                              return (
                                <div className="flex flex-wrap gap-4">
                                  {correctWords.map((word, wIdx) => {
                                    const studentWord = studentData[`blank_${wIdx}`] || "—"
                                    const isWordCorrect = studentWord.trim().toLowerCase() === word.trim().toLowerCase()
                                    return (
                                      <div key={wIdx} className="flex flex-col flex-1 min-w-[140px] bg-white rounded-xl border border-slate-200 p-3 shadow-sm">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Lacuna {wIdx + 1}</span>
                                        <div className="flex items-center gap-2">
                                          {isWordCorrect ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4 text-rose-500" />}
                                          <span className={cn("text-sm font-bold", isWordCorrect ? "text-green-700" : "text-rose-700")}>{studentWord}</span>
                                        </div>
                                        {!isWordCorrect && <div className="mt-2 pt-2 border-t border-slate-100 text-[11px] font-bold text-green-600">Oficial: {word}</div>}
                                      </div>
                                    )
                                  })}
                                </div>
                              )
                            })()}
                          </div>
                        ) : q.type === "matching" && q.pairs ? (
                          <div className="p-5 flex flex-col gap-2">
                            {(() => {
                              let studentData: Record<string, string> = {}
                              try { studentData = JSON.parse(studentAns?.answer || "{}") } catch { }

                              return q.pairs.map((p, pIdx) => {
                                const studentRight = studentData[p.id] || "—"
                                const isPairCorrect = studentRight === p.right
                                return (
                                  <div key={p.id} className="flex flex-col sm:flex-row sm:items-center gap-3 text-sm p-3 rounded-xl bg-white border border-slate-200 shadow-sm">
                                    <div className="flex-1 font-semibold text-slate-700">{p.left}</div>
                                    <div className="hidden sm:block text-slate-300"><ArrowRight className="h-4 w-4"/></div>
                                    <div className="flex-1">
                                       <div className="flex items-center gap-2">
                                          {isPairCorrect ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4 text-rose-500" />}
                                          <span className={cn("font-bold truncate", isPairCorrect ? "text-green-700" : "text-rose-700")} title={studentRight}>{studentRight}</span>
                                       </div>
                                       {!isPairCorrect && <p className="text-xs font-bold text-green-600 mt-1">Ref: {p.right}</p>}
                                    </div>
                                  </div>
                                )
                              })
                            })()}
                          </div>
                        ) : (
                          <div className={cn(
                            "p-5 flex flex-col gap-2 border-l-4",
                            isCorrect ? "border-green-400 bg-green-50" : "border-rose-400 bg-rose-50"
                          )}>
                             <div className="flex gap-2">
                               {isCorrect ? <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" /> : <XCircle className="h-5 w-5 text-rose-500 shrink-0" />}
                               <div>
                                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-0.5">Sua Resposta</p>
                                  <p className={cn("text-sm font-bold leading-relaxed", isCorrect ? "text-green-800" : "text-rose-800")}>{studentLabel}</p>
                               </div>
                             </div>
                             
                             {!isCorrect && correctLabel && (
                                <div className="flex gap-2 mt-2 pt-3 border-t border-slate-200">
                                   <BookOpenCheck className="h-5 w-5 text-slate-400 shrink-0" />
                                   <div>
                                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-0.5">Gabarito Oficial</p>
                                      <p className="text-sm font-bold leading-relaxed text-slate-800">{correctLabel}</p>
                                   </div>
                                </div>
                             )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
           </div>

           {/* Gabarito Resumo da Tabela */}
           {gabaritoItems.length > 0 && (
             <div className="mt-12 mb-8 border border-slate-200 rounded-[2rem] overflow-hidden bg-white premium-shadow">
                <div className="px-6 sm:px-8 py-5 border-b border-slate-100 bg-slate-50/50">
                  <h3 className="text-lg font-bold text-slate-900 font-serif">Resumo do Gabarito</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                      <tr>
                        <th className="px-6 py-4 w-16 text-center">Nº</th>
                        <th className="px-6 py-4">Questão</th>
                        <th className="px-6 py-4">Resposta Oficial</th>
                        <th className="px-6 py-4 text-center w-24">Avaliação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {gabaritoItems.map(({ num, text, correctLabel, isCorrect }) => (
                         <tr key={num} className="hover:bg-slate-50 transition-colors">
                           <td className="px-6 py-4 font-black text-slate-400 text-center">{num}</td>
                           <td className="px-6 py-4 font-medium text-slate-700 max-w-xs truncate" title={text}>{text}</td>
                           <td className="px-6 py-4 font-bold text-indigo-700">{correctLabel}</td>
                           <td className="px-6 py-4">
                              {isCorrect ? (
                                <div className="mx-auto h-6 w-6 rounded-full bg-green-100 flex items-center justify-center">
                                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                                </div>
                              ) : (
                                <div className="mx-auto h-6 w-6 rounded-full bg-rose-100 flex items-center justify-center">
                                  <XCircle className="h-4 w-4 text-rose-500" />
                                </div>
                              )}
                           </td>
                         </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
             </div>
           )}
        </div>
      )}

      {onBack && (
        <div className="flex justify-center mt-4">
          <Button
            size="lg"
            variant="outline"
            onClick={onBack}
            className="w-full sm:w-auto font-bold rounded-2xl h-14 px-8 border-slate-300 text-slate-600 hover:bg-slate-100"
          >
            Sair do Ambiente de Prova
          </Button>
        </div>
      )}
    </div>
  )
}
