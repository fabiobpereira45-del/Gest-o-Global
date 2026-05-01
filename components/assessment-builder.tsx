"use client"

import { useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import {
  Users, FileText, BookOpen, Settings, BarChart3, Download, LogOut,
  Plus, Pencil, Trash2, Eye, EyeOff, Trophy, Clock, CheckCircle2,
  ShieldCheck, Sparkles, AlertCircle, AlertTriangle, ChevronRight, ChevronLeft, Shuffle, Check, ListChecks, Search, HelpCircle, Variable,
  ArrowUp, ArrowDown, RefreshCw, List, Globe, Lock
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import {
  Dialog, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  type Discipline, type Question, type QuestionType, type Assessment,
  getDisciplines, getQuestionsByDiscipline, addAssessment, updateAssessment, getQuestions,
  PROFESSOR_CREDENTIALS,
} from "@/lib/store"

type SelectionMode = "auto" | "manual"

const FORMAT_LABELS: Record<QuestionType, string> = {
  "multiple-choice": "Múltipla Escolha",
  "true-false": "Verdadeiro ou Falso",
  discursive: "Discursiva",
  "fill-in-the-blank": "Preencher as Lacunas",
  "incorrect-alternative": "Alternativa Incorreta",
  matching: "Associação",
}

interface Props {
  open: boolean
  assessment?: Assessment | null // if set, editing mode
  onClose: () => void
  onSave: () => void
}

export function AssessmentBuilder({ open, assessment, onClose, onSave }: Props) {
  const [step, setStep] = useState(1)
  const [saving, setSaving] = useState(false)

  // Step 1
  const [title, setTitle] = useState("")
  const [disciplineId, setDisciplineId] = useState("")
  const [disciplines, setDisciplines] = useState<Discipline[]>([])
  const [logoBase64, setLogoBase64] = useState("")
  const [rules, setRules] = useState("")
  const [modality, setModality] = useState<"public" | "private">("public")

  // Step 2
  const [formats, setFormats] = useState<QuestionType[]>(["multiple-choice"])
  const [questionCount, setQuestionCount] = useState(10)
  const [pointsPerQuestion, setPointsPerQuestion] = useState(1)
  const [pointsInput, setPointsInput] = useState("1")
  const [timeLimitMinutes, setTimeLimitMinutes] = useState<number>(0)

  // Step 3
  const [selectionMode, setSelectionMode] = useState<SelectionMode>("auto")
  const [availableQuestions, setAvailableQuestions] = useState<Question[]>([])
  const [allQuestions, setAllQuestions] = useState<Question[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [loadingQuestions, setLoadingQuestions] = useState(false)

  useEffect(() => {
    if (!open) return
    let mounted = true

    async function init() {
      const discs = await getDisciplines()
      if (!mounted) return
      setDisciplines(discs)

      if (assessment) {
        setTitle(assessment.title)
        setDisciplineId(assessment.disciplineId)
        setLogoBase64(assessment.logoBase64 ?? "")
        setRules(assessment.rules ?? "")
        setModality(assessment.modality ?? "public")
        setPointsPerQuestion(assessment.pointsPerQuestion || 0)
        setPointsInput((assessment.pointsPerQuestion || 0).toString())
        setTimeLimitMinutes(assessment.timeLimitMinutes ?? 0)
        setQuestionCount(assessment.questionIds?.length || 0)
        setSelectedIds(new Set(assessment.questionIds || []))
        setStep(1)
      } else {
        setTitle("")
        setDisciplineId(discs[0]?.id ?? "")
        setLogoBase64("")
        setRules("")
        setModality("public")
        setFormats(["multiple-choice"])
        setQuestionCount(10)
        setPointsPerQuestion(1)
        setPointsInput("1")
        setTimeLimitMinutes(0)
        setSelectionMode("auto")
        setSelectedIds(new Set())
        setStep(1)
      }
    }
    init()

    return () => { mounted = false }
  }, [open, assessment])

  useEffect(() => {
    if (!disciplineId) return
    let mounted = true
    async function loadQs() {
      setLoadingQuestions(true)
      setAvailableQuestions([]) // Clear old questions while loading
      try {
        let qs = await getQuestionsByDiscipline(disciplineId)
        if (!mounted) return
        setAllQuestions(qs)
        let filtered = qs
        if (formats.length > 0) {
          filtered = qs.filter((q) => formats.includes(q.type))
        }
        setAvailableQuestions(filtered)
      } finally {
        if (mounted) setLoadingQuestions(false)
      }
    }
    loadQs()

    return () => { mounted = false }
  }, [disciplineId, formats])

  function handleAutoSelect() {
    const shuffled = [...availableQuestions].sort(() => Math.random() - 0.5)
    // Se não houver questões suficientes, usa o máximo disponível
    const count = Math.min(questionCount, shuffled.length)
    const picked = shuffled.slice(0, count)
    setSelectedIds(new Set(picked.map((q) => q.id)))
    // Se pegamos menos que o solicitado, atualiza o contador para bater
    if (count < questionCount) {
        setQuestionCount(count)
    }
  }

  function toggleQuestion(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else if (next.size < questionCount) next.add(id)
      return next
    })
  }

  function canProceedStep1() {
    return title.trim().length > 0 && disciplineId.length > 0
  }

  function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (event) => {
      setLogoBase64(event.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  function canProceedStep2() {
    return formats.length > 0 && questionCount >= 1 && pointsPerQuestion > 0
  }

  function canProceedStep3() {
    if (selectionMode === "auto") return true
    return selectedIds.size === questionCount
  }

  function handleNext() {
    try {
      if (step === 3 && selectionMode === "auto") {
        handleAutoSelect()
      }
      setStep((s) => s + 1)
    } catch (err) {
      console.error("Error in handleNext:", err)
      alert("Ocorreu um erro ao avançar. Verifique as configurações da prova.")
    }
  }

  function moveQuestion(index: number, direction: 'up' | 'down') {
    const arr = [...selectedIds]
    if (direction === 'up' && index > 0) {
      const temp = arr[index - 1]
      arr[index - 1] = arr[index]
      arr[index] = temp
      setSelectedIds(new Set(arr))
    } else if (direction === 'down' && index < arr.length - 1) {
      const temp = arr[index + 1]
      arr[index + 1] = arr[index]
      arr[index] = temp
      setSelectedIds(new Set(arr))
    }
  }

  function swapQuestionRandomly(idToReplace: string) {
    const arr = [...selectedIds]
    const unselected = availableQuestions.filter(q => !selectedIds.has(q.id))
    if (unselected.length === 0) {
      alert("Não há mais questões disponíveis no banco desta disciplina para realizar a troca.")
      return
    }
    const replacement = unselected[Math.floor(Math.random() * unselected.length)]
    const index = arr.indexOf(idToReplace)
    if (index !== -1) {
      arr[index] = replacement.id
      setSelectedIds(new Set(arr))
    }
  }

  function removeQuestionPreview(idToRemove: string) {
    const arr = [...selectedIds]
    const index = arr.indexOf(idToRemove)
    if (index !== -1) {
      arr.splice(index, 1)
      setSelectedIds(new Set(arr))
      // O contador de questões deve refletir o número real de IDs selecionados.
      setQuestionCount(arr.length)
    }
  }

  async function handleSave() {
    // Fetch all questions for this discipline to ensure we don't lose valid selections 
    // that might be filtered out by the current format selection.
    const allDiscQuestions = await getQuestionsByDiscipline(disciplineId)
    const validIds = [...selectedIds].filter(id => allDiscQuestions.some(q => q.id === id))
    const finalIds = validIds

    const totalPointsNum = finalIds.length * pointsPerQuestion

    if (finalIds.length === 0) {
        alert("A prova precisa ter pelo menos uma questão selecionada.")
        return
    }

    const selectedDisc = disciplines.find(d => d.id === disciplineId)
    const professorName = selectedDisc?.professorName || PROFESSOR_CREDENTIALS.name

    setSaving(true)
    try {
      if (assessment) {
        await updateAssessment(assessment.id, {
          title: title.trim(),
          disciplineId,
          professor: professorName,
          logoBase64,
          rules: rules.trim(),
          questionIds: finalIds,
          pointsPerQuestion,
          totalPoints: totalPointsNum,
          modality,
          timeLimitMinutes: timeLimitMinutes > 0 ? timeLimitMinutes : null,
        })
      } else {
        await addAssessment({
          title: title.trim(),
          disciplineId,
          professor: professorName,
          institution: "Instituto Bíblico das Assembléias de Deus",
          logoBase64,
          rules: rules.trim(),
          questionIds: finalIds,
          pointsPerQuestion,
          totalPoints: totalPointsNum,
          openAt: null,
          closeAt: null,
          isPublished: false,
          modality,
          timeLimitMinutes: timeLimitMinutes > 0 ? timeLimitMinutes : null,
        })
      }

      onSave()
      onClose()
    } catch (error: any) {
      console.error("Erro ao salvar prova:", error)
      alert(`Erro ao salvar prova: ${error.message || "Tente novamente."}`)
    } finally {
      setSaving(false)
    }
  }


  const totalPoints = (questionCount || 0) * (pointsPerQuestion || 0)
  const selectedDisc = Array.isArray(disciplines) ? disciplines.find((d) => d.id === disciplineId) : null

  // Close on ESC key
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open || typeof document === 'undefined') return null

  return createPortal(
    <div style={{ position: 'fixed', inset: 0, zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{ 
          position: 'absolute', 
          inset: 0, 
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          backdropFilter: 'blur(4px)',
          zIndex: -1 
        }}
      />

      {/* Modal — Absolute solid white, zero transparency */}
      <div
        role="dialog"
        aria-modal="true"
        style={{
          margin: 'auto',
          width: '95%',
          maxWidth: '48rem',
          height: '82vh',
          backgroundColor: '#ffffff',
          borderRadius: '1rem',
          display: 'grid',
          gridTemplateRows: 'auto auto 1fr auto',
          overflow: 'hidden',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          border: '1px solid #e2e8f0',
          position: 'relative'
        }}
      >
        {/* Row 1: Header */}
        <div style={{ backgroundColor: '#ffffff' }} className="px-6 pt-5 pb-4 border-b border-slate-100 shrink-0">
          <h2 className="text-xl font-bold text-slate-900">{assessment ? "Editar Prova" : "Criar Nova Prova"}</h2>
        </div>

        {/* Row 2: Steps */}
        <div style={{ backgroundColor: '#f8fafc' }} className="flex items-center gap-3 px-6 py-2.5 border-b border-slate-100 shrink-0">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                step >= s ? "bg-indigo-600 text-white shadow-sm" : "bg-slate-200 text-slate-500"
              }`}>
                {step > s ? <Check className="h-3 w-3" /> : s}
              </div>
              <span className={`text-xs font-bold uppercase tracking-tight ${step === s ? "text-indigo-600" : "text-slate-400"}`}>
                {s === 1 ? "Título" : s === 2 ? "Config" : s === 3 ? "Questões" : "Visualizar"}
              </span>
              {s < 4 && <ChevronRight className="h-3.5 w-3.5 text-slate-300" />}
            </div>
          ))}
        </div>

        {/* Row 3: Body — SOLID WHITE BACKGROUND */}
        <div style={{ backgroundColor: '#ffffff', minHeight: 0, overflowY: 'auto' }} className="px-6 py-6 scrollbar-thin scrollbar-thumb-slate-200">
            {/* Step 1 */}
            {step === 1 && (
              <div className="flex flex-col gap-5 px-1">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="assess-title">Título da Prova *</Label>
                  <Input
                    id="assess-title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ex: Avaliação Bimestral — Livros Poéticos"
                    autoFocus
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label>Disciplina *</Label>
                  <Select 
                    value={disciplineId} 
                    onValueChange={(v) => {
                      if (v !== disciplineId) {
                        setDisciplineId(v)
                        setSelectedIds(new Set())
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a disciplina" />
                    </SelectTrigger>
                    <SelectContent>
                      {disciplines.length > 0 ? (
                        disciplines.map((d) => (
                          <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                        ))
                      ) : (
                        <SelectItem value="none" disabled>Carregando disciplinas...</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  {selectedDisc?.description && (
                    <p className="text-xs text-muted-foreground">{selectedDisc.description}</p>
                  )}
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="assess-logo">Logo da Instituição (Opcional)</Label>
                  <div className="flex items-center gap-3">
                    <Input
                      id="assess-logo"
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="flex-1"
                    />
                    {logoBase64 && (
                      <div className="w-10 h-10 border rounded-md overflow-hidden flex items-center justify-center bg-muted">
                        <img src={logoBase64} alt="Logo preview" className="max-w-full max-h-full object-contain" />
                      </div>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground">Esta imagem aparecerá apenas no cabeçalho ao imprimir a prova física.</p>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="assess-rules">Regras da Prova (Opcional)</Label>
                  <Textarea
                    id="assess-rules"
                    value={rules}
                    onChange={(e) => setRules(e.target.value)}
                    placeholder="Ex: Não é permitido o uso de celular..."
                    className="resize-none h-20"
                  />
                </div>
                {/* Modality Toggle */}
                <div className="flex flex-col gap-2">
                  <Label>Modalidade da Prova *</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setModality("public")}
                      className={`flex items-center gap-2.5 p-3 rounded-xl border-2 text-sm font-medium transition-colors ${modality === "public" ? "border-green-500 bg-green-50 text-green-700" : "border-border hover:border-green-300"
                        }`}
                    >
                      <Globe className="h-5 w-5 shrink-0" />
                      <div className="text-left">
                        <div className="font-semibold">Pública</div>
                        <div className="text-xs font-normal text-muted-foreground">Qualquer pessoa com nome e e-mail</div>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setModality("private")}
                      className={`flex items-center gap-2.5 p-3 rounded-xl border-2 text-sm font-medium transition-colors ${modality === "private" ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary/40"
                        }`}
                    >
                      <Lock className="h-5 w-5 shrink-0" />
                      <div className="text-left">
                        <div className="font-semibold">Privada</div>
                        <div className="text-xs font-normal text-muted-foreground">Só alunos matriculados (login)</div>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2 */}
            {step === 2 && (
              <div className="flex flex-col gap-5 px-1">
                <div className="flex flex-col gap-1.5">
                  <Label>Formato das Questões *</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {(Object.keys(FORMAT_LABELS) as QuestionType[]).map((f) => {
                      const isSelected = formats.includes(f)
                      return (
                        <button
                          key={f}
                          type="button"
                          onClick={() => {
                            setFormats((prev) => prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f])
                          }}
                          className={`text-left p-3 rounded-lg border-2 text-sm font-medium transition-colors ${isSelected
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border hover:border-primary/40"
                            }`}
                        >
                          {FORMAT_LABELS[f]}
                        </button>
                      )
                    })}
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-1 flex flex-col gap-1.5">
                    <Label htmlFor="q-count">Número de Questões *</Label>
                    <Input
                      id="q-count"
                      type="number"
                      min={1}
                      max={50}
                      value={questionCount}
                      onChange={(e) => setQuestionCount(Number(e.target.value))}
                    />
                    <p className="text-xs text-muted-foreground">
                      {availableQuestions.length} questão{availableQuestions.length === 1 ? "" : "es"} disponível{availableQuestions.length === 1 ? "" : "s"}
                    </p>
                  </div>
                  <div className="flex-1 flex flex-col gap-1.5">
                    <Label htmlFor="pts-q">Pontos por Questão *</Label>
                    <Input
                      id="pts-q"
                      type="text"
                      inputMode="decimal"
                      value={pointsInput}
                      onChange={(e) => {
                        const val = e.target.value.replace(",", ".")
                        if (val === "" || /^\d*\.?\d*$/.test(val)) {
                          setPointsInput(val)
                          const num = parseFloat(val)
                          if (!isNaN(num)) setPointsPerQuestion(num)
                          else if (val === "") setPointsPerQuestion(0)
                        }
                      }}
                      onBlur={() => {
                          setPointsInput(pointsPerQuestion.toString())
                      }}
                    />
                    <p className="text-xs text-muted-foreground">Total: {(questionCount * pointsPerQuestion).toFixed(1)} pts</p>
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="time-limit">Tempo Limite (minutos - 0 para ilimitado)</Label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="time-limit"
                      type="number"
                      min={0}
                      value={timeLimitMinutes}
                      onChange={(e) => setTimeLimitMinutes(Number(e.target.value))}
                      className="pl-9"
                      placeholder="Ex: 60"
                    />
                  </div>
                  <p className="text-[11px] text-muted-foreground italic">Se definido, o cronômetro aparecerá para o aluno e a prova será enviada automaticamente ao expirar.</p>
                </div>
              </div>
            )}

            {/* Step 3 */}
            {step === 3 && (
              <div className="flex flex-col gap-4 px-1">
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectionMode("auto")}
                    className={`flex-1 flex items-center gap-2.5 p-3 rounded-lg border-2 text-sm font-medium transition-colors ${selectionMode === "auto"
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border hover:border-primary/40"
                      }`}
                  >
                    <Shuffle className="h-4 w-4" />
                    <div className="text-left">
                      <div className="font-semibold">Automático</div>
                      <div className="text-xs font-normal text-muted-foreground">Seleção aleatória do banco</div>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectionMode("manual")}
                    className={`flex-1 flex items-center gap-2.5 p-3 rounded-lg border-2 text-sm font-medium transition-colors ${selectionMode === "manual"
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border hover:border-primary/40"
                      }`}
                  >
                    <List className="h-4 w-4" />
                    <div className="text-left">
                      <div className="font-semibold">Manual</div>
                      <div className="text-xs font-normal text-muted-foreground">Escolha as questões</div>
                    </div>
                  </button>
                </div>

                {selectionMode === "manual" && (
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <p className={`text-sm ${selectedIds.size < questionCount ? "text-amber-600 font-medium" : "text-muted-foreground"}`}>
                        Selecione exatamente <strong>{questionCount}</strong> questão{questionCount === 1 ? "" : "es"} ({selectedIds.size} selecionada{selectedIds.size === 1 ? "" : "s"})
                        {selectedIds.size < questionCount && (
                          <span className="ml-2 text-amber-600 font-bold">— Faltam {questionCount - selectedIds.size}</span>
                        )}
                      </p>
                      <div className="flex gap-2">
                        {availableQuestions.length < questionCount && (
                          <Button size="sm" variant="outline" className="text-amber-600 border-amber-200" onClick={() => setQuestionCount(availableQuestions.length)}>
                            Ajustar p/ Máximo ({availableQuestions.length})
                          </Button>
                        )}
                        {availableQuestions.length > 0 && (
                          <Button size="sm" variant="outline" onClick={handleAutoSelect}>
                            <Shuffle className="h-3.5 w-3.5 mr-1.5" /> Sortear
                          </Button>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 pr-1">
                      {availableQuestions.filter(Boolean).length === 0 ? (
                        <div className="xl:col-span-2">
                          <p className="text-sm text-muted-foreground text-center py-12 bg-white border border-dashed rounded-xl">
                            Nenhuma questão disponível para este formato e disciplina.
                          </p>
                        </div>
                      ) : (
                        availableQuestions.filter(Boolean).map((q, i) => {
                          const checked = selectedIds.has(q.id)
                          const disabled = !checked && selectedIds.size >= questionCount
                          return (
                            <label
                              key={q.id}
                              className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${checked ? "border-primary bg-primary/5 shadow-md scale-[1.01]" :
                                disabled ? "border-border opacity-40 cursor-not-allowed" :
                                  "border-border bg-white hover:border-primary/40 hover:shadow-sm"
                                }`}
                            >
                              <div className={`mt-0.5 flex-shrink-0 w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-colors ${checked ? "border-primary bg-primary" : "border-muted-foreground/30"
                                }`}>
                                {checked && <Check className="h-4 w-4 text-primary-foreground" />}
                              </div>
                              <input
                                type="checkbox"
                                className="sr-only"
                                checked={checked}
                                disabled={disabled}
                                onChange={() => toggleQuestion(q.id)}
                              />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 uppercase">
                                    Q{i + 1}
                                  </span>
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary uppercase">
                                    {FORMAT_LABELS[q.type] || q.type}
                                  </span>
                                </div>
                                <span className="text-[13px] font-medium text-slate-700 leading-relaxed block">{q.text}</span>
                              </div>
                            </label>
                          )
                        })
                      )}
                    </div>
                  </div>
                )}

                {selectionMode === "auto" && (
                  <div className={cn(
                    "rounded-lg p-4 text-sm font-medium transition-all",
                    availableQuestions.length < questionCount 
                      ? "bg-amber-50 text-amber-700 border border-amber-200" 
                      : "bg-muted text-muted-foreground"
                  )}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold">
                        {Math.min(questionCount, availableQuestions.length)} {Math.min(questionCount, availableQuestions.length) === 1 ? "questão" : "questões"} {Math.min(questionCount, availableQuestions.length) === 1 ? "será" : "serão"} {Math.min(questionCount, availableQuestions.length) === 1 ? "selecionada" : "selecionadas"}
                      </span>
                    </div>
                    <p className="opacity-90">
                      Extraídas aleatoriamente do banco de {availableQuestions.length} questão{availableQuestions.length === 1 ? "" : "es"} disponível{availableQuestions.length === 1 ? "" : "s"} para os formatos selecionados.
                    </p>
                    {availableQuestions.length < questionCount && (
                      <p className="mt-2 text-xs font-bold uppercase tracking-tight flex items-center gap-1 text-amber-600">
                        <AlertTriangle className="h-3 w-3" /> Atenção: O banco possui menos questões que o solicitado ({questionCount}).
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Step 4 */}
            {step === 4 && (
              <div className="flex flex-col px-1">
                <div className="bg-white border rounded shadow-sm text-black p-6 md:p-8">
                  {/* Cabeçalho */}
                  <div className="flex items-center gap-4 border-b-2 border-black pb-4 mb-6">
                    {logoBase64 && (
                      <img src={logoBase64} alt="Logo" className="w-20 h-20 object-contain" />
                    )}
                    <div className="flex-1 flex flex-col items-center justify-center text-center">
                      <h1 className="text-xl md:text-2xl font-bold uppercase tracking-wide">Instituto de Ensino Teológico — IBAD</h1>
                      <p className="text-sm font-semibold uppercase mt-1">
                        Avaliação {selectedDisc ? `— ${selectedDisc.name}` : ""}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-y-3 gap-x-6 text-sm mb-6 border-b border-gray-300 pb-4">
                    <div className="flex gap-2">
                      <span className="font-semibold whitespace-nowrap">Aluno (a):</span>
                      <div className="border-b border-black flex-1" />
                    </div>
                    <div className="flex gap-2">
                      <span className="font-semibold whitespace-nowrap">Data:</span>
                      <div className="border-b border-black w-24" />
                    </div>
                    <div className="flex gap-2">
                      <span className="font-semibold whitespace-nowrap">Professor:</span>
                      <span className="flex-1 truncate">{PROFESSOR_CREDENTIALS.name}</span>
                    </div>
                    <div className="flex gap-2">
                      <span className="font-semibold whitespace-nowrap">Nota:</span>
                      <div className="border-b border-black w-24" />
                    </div>
                  </div>

                  {rules && (
                    <div className="mb-6 p-4 border border-gray-300 rounded bg-gray-50/50">
                      <h3 className="text-xs font-bold uppercase mb-2 text-gray-500">Regras & Instruções</h3>
                      <p className="text-sm whitespace-pre-wrap leading-relaxed">{rules}</p>
                    </div>
                  )}

                  <div className="flex flex-col gap-6">
                    {(() => {
                      let previewIds = [...selectedIds]
                      if (selectionMode === "auto") {
                        if (previewIds.length === 0) {
                          previewIds = availableQuestions.slice(0, questionCount).map(q => q.id)
                        }
                      }
                      const previewQs = previewIds.map(id => allQuestions.find(q => q.id === id)).filter(Boolean) as Question[]
                      
                      return previewQs.map((q, idx) => (
                        <div key={idx} className="flex flex-col gap-2 relative border border-gray-200 rounded-md p-4 bg-white shadow-sm hover:shadow-md transition-shadow">
                          <div className="flex justify-end gap-1 mb-2 border-b border-gray-100 pb-2">
                            <button onClick={() => moveQuestion(idx, 'up')} disabled={idx === 0} className="p-1 px-2 flex items-center gap-1 hover:bg-muted rounded text-muted-foreground disabled:opacity-30 border text-xs font-medium" title="Mover para Cima">
                              <ArrowUp className="w-3.5 h-3.5" /> <span>Subir</span>
                            </button>
                            <button onClick={() => moveQuestion(idx, 'down')} disabled={idx === previewQs.length - 1} className="p-1 px-2 flex items-center gap-1 hover:bg-muted rounded text-muted-foreground disabled:opacity-30 border text-xs font-medium" title="Mover para Baixo">
                              <ArrowDown className="w-3.5 h-3.5" /> <span>Descer</span>
                            </button>
                            <button onClick={() => swapQuestionRandomly(q.id)} className="p-1 px-2 flex items-center gap-1 hover:bg-blue-50 rounded text-blue-600 border border-blue-200 ml-auto transition-colors text-xs font-medium" title="Trocar por outra (Aleatório)">
                              <RefreshCw className="w-3.5 h-3.5" /> <span>Trocar</span>
                            </button>
                            <button onClick={() => removeQuestionPreview(q.id)} className="p-1 px-2 flex items-center gap-1 hover:bg-red-50 hover:text-red-600 rounded text-red-500 border border-red-200 transition-colors text-xs font-medium" title="Excluir Questão">
                              <Trash2 className="w-3.5 h-3.5" /> <span>Excluir</span>
                            </button>
                          </div>
                          <div className="flex gap-2">
                            <span className="font-bold text-gray-700">{idx + 1}.</span>
                            <span className="text-sm font-medium text-gray-900 leading-relaxed">
                              {q.type === "fill-in-the-blank" 
                                ? (q.text || "").replace(/\[\[.*?\]\]/g, "__________") 
                                : (q.text || "")}
                            </span>
                          </div>
                          {(q.type === "multiple-choice" || q.type === "incorrect-alternative") && (
                            <div className="flex flex-col gap-2 ml-6 mt-1">
                              {q.choices.map((c, cIdx) => {
                                const letter = String.fromCharCode(97 + cIdx)
                                return (
                                  <div key={c.id} className="flex items-start gap-2 text-sm">
                                    <span className="font-semibold">({letter})</span>
                                    <span>{c.text}</span>
                                  </div>
                                )
                              })}
                            </div>
                          )}
                          {q.type === "true-false" && (
                            <div className="flex gap-4 ml-6 mt-1 text-sm">
                              <span>( ) V</span>
                              <span>( ) F</span>
                            </div>
                          )}
                          {q.type === "discursive" && (
                            <div className="mt-3 ml-6 space-y-4">
                              <div className="border-b border-gray-300 w-full" />
                              <div className="border-b border-gray-300 w-full" />
                              <div className="border-b border-gray-300 w-full" />
                            </div>
                          )}
                          {q.type === "fill-in-the-blank" && (
                            <div className="mt-2 ml-6 text-sm text-gray-700 italic border-l-2 border-gray-200 pl-3">
                              (Esta questão contém lacunas para o aluno preencher online)
                            </div>
                          )}
                          {q.type === "matching" && q.pairs && (
                            <div className="mt-3 ml-6 flex flex-col gap-2">
                              {q.pairs.map((p, pIdx) => (
                                <div key={p.id} className="flex items-center gap-4 text-sm">
                                  <div className="flex-1 border p-2 rounded bg-gray-50">{p.left}</div>
                                  <div className="w-10 text-center font-bold">---</div>
                                  <div className="flex-1 border p-2 rounded bg-gray-50">{p.right}</div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))
                    })()}
                  </div>
                </div>
              </div>
            )}
        </div>

        {/* Row 4: Footer — SOLID WHITE BACKGROUND */}
        <div
          style={{ backgroundColor: '#ffffff', zIndex: 10 }}
          className="flex items-center justify-between px-6 py-4 border-t border-slate-100 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]"
        >
          <Button
            variant="outline"
            onClick={() => {
              if (step === 1) onClose()
              else if (step === 4 && selectionMode === "auto") setStep(2)
              else setStep((s) => s - 1)
            }}
            className="font-bold border-slate-300 text-slate-700 hover:bg-slate-50 px-6"
          >
            {step === 1 ? "Cancelar" : <><ChevronLeft className="h-4 w-4 mr-1.5" /> Voltar</>}
          </Button>
          {step < 4 ? (
            <Button
              onClick={handleNext}
              disabled={loadingQuestions || (step === 1 ? !canProceedStep1() : step === 2 ? !canProceedStep2() : (selectionMode === "manual" && !canProceedStep3()))}
              className="font-bold bg-indigo-600 hover:bg-indigo-700 text-white px-8"
            >
              {loadingQuestions ? <RefreshCw className="h-4 w-4 animate-spin" /> : <>Próximo <ChevronRight className="h-4 w-4 ml-1.5" /></>}
            </Button>
          ) : (
            <Button 
              onClick={handleSave} 
              disabled={saving}
              className="font-bold bg-green-600 hover:bg-green-700 text-white px-8"
            >
              {saving ? (
                <><RefreshCw className="h-4 w-4 mr-2 animate-spin" />Salvando...</>
              ) : (
                <><Check className="h-4 w-4 mr-2" />{assessment ? "Salvar Alterações" : "Publicar Prova"}</>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}
