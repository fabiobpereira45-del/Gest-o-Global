"use client"

import { useEffect, useState, useMemo } from "react"
import { DollarSign, Plus, Eye, CheckCircle2, AlertCircle, Clock, Trash2, Zap, Loader2, Download, FileText, Pencil, TrendingUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog"
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
    type FinancialCharge, type StudentProfile, type FinancialSettings, type Assessment, type Expense, type ExpenseCategory,
    getFinancialCharges, addFinancialCharge, updateFinancialChargeStatus, deleteFinancialCharge, updateFinancialCharge, updateFinancialChargesStatusBatch,
    getFinancialSettings, updateFinancialSettings, getAssessments, triggerN8nWebhook,
    generateMonthlyCharges, getExpenses, addExpense, deleteExpense, updateExpense, getProfessorAccounts, addProfessorAccount, type ProfessorAccount,
    getDisciplines, updateDiscipline, type Discipline, getProfessorSession,
    syncStudentFinancialCharges, syncAllStudentsFinancialChargesBatch

} from "@/lib/store"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from 'recharts'
import { printFinancialReportPDF, printTeacherPaymentReceipt } from "@/lib/pdf"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { createClient } from "@/lib/supabase/client"

export function FinancialManager() {
    const [charges, setCharges] = useState<FinancialCharge[]>([])
    const [expenses, setExpenses] = useState<Expense[]>([])
    const [students, setStudents] = useState<StudentProfile[]>([])
    const [disciplines, setDisciplines] = useState<Discipline[]>([])
    const [settings, setSettings] = useState<FinancialSettings | null>(null)
    const [loading, setLoading] = useState(true)

    // Session check for Master permissions
    const session = typeof window !== "undefined" ? getProfessorSession() : null;
    const isMaster = session?.role === "master";

    // Tab persistence
    const [activeTab, setActiveTab] = useState("dashboard")

    useEffect(() => {
        const savedTab = localStorage.getItem("financialActiveTab")
        if (savedTab) setActiveTab(savedTab)
    }, [])

    useEffect(() => {
        if (activeTab) {
            localStorage.setItem("financialActiveTab", activeTab)
        }
    }, [activeTab])

    // Charge Modal
    const [chargeModal, setChargeModal] = useState(false)

    const [saving, setSaving] = useState(false)

    // Form state
    const [studentId, setStudentId] = useState("")
    const [type, setType] = useState<FinancialCharge["type"]>("monthly")
    const [amount, setAmount] = useState("")
    const [description, setDescription] = useState("")
    const [dueDate, setDueDate] = useState("")

    const [deleteId, setDeleteId] = useState<string | null>(null)
    const [selectedStudent, setSelectedStudent] = useState<StudentProfile | null>(null)
    const [isGenerating, setIsGenerating] = useState(false)

    // Edit Charge State
    const [editingCharge, setEditingCharge] = useState<FinancialCharge | null>(null)
    const [editAmount, setEditAmount] = useState("")
    const [editDescription, setEditDescription] = useState("")
    const [editDueDate, setEditDueDate] = useState("")
    const [editStatus, setEditStatus] = useState<FinancialCharge["status"]>("pending")

    // Filter state
    const [searchName, setSearchName] = useState("")
    const [searchEnrollment, setSearchEnrollment] = useState("")
    const [searchClass, setSearchClass] = useState("all")
    const [allClasses, setAllClasses] = useState<any[]>([])

    // Expense Modal
    const [expenseModal, setExpenseModal] = useState(false)
    const [editExpenseId, setEditExpenseId] = useState<string | null>(null)
    const [expenseCategory, setExpenseCategory] = useState<ExpenseCategory>("outros")
    const [expenseAmount, setExpenseAmount] = useState("")
    const [expenseDescription, setExpenseDescription] = useState("")
    const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0])
    const [expenseDeleteId, setExpenseDeleteId] = useState<string | null>(null)

    // Teacher Receipt Modal
    const [receiptModal, setReceiptModal] = useState(false)
    const [professors, setProfessors] = useState<ProfessorAccount[]>([])
    const [receiptProfessorId, setReceiptProfessorId] = useState<string>("manual")
    const [receiptManualName, setReceiptManualName] = useState("")
    const [receiptAmount, setReceiptAmount] = useState("")
    const [receiptDescription, setReceiptDescription] = useState("")
    const [receiptDate, setReceiptDate] = useState(new Date().toISOString().split('T')[0])
    const [saveAsExpense, setSaveAsExpense] = useState(true)

    // Add Professor Shortcut
    const [showAddProf, setShowAddProf] = useState(false)
    const [newProfName, setNewProfName] = useState("")
    const [newProfEmail, setNewProfEmail] = useState("")
    const [newProfPass, setNewProfPass] = useState("")

    const supabase = createClient()

    async function fetchAllStudents() {
        const { data } = await supabase.from('students').select('*').eq('status', 'active').order('name')
        return data || []
    }

    async function load() {
        setLoading(true)
        try {
            const [c, e, s, config, { data: classesData }, profs, d] = await Promise.all([
                getFinancialCharges(),
                getExpenses(),
                fetchAllStudents(),
                getFinancialSettings(),
                supabase.from('classes').select('*').order('name'),
                getProfessorAccounts(),
                getDisciplines()
            ])
            setCharges(c)
            setExpenses(e)
            setStudents(s)
            setSettings(config)
            setAllClasses(classesData || [])
            setProfessors(profs)
            setDisciplines(d)
        } catch (err) {
            console.error("Erro ao carregar dados financeiros:", err)
        } finally {
            setLoading(false)
        }
    }

    const [settingsModal, setSettingsModal] = useState(false)
    const [tempCard, setTempCard] = useState("")
    const [tempPix, setTempPix] = useState("")
    const [tempEnrollment, setTempEnrollment] = useState("")
    const [tempMonthly, setTempMonthly] = useState("")
    const [tempSecondCall, setTempSecondCall] = useState("")
    const [tempFinalExam, setTempFinalExam] = useState("")
    const [tempMonths, setTempMonths] = useState("")

    useEffect(() => { load() }, [])

    // --- FINANCIAL METRICS & PROJECTIONS ---
    const totalReceipts = useMemo(() => charges.filter(c => c.status === 'paid').reduce((acc, curr) => acc + curr.amount, 0), [charges])
    const projectedReceipts = useMemo(() => charges.filter(c => ['pending', 'late'].includes(c.status)).reduce((acc, curr) => acc + curr.amount, 0), [charges])
    
    const totalExpenses = useMemo(() => expenses.reduce((acc, curr) => acc + curr.amount, 0), [expenses])
    
    // Each realized discipline already generated an Expense. Pending disciplines generate R$ 300.00 each
    const projectedTeacherExpenses = useMemo(() => {
        const pendingDisciplines = disciplines.filter(d => !d.is_realized)
        return pendingDisciplines.length * 300
    }, [disciplines])

    const chartData = [
        {
            name: 'Atual (Realizado)',
            Receitas: totalReceipts,
            Despesas: totalExpenses,
        },
        {
            name: 'Projetado (Pendente)',
            Receitas: projectedReceipts,
            Despesas: projectedTeacherExpenses,
        }
    ]
    // ---------------------------------------

    // Auto-fill amount based on type and settings
    useEffect(() => {
        if (!settings) return
        let val = 0
        if (type === "enrollment") val = settings.enrollmentFee
        else if (type === "monthly") val = settings.monthlyFee
        else if (type === "second_call") val = settings.secondCallFee
        else if (type === "final_exam") val = settings.finalExamFee

        if (val > 0) setAmount(val.toString())
    }, [type, settings])


    async function handleSaveCharge() {
        if (!studentId || !amount || !dueDate || !description.trim()) {
            alert("Preencha todos os campos corretamente.")
            return
        }

        setSaving(true)
        try {
            await addFinancialCharge({
                studentId,
                type,
                amount: parseFloat(amount),
                dueDate,
                description: description.trim()
            })
            setChargeModal(false)
            load()
        } catch (e: any) {
            alert("Erro ao gerar cobrança: " + e.message)
        } finally {
            setSaving(false)
        }
    }

    async function handleStatusChange(id: string, newStatus: FinancialCharge["status"]) {
        try {
            await updateFinancialChargeStatus(id, newStatus)

            if (newStatus === "paid") {
                const charge = charges.find(c => c.id === id)
                if (charge && charge.type === "enrollment") {
                    try {
                        const res = await fetch('/api/student/activate', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ studentId: charge.studentId })
                        })
                        if (!res.ok) {
                            console.error("Falha ao ativar aluno:", await res.text())
                        }
                    } catch (actErr) {
                        console.error("Erro de rede na ativação:", actErr)
                    }
                }
            }

            load()
        } catch (e: any) {
            alert("Erro ao atualizar status: " + e.message)
        }
    }

    async function handleTriggerReminders() {
        setSaving(true)
        try {
            const now = new Date()
            const tomorrow = new Date(now)
            tomorrow.setDate(tomorrow.getDate() + 1)

            const formatDateStr = (d: Date) => d.toISOString().split('T')[0]
            const tomorrowStr = formatDateStr(tomorrow)
            const todayStr = formatDateStr(now)

            // 1. Check Financial Reminders
            for (const c of charges) {
                if (c.status === 'paid') continue
                const student = students.find(s => s.id === c.studentId)
                if (!student) continue

                if (c.dueDate === tomorrowStr) {
                    await triggerN8nWebhook('lembrete_financeiro_amanha', {
                        type: 'finance_upcoming',
                        name: student.name,
                        phone: student.phone,
                        amount: c.amount,
                        dueDate: c.dueDate
                    })
                } else if (new Date(c.dueDate) < now && c.status === 'pending') {
                    // Overdue logic
                    await triggerN8nWebhook('financeiro_atrasado', {
                        type: 'finance_overdue',
                        name: student.name,
                        phone: student.phone,
                        amount: c.amount,
                        dueDate: c.dueDate
                    })
                }
            }

            // 2. Check Exam Reminders
            const assessments = await getAssessments()
            for (const a of assessments) {
                if (!a.isPublished || !a.openAt) continue
                const openDate = formatDateStr(new Date(a.openAt))

                if (openDate === tomorrowStr || openDate === todayStr) {
                    const triggerId = openDate === tomorrowStr ? 'lembrete_prova_amanha' : 'lembrete_prova_hoje'
                    for (const s of students) {
                        await triggerN8nWebhook(triggerId, {
                            type: openDate === tomorrowStr ? 'exam_tomorrow' : 'exam_today',
                            name: s.name,
                            phone: s.phone,
                            title: a.title,
                            date: openDate,
                            open_time: a.openAt ? new Date(a.openAt).toLocaleTimeString("pt-BR") : "N/A",
                            close_time: a.closeAt ? new Date(a.closeAt).toLocaleTimeString("pt-BR") : "N/A"
                        })
                    }
                }
            }

            alert("Disparo de lembretes concluído!")
        } catch (err: any) {
            alert("Erro ao disparar lembretes: " + err.message)
        } finally {
            setSaving(false)
        }
    }

    async function handleGeneratePlan(uid: string) {
        if (!settings?.monthlyFee) {
            alert("Configure a mensalidade nas configurações antes de gerar.")
            return
        }
        if (!confirm("Deseja gerar as 24 mensalidades (Abril 2026 a Março 2028) para este aluno?")) return

        setIsGenerating(true)
        try {
            await generateMonthlyCharges(uid, settings.monthlyFee)
            alert("Mensalidades geradas com sucesso!")
            load()
        } catch (actErr: any) {
            alert("Erro ao gerar mensalidades: " + actErr.message)
        } finally {
            setIsGenerating(false)
        }
    }

    async function handleDelete() {
        if (!deleteId) return
        try {
            await deleteFinancialCharge(deleteId)
            setDeleteId(null)
            load()
        } catch (e: any) {
            alert("Erro ao excluir: " + e.message)
        }
    }

    async function handleEditCharge() {
        if (!editingCharge || !editAmount || !editDueDate || !editDescription.trim()) {
            alert("Preencha todos os campos corretamente.")
            return
        }

        setSaving(true)
        try {
            await updateFinancialCharge(editingCharge.id, {
                amount: parseFloat(editAmount),
                description: editDescription.trim(),
                dueDate: editDueDate
            })
            if (editStatus !== editingCharge.status) {
                await updateFinancialChargeStatus(editingCharge.id, editStatus)
            }
            setEditingCharge(null)
            load()
        } catch (e: any) {
            alert("Erro ao editar cobrança: " + e.message)
        } finally {
            setSaving(false)
        }
    }

    async function handleSaveSettings() {
        if (!settings) return
        setSaving(true)
        try {
            await updateFinancialSettings({
                enrollmentFee: Number(tempEnrollment),
                monthlyFee: Number(tempMonthly),
                secondCallFee: Number(tempSecondCall),
                finalExamFee: Number(tempFinalExam),
                totalMonths: Number(tempMonths),
                creditCardUrl: tempCard,
                pixKey: tempPix
            })
            alert("Configurações salvas com sucesso!")
            setSettingsModal(false)
            load()
        } catch (e: any) {
            alert("Erro ao salvar configurações: " + e.message)
        } finally {
            setSaving(false)
        }
    }

    async function handleSaveExpense() {
        if (!expenseAmount || !expenseDate || !expenseDescription.trim()) {
            alert("Preencha todos os campos da despesa.")
            return
        }
        setSaving(true)
        try {
            if (editExpenseId) {
                await updateExpense(editExpenseId, {
                    category: expenseCategory,
                    description: expenseDescription.trim(),
                    amount: parseFloat(expenseAmount),
                    date: expenseDate
                })
                alert("Despesa atualizada com sucesso!")
            } else {
                await addExpense({
                    category: expenseCategory,
                    description: expenseDescription.trim(),
                    amount: parseFloat(expenseAmount),
                    date: expenseDate
                })
                alert("Despesa registrada com sucesso!")
            }
            setExpenseModal(false)
            setEditExpenseId(null)
            setExpenseDescription("")
            setExpenseAmount("")
            load()
        } catch (e: any) {
            alert("Erro ao salvar despesa: " + e.message)
        } finally {
            setSaving(false)
        }
    }

    async function handleDeleteExpense() {
        if (!expenseDeleteId) return
        try {
            await deleteExpense(expenseDeleteId)
            setExpenseDeleteId(null)
            load()
        } catch (e: any) {
            alert("Erro ao excluir despesa: " + e.message)
        }
    }

    function getStatusBadge(status: string) {
        if (status === 'paid') return <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded font-medium flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> Pago</span>
        if (status === 'late') return <span className="bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded font-medium flex items-center gap-1"><AlertCircle className="h-3 w-3" /> Atrasado</span>
        if (status === 'cancelled') return <span className="bg-muted text-muted-foreground text-xs px-2 py-0.5 rounded font-medium flex items-center gap-1">Cancelado</span>
        if (status === 'bolsa100') return <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded font-medium flex items-center gap-1">Bolsa 100%</span>
        if (status === 'bolsa50') return <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded font-medium flex items-center gap-1">Bolsa 50%</span>
        return <span className="bg-amber-100 text-amber-700 text-xs px-2 py-0.5 rounded font-medium flex items-center gap-1"><Clock className="h-3 w-3" /> Pendente</span>
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-6 w-full max-w-[1400px] mx-auto pb-20">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold font-serif text-foreground">Gestão Financeira</h2>
                    <p className="text-muted-foreground text-sm">Controle de mensalidades e extratos individuais</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => {
                        setTempCard(settings?.creditCardUrl || "")
                        setTempPix(settings?.pixKey || "")
                        setTempEnrollment(settings?.enrollmentFee.toString() || "0")
                        setTempMonthly(settings?.monthlyFee.toString() || "0")
                        setTempSecondCall(settings?.secondCallFee.toString() || "0")
                        setTempFinalExam(settings?.finalExamFee.toString() || "0")
                        setTempMonths(settings?.totalMonths.toString() || "12")
                        setSettingsModal(true)
                    }} className="border-primary text-primary hover:bg-primary/10">
                        Configurar Pagamentos
                    </Button>
                    <Button variant="outline" onClick={() => printFinancialReportPDF(charges, students)} className="border-primary text-primary hover:bg-primary/10">
                        <Download className="h-4 w-4 mr-2" />
                        Exportar PDF
                    </Button>
                    <Button onClick={() => {
                        setStudentId("")
                        setType("monthly")
                        setAmount("")
                        setDescription("")
                        setDueDate("")
                        setChargeModal(true)
                    }}>
                        <Plus className="h-4 w-4 mr-2" />
                        Nova Cobrança
                    </Button>
                    <Button variant="outline" className="border-blue-500 text-blue-600 hover:bg-blue-50" 
                        onClick={async () => {
                            if (!settings) return
                            if (!confirm("Atenção: Deseja sincronizar as mensalidades de TODOS os alunos ativos com as configurações atuais? Isso atualizará valores e parcelas conforme definido.")) return
                            setIsGenerating(true)
                            try {
                                await syncAllStudentsFinancialChargesBatch(settings)
                                alert("Sincronização em lote concluída com sucesso!")
                                load()
                            } catch (e: any) { alert("Erro na sincronização: " + e.message) }
                            finally { setIsGenerating(false) }
                        }}
                        disabled={isGenerating}>
                        <Zap className="h-4 w-4 mr-2" />
                        Sincronizar Todos (Lote)
                    </Button>
                    <Button variant="outline" className="border-accent text-accent hover:bg-accent/10" onClick={() => {
                        setEditExpenseId(null)
                        setExpenseCategory("outros")
                        setExpenseDescription("")
                        setExpenseAmount("")
                        setExpenseDate(new Date().toISOString().split('T')[0])
                        setExpenseModal(true)
                    }}>
                        <Plus className="h-4 w-4 mr-2" />
                        Nova Despesa
                    </Button>
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full sm:w-auto grid-cols-2 md:grid-cols-4 mb-4 gap-1 h-auto p-1 bg-muted/50 rounded-lg">
                    <TabsTrigger value="dashboard" className="h-9 px-4 text-xs font-semibold data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-md"><TrendingUp className="h-3.5 w-3.5 mr-2"/> Painel & Gráficos</TabsTrigger>
                    <TabsTrigger value="charges" className="h-9 px-4 text-xs font-semibold data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-md"><DollarSign className="h-3.5 w-3.5 mr-2"/> Receitas / Cobranças</TabsTrigger>
                    <TabsTrigger value="expenses" className="h-9 px-4 text-xs font-semibold data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-md"><Trash2 className="h-3.5 w-3.5 mr-2"/> Despesas Diversas</TabsTrigger>
                    <TabsTrigger value="lessons" className="h-9 px-4 text-xs font-semibold data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-md"><FileText className="h-3.5 w-3.5 mr-2"/> Aulas (Prolabore)</TabsTrigger>
                </TabsList>

                <TabsContent value="dashboard" className="flex flex-col gap-6">
                    {/* Resumo Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-card border border-border p-5 rounded-xl shadow-sm hover:border-primary/40 transition-colors">
                            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2"><DollarSign className="h-4 w-4 text-green-500"/> Saldo Realizado</h3>
                            <p className={`text-3xl font-black mt-3 ${(totalReceipts - totalExpenses) >= 0 ? 'text-green-600' : 'text-red-600'}`}>R$ {(totalReceipts - totalExpenses).toFixed(2)}</p>
                            <p className="text-xs text-muted-foreground mt-2 border-t border-border/50 pt-2 flex items-center gap-2"><span className="font-bold text-green-500">+{totalReceipts.toFixed(0)} rec.</span> |  <span className="font-bold text-red-500">-{totalExpenses.toFixed(0)} desp.</span></p>
                        </div>
                        <div className="bg-card border border-border p-5 rounded-xl shadow-sm hover:border-primary/40 transition-colors">
                            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2"><Eye className="h-4 w-4 text-blue-500"/> Projeção (Saldo Futuro)</h3>
                            <p className={`text-3xl font-black mt-3 ${(projectedReceipts - projectedTeacherExpenses) >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>R$ {(projectedReceipts - projectedTeacherExpenses).toFixed(2)}</p>
                            <p className="text-xs text-muted-foreground mt-2 border-t border-border/50 pt-2 flex items-center gap-2"><span className="font-bold text-blue-500">+{projectedReceipts.toFixed(0)} cobr. pend.</span> | <span className="font-bold text-orange-500">-{projectedTeacherExpenses.toFixed(0)} aula pend.</span></p>
                        </div>
                        <div className="bg-card border border-orange-200 bg-orange-50/30 p-5 rounded-xl shadow-sm">
                            <h3 className="text-xs font-bold text-orange-700 uppercase tracking-wider flex items-center gap-2"><Clock className="h-4 w-4 text-orange-500"/> Provisão (Professores)</h3>
                            <p className="text-3xl font-black mt-3 text-destructive cursor-help" title="Despesa calculada sobre o total de disciplinas não realizadas">R$ {projectedTeacherExpenses.toFixed(2)}</p>
                            <p className="text-xs text-orange-800/80 mt-2 border-t border-orange-200 pt-2">{disciplines.filter(d => !d.is_realized).length} disciplinas pendentes na grade x R$ 300,00</p>
                        </div>
                    </div>

                    {/* Chart */}
                    <div className="bg-card border border-border rounded-xl p-6 shadow-sm mx-auto w-full" style={{ height: "450px" }}>
                        <h3 className="text-sm font-bold text-foreground mb-6">Comparativo: Panorama Financeiro</h3>
                        <ResponsiveContainer width="100%" height="90%">
                            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" opacity={0.3} vertical={false} />
                                <XAxis dataKey="name" stroke="#888888" fontSize={13} fontWeight="bold" tickLine={false} axisLine={false} />
                                <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `R$${value}`} />
                                <RechartsTooltip formatter={(value: number) => `R$ ${value.toFixed(2)}`} cursor={{fill: 'var(--muted)', opacity: 0.4}} contentStyle={{ borderRadius: '8px', border: '1px solid var(--border)', fontWeight: 'bold' }} />
                                <Legend wrapperStyle={{ paddingTop: "20px" }} />
                                <Bar dataKey="Receitas" fill="#22c55e" radius={[4, 4, 0, 0]} maxBarSize={60} />
                                <Bar dataKey="Despesas" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={60} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </TabsContent>
                
                <TabsContent value="charges" className="flex flex-col gap-6">
                    {/* Filters */}
                    <div className="bg-card border border-border shadow-sm rounded-xl p-4 grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                        <div className="space-y-1.5">
                            <Label className="text-xs font-bold uppercase text-muted-foreground">Nome do Aluno</Label>
                            <Input 
                                placeholder="Buscar por nome..." 
                                value={searchName} 
                                onChange={e => setSearchName(e.target.value)}
                                className="h-9"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs font-bold uppercase text-muted-foreground">Matrícula</Label>
                            <Input 
                                placeholder="Buscar matrícula..." 
                                value={searchEnrollment} 
                                onChange={e => setSearchEnrollment(e.target.value)}
                                className="h-9"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs font-bold uppercase text-muted-foreground">Turma</Label>
                            <Select value={searchClass} onValueChange={setSearchClass}>
                                <SelectTrigger className="h-9">
                                    <SelectValue placeholder="Todos os Núcleos" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todos os Núcleos</SelectItem>
                                    {allClasses.map((c: any) => (
                                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" className="h-9 flex-1" onClick={() => {
                                setSearchName("")
                                setSearchEnrollment("")
                                setSearchClass("all")
                            }}>
                                Limpar
                            </Button>
                            <Button 
                                variant="outline" 
                                className="h-9 flex-1 border-primary text-primary hover:bg-primary/5"
                                onClick={() => {
                                    const filteredStudents = students.filter(s => {
                                        const matchName = s.name.toLowerCase().includes(searchName.toLowerCase())
                                        const matchEnroll = s.enrollment_number.toLowerCase().includes(searchEnrollment.toLowerCase())
                                        const matchClass = searchClass === "all" || s.class_id === searchClass
                                        return matchName && matchEnroll && matchClass
                                    })
                                    const filteredCharges = charges.filter(c => filteredStudents.some(s => s.id === c.studentId))
                                    printFinancialReportPDF(filteredCharges, filteredStudents)
                                }}
                            >
                                <Download className="h-4 w-4 mr-2" /> PDF Filtro
                            </Button>
                        </div>
                    </div>

                    <div className="bg-card border border-border shadow-sm rounded-xl overflow-hidden">
                        <div className="p-4 border-b border-border bg-muted/20">
                            <h3 className="font-bold text-sm text-foreground">Lista de Alunos e Situação Financeira</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-muted/50 text-muted-foreground text-xs uppercase font-semibold">
                                    <tr>
                                        <th className="px-4 py-3">ALUNO</th>
                                        <th className="px-4 py-3">MATRÍCULA</th>
                                        <th className="px-4 py-3">SITUAÇÃO</th>
                                        <th className="px-4 py-3">SALDO</th>
                                        <th className="px-4 py-3 text-right">AÇÕES</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {students
                                        .filter(s => {
                                            const matchName = s.name.toLowerCase().includes(searchName.toLowerCase())
                                            const matchEnroll = s.enrollment_number.toLowerCase().includes(searchEnrollment.toLowerCase())
                                            const matchClass = searchClass === "all" || s.class_id === searchClass
                                            return matchName && matchEnroll && matchClass
                                        })
                                        .map(s => {
                                            const studentCharges = charges.filter(c => c.studentId === s.id)
                                            const pending = studentCharges.filter(c => c.status === 'pending' || c.status === 'late')
                                            const totalPending = pending.reduce((acc, curr) => acc + curr.amount, 0)
                                            const turmaName = allClasses.find((c: any) => c.id === s.class_id)?.name || "-"
                                            return (
                                                <tr key={s.id} className="hover:bg-muted/30 transition-colors">
                                                    <td className="px-4 py-3">
                                                        <div className="font-bold text-foreground">{s.name}</div>
                                                        <div className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">{turmaName}</div>
                                                    </td>
                                                    <td className="px-4 py-3 text-muted-foreground">{s.enrollment_number}</td>
                                                    <td className="px-4 py-3">
                                                        {pending.some(c => c.status === 'late') ? (
                                                            <span className="text-destructive font-bold flex items-center gap-1"><AlertCircle className="h-3 w-3" /> Inadimplente</span>
                                                        ) : pending.length > 0 ? (
                                                            <span className="text-amber-600 font-bold flex items-center gap-1"><Clock className="h-3 w-3" /> Pendente</span>
                                                        ) : (
                                                            <span className="text-green-600 font-bold flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> Em dia</span>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3 font-bold">R$ {totalPending.toFixed(2)}</td>
                                                    <td className="px-4 py-3 text-right">
                                                        <Button size="sm" variant="ghost" className="text-primary gap-2 hover:bg-primary/10" onClick={() => setSelectedStudent(s)}>
                                                            <Eye className="h-4 w-4" /> Ver Histórico
                                                        </Button>
                                                    </td>
                                                </tr>
                                            )
                                        })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="expenses" className="flex flex-col gap-4">
                    <div className="bg-card border border-border shadow-sm rounded-xl overflow-hidden">
                        <div className="p-4 border-b border-border bg-muted/20 flex justify-between items-center">
                            <h3 className="font-bold text-sm text-foreground">Registro de Despesas</h3>
                            <div className="flex items-center gap-2">
                                <Button size="sm" variant="outline" className="h-8 gap-2 border-violet-500 text-violet-600 hover:bg-violet-50" onClick={() => setReceiptModal(true)}>
                                    <FileText className="h-4 w-4" /> Recibo Professor
                                </Button>
                                <div className="text-sm font-bold text-destructive ml-4"> Total: R$ {expenses.reduce((acc: number, curr: Expense) => acc + (curr.amount || 0), 0).toFixed(2)}</div>
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-muted/50 text-muted-foreground text-xs uppercase font-semibold">
                                    <tr>
                                        <th className="px-4 py-3">DATA</th>
                                        <th className="px-4 py-3">CATEGORIA</th>
                                        <th className="px-4 py-3">DESCRIÇÃO</th>
                                        <th className="px-4 py-3 text-right">VALOR</th>
                                        <th className="px-4 py-3 text-right">AÇÕES</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {expenses.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">Nenhuma despesa registrada.</td>
                                        </tr>
                                    ) : expenses.map(e => (
                                        <tr key={e.id} className="hover:bg-muted/30 transition-colors">
                                            <td className="px-4 py-3">{new Date(e.date).toLocaleDateString("pt-BR")}</td>
                                            <td className="px-4 py-3">
                                                <span className="bg-accent/10 text-accent px-2 py-0.5 rounded text-[10px] font-bold uppercase">{e.category}</span>
                                            </td>
                                            <td className="px-4 py-3 text-muted-foreground">{e.description}</td>
                                            <td className="px-4 py-3 text-right font-bold text-destructive">R$ {e.amount.toFixed(2)}</td>
                                            <td className="px-4 py-3 text-right">
                                                {isMaster && (
                                                    <Button size="icon" variant="ghost" className="h-8 w-8 text-blue-600 hover:bg-blue-50 mr-1" onClick={() => {
                                                        setEditExpenseId(e.id)
                                                        setExpenseCategory(e.category)
                                                        setExpenseDescription(e.description)
                                                        setExpenseAmount(e.amount.toString())
                                                        setExpenseDate(e.date)
                                                        setExpenseModal(true)
                                                    }}>
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                )}
                                                <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => setExpenseDeleteId(e.id)}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="lessons" className="flex flex-col gap-6">
                    <div className="bg-card border border-border shadow-sm rounded-xl overflow-hidden">
                        <div className="p-4 border-b border-border bg-muted/20 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                            <div>
                                <h3 className="font-bold text-sm text-foreground">Aulas Planejadas (Pagamento a Professores)</h3>
                                <p className="text-xs text-muted-foreground mt-0.5 max-w-2xl">Cada disciplina da Grade Curricular gera automaticamente uma provisão de <b>R$ 300,00</b>. Quando a disciplina for ministrada, clique em "Dar Baixa Fiscal" para gerar a despesa correspondente oficial e remover o custo da Projeção.</p>
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-muted/50 text-muted-foreground text-[11px] uppercase tracking-wider font-bold">
                                    <tr>
                                        <th className="px-4 py-3">DISCIPLINA</th>
                                        <th className="px-4 py-3">PROFESSOR ALOCADO</th>
                                        <th className="px-4 py-3 text-right">CUSTO FIXO</th>
                                        <th className="px-4 py-3 text-center">STATUS DE PAGAMENTO</th>
                                        <th className="px-4 py-3 text-right">AÇÃO</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {disciplines.length === 0 ? (
                                        <tr><td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">Nenhuma disciplina cadastrada na Grade Curricular.</td></tr>
                                    ) : [...disciplines].sort((a,b) => (a.is_realized === b.is_realized) ? 0 : a.is_realized ? 1 : -1).map(d => (
                                        <tr key={d.id} className={`hover:bg-muted/30 transition-colors ${d.is_realized ? 'bg-emerald-50/40' : ''}`}>
                                            <td className="px-4 py-3 font-semibold text-primary">{d.name}</td>
                                            <td className="px-4 py-3 text-muted-foreground">{d.professorName ? <span className="flex items-center gap-1.5"><FileText className="h-3 w-3 opacity-50"/> {d.professorName}</span> : <span className="italic opacity-50">Não definido</span>}</td>
                                            <td className="px-4 py-3 text-right font-bold text-destructive">R$ 300,00</td>
                                            <td className="px-4 py-3 text-center">
                                                {d.is_realized ? 
                                                    <span className="bg-emerald-100 text-emerald-700 text-xs px-2.5 py-1 rounded-full border border-emerald-200 font-bold flex items-center gap-1.5 justify-center w-max mx-auto shadow-sm"><CheckCircle2 className="h-3.5 w-3.5" /> Pagamento Realizado</span> :
                                                    <span className="bg-orange-100 text-orange-700 text-xs px-2.5 py-1 rounded-full border border-orange-200 font-bold flex items-center gap-1.5 justify-center w-max mx-auto shadow-sm"><Clock className="h-3.5 w-3.5" /> Pagamento Pendente</span>
                                                }
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                {d.is_realized ? (
                                                    <Button size="sm" variant="outline" className="border-red-500 text-red-600 hover:bg-red-50 font-bold px-4 transition-all" onClick={async () => {
                                                        if(confirm(`Deseja ESTORNAR a baixa de "${d.name}"? O status voltará para Pendente, mas a despesa gerada anteriormente não será excluída automaticamente.`)) {
                                                            setSaving(true)
                                                            try {
                                                                await updateDiscipline(d.id, { is_realized: false })
                                                                alert(`Estorno realizado com sucesso. Lembre-se de verificar a aba "Despesas" se desejar remover o lançamento oficial de R$ 300,00.`)
                                                                load()
                                                            } catch(e:any) {
                                                                alert('Erro ao estornar: ' + e.message)
                                                            } finally {
                                                                setSaving(false)
                                                            }
                                                        }
                                                    }}>
                                                        <AlertCircle className="h-3.5 w-3.5 mr-1.5" /> Estornar Baixa
                                                    </Button>
                                                ) : (
                                                    <Button size="sm" variant="default" className="font-bold px-4 bg-primary hover:bg-primary/90 shadow-md transition-all" onClick={async () => {
                                                        if(confirm(`Confirmar BAIXA FINANCEIRA para a disciplina "${d.name}"? Isso registrará uma despesa de R$ 300,00 no sistema.`)) {
                                                            setSaving(true)
                                                            try {
                                                                const profSuffix = d.professorName ? ` (Prof. ${d.professorName})` : ''
                                                                await addExpense({ 
                                                                    category: "Pagamento ao Professor", 
                                                                    description: `Baixa Fiscal: Aula - ${d.name}${profSuffix}`, 
                                                                    amount: 300, 
                                                                    date: new Date().toISOString().split('T')[0] 
                                                                })
                                                                await updateDiscipline(d.id, { is_realized: true })
                                                                alert(`Baixa concluída! Despesa registrada na categoria "Pagamento ao Professor".`)
                                                                load()
                                                            } catch(e:any) {
                                                                alert('Erro ao dar baixa: ' + e.message)
                                                            } finally {
                                                                setSaving(false)
                                                            }
                                                        }
                                                    }}>
                                                        <DollarSign className="h-3.5 w-3.5 mr-1.5" /> Dar Baixa Financeira
                                                    </Button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </TabsContent>
            </Tabs>

            <Dialog open={!!selectedStudent} onOpenChange={(o: boolean) => !o && setSelectedStudent(null)}>
                <DialogContent className="max-w-[98vw] sm:max-w-[98vw] w-full max-h-[96vh] overflow-hidden flex flex-col p-0">
                    <DialogHeader className="p-6 border-b border-border bg-muted/30">
                        <div className="flex items-center justify-between">
                            <div>
                                <DialogTitle className="text-xl font-bold font-serif">Extrato Financeiro</DialogTitle>
                                <p className="text-sm text-muted-foreground">{selectedStudent?.name} ({selectedStudent?.enrollment_number})</p>
                            </div>
                            <div className="flex gap-2">
                                <Button size="sm" variant="outline" onClick={() => setSelectedStudent(null)}>
                                    Fechar
                                </Button>
                                <Button size="sm" variant="outline" className="h-9 text-xs font-bold border-blue-500 text-blue-600 hover:bg-blue-50" 
                                    onClick={async () => {
                                        const val = window.prompt("Bolsa Lote (Mensalidades Pendentes):\nDigite 100 para Bolsa Integral\nDigite 50 para Bolsa Parcial")
                                        if (val !== "100" && val !== "50") {
                                            if (val !== null && val.trim() !== "") alert("Valor inválido. Use 100 ou 50.")
                                            return
                                        }
                                        const stCharges = charges.filter(c => c.studentId === selectedStudent?.id && c.type === 'monthly' && (c.status === 'pending' || c.status === 'late'))
                                        if (stCharges.length === 0) return alert("Nenhuma mensalidade pendente encontrada.")
                                        if (!confirm(`Aplicar Bolsa ${val}% em ${stCharges.length} mensalidade(s)?`)) return
                                        
                                        setIsGenerating(true)
                                        try {
                                            const newStatus = val === "100" ? "bolsa100" : "bolsa50"
                                            const stChargeIds = stCharges.map(c => c.id)
                                            await updateFinancialChargesStatusBatch(stChargeIds, newStatus)
                                            await load()
                                            alert("Bolsas aplicadas com sucesso!")
                                        } catch (e: any) { alert("Erro ao aplicar bolsas: " + e.message) } 
                                        finally { setIsGenerating(false) }
                                    }}
                                    disabled={isGenerating}>
                                    {isGenerating ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : <DollarSign className="h-3 w-3 mr-2" />}
                                    Aplicar Bolsa (Lote)
                                </Button>
                                <Button size="sm" variant="outline" className="h-9 text-xs font-bold border-green-500 text-green-600 hover:bg-green-50" 
                                    onClick={async () => {
                                        if (!settings || !selectedStudent) return
                                        setIsGenerating(true)
                                        try {
                                            await syncStudentFinancialCharges(selectedStudent.id, settings)
                                            alert("Sincronização individual concluída!")
                                            load()
                                        } catch (e: any) { alert("Erro ao sincronizar: " + e.message) }
                                        finally { setIsGenerating(false) }
                                    }}
                                    disabled={isGenerating}>
                                    <Zap className="h-3 w-3 mr-2" />
                                    Sincronizar
                                </Button>
                                <Button size="sm" variant="outline" className="h-9 text-xs font-bold border-accent text-accent hover:bg-accent/10" 
                                    onClick={() => handleGeneratePlan(selectedStudent!.id)}
                                    disabled={isGenerating}>
                                    {isGenerating ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : <DollarSign className="h-3 w-3 mr-2" />}
                                    Gerar Carnê 24x
                                </Button>
                            </div>
                        </div>
                    </DialogHeader>

                    <div className="flex-1 overflow-hidden p-0 md:p-6 px-4 py-4 flex flex-col">
                        <div className="w-full flex-1 overflow-auto pb-4 border rounded-md">
                            <table className="w-full min-w-[750px] text-sm text-left border-collapse">
                                <thead className="bg-muted/50 text-muted-foreground text-[10px] uppercase font-bold tracking-wider sticky top-0 z-10">
                                    <tr>
                                        <th className="px-4 py-3 first:rounded-l-lg w-auto min-w-[220px]">Descrição da Cobrança</th>
                                        <th className="px-4 py-3 w-[130px] text-center whitespace-nowrap">Vencimento</th>
                                        <th className="px-4 py-3 w-[130px] text-center whitespace-nowrap">Valor (R$)</th>
                                        <th className="px-4 py-3 w-[120px] text-center">Status</th>
                                        <th className="px-4 py-3 text-right last:rounded-r-lg w-[120px]">Ação</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {charges.filter(c => c.studentId === selectedStudent?.id).sort((a,b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()).map(c => (
                                        <tr key={c.id} className="hover:bg-muted/30 transition-colors">
                                            <td className="px-4 py-4">
                                                <div className="font-medium text-foreground leading-tight">{c.description}</div>
                                                <div className="text-[10px] text-muted-foreground mt-1 uppercase tracking-tighter">{{ enrollment: "Matrícula", monthly: "Mensalidade", second_call: "2ª Chamada", final_exam: "Prova Final", other: "Outros" }[c.type] || c.type}</div>
                                            </td>
                                            <td className="px-4 py-4 text-muted-foreground text-center tabular-nums whitespace-nowrap">
                                                {new Date(c.dueDate).toLocaleDateString("pt-BR")}
                                            </td>
                                            <td className="px-4 py-4 font-bold text-foreground text-center tabular-nums whitespace-nowrap">
                                                R$ {c.amount.toFixed(2)}
                                            </td>
                                            <td className="px-4 py-4 text-center">
                                                <div className="inline-flex justify-center">
                                                    {getStatusBadge(c.status)}
                                                </div>
                                            </td>
                                            <td className="px-4 py-4 text-right">
                                                <div className="flex justify-end items-center gap-1">
                                                    {c.status !== 'paid' ? (
                                                        <Button size="icon" variant="ghost" className="h-8 w-8 text-green-600 hover:bg-green-50" onClick={() => handleStatusChange(c.id, 'paid')} title="Marcar como Pago"><CheckCircle2 className="h-4 w-4" /></Button>
                                                    ) : (
                                                        <Button size="icon" variant="ghost" className="h-8 w-8 text-amber-600 hover:bg-amber-50" onClick={() => handleStatusChange(c.id, 'pending')} title="Estornar"><Clock className="h-4 w-4" /></Button>
                                                    )}
                                                    <Button size="icon" variant="ghost" className="h-8 w-8 text-blue-600 hover:bg-blue-50" onClick={() => {
                                                        setEditingCharge(c)
                                                        setEditAmount(c.amount.toString())
                                                        setEditDescription(c.description)
                                                        setEditDueDate(c.dueDate)
                                                        setEditStatus(c.status)
                                                    }} title="Editar"><Pencil className="h-4 w-4" /></Button>
                                                    <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:bg-destructive/10" title="Excluir" onClick={() => setDeleteId(c.id)}><Trash2 className="h-4 w-4" /></Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={chargeModal} onOpenChange={setChargeModal}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Gerar Nova Cobrança</DialogTitle>
                    </DialogHeader>
                    <div className="flex flex-col gap-4 py-2">
                        <div className="flex flex-col gap-1.5">
                            <Label>Aluno</Label>
                            <Select value={studentId} onValueChange={setStudentId}>
                                <SelectTrigger><SelectValue placeholder="Selecione um aluno" /></SelectTrigger>
                                <SelectContent>
                                    {students.map(s => (
                                        <SelectItem key={s.id} value={s.id} className="h-auto whitespace-normal">
                                            {s.name} ({s.enrollment_number})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <Label>Tipo de Cobrança</Label>
                            <Select value={type} onValueChange={(v: any) => setType(v)}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="monthly">Mensalidade</SelectItem>
                                    <SelectItem value="enrollment">Taxa de Matrícula</SelectItem>
                                    <SelectItem value="second_call">Segunda Chamada</SelectItem>
                                    <SelectItem value="final_exam">Prova Final</SelectItem>
                                    <SelectItem value="other">Outros / Avulso</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <Label>Descrição</Label>
                            <Input
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                placeholder="Ex: Mensalidade - Abril/2026"
                            />
                        </div>

                        <div className="flex gap-4">
                            <div className="flex flex-col gap-1.5 flex-1">
                                <Label>Valor (R$)</Label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    value={amount}
                                    onChange={e => setAmount(e.target.value)}
                                />
                            </div>
                            <div className="flex flex-col gap-1.5 flex-1">
                                <Label>Vencimento</Label>
                                <Input
                                    type="date"
                                    value={dueDate}
                                    onChange={e => setDueDate(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setChargeModal(false)}>Cancelar</Button>
                        <Button onClick={handleSaveCharge} disabled={saving}>Gerar Boleto/Cobrança</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={settingsModal} onOpenChange={setSettingsModal}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Configurações de Pagamento Manual</DialogTitle>
                    </DialogHeader>
                    <div className="flex flex-col gap-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex flex-col gap-1.5">
                                <Label>Taxa de Matrícula (R$)</Label>
                                <Input type="number" step="0.01" value={tempEnrollment} onChange={e => setTempEnrollment(e.target.value)} />
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <Label>Mensalidade (R$)</Label>
                                <Input type="number" step="0.01" value={tempMonthly} onChange={e => setTempMonthly(e.target.value)} />
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <Label>2ª Chamada (R$)</Label>
                                <Input type="number" step="0.01" value={tempSecondCall} onChange={e => setTempSecondCall(e.target.value)} />
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <Label>Prova Final (R$)</Label>
                                <Input type="number" step="0.01" value={tempFinalExam} onChange={e => setTempFinalExam(e.target.value)} />
                            </div>
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <Label>Duração do Curso (Meses)</Label>
                            <Input type="number" value={tempMonths} onChange={e => setTempMonths(e.target.value)} />
                        </div>

                        <div className="flex flex-col gap-1.5 pt-2 border-t mt-2">
                            <Label className="font-bold">Integrações de Pagamento Manual</Label>
                            <Label className="text-[11px] text-muted-foreground">Links e Chaves mostradas ao aluno na matrícula</Label>
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <Label>Link de Pagamento (Cartão de Crédito)</Label>
                            <Input
                                value={tempCard}
                                onChange={e => setTempCard(e.target.value)}
                                placeholder="Link do Mercado Pago, PicPay, etc."
                            />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <Label>Chave PIX para Recebimento</Label>
                            <Input
                                value={tempPix}
                                onChange={e => setTempPix(e.target.value)}
                                placeholder="E-mail, CPF, CNPJ ou Aleatória"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setSettingsModal(false)}>Cancelar</Button>
                        <Button onClick={handleSaveSettings} disabled={saving}>Salvar Configurações</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit Charge Dialog */}
            <Dialog open={!!editingCharge} onOpenChange={(o) => !o && setEditingCharge(null)}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Editar Cobrança</DialogTitle>
                    </DialogHeader>
                    <div className="flex flex-col gap-4 py-2">
                        <div className="flex flex-col gap-1.5">
                            <Label>Descrição</Label>
                            <Input
                                value={editDescription}
                                onChange={e => setEditDescription(e.target.value)}
                            />
                        </div>
                        <div className="flex gap-4">
                            <div className="flex flex-col gap-1.5 flex-1">
                                <Label>Valor (R$)</Label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    value={editAmount}
                                    onChange={e => setEditAmount(e.target.value)}
                                />
                            </div>
                            <div className="flex flex-col gap-1.5 flex-1">
                                <Label>Vencimento</Label>
                                <Input
                                    type="date"
                                    value={editDueDate}
                                    onChange={e => setEditDueDate(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <Label>Status</Label>
                            <Select value={editStatus} onValueChange={(v: any) => setEditStatus(v)}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="pending">Pendente</SelectItem>
                                    <SelectItem value="paid">Pago</SelectItem>
                                    <SelectItem value="late">Atrasado</SelectItem>
                                    <SelectItem value="cancelled">Cancelado</SelectItem>
                                    <SelectItem value="bolsa100">Bolsa 100%</SelectItem>
                                    <SelectItem value="bolsa50">Bolsa 50%</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditingCharge(null)}>Cancelar</Button>
                        <Button onClick={handleEditCharge} disabled={saving}>Salvar Alterações</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Excluir Cobrança</AlertDialogTitle>
                        <AlertDialogDescription>Tem certeza que deseja excluir este registro financeiro? Esta ação não possui volta.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction className="bg-destructive" onClick={handleDelete}>Excluir</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Expense Modal */}
            <Dialog open={expenseModal} onOpenChange={setExpenseModal}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>{editExpenseId ? "Editar Despesa" : "Registrar Nova Despesa"}</DialogTitle>
                    </DialogHeader>
                    <div className="flex flex-col gap-4 py-2">
                        <div className="flex flex-col gap-1.5">
                            <Label>Categoria</Label>
                            <Select value={expenseCategory} onValueChange={(v: any) => setExpenseCategory(v)}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Pagamento ao Professor">Pagamento ao Professor</SelectItem>
                                    <SelectItem value="Material de secretária">Material de secretária</SelectItem>
                                    <SelectItem value="combustível">Combustível</SelectItem>
                                    <SelectItem value="Transporte">Transporte</SelectItem>
                                    <SelectItem value="Alimento">Alimento</SelectItem>
                                    <SelectItem value="devolução">Devolução</SelectItem>
                                    <SelectItem value="Outros">Outros</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <Label>Descrição</Label>
                            <Input value={expenseDescription} onChange={e => setExpenseDescription(e.target.value)} placeholder="Ex: Toner para impressora" />
                        </div>
                        <div className="flex gap-4">
                            <div className="flex flex-col gap-1.5 flex-1">
                                <Label>Valor (R$)</Label>
                                <Input type="number" step="0.01" value={expenseAmount} onChange={e => setExpenseAmount(e.target.value)} />
                            </div>
                            <div className="flex flex-col gap-1.5 flex-1">
                                <Label>Data</Label>
                                <Input type="date" value={expenseDate} onChange={e => setExpenseDate(e.target.value)} />
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setExpenseModal(false)}>Cancelar</Button>
                        <Button onClick={handleSaveExpense} disabled={saving} className="bg-destructive hover:bg-destructive/90 text-white">Salvar Despesa</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <AlertDialog open={!!expenseDeleteId} onOpenChange={(o) => !o && setExpenseDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Excluir Despesa</AlertDialogTitle>
                        <AlertDialogDescription>Deseja realmente remover este registro de saída?</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction className="bg-destructive" onClick={handleDeleteExpense}>Excluir</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <Dialog open={receiptModal} onOpenChange={setReceiptModal}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Gerar Recibo de Professor</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4 uppercase font-bold text-xs">
                        <div className="space-y-2">
                            <Label>Professor</Label>
                            <div className="flex gap-2">
                                <Select value={receiptProfessorId} onValueChange={setReceiptProfessorId}>
                                    <SelectTrigger className="font-bold">
                                        <SelectValue placeholder="Selecione um professor" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="manual" className="font-bold text-amber-600">PREENCHIMENTO MANUAL</SelectItem>
                                        {professors.map(p => (
                                            <SelectItem key={p.id} value={p.id} className="font-bold">{p.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Button size="icon" variant="outline" className="h-10 w-10 shrink-0 border-violet-500 text-violet-600" onClick={() => setShowAddProf(true)}>
                                    <Plus className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>

                        {receiptProfessorId === "manual" && (
                            <div className="space-y-2 animate-in slide-in-from-top-1 duration-200">
                                <Label>Nome do Professor (Manual)</Label>
                                <Input 
                                    className="font-bold"
                                    placeholder="Nome Completo" 
                                    value={receiptManualName} 
                                    onChange={e => setReceiptManualName(e.target.value.toUpperCase())} 
                                />
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Valor (R$)</Label>
                                <Input 
                                    type="number" 
                                    className="font-bold"
                                    placeholder="100.00" 
                                    value={receiptAmount} 
                                    onChange={e => setReceiptAmount(e.target.value)} 
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Data</Label>
                                <Input 
                                    type="date" 
                                    className="font-bold uppercase"
                                    value={receiptDate} 
                                    onChange={e => setReceiptDate(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Descrição da Aula / Serviço</Label>
                            <Input 
                                className="font-bold"
                                placeholder="AULA DE TEOLOGIA - NÚCLEO COSME DE FÁRIAS" 
                                value={receiptDescription} 
                                onChange={e => setReceiptDescription(e.target.value.toUpperCase())} 
                            />
                        </div>

                        <div className="flex items-center gap-2 p-2 bg-muted/30 rounded-lg cursor-pointer select-none" onClick={() => setSaveAsExpense(!saveAsExpense)}>
                            <div className={`w-10 h-6 rounded-full transition-colors relative ${saveAsExpense ? 'bg-violet-600' : 'bg-muted'}`}>
                                <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${saveAsExpense ? 'translate-x-4' : ''}`} />
                            </div>
                            <span className="text-[10px] text-muted-foreground uppercase font-bold">Lançar automaticamente como Despesa</span>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setReceiptModal(false)}>Cancelar</Button>
                        <Button className="bg-violet-600 hover:bg-violet-700 font-bold" disabled={!receiptAmount || (!receiptManualName && receiptProfessorId === "manual")}
                            onClick={async () => {
                                const professorName = receiptProfessorId === "manual" 
                                    ? receiptManualName 
                                    : (professors.find(p => p.id === receiptProfessorId)?.name || "PROFESSOR")
                                
                                printTeacherPaymentReceipt({
                                    professorName,
                                    amount: Number(receiptAmount),
                                    description: receiptDescription || "PAGAMENTO DE AULA",
                                    date: receiptDate
                                })

                                if (saveAsExpense) {
                                    await addExpense({
                                        category: "Pagamento ao Professor",
                                        description: `RECIBO: ${professorName} - ${receiptDescription}`,
                                        amount: Number(receiptAmount),
                                        date: receiptDate
                                    })
                                    load()
                                }
                                setReceiptModal(false)
                            }}
                        >
                            Gerar e Imprimir
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={showAddProf} onOpenChange={setShowAddProf}>
                <DialogContent className="max-w-sm">
                    <DialogHeader>
                        <DialogTitle>Adicionar Novo Professor</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4 uppercase font-bold text-xs">
                        <div className="space-y-2">
                            <Label>Nome Completo</Label>
                            <Input className="font-bold" value={newProfName} onChange={e => setNewProfName(e.target.value.toUpperCase())} />
                        </div>
                        <div className="space-y-2">
                            <Label>E-mail</Label>
                            <Input className="font-bold lowercase" type="email" value={newProfEmail} onChange={e => setNewProfEmail(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label>Senha Temporária</Label>
                            <Input className="font-bold" type="text" value={newProfPass} onChange={e => setNewProfPass(e.target.value)} />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowAddProf(false)}>Voltar</Button>
                        <Button className="bg-violet-600" disabled={!newProfName || !newProfEmail || !newProfPass}
                            onClick={async () => {
                                try {
                                    const res = await fetch("/api/admin/users", {
                                        method: "POST",
                                        headers: { "Content-Type": "application/json" },
                                        body: JSON.stringify({
                                            email: newProfEmail,
                                            password: newProfPass,
                                            name: newProfName,
                                            role: "professor"
                                        })
                                    })
                                    if (!res.ok) throw new Error("Erro no registro")
                                    const { user } = await res.json()
                                    await addProfessorAccount({
                                        name: newProfName,
                                        email: newProfEmail,
                                        password: newProfPass,
                                        role: "professor",
                                        id: user.id
                                    })
                                    alert("Professor cadastrado com sucesso!")
                                    load()
                                    setReceiptProfessorId(user?.id || "manual")
                                    setShowAddProf(false)
                                } catch (err) {
                                    alert("Erro ao cadastrar professor.")
                                }
                            }}
                        >
                            Cadastrar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
