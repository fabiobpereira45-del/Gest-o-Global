"use client"

import { useEffect, useState } from "react"
import {
  Sparkles, BookOpen, ListChecks, Check,
  AlertCircle, MessageSquare, Settings2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AIAssistantChat } from "./ai-assistant-chat"
import {
  type Discipline, type QuestionType,
} from "@/lib/store"

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
  disciplines: Discipline[]
  onQuestionsAdded: (assessmentCreated?: boolean) => void
  defaultDisciplineId?: string
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const TYPE_LABELS: Record<QuestionType, string> = {
  "multiple-choice": "Múltipla Escolha",
  "true-false": "Verdadeiro ou Falso",
  "discursive": "Discursiva",
  "incorrect-alternative": "Escolha a Incorreta",
  "fill-in-the-blank": "Completar Lacunas",
  "matching": "Relacionar Colunas"
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function AIQuestionGenerator({ disciplines, defaultDisciplineId }: Props) {
  const [disciplineId, setDisciplineId] = useState(defaultDisciplineId || disciplines[0]?.id || "")
  const [count, setCount] = useState(5)
  const [types, setTypes] = useState<QuestionType[]>(["multiple-choice", "true-false"])
  const [audience, setAudience] = useState("Seminário Teológico / Graduação")
  const [difficulty, setDifficulty] = useState("Intermediário")
  const [copied, setCopied] = useState(false)
  const [sourceText, setSourceText] = useState("")

  useEffect(() => {
    if (defaultDisciplineId) {
      setDisciplineId(defaultDisciplineId)
    }
  }, [defaultDisciplineId])

  const selectedDiscipline = disciplines.find((d) => d.id === disciplineId)

  function toggleType(t: QuestionType) {
    setTypes((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]
    )
  }

  function handleCopyPrompt() {
    const prompt = `Atue como um Professor de Teologia especializado em ${selectedDiscipline?.name || 'Teologia'}.
Sua tarefa é elaborar ${count} questões para uma avaliação acadêmica.

---
PERFIL PEDAGÓGICO:
- Público-Alvo: ${audience}
- Complexidade: ${difficulty}
- Disciplina: ${selectedDiscipline?.name || 'Teologia'}
- Formatos Solicitados: ${types.map(t => TYPE_LABELS[t]).join(", ")}
${sourceText ? `---
TEXTO DE BASE:
${sourceText}` : ""}
---
INSTRUÇÕES DE FORMATO:
Para que eu possa importar no sistema Gestão Global, você DEVE retornar as questões seguindo RIGOROSAMENTE este formato estruturado:

Questão [Número]: [Texto da Questão]
Tipo: [Múltipla Escolha / Verdadeiro ou Falso / Discursiva]
Opção A: [Texto]
Opção B: [Texto]
Opção C: [Texto]
Opção D: [Texto]
Gabarito: [A, B, C ou D / Verdadeiro ou Falso]
Fundamentação: [Breve explicação teográfica da resposta]

---
INICIE A ELABORAÇÃO AGORA:`

    navigator.clipboard.writeText(prompt)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const externalIA = [
    { name: "ChatGPT (OpenAI)", url: "https://chat.openai.com", color: "bg-[#10a37f]" },
    { name: "Gemini (Google)", url: "https://gemini.google.com", color: "bg-[#1a73e8]" },
    { name: "Claude (Anthropic)", url: "https://claude.ai", color: "bg-[#d97757]" },
    { name: "Copilot (Microsoft)", url: "https://copilot.microsoft.com", color: "bg-[#00a1f1]" },
  ]

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-start gap-4 bg-gradient-to-br from-primary/10 via-background to-primary/5 border border-primary/20 rounded-2xl p-5 shadow-inner">
        <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center flex-shrink-0 shadow-lg shadow-primary/20">
          <Sparkles className="h-6 w-6 text-primary-foreground animate-pulse" />
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-foreground text-lg">Assistente de IA Teológica</h3>
          <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
            Configure seu prompt acadêmico abaixo, copie-o e use na sua IA favorita (cada professor usa seus próprios créditos).
            Depois, basta colar o resultado no botão <strong>"Importar Lote"</strong> que fica no banco de questões.
          </p>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3 text-amber-800 animate-in fade-in slide-in-from-top-2">
        <AlertCircle className="h-5 w-5 flex-shrink-0" />
        <p className="text-xs font-medium leading-relaxed">
          <strong>Aviso de Créditos:</strong> Para garantir estabilidade e livre escolha, o sistema não gera questões diretamente via API. 
          Use seus créditos pessoais no ChatGPT/Gemini para maior controle e profundidade teológica.
        </p>
      </div>

      <Tabs defaultValue="prompt" className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-muted/50 p-1 rounded-xl mb-4">
          <TabsTrigger value="prompt" className="rounded-lg data-[state=active]:accent-gradient data-[state=active]:text-white transition-all py-2 gap-2">
            <Settings2 className="h-4 w-4" /> 1. Configurar Prompt
          </TabsTrigger>
          <TabsTrigger value="external" className="rounded-lg data-[state=active]:accent-gradient data-[state=active]:text-white transition-all py-2 gap-2">
            <MessageSquare className="h-4 w-4" /> 2. Abrir IA Externa
          </TabsTrigger>
        </TabsList>

        <TabsContent value="prompt" className="animate-in fade-in slide-in-from-left-4 duration-300">
          <div className="flex flex-col gap-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Configuração Básica */}
              <div className="bg-card border border-border/60 shadow-sm rounded-2xl p-6 flex flex-col gap-4">
                <div className="flex items-center gap-2 border-b border-border/50 pb-3 mb-2">
                  <BookOpen className="h-4 w-4 text-primary" />
                  <h4 className="font-bold text-sm text-foreground">Perfil da Avaliação</h4>
                </div>
                <div className="space-y-4">
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Disciplina</Label>
                    <select
                      value={disciplineId}
                      onChange={(e) => setDisciplineId(e.target.value)}
                      className="h-10 rounded-xl border border-border bg-background px-3 text-sm font-medium focus:ring-2 focus:ring-primary/20 transition-all"
                    >
                      {disciplines.map((d) => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Público-Alvo</Label>
                    <select
                      value={audience}
                      onChange={(e) => setAudience(e.target.value)}
                      className="h-10 rounded-xl border border-border bg-background px-3 text-sm font-medium focus:ring-2 focus:ring-primary/20 transition-all"
                    >
                      <option value="Escola Bíblica (Membros Gerais)">Escola Bíblica (Básico)</option>
                      <option value="Seminário Teológico / Graduação">Seminário Teológico (Normal)</option>
                      <option value="Pós-Graduação / Especialização">Pós / Especialização (Intenso)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Parâmetros IA */}
              <div className="bg-card border border-border/60 shadow-sm rounded-2xl p-6 flex flex-col gap-4">
                <div className="flex items-center gap-2 border-b border-border/50 pb-3 mb-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <h4 className="font-bold text-sm text-foreground">Complexidade e Volume</h4>
                </div>
                <div className="space-y-4">
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Nível Exigido</Label>
                    <select
                      value={difficulty}
                      onChange={(e) => setDifficulty(e.target.value)}
                      className="h-10 rounded-xl border border-border bg-background px-3 text-sm font-medium focus:ring-2 focus:ring-primary/20 transition-all"
                    >
                      <option value="Básico">Básico</option>
                      <option value="Intermediário">Intermediário</option>
                      <option value="Avançado">Avançado</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Qtd. de Questões</Label>
                    <Input
                      type="number"
                      min={1}
                      max={30}
                      value={count}
                      onChange={(e) => setCount(Number(e.target.value))}
                      className="h-10 rounded-xl font-bold"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Formatos e Conteúdo */}
            <div className="bg-card border border-border/60 shadow-sm rounded-2xl p-6">
              <div className="flex items-center gap-2 border-b border-border/50 pb-3 mb-4">
                <ListChecks className="h-4 w-4 text-primary" />
                <h4 className="font-bold text-sm text-foreground">Conteúdo e Modalidades</h4>
              </div>
              
              <div className="space-y-6">
                <div>
                  <Label className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold mb-3 block">Modalidades do Questões</Label>
                  <div className="flex flex-wrap gap-2">
                    {(Object.keys(TYPE_LABELS) as QuestionType[]).map((t) => (
                      <button
                        key={t}
                        onClick={() => toggleType(t)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${types.includes(t)
                          ? "bg-primary text-primary-foreground border-primary shadow-md"
                          : "bg-background text-muted-foreground border-border hover:border-primary/40 hover:bg-muted"
                          }`}
                      >
                        {TYPE_LABELS[t]} {types.includes(t) && <Check className="inline-block w-3 h-3 ml-1" />}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <Label className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold mb-1">Recorte ou Assunto Específico (Opcional)</Label>
                  <textarea
                    placeholder="Cole aqui um texto base, capítulos do livro ou temas específicos que a IA deve abordar..."
                    value={sourceText}
                    onChange={(e) => setSourceText(e.target.value)}
                    className="min-h-[120px] w-full rounded-2xl border border-border bg-background p-4 text-sm resize-none focus:ring-2 focus:ring-primary/20 outline-none transition-all scrollbar-thin overflow-y-auto"
                  />
                  <p className="text-[11px] text-muted-foreground italic">Dica: Quanto mais contexto você fornecer, melhor será a questão gerada.</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-primary/5 rounded-2xl p-6 border border-primary/20">
              <div className="flex flex-col gap-0.5">
                <p className="text-sm font-bold text-foreground">Tudo pronto?</p>
                <p className="text-xs text-muted-foreground">Copie o prompt configurado e leve-o para sua IA.</p>
              </div>
              <Button
                onClick={handleCopyPrompt}
                size="lg"
                className={`min-w-[240px] rounded-xl font-bold h-12 transition-all ${copied ? "bg-green-600 hover:bg-green-700" : "accent-gradient shadow-lg shadow-primary/20"}`}
              >
                {copied ? (
                  <>
                    <Check className="h-5 w-5 mr-2" />
                    Prompt Copiado!
                  </>
                ) : (
                  <>
                    <Sparkles className="h-5 w-5 mr-2" />
                    Gerar e Copiar Prompt
                  </>
                )}
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="external" className="animate-in fade-in slide-in-from-right-4 duration-300">
          <div className="flex flex-col gap-6">
            <div className="bg-muted/30 border border-border rounded-2xl p-6">
              <h4 className="font-bold text-sm text-foreground mb-4 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" /> Sugestões de IAs Teológicas
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {externalIA.map((ia) => (
                  <a
                    key={ia.name}
                    href={ia.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-col items-center justify-center p-6 rounded-2xl bg-card border border-border hover:border-primary hover:shadow-lg transition-all group"
                  >
                    <div className={`h-12 w-12 rounded-2xl ${ia.color} flex items-center justify-center text-white mb-3 shadow-sm group-hover:scale-110 transition-transform`}>
                      <Sparkles className="h-6 w-6" />
                    </div>
                    <span className="text-xs font-bold text-foreground text-center">{ia.name}</span>
                    <span className="text-[10px] text-muted-foreground mt-1">Abrir em nova aba</span>
                  </a>
                ))}
              </div>
            </div>

            <div className="bg-card border border-border rounded-2xl p-8 flex flex-col items-center text-center max-w-2xl mx-auto">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                <Check className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3">O que fazer após gerar as questões?</h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                Se a IA retornar as questões no formato que solicitamos no prompt, você conseguirá importá-las em massa. 
                Vá até o <strong>Banco de Questões</strong> da disciplina correspondente e use o botão <strong>"Importar Lote"</strong>.
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                <div className="px-3 py-1.5 bg-muted rounded-full text-[10px] uppercase font-bold text-muted-foreground border">Copiar questões da IA</div>
                <div className="px-3 py-1.5 bg-muted rounded-full text-[10px] uppercase font-bold text-muted-foreground border">Ir para Banco de Questões</div>
                <div className="px-3 py-1.5 bg-muted rounded-full text-[10px] uppercase font-bold text-muted-foreground border">Colar e Salvar</div>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
