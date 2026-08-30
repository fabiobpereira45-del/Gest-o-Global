"use client"

import { useEffect, useState } from "react"
import {
  Plus, Pencil, Trash2, ChevronRight, BookOpen, CheckSquare, AlignLeft, X, Check, Sparkles, Upload, ListChecks, Download, Search
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { VisuallyHidden } from "@radix-ui/react-visually-hidden"
import {
  type Discipline, type Question, type QuestionType, type Choice, type MatchingPair,
  getDisciplines, addDiscipline, updateDiscipline, deleteDiscipline,
  getQuestionsByDiscipline, addQuestion, addQuestions, updateQuestion, deleteQuestion, uid, getDisciplineQuestionCounts,
  deleteQuestions, deleteQuestionsByDiscipline
} from "@/lib/store"
import { Checkbox } from "@/components/ui/checkbox"

import { AIQuestionGenerator } from "./ai-question-generator"
import { cn } from "@/lib/utils"
import { printDisciplineQuestionsPDF } from "@/lib/pdf"


// ─── Type Labels ──────────────────────────────────────────────────────────────

const TYPE_LABELS: Record<QuestionType, string> = {
  "multiple-choice": "Múltipla Escolha",
  "true-false": "Verdadeiro ou Falso",
  discursive: "Discursiva",
  "incorrect-alternative": "Escolha a Incorreta",
  "fill-in-the-blank": "Completar Lacunas",
  matching: "Relacionar Colunas"
}

const TYPE_ICONS: Record<QuestionType, React.ReactNode> = {
  "multiple-choice": <CheckSquare className="h-3.5 w-3.5" />,
  "true-false": <Check className="h-3.5 w-3.5" />,
  discursive: <AlignLeft className="h-3.5 w-3.5" />,
  "incorrect-alternative": <X className="h-3.5 w-3.5" />,
  "fill-in-the-blank": <Pencil className="h-3.5 w-3.5" />,
  matching: <ListChecks className="h-3.5 w-3.5" />,
}

// ─── Discipline Modal ─────────────────────────────────────────────────────────

function DisciplineModal({
  open, discipline, onClose, onSave,
}: {
  open: boolean
  discipline: Discipline | null
  onClose: () => void
  onSave: () => void
}) {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")

  useEffect(() => {
    if (open) {
      setName(discipline?.name ?? "")
      setDescription(discipline?.description ?? "")
    }
  }, [open, discipline])

  async function handleSave() {
    if (!name.trim()) return
    if (discipline) {
      await updateDiscipline(discipline.id, { name: name.trim(), description: description.trim() || undefined })
    } else {
      await addDiscipline(name.trim(), description.trim() || undefined)
    }
    onSave()
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{discipline ? "Editar Disciplina" : "Nova Disciplina"}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="disc-name">Nome *</Label>
            <Input
              id="disc-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Livros Históricos"
              autoFocus
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="disc-desc">Descrição</Label>
            <Input
              id="disc-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: Josué, Juízes, Rute..."
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSave} disabled={!name.trim()}>Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Question Modal ───────────────────────────────────────────────────────────

function QuestionModal({
  open, question, disciplineId, onClose, onSave,
}: {
  open: boolean
  question: Question | null
  disciplineId: string
  onClose: () => void
  onSave: () => void
}) {
  const [type, setType] = useState<QuestionType>("multiple-choice")
  const [text, setText] = useState("")
  const [choices, setChoices] = useState<Choice[]>([
    { id: uid(), text: "" },
    { id: uid(), text: "" },
    { id: uid(), text: "" },
    { id: uid(), text: "" },
  ])
  const [pairs, setPairs] = useState<MatchingPair[]>([
    { id: uid(), left: "", right: "" },
    { id: uid(), left: "", right: "" },
  ])
  const [correctAnswer, setCorrectAnswer] = useState("")
  const [points, setPoints] = useState(1)

  useEffect(() => {
    if (!open) return
    if (question) {
      setType(question.type)
      setText(question.text)
      setChoices(
        question.choices.length > 0
          ? question.choices
          : [{ id: uid(), text: "" }, { id: uid(), text: "" }, { id: uid(), text: "" }, { id: uid(), text: "" }]
      )
      setCorrectAnswer(question.correctAnswer)
      setPoints(question.points)
      setPairs(question.pairs && question.pairs.length > 0 ? question.pairs : [{ id: uid(), left: "", right: "" }, { id: uid(), left: "", right: "" }])
    } else {
      setType("multiple-choice")
      setText("")
      setChoices([
        { id: uid(), text: "" },
        { id: uid(), text: "" },
        { id: uid(), text: "" },
        { id: uid(), text: "" },
      ])
      setPairs([
        { id: uid(), left: "", right: "" },
        { id: uid(), left: "", right: "" },
      ])
      setCorrectAnswer("")
      setPoints(1)
    }
  }, [open, question])

  function handleTypeChange(t: QuestionType) {
    setType(t)
    setCorrectAnswer("")
  }

  function handleChoiceText(id: string, value: string) {
    setChoices((prev) => prev.map((c) => (c.id === id ? { ...c, text: value } : c)))
  }

  function addChoice() {
    setChoices((prev) => [...prev, { id: uid(), text: "" }])
  }

  function removeChoice(id: string) {
    if (choices.length <= 2) return
    setChoices((prev) => prev.filter((c) => c.id !== id))
    if (correctAnswer === id) setCorrectAnswer("")
  }

  function handlePairChange(id: string, field: 'left' | 'right', value: string) {
    setPairs(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p))
  }

  function addPair() {
    setPairs(prev => [...prev, { id: uid(), left: "", right: "" }])
  }

  function removePair(id: string) {
    if (pairs.length <= 2) return
    setPairs(prev => prev.filter(p => p.id !== id))
  }

  function isValid() {
    if (!text.trim()) return false
    if (type === "multiple-choice" || type === "incorrect-alternative") {
      const filled = choices.filter((c) => c.text.trim())
      return filled.length >= 2 && !!correctAnswer && filled.some(c => c.id === correctAnswer)
    }
    if (type === "true-false") return !!correctAnswer
    if (type === "fill-in-the-blank") {
      return text.includes("[[") && text.includes("]]")
    }
    if (type === "matching") {
      const filled = pairs.filter(p => p.left.trim() && p.right.trim())
      return filled.length >= 2
    }
    return true // discursive
  }

  async function handleSave() {
    if (!isValid()) return
    const data = {
      disciplineId,
      type,
      text: text.trim(),
      choices: (type === "multiple-choice" || type === "incorrect-alternative") ? choices.filter((c) => c.text.trim()) : [],
      pairs: type === "matching" ? pairs.filter(p => p.left.trim() && p.right.trim()) : [],
      correctAnswer: type === "discursive" ? "" : correctAnswer,
      points,
    }
    if (question) {
      await updateQuestion(question.id, data)
    } else {
      await addQuestion(data)
    }
    onSave()
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{question ? "Editar Questão" : "Nova Questão"}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-5 py-2">
          {/* Type + Points */}
          <div className="flex gap-3">
            <div className="flex-1 flex flex-col gap-1.5">
              <Label>Tipo de Questão *</Label>
              <Select value={type} onValueChange={(v) => handleTypeChange(v as QuestionType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(TYPE_LABELS) as QuestionType[]).map((t) => (
                    <SelectItem key={t} value={t}>{TYPE_LABELS[t]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-28 flex flex-col gap-1.5">
              <Label>Pontos *</Label>
              <Input
                type="text"
                inputMode="decimal"
                value={points}
                onChange={(e) => {
                  const val = e.target.value.replace(",", ".")
                  if (val === "" || /^\d*\.?\d*$/.test(val)) {
                    const num = parseFloat(val)
                    if (!isNaN(num)) setPoints(num)
                    else if (val === "") setPoints(0)
                  }
                }}
                onBlur={() => {
                   if (!points || points < 0) setPoints(1)
                }}
              />
            </div>
          </div>

          {/* Question text */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="q-text">Enunciado *</Label>
            <Textarea
              id="q-text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Digite o enunciado da questão..."
              rows={3}
            />
          </div>

          {/* Multiple choice options */}
          {type === "multiple-choice" && (
            <div className="flex flex-col gap-2">
              <Label>Alternativas * <span className="text-muted-foreground font-normal text-xs">(marque a correta)</span></Label>
              {choices.map((c, i) => (
                <div key={c.id} className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setCorrectAnswer(c.id)}
                    className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${correctAnswer === c.id
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border hover:border-primary"
                      }`}
                    aria-label={`Marcar alternativa ${i + 1} como correta`}
                  >
                    {correctAnswer === c.id && <Check className="h-3 w-3" />}
                  </button>
                  <span className="text-xs font-bold text-muted-foreground w-4">{String.fromCharCode(65 + i)}</span>
                  <Input
                    value={c.text}
                    onChange={(e) => handleChoiceText(c.id, e.target.value)}
                    placeholder={`Alternativa ${String.fromCharCode(65 + i)}`}
                    className="flex-1"
                  />
                  <button
                    type="button"
                    onClick={() => removeChoice(c.id)}
                    disabled={choices.length <= 2}
                    className="text-muted-foreground hover:text-destructive disabled:opacity-30 transition-colors"
                    aria-label="Remover alternativa"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
              {choices.length < 6 && (
                <Button type="button" variant="outline" size="sm" onClick={addChoice} className="self-start mt-1">
                  <Plus className="h-3.5 w-3.5 mr-1.5" /> Adicionar alternativa
                </Button>
              )}
            </div>
          )}

          {/* True/False */}
          {type === "true-false" && (
            <div className="flex flex-col gap-2">
              <Label>Resposta Correta *</Label>
              <div className="flex gap-3">
                {["true", "false"].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setCorrectAnswer(val)}
                    className={`flex-1 py-3 rounded-lg border-2 font-semibold text-sm transition-colors ${correctAnswer === val
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border hover:border-primary/50"
                      }`}
                  >
                    {val === "true" ? "Verdadeiro" : "Falso"}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Discursive note */}
          {type === "discursive" && (
            <div className="rounded-lg bg-muted p-3 text-sm text-muted-foreground">
              Questões discursivas não possuem gabarito automático. A correção deve ser feita manualmente pelo professor.
            </div>
          )}

          {/* Fill in the blank note */}
          {type === "fill-in-the-blank" && (
            <div className="flex flex-col gap-2">
              <div className="rounded-lg bg-blue-50 border border-blue-100 p-3 text-sm text-blue-800">
                <p className="font-semibold mb-1 flex items-center gap-1.5"><Sparkles className="h-4 w-4" /> Como usar:</p>
                <p>Use colchetes duplos para indicar a lacuna. O texto dentro será a resposta correta.</p>
                <p className="mt-1 font-mono text-[11px] bg-white/50 p-1.5 rounded border border-blue-200">Ex: O céu é [[azul]] e o sol é [[quente]].</p>
              </div>
            </div>
          )}

          {/* Matching / Association */}
          {type === "matching" && (
            <div className="flex flex-col gap-3">
              <Label>Pares de Associação * <span className="text-muted-foreground font-normal text-xs">(Lado Esquerdo vs Lado Direito)</span></Label>
              <div className="flex flex-col gap-2">
                {pairs.map((p, i) => (
                  <div key={p.id} className="flex items-center gap-2">
                    <span className="text-xs font-bold text-muted-foreground w-4">{i + 1}</span>
                    <Input
                      value={p.left}
                      onChange={(e) => handlePairChange(p.id, 'left', e.target.value)}
                      placeholder="Conceito / Pergunta"
                      className="flex-1"
                    />
                    <div className="text-muted-foreground">→</div>
                    <Input
                      value={p.right}
                      onChange={(e) => handlePairChange(p.id, 'right', e.target.value)}
                      placeholder="Resposta / Definição"
                      className="flex-1"
                    />
                    <button
                      type="button"
                      onClick={() => removePair(p.id)}
                      disabled={pairs.length <= 2}
                      className="text-muted-foreground hover:text-destructive disabled:opacity-30 transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
              {pairs.length < 8 && (
                <Button type="button" variant="outline" size="sm" onClick={addPair} className="self-start">
                  <Plus className="h-3.5 w-3.5 mr-1.5" /> Adicionar par
                </Button>
              )}
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSave} disabled={!isValid()}>Salvar Questão</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Bulk Import Modal ────────────────────────────────────────────────────────
function BulkImportModal({
  open, disciplineId, onClose, onSave,
}: {
  open: boolean
  disciplineId: string
  onClose: () => void
  onSave: () => void
}) {
  const [text, setText] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [preview, setPreview] = useState<any[]>([])

  useEffect(() => {
    if (open) {
      setText("")
      setError("")
      setPreview([])
    }
  }, [open])

  // Universal CSV Parser supporting RFC 4180 with quotes & multi-line
  function parseCSVRows(rawText: string): string[][] {
    const rows: string[][] = [];
    let currentRow: string[] = [];
    let currentField = '';
    let inQuotes = false;
    let i = 0;

    // Detect if separator is semicolon or comma
    const commaCount = (rawText.match(/","/g) || []).length;
    const semiCount = (rawText.match(/";"/g) || []).length + (rawText.match(/;/g) || []).length;
    const sep = semiCount > commaCount ? ';' : ',';

    while (i < rawText.length) {
      const char = rawText[i];
      const nextChar = rawText[i + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          currentField += '"';
          i += 2;
          continue;
        } else {
          inQuotes = !inQuotes;
          i++;
          continue;
        }
      }

      if (!inQuotes && (char === sep || (sep === ';' && char === ';') || (sep === ',' && char === ','))) {
        currentRow.push(currentField.trim());
        currentField = '';
        i++;
        continue;
      }

      if (!inQuotes && (char === '\r' || char === '\n')) {
        if (char === '\r' && nextChar === '\n') i++;
        currentRow.push(currentField.trim());
        currentField = '';
        if (currentRow.some(f => f.length > 0)) {
          rows.push(currentRow);
        }
        currentRow = [];
        i++;
        continue;
      }

      currentField += char;
      i++;
    }

    if (currentField.length > 0 || currentRow.length > 0) {
      currentRow.push(currentField.trim());
      if (currentRow.some(f => f.length > 0)) {
        rows.push(currentRow);
      }
    }

    return rows;
  }

  // Universal Parser for AI Structured Text, CSV (comma/semicolon/quotes) and JSON
  function parseContent(content: string) {
    const trimmed = content.trim();
    if (!trimmed) return [];

    // 1. Try JSON Array
    if ((trimmed.startsWith('[') && trimmed.endsWith(']')) || (trimmed.startsWith('{') && trimmed.endsWith('}'))) {
      try {
        const parsed = JSON.parse(trimmed);
        const arr = Array.isArray(parsed) ? parsed : (parsed.questions || [parsed]);
        return arr.map((item: any) => {
          const rawChoices = item.choices || item.options || item.alternativas || [];
          const choices = rawChoices.map((c: any, idx: number) => ({
            id: uid(),
            text: typeof c === 'object' ? (c.text || c.label || '') : String(c)
          }));
          let correctId = choices[0]?.id || "";
          const rawAns = String(item.correctAnswer || item.gabarito || item.answer || "A").trim().toUpperCase();
          const match = rawAns.match(/([A-E])/);
          if (match) {
            const idx = match[1].charCodeAt(0) - 65;
            if (choices[idx]) correctId = choices[idx].id;
          }
          return {
            text: item.text || item.question || item.enunciado || "",
            type: item.type || "multiple-choice",
            choices,
            correctAnswer: correctId,
            points: Number(item.points || 1)
          };
        }).filter((q: any) => q.text);
      } catch {}
    }

    // 2. Try CSV parsing (with commas or semicolons)
    const csvRows = parseCSVRows(trimmed);
    if (csvRows.length > 0 && csvRows[0].length >= 3) {
      const csvQuestions: any[] = [];
      for (const row of csvRows) {
        if (row.length < 3) continue;
        
        // Skip header row if present
        const firstColLower = (row[0] || "").toLowerCase();
        if (firstColLower.includes("número") || firstColLower.includes("numero") || firstColLower.includes("enunciado") || firstColLower.includes("questão")) {
          if (row.length > 4 && (row[1]?.toLowerCase().includes("enunciado") || row[1]?.toLowerCase().includes("pergunta"))) continue;
        }

        let qText = "";
        let qType = "multiple-choice";
        let startIndex = 0;

        // If column 0 is question number (e.g. "24" or "Questão 24")
        if (/^(?:Questão\s*)?\d+$/i.test(row[0]) && row.length >= 4) {
          qText = row[1];
          startIndex = 2;
        } else {
          qText = row[0];
          startIndex = 1;
        }

        // Check if next column is Question Type
        const possibleType = (row[startIndex] || "").toLowerCase();
        if (possibleType.includes("múltipla") || possibleType.includes("multipla") || possibleType.includes("verdadeiro") || possibleType.includes("falso") || possibleType.includes("incorreta") || possibleType.includes("discursiva") || possibleType.includes("lacuna") || possibleType.includes("relacionar")) {
          if (possibleType.includes("verdadeiro") || possibleType.includes("falso") || possibleType.includes("v/f")) qType = "true-false";
          else if (possibleType.includes("incorreta")) qType = "incorrect-alternative";
          else if (possibleType.includes("discursiva")) qType = "discursive";
          else if (possibleType.includes("lacuna")) qType = "fill-in-the-blank";
          else if (possibleType.includes("relacionar")) qType = "matching";
          else qType = "multiple-choice";
          startIndex++;
        }

        const remaining = row.slice(startIndex);
        
        if (qType === "multiple-choice" || qType === "incorrect-alternative") {
          let gabIndex = -1;
          let gabarito = "";
          for (let r = remaining.length - 1; r >= 0; r--) {
            const val = remaining[r].trim();
            if (/^[A-Ea-e]$/.test(val) || /^Opção\s+[A-E]$/i.test(val) || /^Gabarito:\s*[A-E]/i.test(val)) {
              gabIndex = r;
              gabarito = val.replace(/^Opção\s+/i, '').replace(/^Gabarito:\s*/i, '').toUpperCase();
              break;
            }
          }

          let options: string[] = [];
          if (gabIndex !== -1) {
            options = remaining.slice(0, gabIndex).filter(o => o.trim());
          } else if (remaining.length >= 4) {
            const secondLast = remaining[remaining.length - 2]?.trim();
            if (/^[A-Ea-e]$/.test(secondLast)) {
              gabarito = secondLast.toUpperCase();
              options = remaining.slice(0, remaining.length - 2);
            } else {
              gabarito = remaining[remaining.length - 1]?.trim().toUpperCase() || "A";
              options = remaining.slice(0, remaining.length - 1);
            }
          }

          const choices = options.map((optText) => ({
            id: uid(),
            text: optText.replace(/^[A-Ea-e]\s*[\)\.\-:]\s*/, '').trim()
          }));

          const letterCode = (gabarito.charCodeAt(0) || 65) - 65;
          const correctChoiceId = (choices[letterCode] && choices[letterCode].id) || (choices[0] && choices[0].id) || "";

          if (qText && choices.length >= 2) {
            csvQuestions.push({
              text: qText.trim(),
              type: qType,
              choices,
              correctAnswer: correctChoiceId,
              points: 1
            });
          }
        } else if (qType === "true-false") {
          let finalCorrect = "true";
          const lastVal = remaining[remaining.length - 1]?.toLowerCase() || "";
          if (lastVal.includes("falso") || lastVal === "f") finalCorrect = "false";
          if (qText) {
            csvQuestions.push({
              text: qText.trim(),
              type: "true-false",
              choices: [],
              correctAnswer: finalCorrect,
              points: 1
            });
          }
        }
      }

      if (csvQuestions.length > 0) {
        return csvQuestions;
      }
    }

    // 3. Structured Text / Markdown format
    const lines = trimmed.split('\n');
    const questions: any[] = [];
    let currentQ: any = null;
    let inRationale = false;

    // Patterns for AI-structured format
    const qPattern = /^(?:\*{1,2})?Questão\s*(\d+)?:?\s*(?:\*{1,2})?\s*(.*)/i;
    const numListPattern = /^(\d{1,2})\s*[\.\-\)]\s+(.*)/;
    const typePattern = /^(?:\*{1,2})?Tipo:\s*(?:\*{1,2})?\s*(.*)/i;
    const optionPattern = /^(?:\*{1,2})?Opção\s*([A-E]):?\s*(?:\*{1,2})?\s*(.*)/i;
    const altOptionPattern = /^(?:\*{1,2})?([A-E])\)\s*(?:\*{1,2})?\s*(.*)/i;
    const answerPattern = /^(?:\*{1,2})?(?:Gabarito|Resposta\s*Correta|Resposta):\s*(?:\*{1,2})?\s*(.*)/i;
    const rationalePattern = /^(?:\*{1,2})?(?:Fundamentação|Justificativa|Explicação|Comentário):\s*(?:\*{1,2})?\s*(.*)/i;
    const dividerPattern = /^[\=\-\*_#~]{3,}$/;

    for (let rawLine of lines) {
      const line = rawLine.trim();
      if (!line) continue;
      if (dividerPattern.test(line)) continue;

      const qMatch = line.match(qPattern) || (!currentQ || currentQ.choices.length > 0 ? line.match(numListPattern) : null);
      if (qMatch && !optionPattern.test(line) && !altOptionPattern.test(line)) {
        if (currentQ && currentQ.text) questions.push(currentQ);
        inRationale = false;
        currentQ = {
          text: (qMatch[2] || "").replace(/^\*+|\*+$/g, '').trim(),
          type: "multiple-choice",
          choices: [],
          correctAnswer: "",
          points: 1
        };
        continue;
      }

      if (rationalePattern.test(line)) {
        inRationale = true;
        continue;
      }

      if (inRationale) {
        continue;
      }

      if (!currentQ) continue;

      const typeMatch = line.match(typePattern);
      if (typeMatch) {
        const t = typeMatch[1].toLowerCase();
        if (t.includes("verdadeiro") || t.includes("falso") || t.includes("v/f")) currentQ.type = "true-false";
        else if (t.includes("discursiva")) currentQ.type = "discursive";
        else if (t.includes("incorreta")) currentQ.type = "incorrect-alternative";
        else if (t.includes("lacuna") || t.includes("completar")) currentQ.type = "fill-in-the-blank";
        else if (t.includes("relacionar") || t.includes("associa")) currentQ.type = "matching";
        else currentQ.type = "multiple-choice";
        continue;
      }

      const optMatch = line.match(optionPattern) || line.match(altOptionPattern);
      if (optMatch) {
        currentQ.choices.push({
          id: optMatch[1].toUpperCase(),
          text: optMatch[2].replace(/^\*+|\*+$/g, '').trim()
        });
        continue;
      }

      const ansMatch = line.match(answerPattern);
      if (ansMatch) {
        currentQ.correctAnswer = ansMatch[1].replace(/[*()]/g, '').trim();
        continue;
      }
      
      // Multi-line question text or choice text
      if (currentQ.choices.length === 0 && !currentQ.correctAnswer) {
        if (!currentQ.text) currentQ.text = line;
        else currentQ.text += " " + line;
      } else if (currentQ.choices.length > 0 && !currentQ.correctAnswer) {
        const lastChoice = currentQ.choices[currentQ.choices.length - 1];
        if (lastChoice) {
          lastChoice.text += " " + line;
        }
      }
    }

    if (currentQ && currentQ.text) questions.push(currentQ);

    // Map letter IDs to real UIDs for multiple choice
    return questions.map(q => {
      if ((q.type === "multiple-choice" || q.type === "incorrect-alternative") && q.choices.length > 0) {
        const uids: Record<string, string> = {};
        const finalChoices = q.choices.map((c: any) => {
          const newId = uid();
          uids[c.id] = newId;
          return { id: newId, text: c.text };
        });
        
        let finalCorrect = q.correctAnswer;
        const letterMatch = q.correctAnswer.match(/([A-E])/i);
        if (letterMatch && uids[letterMatch[1].toUpperCase()]) {
          finalCorrect = uids[letterMatch[1].toUpperCase()];
        } else if (finalChoices[0]) {
          finalCorrect = finalChoices[0].id;
        }

        return { ...q, choices: finalChoices, correctAnswer: finalCorrect };
      }
      
      if (q.type === "true-false") {
        let finalCorrect = "true";
        if (q.correctAnswer.toLowerCase().includes("falso") || q.correctAnswer.toLowerCase() === "f") {
          finalCorrect = "false";
        }
        return { ...q, correctAnswer: finalCorrect, choices: [] };
      }

      return q;
    });
  }

  useEffect(() => {
    if (text.trim()) {
      const parsed = parseContent(text);
      setPreview(parsed);
    } else {
      setPreview([]);
    }
  }, [text]);

  async function handleImport() {
    if (preview.length === 0) return;
    setLoading(true);
    setError("");

    try {
      await addQuestions(preview.map(q => ({
        disciplineId,
        ...q
      })));
      onSave();
      onClose();
    } catch (err: any) {
      setError(err?.message || "Erro ao salvar algumas questões no banco de dados.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] flex flex-col p-0 overflow-hidden bg-background">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-primary" /> Importar Questões (Smart)
          </DialogTitle>
          <div className="text-sm text-muted-foreground mt-2">
            Aceita o formato <strong>estruturado da IA</strong> ou <strong>CSV (ponto e vírgula)</strong>.
          </div>
        </DialogHeader>
        
        <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-2 gap-0 border-t border-border">
          {/* Input side */}
          <div className="p-6 flex flex-col gap-4 border-r border-border bg-muted/5">
            <Label className="text-xs uppercase font-bold tracking-widest text-muted-foreground">Conteúdo para Importar</Label>
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Cole o resultado da IA aqui..."
              className="flex-1 font-mono text-xs resize-none bg-background shadow-inner scrollbar-thin"
            />
          </div>

          {/* Preview side */}
          <div className="p-6 flex flex-col gap-4 overflow-hidden bg-background">
            <div className="flex items-center justify-between">
              <Label className="text-xs uppercase font-bold tracking-widest text-muted-foreground">Visualização ({preview.length})</Label>
              {preview.length > 0 && <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold">Válidas</span>}
            </div>
            
            <div className="flex-1 overflow-y-auto pr-2 space-y-3 scrollbar-thin">
              {preview.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-8 opacity-40">
                  <ListChecks className="h-10 w-10 mb-2" />
                  <p className="text-xs">Aguardando dados estruturados...</p>
                </div>
              ) : (
                preview.map((q, i) => (
                  <div key={i} className="p-3 rounded-xl border border-border bg-muted/30 text-xs">
                    <p className="font-bold text-foreground mb-1 line-clamp-2">{i+1}. {q.text}</p>
                    <div className="flex gap-2 opacity-70">
                      <span className="capitalize">{TYPE_LABELS[q.type as QuestionType]}</span>
                      {q.type === 'multiple-choice' && <span>• {q.choices.length} opções</span>}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="p-6 border-t border-border bg-muted/20">
          {error && <p className="text-xs text-destructive font-bold mr-auto">{error}</p>}
          <Button variant="ghost" onClick={onClose} disabled={loading}>Cancelar</Button>
          <Button 
            onClick={handleImport} 
            disabled={preview.length === 0 || loading}
            className="accent-gradient text-white min-w-[150px]"
          >
            {loading ? "Processando..." : `Importar ${preview.length} Questões`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function QuestionBank({ isMaster }: { isMaster?: boolean }) {
  const [disciplines, setDisciplines] = useState<Discipline[]>([])
  const [selectedDiscipline, setSelectedDiscipline] = useState<Discipline | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [questionCounts, setQuestionCounts] = useState<Record<string, number>>({})

  // Modals
  const [discModal, setDiscModal] = useState(false)
  const [editingDisc, setEditingDisc] = useState<Discipline | null>(null)
  const [deleteDiscId, setDeleteDiscId] = useState<string | null>(null)

  const [qModal, setQModal] = useState(false)
  const [editingQ, setEditingQ] = useState<Question | null>(null)
  const [deleteQId, setDeleteQId] = useState<string | null>(null)

  const [aiModal, setAiModal] = useState(false)
  const [importModal, setImportModal] = useState(false)

  // Seleção e Ações em Lote
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [bulkDeleteModal, setBulkDeleteModal] = useState(false)
  const [emptyDiscModal, setEmptyDiscModal] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  async function reload(discIdToSelect?: string) {
    const discs = await getDisciplines()
    setDisciplines(discs)

    const counts = await getDisciplineQuestionCounts()
    setQuestionCounts(counts)

    let toSelect = selectedDiscipline
    if (discIdToSelect) {
      toSelect = discs.find((d) => d.id === discIdToSelect) || null
    } else if (selectedDiscipline) {
      toSelect = discs.find((d) => d.id === selectedDiscipline.id) || null
    }

    if (!toSelect && discs.length > 0) {
      toSelect = discs[0]
    }

    setSelectedDiscipline(toSelect)

    if (toSelect) {
      const qs = await getQuestionsByDiscipline(toSelect.id)
      setQuestions(qs)
    } else {
      setQuestions([])
    }
  }

  useEffect(() => {
    reload()
  }, [])

  async function handleSelectDisc(d: Discipline) {
    setSelectedDiscipline(d)
    setSearchQuery("")
    const qs = await getQuestionsByDiscipline(d.id)
    setQuestions(qs)
  }

  async function handleDeleteDisc(id: string) {
    try {
      await deleteDiscipline(id)
      await reload()
      setDeleteDiscId(null)
    } catch (err: any) {
      alert(`Erro ao excluir disciplina: ${err.message}. Verifique se existem dependências vinculadas.`)
    }
  }

  async function handleDeleteQ(id: string) {
    await deleteQuestion(id)
    if (selectedDiscipline) {
      reload(selectedDiscipline.id)
    }
    setDeleteQId(null)
    setSelectedIds(prev => prev.filter(sid => sid !== id))
  }

  async function handleBulkDelete() {
    if (selectedIds.length === 0) return
    setIsDeleting(true)
    try {
      await deleteQuestions(selectedIds)
      if (selectedDiscipline) reload(selectedDiscipline.id)
      setSelectedIds([])
      setBulkDeleteModal(false)
    } catch (err) {
      console.error(err)
    } finally {
      setIsDeleting(false)
    }
  }

  async function handleEmptyDiscipline() {
    if (!selectedDiscipline) return
    setIsDeleting(true)
    try {
      await deleteQuestionsByDiscipline(selectedDiscipline.id)
      reload(selectedDiscipline.id)
      setSelectedIds([])
      setEmptyDiscModal(false)
    } catch (err) {
      console.error(err)
    } finally {
      setIsDeleting(false)
    }
  }

  const filteredQuestions = questions.filter(q => {
    if (!searchQuery.trim()) return true
    const term = searchQuery.toLowerCase().trim()
    const matchText = q.text?.toLowerCase().includes(term)
    const matchChoices = q.choices?.some(c => c.text.toLowerCase().includes(term))
    const matchPairs = q.pairs?.some(p => p.left.toLowerCase().includes(term) || p.right.toLowerCase().includes(term))
    const matchType = (TYPE_LABELS[q.type] || "").toLowerCase().includes(term)
    return matchText || matchChoices || matchPairs || matchType
  })

  const toggleSelectAll = () => {
    const currentVisibleIds = filteredQuestions.map(q => q.id)
    const allVisibleSelected = currentVisibleIds.length > 0 && currentVisibleIds.every(id => selectedIds.includes(id))
    
    if (allVisibleSelected) {
      setSelectedIds(prev => prev.filter(id => !currentVisibleIds.includes(id)))
    } else {
      setSelectedIds(prev => Array.from(new Set([...prev, ...currentVisibleIds])))
    }
  }

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(sid => sid !== id) : [...prev, id]
    )
  }


  const discToDelete = disciplines.find((d) => d.id === deleteDiscId)
  const qToDelete = questions.find((q) => q.id === deleteQId)

  return (
    <div className="flex h-full min-h-[600px] gap-0 rounded-2xl border border-border/50 overflow-hidden bg-background premium-shadow">
      {/* Left: Disciplines */}
      <div className="w-80 flex-shrink-0 flex flex-col border-r border-border/50 bg-muted/20">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/50">
          <span className="text-sm font-bold text-foreground">Disciplinas</span>
          <Button
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0"
            onClick={() => { setEditingDisc(null); setDiscModal(true) }}
            aria-label="Nova disciplina"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto py-2 px-2 space-y-1">
          {disciplines.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
              Nenhuma disciplina cadastrada
            </div>
          ) : (
            disciplines.map((d) => {
              const count = questionCounts[d.id]
              const active = selectedDiscipline?.id === d.id
              return (
                <div
                  key={d.id}
                  className={`group flex items-center gap-3 px-3 py-3 cursor-pointer rounded-xl transition-all ${active ? "accent-gradient text-white shadow-md" : "hover:bg-muted/50 text-foreground"
                    }`}
                  onClick={() => handleSelectDisc(d)}
                >
                  <div className={`p-1.5 rounded-lg ${active ? "bg-white/20" : "bg-muted"}`}>
                    <BookOpen className={`h-4 w-4 flex-shrink-0 ${active ? "text-white" : "text-muted-foreground"}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-bold truncate ${active ? "text-white" : "text-foreground"}`}>{d.name}</p>
                    <p className={`text-[10px] uppercase font-bold tracking-wider ${active ? "text-white/70" : "text-muted-foreground"}`}>{count === undefined ? "Carregando questões" : `${count} ${count === 1 ? "questão" : "questões"}`}</p>
                  </div>
                  {active && <ChevronRight className="h-4 w-4 flex-shrink-0 text-white" />}
                  <div className={`flex-shrink-0 flex gap-0.5 ${active ? "opacity-100" : "opacity-0 group-hover:opacity-100"} transition-opacity`}>
                    <button
                      onClick={(e) => { e.stopPropagation(); setEditingDisc(d); setDiscModal(true) }}
                      className={`p-1 rounded-lg transition-colors ${active ? "hover:bg-white/20 text-white" : "hover:bg-primary/10 text-muted-foreground hover:text-primary"}`}
                      aria-label="Editar disciplina"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    {isMaster && (
                      <button
                        onClick={(e) => { e.stopPropagation(); setDeleteDiscId(d.id) }}
                        className={`p-1 rounded-lg transition-colors ${active ? "hover:bg-white/20 text-white" : "hover:bg-destructive/10 text-muted-foreground hover:text-destructive"}`}
                        aria-label="Excluir disciplina"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* Right: Questions */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex flex-wrap items-center justify-between px-5 py-3 border-b border-border bg-muted/5 gap-3">
          <div className="flex items-center gap-3 shrink-0">
            {questions.length > 0 && (
              <div className="flex items-center gap-2 pr-3 border-r border-border">
                <Checkbox 
                  checked={filteredQuestions.length > 0 && filteredQuestions.every(q => selectedIds.includes(q.id))}
                  onCheckedChange={toggleSelectAll}
                  aria-label="Selecionar todas as questões"
                />
              </div>
            )}
            <div>
              <span className="text-sm font-semibold text-foreground">
                {selectedDiscipline ? selectedDiscipline.name : "Selecione uma disciplina"}
              </span>
              {selectedDiscipline?.description && (
                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tight">{selectedDiscipline.description}</p>
              )}
            </div>
          </div>

          {/* Search Bar */}
          {selectedDiscipline && questions.length > 0 && (
            <div className="relative flex-1 min-w-[180px] max-w-xs md:max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                type="text"
                placeholder="Buscar por iniciais, texto, gabarito..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-8 h-9 text-xs bg-background rounded-lg border-border focus-visible:ring-1"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5 rounded-full"
                  title="Limpar busca"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          )}

          {selectedDiscipline && (
            <div className="flex items-center gap-2">
              {selectedIds.length > 0 ? (
                <div className="flex items-center gap-2 mr-2 animate-in fade-in slide-in-from-right-2">
                  <span className="text-xs font-bold text-primary mr-2">{selectedIds.length} selecionada{selectedIds.length !== 1 ? 's' : ''}</span>
                  <Button
                    size="sm"
                    variant="destructive"
                    className="h-8"
                    onClick={() => setBulkDeleteModal(true)}
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-1.5" /> Excluir
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2 mr-2">
                  {questions.length > 0 && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-muted-foreground hover:text-destructive h-8 text-[11px] font-bold"
                      onClick={() => setEmptyDiscModal(true)}
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-1.5" /> Esvaziar
                    </Button>
                  )}
                </div>
              )}
              
              <div className="flex items-center gap-2 border-l border-border pl-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-200"
                  onClick={() => setAiModal(true)}
                >
                  <Sparkles className="h-4 w-4 mr-1.5" /> Gerar com IA
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => selectedDiscipline && printDisciplineQuestionsPDF(selectedDiscipline, questions)}
                  className="bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
                >
                  <Download className="h-4 w-4 mr-1.5" /> Baixar PDF
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setImportModal(true)}
                >
                  <Upload className="h-4 w-4 mr-1.5" /> Importar Lote
                </Button>
                <Button
                  size="sm"
                  onClick={() => { setEditingQ(null); setQModal(true) }}
                >
                  <Plus className="h-4 w-4 mr-1.5" /> Nova Questão
                </Button>
              </div>
            </div>
          )}
        </div>


        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
          {!selectedDiscipline ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-2">
              <BookOpen className="h-10 w-10 opacity-30" />
              <p className="text-sm">Selecione uma disciplina para ver suas questões</p>
            </div>
          ) : questions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-3">
              <AlignLeft className="h-10 w-10 opacity-30" />
              <p className="text-sm">Nenhuma questão cadastrada nesta disciplina</p>
              <Button size="sm" variant="outline" onClick={() => { setEditingQ(null); setQModal(true) }}>
                <Plus className="h-3.5 w-3.5 mr-1.5" /> Adicionar primeira questão
              </Button>
            </div>
          ) : filteredQuestions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-3 py-16">
              <Search className="h-10 w-10 opacity-30" />
              <p className="text-sm font-medium">Nenhuma questão encontrada para &quot;{searchQuery}&quot;</p>
              <Button size="sm" variant="outline" onClick={() => setSearchQuery("")}>
                Limpar busca
              </Button>
            </div>
          ) : (
            filteredQuestions.map((q) => {
              const originalIndex = questions.findIndex(item => item.id === q.id) + 1
              return (
              <div
                key={q.id}
                className={cn(
                  "group flex items-start gap-3 p-4 rounded-xl border transition-all duration-200",
                  selectedIds.includes(q.id) 
                    ? "border-primary bg-primary/5 shadow-sm" 
                    : "border-border bg-background hover:border-primary/30"
                )}
              >
                <div className="flex flex-col items-center gap-3">
                  <Checkbox 
                    checked={selectedIds.includes(q.id)}
                    onCheckedChange={() => toggleSelect(q.id)}
                    className="mt-1"
                  />
                  <div className={cn(
                    "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors",
                    selectedIds.includes(q.id) ? "bg-primary text-white" : "bg-primary/10 text-primary"
                  )}>
                    {originalIndex}
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${q.type === "multiple-choice" ? "bg-blue-100 text-blue-700" :
                      q.type === "true-false" ? "bg-amber-100 text-amber-700" :
                        "bg-purple-100 text-purple-700"
                      }`}>
                      {TYPE_ICONS[q.type]}
                      {TYPE_LABELS[q.type]}
                    </span>
                    <span className="text-xs text-muted-foreground">{q.points} pt{q.points !== 1 ? "s" : ""}</span>
                  </div>
                  <p className="text-sm text-foreground leading-relaxed">{q.text}</p>
                  {q.type === "multiple-choice" && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {q.choices.map((c) => (
                        <span
                          key={c.id}
                          className={`text-xs px-2 py-0.5 rounded ${c.id === q.correctAnswer
                            ? "bg-green-100 text-green-700 font-semibold"
                            : "bg-muted text-muted-foreground"
                            }`}
                        >
                          {c.id === q.correctAnswer && <Check className="inline h-3 w-3 mr-0.5" />}
                          {c.text}
                        </span>
                      ))}
                    </div>
                  )}
                  {q.type === "true-false" && (
                    <span className="mt-1 inline-block text-xs px-2 py-0.5 rounded bg-green-100 text-green-700 font-semibold">
                      Gabarito: {q.correctAnswer === "true" ? "Verdadeiro" : "Falso"}
                    </span>
                  )}
                </div>
                <div className="flex-shrink-0 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0"
                    onClick={() => { setEditingQ(q); setQModal(true) }}
                    aria-label="Editar questão"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => setDeleteQId(q.id)}
                    aria-label="Excluir questão"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            )})
          )}
        </div>
      </div>

      {/* Discipline Modal */}
      <DisciplineModal
        open={discModal}
        discipline={editingDisc}
        onClose={() => setDiscModal(false)}
        onSave={reload}
      />

      {/* Question Modal */}
      {selectedDiscipline && (
        <QuestionModal
          open={qModal}
          question={editingQ}
          disciplineId={selectedDiscipline.id}
          onClose={() => setQModal(false)}
          onSave={() => {
            if (selectedDiscipline) reload(selectedDiscipline.id)
          }}
        />
      )}

      {/* AI Generator Modal */}
      <Dialog open={aiModal} onOpenChange={setAiModal}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden bg-background border-border max-h-[90vh]">
          <VisuallyHidden>
            <DialogTitle>Gerador de Questões com IA</DialogTitle>
          </VisuallyHidden>
          <div className="overflow-y-auto max-h-[90vh]">
            <AIQuestionGenerator
              disciplines={disciplines}
              defaultDisciplineId={selectedDiscipline?.id}
              onQuestionsAdded={(assessmentCreated) => {
                setAiModal(false)
                if (selectedDiscipline) {
                  reload(selectedDiscipline.id)
                }
                if (assessmentCreated) {
                  // If we added a way to switch tabs to "Assessments", we would do it here.
                  // For now, reload the current discipline's questions is enough.
                }
              }}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Bulk Import Modal */}
      <BulkImportModal
        open={importModal}
        disciplineId={selectedDiscipline?.id ?? ""}
        onClose={() => setImportModal(false)}
        onSave={() => {
          if (selectedDiscipline) reload(selectedDiscipline.id)
        }}
      />

      {/* Delete Discipline Confirm */}
      <AlertDialog open={!!deleteDiscId} onOpenChange={(o) => !o && setDeleteDiscId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir disciplina</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir <strong>{discToDelete?.name}</strong>? Todas as questões vinculadas a esta disciplina também serão excluídas. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteDiscId && handleDeleteDisc(deleteDiscId)}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Question Confirm */}
      <AlertDialog open={!!deleteQId} onOpenChange={(o) => !o && setDeleteQId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir questão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta questão? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteQId && handleDeleteQ(deleteQId)}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Delete Confirm */}
      <AlertDialog open={bulkDeleteModal} onOpenChange={setBulkDeleteModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir questões selecionadas</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir as <strong>{selectedIds.length} questões</strong> selecionadas? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleBulkDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Excluindo..." : "Excluir Selecionadas"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Empty Discipline Confirm */}
      <AlertDialog open={emptyDiscModal} onOpenChange={setEmptyDiscModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Esvaziar disciplina</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir <strong>TODAS</strong> as questões da disciplina <strong>{selectedDiscipline?.name}</strong>? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleEmptyDiscipline}
              disabled={isDeleting}
            >
              {isDeleting ? "Esvaziando..." : "Esvaziar Tudo"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>

  )
}
