"use client"

import { useState, useRef, useEffect } from "react"
import { useChat } from "@ai-sdk/react"
import {
    Send, Bot, User, Loader2, Paperclip, X, FileText, ImageIcon,
    Check, Sparkles, AlertCircle, Trash2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
    type Discipline,
} from "@/lib/store"

interface Props {
    selectedDiscipline?: Discipline
}

export function AIAssistantChat({ selectedDiscipline }: Props) {
    const [input, setInput] = useState("")
    const scrollRef = useRef<HTMLDivElement>(null)

    const initialMessages = [
        {
            id: "welcome",
            role: "assistant",
            content: `Olá! Sou seu **Assistente de Prompt Teológico**. 
            
Como o sistema agora utiliza IAs externas (como ChatGPT ou Gemini), eu ajudarei você a preparar o comando perfeito para elas.
${selectedDiscipline ? `\nEstou configurado para a disciplina de **${selectedDiscipline.name}**.` : ""}

**Como usar:**
1. Me diga qual o tema da aula ou anexe um texto/imagem.
2. Eu gerarei um prompt técnico otimizado para você copiar.
3. Você cola na sua IA favorita e traz o resultado de volta para o sistema.`
        }
    ]

    const [messages, setMessages] = useState<any[]>(initialMessages)

    function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
        setInput(e.target.value)
    }

    async function onChatSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        if (!input.trim()) return

        const userMsg = input.trim()
        setInput("")

        const newMessages = [...messages, { id: uid(), role: "user", content: userMsg }]
        setMessages(newMessages)

        const loadingId = uid()
        setMessages([...newMessages, { id: loadingId, role: "assistant", content: "...", isLoading: true }])

        // Simula uma "geração de prompt" rápida baseada no pedido
        setTimeout(() => {
            const assistantMsg = {
                id: uid(),
                role: "assistant",
                content: `Aqui está uma sugestão de prompt baseada no seu pedido:
                
---
"Atue como um Professor de Teologia. Com base no tema '${userMsg}'${selectedDiscipline ? ` para a disciplina ${selectedDiscipline.name}` : ""}, elabore um roteiro de 5 questões acadêmicas de nível acadêmico, estruturadas com Gabarito e Fundamentação Teológica."
---

Deseja que eu adicione mais detalhes técnicos ou mude o formato das questões?`
            }
            setMessages([...newMessages, assistantMsg])
        }, 1000)
    }

    return (
        <div className="flex flex-col h-[550px] bg-background border border-border rounded-2xl overflow-hidden premium-shadow">
            {/* Header */}
            <div className="bg-primary/5 border-b border-border px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
                        <MessageSquare className="h-5 w-5 text-primary-foreground" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-foreground">Assistente de Prompts</h3>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold tracking-tighter">Preparação para IA Externa</p>
                    </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setMessages(initialMessages)} className="h-8 text-xs text-muted-foreground hover:text-destructive">
                    <Trash2 className="h-3.5 w-3.5 mr-1" /> Reiniciar
                </Button>
            </div>

            {/* Messages */}
            <ScrollArea ref={scrollRef} className="flex-1 p-6 bg-gradient-to-b from-transparent to-muted/5">
                <div className="flex flex-col gap-6">
                    {messages.map((m: any) => (
                        <div
                            key={m.id}
                            className={`flex items-start gap-4 ${m.role === "user" ? "flex-row-reverse" : "flex-row"}`}
                        >
                            <div className={`flex-shrink-0 h-10 w-10 rounded-xl flex items-center justify-center shadow-sm border ${m.role === "user"
                                ? "bg-accent-gradient text-white border-orange/20"
                                : "bg-white text-primary border-border"
                                }`}>
                                {m.role === "user" ? <User className="h-5 w-5" /> : <Bot className="h-5 w-5" />}
                            </div>
                            <div className={`flex flex-col gap-1.5 max-w-[85%] ${m.role === "user" ? "items-end" : "items-start"}`}>
                                <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${m.role === "user"
                                    ? "bg-muted text-foreground rounded-tr-none"
                                    : "bg-white border border-border text-foreground rounded-tl-none premium-shadow"
                                    }`}>
                                    {m.isLoading ? (
                                        <div className="flex gap-1 py-1">
                                            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce"></span>
                                            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce [animation-delay:0.2s]"></span>
                                            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce [animation-delay:0.4s]"></span>
                                        </div>
                                    ) : (
                                        <p className="whitespace-pre-wrap">{m.content}</p>
                                    )}
                                </div>
                                <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest px-1">
                                    {m.role === "user" ? "Seu Pedido" : "Sugestão do Assistente"}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </ScrollArea>

            {/* Input Area */}
            <div className="p-4 bg-muted/30 border-t border-border mt-auto">
                <form onSubmit={onChatSubmit} className="flex gap-2">
                    <div className="relative flex-1">
                        <Input
                            value={input}
                            onChange={handleInputChange}
                            placeholder="Ex: Gere um roteiro sobre a Trindade..."
                            className="h-11 rounded-xl pr-12 bg-white border-border"
                        />
                        <Button
                            type="submit"
                            size="icon"
                            disabled={!input.trim()}
                            className="absolute right-1.5 top-1.5 h-8 w-8 rounded-lg accent-gradient shadow-md"
                        >
                            <Send className="h-4 w-4" />
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    )
}
    )
}
