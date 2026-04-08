"use client"

import { useState, useEffect } from "react"
import { X, ChevronRight, ChevronLeft, User, Phone, MapPin, Church, BookOpen, Loader2, CheckCircle2, AlertCircle, Copy, MessageCircle } from "lucide-react"
import { getClasses, getClassSchedules, type ClassRoom, type ClassSchedule } from "@/lib/store"
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface EnrollmentFormProps {
    onClose: () => void
    onSuccess?: () => void
}

type Step = "personal" | "class"

interface FormData {
    name: string
    cpf: string
    phone: string
    address: string
    church: string
    pastor: string
    classId: string
}

const EMPTY_FORM: FormData = { name: "", cpf: "", phone: "", address: "", church: "", pastor: "", classId: "" }

function formatCPF(v: string) {
    return v.replace(/\D/g, "").replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d{1,2})$/, "$1-$2").slice(0, 14)
}
function formatPhone(v: string) {
    return v.replace(/\D/g, "").replace(/(\d{2})(\d)/, "($1) $2").replace(/(\d{5})(\d)/, "$1-$2").slice(0, 15)
}

export function EnrollmentForm({ onClose, onSuccess }: EnrollmentFormProps) {
    const [step, setStep] = useState<Step>("personal")
    const [form, setForm] = useState<FormData>(EMPTY_FORM)
    const [classes, setClasses] = useState<ClassRoom[]>([])
    const [schedules, setSchedules] = useState<ClassSchedule[]>([])

    const [loading, setLoading] = useState(true)

    // Enrollment state
    const [enrollmentDetails, setEnrollmentDetails] = useState<{ enrollmentNumber: string, name: string } | null>(null)

    // Success
    const [success, setSuccess] = useState(false)
    const [enrollError, setEnrollError] = useState("")
    const [creating, setCreating] = useState(false)
    const [exitConfirmOpen, setExitConfirmOpen] = useState(false)

    useEffect(() => {
        async function load() {
            const [cls, scheds] = await Promise.all([
                getClasses(), getClassSchedules()
            ])
            setClasses(cls)
            setSchedules(scheds)
            setLoading(false)
        }
        load()
    }, [])

    const isPersonalValid = form.name.trim() && form.cpf.length >= 14 && form.phone.length >= 14 && form.address.trim() && form.church.trim() && form.pastor.trim()
    const isClassValid = !!form.classId

    async function handleConfirmEnrollment() {
        if (creating) return
        setCreating(true)
        try {
            const res = await fetch("/api/enrollment/create", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...form })
            })
            const body = await res.json()
            if (!res.ok) throw new Error(body.error || "Erro ao criar matrícula")
            setEnrollmentDetails({ enrollmentNumber: body.enrollmentNumber, name: form.name })
            setSuccess(true)
        } catch (e: any) {
            setEnrollError(e.message)
            alert("Erro ao realizar matrícula: " + e.message)
        } finally {
            setCreating(false)
        }
    }

    function handleAttemptClose() {
        if (success) {
            onClose()
        } else {
            setExitConfirmOpen(true)
        }
    }

    if (success) {
        const selectedClass = classes.find(c => c.id === form.classId)
        let whatsappGroupLink = ""
        const classNameStr = (selectedClass?.name || "").toLowerCase()
        if (classNameStr.includes("alpha")) {
            whatsappGroupLink = "https://chat.whatsapp.com/IuAPUAYZpurBIPisnxgVug"
        } else if (classNameStr.includes("beta")) {
            whatsappGroupLink = "https://chat.whatsapp.com/IHOwW3beRo4CDdxegzJsQs"
        } else if (classNameStr.includes("omega") || classNameStr.includes("ômega")) {
            whatsappGroupLink = "https://chat.whatsapp.com/JJU7yF8vmqH9l42LVHl3GA"
        }

        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                <div className="bg-card rounded-2xl shadow-2xl w-full max-w-md p-8 text-center flex flex-col items-center">
                    <div className="flex justify-center mb-6">
                        <div className="h-20 w-20 rounded-full bg-green-50 flex items-center justify-center border border-green-100 shadow-sm">
                            <CheckCircle2 className="h-10 w-10 text-green-600" />
                        </div>
                    </div>
                    <h2 className="text-3xl font-serif font-bold text-foreground mb-2">
                        Matrícula Realizada!
                    </h2>
                    <p className="text-muted-foreground mb-8">
                        Sua matrícula foi registrada com sucesso. Seja bem-vindo ao Instituto Bíblico!
                    </p>

                    <div className="w-full bg-muted/40 border border-border rounded-2xl p-6 text-left mb-8 shadow-sm">
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4">Número de Matrícula</p>

                        <div className="space-y-4">
                            <div>
                                <div className="flex items-center justify-between bg-background border border-border rounded-lg p-3">
                                    <span className="font-mono text-xl font-bold tracking-widest text-primary">{enrollmentDetails?.enrollmentNumber}</span>
                                    <button
                                        onClick={() => {
                                            if (enrollmentDetails?.enrollmentNumber) {
                                                navigator.clipboard.writeText(enrollmentDetails.enrollmentNumber);
                                            }
                                        }}
                                        className="text-xs flex items-center gap-1.5 bg-accent/10 hover:bg-accent/20 text-accent font-semibold px-2 py-1.5 rounded-md transition-colors"
                                    >
                                        <Copy className="h-3.5 w-3.5" /> Copiar
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {whatsappGroupLink && (
                        <a 
                            href={whatsappGroupLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full flex items-center justify-center gap-2 bg-[#25D366] text-white font-bold py-3.5 rounded-xl hover:bg-[#20bd5a] transition-colors shadow-md mb-3"
                        >
                            <MessageCircle className="h-5 w-5" />
                            Entrar no grupo de WhatsApp
                        </a>
                    )}

                    <button onClick={() => { onSuccess?.(); onClose() }} className="w-full bg-accent text-accent-foreground font-bold py-3.5 rounded-xl hover:bg-accent/90 transition-colors shadow-md mt-2">
                        Concluir e Ir para o Portal
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-card rounded-2xl shadow-2xl w-full max-w-lg max-h-[95vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-primary text-primary-foreground rounded-t-2xl shrink-0">
                    <div>
                        <h2 className="font-bold text-lg">Faça sua Matrícula</h2>
                        <p className="text-xs text-primary-foreground/70">Instituto Bíblico das Assembléias de Deus</p>
                    </div>
                    <button onClick={handleAttemptClose} className="rounded-full p-1.5 hover:bg-white/10 transition-colors">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Step Indicator */}
                <div className="flex px-6 py-3 gap-2 border-b border-border shrink-0">
                    {((["personal", "class"] as Step[])).map((s, i) => (
                        <div key={s} className="flex items-center gap-2">
                            <div className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold ${step === s ? "bg-accent text-accent-foreground" : i < ["personal", "class"].indexOf(step) ? "bg-green-500 text-white" : "bg-muted text-muted-foreground"}`}>{i + 1}</div>
                            <span className={`text-xs hidden sm:block ${step === s ? "font-semibold text-foreground" : "text-muted-foreground"}`}>{["Dados Pessoais", "Escolha da Turma"][i]}</span>
                            {i < 1 && <ChevronRight className="h-3 w-3 text-muted-foreground" />}
                        </div>
                    ))}
                </div>

                <div className="overflow-y-auto flex-1 p-6">
                    {loading ? (
                        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 text-accent animate-spin" /></div>
                    ) : step === "personal" ? (
                        <div className="space-y-4">
                            <h3 className="font-semibold text-foreground flex items-center gap-2"><User className="h-4 w-4 text-accent" /> Dados Pessoais</h3>
                            {[
                                { label: "Nome Completo *", key: "name", icon: User, placeholder: "Seu nome completo", type: "text" },
                                { label: "CPF *", key: "cpf", icon: User, placeholder: "000.000.000-00", type: "text" },
                                { label: "Telefone/WhatsApp *", key: "phone", icon: Phone, placeholder: "(00) 00000-0000", type: "tel" },
                                { label: "Endereço Residencial *", key: "address", icon: MapPin, placeholder: "Rua, número, bairro e cidade", type: "text" },
                                { label: "Nome da Igreja *", key: "church", icon: Church, placeholder: "Nome da sua congregação", type: "text" },
                                { label: "Nome do Pastor *", key: "pastor", icon: User, placeholder: "Nome do pastor responsável", type: "text" },
                            ].map(({ label, key, icon: Icon, placeholder, type }) => (
                                <div key={key}>
                                    <label className="text-xs font-semibold text-muted-foreground block mb-1">{label}</label>
                                    <div className="relative">
                                        <Icon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <input
                                            type={type}
                                            className="w-full border border-input rounded-xl pl-9 pr-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-accent"
                                            placeholder={placeholder}
                                            value={form[key as keyof FormData]}
                                            onChange={e => {
                                                let val = e.target.value
                                                if (key === "cpf") val = formatCPF(val)
                                                if (key === "phone") val = formatPhone(val)
                                                setForm(f => ({ ...f, [key]: val }))
                                            }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <h3 className="font-semibold text-foreground flex items-center gap-2"><BookOpen className="h-4 w-4 text-accent" /> Escolha sua Turma</h3>
                            {classes.length === 0 ? (
                                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-700">
                                    <AlertCircle className="h-4 w-4 inline mr-2" />Nenhuma turma disponível no momento.
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {classes.map(c => (
                                        <button
                                            key={c.id}
                                            onClick={() => setForm(f => ({ ...f, classId: c.id }))}
                                            className={`w-full text-left rounded-xl border-2 p-4 transition-all ${form.classId === c.id ? "border-accent bg-accent/5" : "border-border hover:border-accent/50"}`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="font-semibold text-sm">{c.name}</p>
                                                    <div className="text-xs text-muted-foreground mt-0.5 space-y-0.5">
                                                        <p>
                                                            {(({ morning: "Manhã", afternoon: "Tarde", evening: "Noite", ead: "EAD/Online", hibrido: "Híbrido" } as any)[c.shift]) || c.shift}
                                                        </p>
                                                        {schedules.filter(s => s.classId === c.id).length > 0 ? (
                                                            <div className="flex flex-col gap-0.5">
                                                                {schedules.filter(s => s.classId === c.id).map(s => (
                                                                    <p key={s.id} className="text-[10px] font-medium text-primary/80 uppercase tracking-tight">
                                                                        {s.dayOfWeek} • {s.timeStart.substring(0, 5)} - {s.timeEnd.substring(0, 5)}
                                                                    </p>
                                                                ))}
                                                            </div>
                                                        ) : (
                                                            c.dayOfWeek && (
                                                                <p className="text-[10px] uppercase">{c.dayOfWeek}</p>
                                                            )
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className={`text-sm font-bold ${c.maxStudents - (c.studentCount || 0) <= 5 ? "text-destructive" : "text-accent"}`}>
                                                        {Math.max(0, c.maxStudents - (c.studentCount || 0))} vagas restantes
                                                    </p>
                                                    {form.classId === c.id && <CheckCircle2 className="h-4 w-4 text-green-500 ml-auto mt-1" />}
                                                    {c.maxStudents - (c.studentCount || 0) <= 0 && <span className="text-[10px] font-bold text-destructive uppercase">Esgotado</span>}
                                                </div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer Nav */}
                {!loading && (
                    <div className="px-6 py-4 border-t border-border flex gap-3 shrink-0">
                        {step !== "personal" && (
                            <button onClick={() => setStep("personal")} className="flex-1 flex items-center justify-center gap-2 border border-border rounded-xl py-3 text-sm font-medium hover:bg-muted transition-colors">
                                <ChevronLeft className="h-4 w-4" /> Voltar
                            </button>
                        )}
                        {step === "personal" ? (
                             <button
                                onClick={() => setStep("class")}
                                disabled={!isPersonalValid}
                                className="flex-1 flex items-center justify-center gap-2 bg-accent text-accent-foreground font-bold rounded-xl py-3 text-sm disabled:opacity-50 hover:bg-accent/90 transition-colors"
                            >
                                Próximo <ChevronRight className="h-4 w-4" />
                            </button>
                        ) : (
                            <button
                                onClick={handleConfirmEnrollment}
                                disabled={creating || !isClassValid}
                                className="flex-1 flex items-center justify-center gap-2 bg-accent text-accent-foreground font-bold rounded-xl py-3 text-sm disabled:opacity-50 hover:bg-accent/90 transition-colors"
                            >
                                {creating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
                                Finalizar Matrícula
                            </button>
                        )}
                    </div>
                )}
            </div>

            <AlertDialog open={exitConfirmOpen} onOpenChange={setExitConfirmOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Matrícula não concluída</AlertDialogTitle>
                        <AlertDialogDescription>
                            Sua matrícula ainda não foi finalizada. Se você sair agora, seus dados não serão salvos. Tem certeza que deseja sair?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Continuar Matrícula</AlertDialogCancel>
                        <AlertDialogAction onClick={onClose} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Sair e Cancelar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
