"use client"

import { useState, useEffect } from "react"
import { createPortal } from "react-dom"
import { BarChart3, CheckCircle2, Download, Eye, FileText, Pencil, RotateCcw, Trophy, Trash2, Users, XCircle, X, Clock, AlertTriangle, Flag } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { type Assessment, type StudentSubmission, type Question, deleteSubmission, updateSubmissionScore, reopenSubmission, getQuestionsByDiscipline } from "@/lib/store"
import { printStudentPDF, printOverviewPDF, printScoreTablePDF } from "@/lib/pdf"
import { formatDate, formatTime } from "../admin-utils"
import { cn } from "@/lib/utils"

interface Props {
  assessments: Assessment[]
  allSubmissions: StudentSubmission[]
  questions: Question[]
  onRefresh: () => void
  isMaster: boolean
}

// ─── Answer Viewer Modal ──────────────────────────────────────────────────────
function AnswerViewerModal({
  sub,
  assessment,
  onClose,
}: {
  sub: StudentSubmission
  assessment: Assessment
  onClose: () => void
}) {
  const [questions, setQuestions] = useState<Question[]>([])
  const [loadingQs, setLoadingQs] = useState(true)

  useEffect(() => {
    let mounted = true
    async function load() {
      try {
        const qs = await getQuestionsByDiscipline(assessment.disciplineId)
        if (!mounted) return
        // Manter a ordem exata dos questionIds da avaliação
        const ordered = assessment.questionIds
          .map((id) => qs.find((q) => q.id === id))
          .filter(Boolean) as Question[]
        setQuestions(ordered)
      } catch (err) {
        console.error("Erro ao carregar questões do viewer:", err)
      } finally {
        if (mounted) setLoadingQs(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [assessment.disciplineId, assessment.questionIds])

  function getAnswer(questionId: string) {
    return sub.answers.find((a) => a.questionId === questionId)?.answer ?? ""
  }

  function renderAnswer(q: Question, rawAnswer: string) {
    if (!rawAnswer) {
      return (
        <span className="inline-flex items-center gap-1.5 text-amber-600 font-semibold text-sm">
          <AlertTriangle className="h-3.5 w-3.5" /> Sem resposta
        </span>
      )
    }

    if (q.type === "multiple-choice" || q.type === "incorrect-alternative") {
      const choice = q.choices?.find((c) => c.id === rawAnswer)
      const isCorrect = rawAnswer === q.correctAnswer
      return (
        <div className={cn(
          "flex items-start gap-3 p-3 rounded-xl border",
          isCorrect
            ? "bg-green-50 border-green-200 text-green-800"
            : "bg-red-50 border-red-200 text-red-800"
        )}>
          {isCorrect
            ? <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0 text-green-600" />
            : <XCircle className="h-4 w-4 mt-0.5 shrink-0 text-red-600" />}
          <div>
            <p className="font-semibold text-sm">{choice?.text ?? rawAnswer}</p>
            {!isCorrect && (
              <p className="text-xs mt-1 opacity-80">
                Resposta correta: <strong>{q.choices?.find((c) => c.id === q.correctAnswer)?.text}</strong>
              </p>
            )}
          </div>
        </div>
      )
    }

    if (q.type === "true-false") {
      const isCorrect = rawAnswer === q.correctAnswer
      const label = rawAnswer === "true" ? "Verdadeiro" : "Falso"
      return (
        <div className={cn(
          "flex items-center gap-3 p-3 rounded-xl border",
          isCorrect
            ? "bg-green-50 border-green-200 text-green-800"
            : "bg-red-50 border-red-200 text-red-800"
        )}>
          {isCorrect
            ? <CheckCircle2 className="h-4 w-4 shrink-0 text-green-600" />
            : <XCircle className="h-4 w-4 shrink-0 text-red-600" />}
          <span className="font-semibold text-sm">{label}</span>
          {!isCorrect && (
            <span className="text-xs opacity-80 ml-2">
              (Correto: {q.correctAnswer === "true" ? "Verdadeiro" : "Falso"})
            </span>
          )}
        </div>
      )
    }

    if (q.type === "fill-in-the-blank") {
      let parsed: Record<string, string> = {}
      try { parsed = JSON.parse(rawAnswer) } catch { }
      return (
        <div className="flex flex-wrap gap-2">
          {Object.entries(parsed).map(([key, val]) => (
            <span key={key} className="bg-indigo-50 border border-indigo-200 text-indigo-800 rounded-lg px-3 py-1 text-sm font-medium">
              {val || <em className="opacity-50">em branco</em>}
            </span>
          ))}
        </div>
      )
    }

    if (q.type === "matching") {
      let parsed: Record<string, string> = {}
      try { parsed = JSON.parse(rawAnswer) } catch { }
      return (
        <div className="flex flex-col gap-2">
          {q.pairs?.map((p) => (
            <div key={p.id} className="flex items-center gap-3 text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
              <span className="font-semibold text-slate-800 flex-1">{p.left}</span>
              <span className="text-slate-400">→</span>
              <span className={cn(
                "flex-1 font-medium",
                parsed[p.id] === p.right ? "text-green-700" : "text-red-600"
              )}>
                {parsed[p.id] || <em className="opacity-50">sem resposta</em>}
                {parsed[p.id] !== p.right && (
                  <span className="text-xs text-slate-500 ml-2">(correto: {p.right})</span>
                )}
              </span>
            </div>
          ))}
        </div>
      )
    }

    // Discursive
    return (
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
        {rawAnswer}
      </div>
    )
  }

  const finalScore = sub.preQuestionnaireAnswers 
    ? (((sub.score / (sub.totalPoints || 1)) * 10 + (sub.preQuestionnaireScore || 0)) / 2)
    : (sub.totalPoints > 0 ? (sub.score / sub.totalPoints) * 10 : sub.percentage / 10)
  const scoreLabel = finalScore.toFixed(1)
  const isPassing = finalScore >= 7.0

  if (loadingQs) {
    return createPortal(
      <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
        <div className="relative z-10 flex flex-col items-center justify-center gap-4 bg-white rounded-3xl shadow-2xl border border-slate-200 p-12">
          <div className="relative flex h-14 w-14">
            <div className="absolute inline-flex h-full w-full animate-ping rounded-full bg-indigo-500 opacity-20" />
            <div className="relative inline-flex h-14 w-14 items-center justify-center rounded-full bg-white text-indigo-600 shadow-xl border border-indigo-100">
              <Eye className="h-7 w-7 animate-pulse" />
            </div>
          </div>
          <p className="text-slate-500 font-medium text-sm animate-pulse">Carregando questões...</p>
        </div>
      </div>,
      document.body
    )
  }

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="relative z-10 w-full max-w-2xl max-h-[90vh] bg-white rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">

        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 bg-slate-50 flex items-start justify-between gap-4 shrink-0">
          <div>
            <h2 className="font-bold text-slate-900 text-lg font-serif">{sub.studentName}</h2>
            <p className="text-sm text-slate-500">{sub.studentEmail}</p>
            <div className="flex items-center gap-3 mt-2">
              <span className={cn(
                "px-3 py-1 rounded-full text-sm font-black border",
                isPassing
                  ? "bg-green-50 text-green-700 border-green-200"
                  : "bg-red-50 text-red-700 border-red-200"
              )}>
                {scoreLabel} / 10
              </span>
              <span className="flex items-center gap-1 text-xs text-slate-500">
                <Clock className="h-3 w-3" /> {formatTime(sub.timeElapsedSeconds)}
              </span>
              {(sub.focusLostCount ?? 0) > 0 && (
                <span className="flex items-center gap-1 text-xs text-amber-600 font-semibold">
                  <Flag className="h-3 w-3" /> {sub.focusLostCount} alerta(s)
                </span>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="h-9 w-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors shrink-0"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Question List */}
        <div className="overflow-y-auto flex-1 px-6 py-6 flex flex-col gap-6">
          {sub.preQuestionnaireAnswers && (
            <div className="mb-4 bg-slate-50 border border-slate-200 rounded-xl p-4">
              <h3 className="text-sm font-bold text-slate-800 font-serif mb-3 flex justify-between items-center">
                Questionário Pré-Avaliação
                <span className="bg-indigo-100 text-indigo-800 text-xs px-2 py-1 rounded-full">Nota: {sub.preQuestionnaireScore?.toFixed(1)}</span>
              </h3>
              <div className="grid gap-2">
                {[
                  { id: 'q1', label: 'Participou da aula presencial?' },
                  { id: 'q2', label: 'Participou da Aula Online?' },
                  { id: 'q3', label: 'Fez a leitura do Livro?' },
                  { id: 'q4', label: 'Assistiu a vídeo aula?' },
                  { id: 'q5', label: 'Respondeu ao Questionário?' }
                ].map(q => (
                  <div key={q.id} className="flex items-center justify-between text-sm p-2 bg-white rounded border border-slate-100">
                    <span className="text-slate-600">{q.label}</span>
                    <span className={cn(
                      "font-bold px-2 py-0.5 rounded text-xs",
                      sub.preQuestionnaireAnswers![q.id] 
                        ? "bg-green-100 text-green-700" 
                        : "bg-red-100 text-red-700"
                    )}>
                      {sub.preQuestionnaireAnswers![q.id] ? "SIM" : "NÃO"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {questions.map((q, idx) => {
            const rawAnswer = getAnswer(q.id)
            const isAnswered = !!rawAnswer

            return (
              <div key={q.id} className="flex flex-col gap-3">
                {/* Question label */}
                <div className="flex items-start gap-3">
                  <span className={cn(
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-black border",
                    isAnswered ? "bg-indigo-50 border-indigo-200 text-indigo-700" : "bg-amber-50 border-amber-200 text-amber-700"
                  )}>
                    {idx + 1}
                  </span>
                  <div className="flex-1">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                      {q.type === "multiple-choice" ? "Múltipla Escolha" :
                       q.type === "true-false" ? "Verdadeiro ou Falso" :
                       q.type === "fill-in-the-blank" ? "Preenchimento" :
                       q.type === "incorrect-alternative" ? "Escolha a Incorreta" :
                       q.type === "matching" ? "Relacionar Colunas" : "Discursiva"}
                    </p>
                    <p className="text-sm font-medium text-slate-800 leading-snug">{q.text}</p>
                  </div>
                </div>
                {/* Answer */}
                <div className="ml-10">
                  {renderAnswer(q, rawAnswer)}
                </div>
                {idx < questions.length - 1 && (
                  <hr className="border-slate-100 mt-2" />
                )}
              </div>
            )
          })}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-2 shrink-0">
          <Button variant="outline" className="rounded-xl font-semibold" onClick={onClose}>
            Fechar
          </Button>
        </div>
      </div>
    </div>,
    document.body
  )
}
// ─────────────────────────────────────────────────────────────────────────────

export function SubmissionsTab({ assessments, allSubmissions, questions, onRefresh, isMaster }: Props) {
  const [selectedAssessmentId, setSelectedAssessmentId] = useState(assessments[0]?.id ?? "")
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [reopenId, setReopenId] = useState<string | null>(null)
  const [isReopening, setIsReopening] = useState(false)

  const [editingSubId, setEditingSubId] = useState<string | null>(null)
  const [editScore, setEditScore] = useState<string>("")
  const [isSavingScore, setIsSavingScore] = useState(false)

  // ─── Viewer state ─────────────────────────────────────────────────────────
  const [viewingSub, setViewingSub] = useState<StudentSubmission | null>(null)

  async function handleReopen() {
    if (!reopenId) return
    setIsReopening(true)
    try {
      await reopenSubmission(reopenId)
      onRefresh()
      setReopenId(null)
    } catch (err: any) {
      console.error("Erro ao reabrir prova:", err)
      alert("Erro ao reabrir a prova: " + err.message)
    } finally {
      setIsReopening(false)
    }
  }

  // Calcula a nota final de cada submissão (média entre questionário e prova)
  function getFinalGrade(sub: StudentSubmission): number {
    const examScore = sub.totalPoints > 0
      ? (sub.score / sub.totalPoints) * 10
      : sub.percentage / 10
    if (sub.preQuestionnaireAnswers) {
      return (examScore + (sub.preQuestionnaireScore || 0)) / 2
    }
    return examScore
  }

  const submissions = allSubmissions
    .filter((s) => s.assessmentId === selectedAssessmentId)
    .sort((a, b) => getFinalGrade(b) - getFinalGrade(a))

  const classAverage = submissions.length > 0
    ? submissions.reduce((acc, curr) => acc + getFinalGrade(curr), 0) / submissions.length
    : 0

  function handlePDF(sub: StudentSubmission) {
    if (!selectedAssessment) return
    const qs = selectedAssessment.questionIds
      .map((id) => questions.find((q) => q.id === id))
      .filter(Boolean) as typeof questions
    printStudentPDF({ submission: sub, assessment: selectedAssessment, questions: qs })
  }

  async function handleDelete() {
    if (deleteId) {
      try {
        await deleteSubmission(deleteId)
        onRefresh()
        setDeleteId(null)
      } catch (err: any) {
        console.error("Erro ao excluir resposta:", err)
        alert("Erro ao excluir resposta: " + err.message)
      }
    }
  }

  function startEditingScore(sub: StudentSubmission) {
    setEditingSubId(sub.id)
    setEditScore(sub.score.toString())
  }

  async function saveScore(sub: StudentSubmission) {
    const numericScore = parseFloat(editScore)
    if (isNaN(numericScore) || numericScore < 0 || numericScore > sub.totalPoints) {
      return alert(`A nota deve ser um número válido entre 0 e ${sub.totalPoints}`)
    }
    setIsSavingScore(true)
    try {
      await updateSubmissionScore(sub.id, numericScore, sub.totalPoints)
      setEditingSubId(null)
      onRefresh()
    } catch (err: any) {
      alert("Erro ao salvar nota: " + err.message)
    } finally {
      setIsSavingScore(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {assessments.length > 0 && (
        <div className="flex items-center gap-3">
          {assessments.length > 1 && (
            <>
              <Label className="text-sm whitespace-nowrap">Prova:</Label>
              <select
                value={selectedAssessmentId}
                onChange={(e) => setSelectedAssessmentId(e.target.value)}
                className="text-sm border border-border rounded-lg px-3 py-1.5 bg-background text-foreground"
              >
                {assessments.map((a) => (
                  <option key={a.id} value={a.id}>{a.title}</option>
                ))}
              </select>
            </>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (!selectedAssessment) return
              const qs = selectedAssessment.questionIds
                .map((id) => questions.find((q) => q.id === id))
                .filter(Boolean) as typeof questions
              printOverviewPDF({ assessments: [selectedAssessment], submissions, questions: qs })
            }}
            className="ml-auto"
            disabled={submissions.length === 0}
          >
            <Download className="h-4 w-4 mr-2" /> Baixar PDF Compilado
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (!selectedAssessment) return
              printScoreTablePDF({ assessment: selectedAssessment, submissions })
            }}
            disabled={submissions.length === 0}
          >
            <FileText className="h-4 w-4 mr-2" /> Baixar Tabela de Notas
          </Button>
        </div>
      )}

      {selectedAssessment && submissions.length > 0 && (
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-card border border-border rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase font-medium">Envios Totais</p>
              <p className="text-2xl font-bold">{submissions.length}</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <div className="bg-card border border-border rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase font-medium">Média da Turma</p>
              <div className="flex items-baseline gap-1">
                <p className="text-2xl font-bold">{classAverage.toFixed(1)}</p>
                <p className="text-sm text-muted-foreground">/ 10.0</p>
              </div>
            </div>
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
              <BarChart3 className="h-5 w-5" />
            </div>
          </div>
        </div>
      )}

      {submissions.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-10 text-center text-muted-foreground">
          <Users className="h-10 w-10 mx-auto opacity-30 mb-3" />
          <p className="text-sm">Nenhum aluno enviou esta prova ainda.</p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">#</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Aluno</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Nota</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground uppercase hidden md:table-cell">Tempo</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground uppercase hidden lg:table-cell">Alertas</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground uppercase hidden lg:table-cell">Enviado em</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Ações</th>
              </tr>
            </thead>
            <tbody>
              {submissions.map((sub, i) => (
                <tr key={sub.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 text-muted-foreground font-semibold">
                    {i === 0 ? <Trophy className="h-4 w-4 text-amber-500" /> : i + 1}
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-foreground">{sub.studentName}</div>
                    <div className="text-xs text-muted-foreground">{sub.studentEmail}</div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {editingSubId === sub.id ? (
                      <div className="flex items-center justify-center gap-2">
                        <input
                          type="text"
                          className="w-16 border border-input rounded px-2 py-1 text-sm text-center"
                          value={editScore}
                          onChange={(e) => setEditScore(e.target.value)}
                          disabled={isSavingScore}
                        />
                        <Button size="icon" variant="ghost" className="h-6 w-6 text-green-600 hover:text-green-700 hover:bg-green-100" onClick={() => saveScore(sub)} disabled={isSavingScore}>
                          <CheckCircle2 className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-6 w-6 text-muted-foreground hover:text-foreground" onClick={() => setEditingSubId(null)} disabled={isSavingScore}>
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (() => {
                      const grade = getFinalGrade(sub)
                      const isPassingGrade = grade >= 7.0
                      return (
                        <span className={`px-2 py-0.5 rounded flex items-center justify-center font-bold font-mono text-sm max-w-[80px] mx-auto ` + (isPassingGrade ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700')}>
                          {grade.toFixed(1)}
                        </span>
                      )
                    })()}
                  </td>

                  <td className="px-4 py-3 text-center hidden md:table-cell text-muted-foreground">
                    {formatTime(sub.timeElapsedSeconds)}
                  </td>
                  <td className="px-4 py-3 text-center hidden lg:table-cell">
                    {(sub.focusLostCount ?? 0) > 0 ? (
                      <div className={cn("flex items-center justify-center gap-1", (sub.focusLostCount ?? 0) > 3 ? "text-red-500 font-bold" : "text-amber-500")}>
                        <XCircle className="h-3 w-3" />
                        <span>{sub.focusLostCount}</span>
                      </div>
                    ) : (
                      <span className="text-green-500 text-xs">Nenhum</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center hidden lg:table-cell text-muted-foreground">
                    {formatDate(sub.submittedAt)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {/* ← NEW: Ver Respostas em tela */}
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-100"
                        title="Ver Respostas"
                        onClick={() => setViewingSub(sub)}
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                      {/* PDF download (existing) */}
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0" title="Baixar PDF" onClick={() => handlePDF(sub)}>
                        <Download className="h-3.5 w-3.5" />
                      </Button>
                      {/* Reopen — master only */}
                      {isMaster && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 text-orange-500 hover:text-orange-700 hover:bg-orange-100"
                          title="Reabrir Prova para o Aluno"
                          onClick={() => setReopenId(sub.id)}
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-amber-600 hover:text-amber-700 hover:bg-amber-100" title="Editar Nota" onClick={() => startEditingScore(sub)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                        title="Excluir Envio" onClick={() => setDeleteId(sub.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir envio</AlertDialogTitle>
            <AlertDialogDescription>Tem certeza que deseja apagar a resposta deste aluno? Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={handleDelete}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ─── Reopen Confirmation Dialog ──────────────────────────────────── */}
      <AlertDialog open={!!reopenId} onOpenChange={(o) => !o && setReopenId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <RotateCcw className="h-5 w-5 text-orange-500" />
              Reabrir Prova para o Aluno
            </AlertDialogTitle>
            <AlertDialogDescription>
              O aluno poderá fazer login novamente e continuar a prova a partir das respostas já enviadas.
              As questões respondidas anteriormente serão mantidas. 
              <strong className="block mt-2 text-orange-700">Esta ação não pode ser desfeita pelo aluno — apenas o master pode cancelar uma reabertura.</strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isReopening}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-orange-500 text-white hover:bg-orange-600"
              onClick={handleReopen}
              disabled={isReopening}
            >
              {isReopening ? "Reabrindo..." : "Sim, Reabrir Prova"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ─── Answer Viewer Modal ─────────────────────────────────────────── */}
      {viewingSub && selectedAssessment && (
        <AnswerViewerModal
          sub={viewingSub}
          assessment={selectedAssessment}
          onClose={() => setViewingSub(null)}
        />
      )}
    </div>
  )
}
