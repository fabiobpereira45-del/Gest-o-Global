"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { GraduationCap, Calendar, Clock, CheckCircle2, AlertCircle, Loader2, ArrowRight, ShieldCheck, MessageCircle } from "lucide-react"
import { getPublicClasses, type ClassRoom } from "@/lib/store"

const SHIFT_LABEL: Record<string, string> = {
    morning: "Manhã",
    afternoon: "Tarde",
    evening: "Noite",
    ead: "EAD/Online",
}

const DAY_LABEL: Record<string, string> = {
    monday: "Segunda-feira",
    tuesday: "Terça-feira",
    wednesday: "Quarta-feira",
    thursday: "Quinta-feira",
    friday: "Sexta-feira",
    saturday: "Sábado",
}

function EnrollmentContent() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const classIdParam = searchParams.get("classId")

    const [step, setStep] = useState<"personal" | "class">("personal")
    const [classes, setClasses] = useState<ClassRoom[]>([])
    const [loadingClasses, setLoadingClasses] = useState(true)
    
    const [form, setForm] = useState({
        name: "",
        cpf: "",
        phone: "",
        address: "",
        church: "",
        pastor: "",
        classId: classIdParam || ""
    })

    const [submitting, setSubmitting] = useState(false)
    const [success, setSuccess] = useState<{ enrollmentNumber: string; studentId: string } | null>(null)
    const [error, setError] = useState<string | null>(null)
    
    useEffect(() => {
        async function load() {
            try {
                const cls = await getPublicClasses()
                setClasses(cls)
                if (classIdParam && cls.find(c => c.id === classIdParam)) {
                    setForm(prev => ({ ...prev, classId: classIdParam }))
                }
            } catch (err) {
                console.error("Erro ao carregar turmas:", err)
            } finally {
                setLoadingClasses(false)
            }
        }
        load()
    }, [classIdParam])

    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (!success && (form.name || form.cpf)) {
                e.preventDefault()
                e.returnValue = "Sua matrícula ainda não foi finalizada. Se você sair agora, seus dados não serão salvos."
            }
        }
        window.addEventListener("beforeunload", handleBeforeUnload)
        return () => window.removeEventListener("beforeunload", handleBeforeUnload)
    }, [success, form.name, form.cpf])

    const isPersonalValid = form.name.trim() && form.cpf.replace(/\D/g, '').length === 11 && form.phone.trim() && form.address.trim() && form.church.trim() && form.pastor.trim()

    async function handleFinalizeEnrollment() {
        if (submitting) return
        setSubmitting(true)
        setError(null)

        try {
            const res = await fetch("/api/enrollment/create", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form)
            })
            const data = await res.json()

            if (!res.ok) throw new Error(data.error || "Erro ao realizar matrícula")

            setSuccess({ enrollmentNumber: data.enrollmentNumber, studentId: data.studentId })
        } catch (err: any) {
            setError(err.message)
        } finally {
            setSubmitting(false)
        }
    }

    function handleWhatsAppConfirm() {
        const message = `Olá! Acabei de realizar minha matrícula no IBAD.\n\n*Dados:* \nNome: ${form.name}\nCPF: ${form.cpf}\nMatrícula: ${success?.enrollmentNumber}\n\n*Gostaria de saber mais sobre as aulas.*`
        const encoded = encodeURIComponent(message)
        window.open(`https://wa.me/5571987483103?text=${encoded}`, "_blank")
    }

    if (success) {
        return (
            <div className="max-w-md mx-auto bg-card border border-border rounded-3xl p-8 shadow-2xl text-center space-y-6 animate-in fade-in zoom-in duration-500">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="h-10 w-10 text-green-600" />
                </div>
                <h2 className="text-3xl font-bold text-foreground">Matrícula Realizada!</h2>
                <p className="text-muted-foreground">
                    Sua matrícula no IBAD foi concluída com sucesso. Você já pode acessar o portal usando seu CPF e a senha padrão <b>IBAD2026</b>.
                </p>
                <div className="bg-muted p-4 rounded-2xl border border-border">
                    <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold">Número de Matrícula</p>
                    <p className="text-2xl font-mono font-bold text-primary">{success.enrollmentNumber}</p>
                </div>
                <div className="space-y-3">
                    <button
                        onClick={() => router.push("/student")}
                        className="w-full bg-primary text-primary-foreground font-bold py-4 rounded-2xl hover:bg-primary/90 transition-all shadow-lg flex items-center justify-center gap-2"
                    >
                        Acessar Portal do Aluno
                    </button>
                    <button
                        onClick={handleWhatsAppConfirm}
                        className="w-full bg-green-600 text-white font-bold py-4 rounded-2xl hover:bg-green-700 transition-all shadow-lg flex items-center justify-center gap-2"
                    >
                        <MessageCircle className="h-5 w-5" /> Falar com a Secretaria
                    </button>
                    <button
                        onClick={() => router.push("/")}
                        className="w-full bg-accent text-accent-foreground font-bold py-4 rounded-2xl hover:bg-accent/90 transition-all shadow-lg"
                    >
                        Voltar para o Início
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-5 gap-8">
            <div className="lg:col-span-2 space-y-6">
                <div className="bg-accent/5 border border-accent/20 rounded-3xl p-6 space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center">
                            <GraduationCap className="h-6 w-6 text-accent-foreground" />
                        </div>
                        <h1 className="text-2xl font-bold">Matrícula Online</h1>
                    </div>
                    <p className="text-muted-foreground text-sm uppercase tracking-wider font-semibold">Instituto de Ensino Teológico - IBAD</p>
                    <div className="space-y-4 pt-4">
                        <div className="flex gap-3">
                            <ShieldCheck className="h-5 w-5 text-green-600 shrink-0" />
                            <p className="text-sm">Processo 100% seguro de inscrição acadêmica.</p>
                        </div>
                        <div className="flex gap-3">
                            <Clock className="h-5 w-5 text-accent shrink-0" />
                            <p className="text-sm">Acesso imediato aos materiais após a finalização.</p>
                        </div>
                    </div>
                </div>

                <div className="hidden lg:block space-y-4">
                    <h3 className="font-bold text-sm text-muted-foreground uppercase px-4">Passos para ingressar</h3>
                    <div className="space-y-2">
                        <div className={`flex items-center gap-3 p-4 rounded-2xl border transition-all ${step === 'personal' ? 'bg-accent/10 border-accent/20 ring-2 ring-accent/5' : 'bg-background/50 border-transparent opacity-60'}`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${step === 'personal' ? 'bg-accent text-accent-foreground' : 'bg-muted text-muted-foreground'}`}>1</div>
                            <span className="text-sm font-medium">Dados básicos</span>
                        </div>
                        <div className={`flex items-center gap-3 p-4 rounded-2xl border transition-all ${step === 'class' ? 'bg-accent/10 border-accent/20 ring-2 ring-accent/5' : 'bg-background/50 border-transparent opacity-60'}`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${step === 'class' ? 'bg-accent text-accent-foreground' : 'bg-muted text-muted-foreground'}`}>2</div>
                            <span className="text-sm font-medium">Selecione sua turma</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="lg:col-span-3">
                <div className="bg-card border border-border rounded-3xl p-6 lg:p-8 shadow-xl space-y-6">
                    {step === 'personal' && (
                        <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="md:col-span-2 space-y-1.5">
                                    <label className="text-xs font-bold text-muted-foreground uppercase ml-1">Nome Completo</label>
                                    <input
                                        required
                                        className="w-full bg-muted/30 border border-border rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-accent transition-all uppercase"
                                        placeholder="Seu nome completo"
                                        value={form.name}
                                        onChange={e => setForm({ ...form, name: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-muted-foreground uppercase ml-1">CPF</label>
                                    <input
                                        required
                                        className="w-full bg-muted/30 border border-border rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-accent transition-all"
                                        placeholder="000.000.000-00"
                                        value={form.cpf}
                                        onChange={e => setForm({ ...form, cpf: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-muted-foreground uppercase ml-1">WhatsApp</label>
                                    <input
                                        required
                                        className="w-full bg-muted/30 border border-border rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-accent transition-all"
                                        placeholder="(00) 00000-0000"
                                        value={form.phone}
                                        onChange={e => setForm({ ...form, phone: e.target.value })}
                                    />
                                </div>
                                <div className="md:col-span-2 space-y-1.5">
                                    <label className="text-xs font-bold text-muted-foreground uppercase ml-1">Endereço Residencial</label>
                                    <input
                                        className="w-full bg-muted/30 border border-border rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-accent transition-all"
                                        placeholder="Rua, Número, Bairro, Cidade"
                                        value={form.address}
                                        onChange={e => setForm({ ...form, address: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-muted-foreground uppercase ml-1">Igreja</label>
                                    <input
                                        className="w-full bg-muted/30 border border-border rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-accent transition-all"
                                        placeholder="Nome da sua igreja"
                                        value={form.church}
                                        onChange={e => setForm({ ...form, church: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-muted-foreground uppercase ml-1">Pastor</label>
                                    <input
                                        className="w-full bg-muted/30 border border-border rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-accent transition-all"
                                        placeholder="Nome do seu pastor"
                                        value={form.pastor}
                                        onChange={e => setForm({ ...form, pastor: e.target.value })}
                                    />
                                </div>
                            </div>
                            <button
                                onClick={() => setStep('class')}
                                disabled={!isPersonalValid}
                                className="w-full bg-primary text-primary-foreground font-bold py-5 rounded-2xl transition-all shadow-xl disabled:opacity-50 flex items-center justify-center gap-3 text-lg"
                            >
                                Avançar <ArrowRight className="h-5 w-5" />
                            </button>
                        </div>
                    )}

                    {step === 'class' && (
                        <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                             <div className="pt-2">
                                <label className="text-xs font-bold text-muted-foreground uppercase ml-1 mb-4 block">Selecione sua Turma</label>
                                {loadingClasses ? (
                                    <div className="flex py-12 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-accent" /></div>
                                ) : (
                                    <div className="grid grid-cols-1 gap-3">
                                        {classes.map(c => {
                                            const remaining = (c.maxStudents || 0) - (c.studentCount || 0)
                                            const isFull = remaining <= 0
                                            return (
                                                <label
                                                    key={c.id}
                                                    className={`
                                                        relative group cursor-pointer border-2 rounded-2xl p-4 transition-all
                                                        ${form.classId === c.id ? "border-accent bg-accent/5 ring-4 ring-accent/10" : "border-border hover:border-accent/40 bg-muted/10"}
                                                        ${isFull ? "opacity-50 grayscale pointer-events-none" : ""}
                                                    `}
                                                >
                                                    <input
                                                        type="radio"
                                                        name="classId"
                                                        value={c.id}
                                                        className="sr-only"
                                                        disabled={isFull}
                                                        checked={form.classId === c.id}
                                                        onChange={e => setForm({ ...form, classId: e.target.value })}
                                                    />
                                                    <div className="flex items-center justify-between">
                                                        <div className="space-y-1">
                                                            <p className="font-bold text-sm tracking-tight">{c.name}</p>
                                                            <div className="flex items-center gap-4 text-[10px] text-muted-foreground font-semibold uppercase">
                                                                <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {DAY_LABEL[c.dayOfWeek || ''] || 'EAD'}</span>
                                                                <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {SHIFT_LABEL[c.shift] || c.shift}</span>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className={`text-xs font-bold ${remaining <= 5 ? "text-red-500" : "text-primary"}`}>
                                                                {isFull ? "Vagas Esgotadas" : `${remaining} vagas`}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </label>
                                            )
                                        })}
                                    </div>
                                )}
                            </div>
                            
                            {error && (
                                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-2xl flex items-center gap-3">
                                    <AlertCircle className="h-5 w-5 shrink-0" />
                                    <p className="text-sm font-medium">{error}</p>
                                </div>
                            )}

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setStep('personal')}
                                    className="flex-1 bg-muted text-foreground font-bold py-4 rounded-2xl hover:bg-muted/80 transition-all text-sm"
                                >
                                    Voltar
                                </button>
                                <button
                                    onClick={handleFinalizeEnrollment}
                                    disabled={!form.classId || submitting}
                                    className="flex-[2] bg-primary text-primary-foreground font-bold py-4 rounded-2xl transition-all shadow-xl disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : "Finalizar Matrícula Grátis"}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default function EnrollmentPage() {
    return (
        <div className="min-h-screen bg-background relative overflow-hidden flex flex-col items-center py-12 px-6">
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden">
                <div className="h-[500px] w-[500px] bg-accent/20 blur-[120px] rounded-full opacity-30 -translate-x-[30%] -translate-y-[20%] animate-pulse" />
                <div className="h-[400px] w-[400px] bg-primary/20 blur-[120px] rounded-full opacity-30 translate-x-[30%] translate-y-[20%]" />
            </div>
            <Suspense fallback={<div className="flex items-center justify-center h-[60vh]"><Loader2 className="h-10 w-10 animate-spin text-accent" /></div>}>
                <EnrollmentContent />
            </Suspense>
        </div>
    )
}
