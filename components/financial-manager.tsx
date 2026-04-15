"use client"

import { useState, useEffect, useMemo } from "react"
import { 
  BarChart3, TrendingUp, TrendingDown, DollarSign, Calendar, Filter, Download, Plus, 
  Trash2, CheckCircle2, AlertCircle, PieChart, Wallet, ArrowUpRight, ArrowDownRight,
  MoreHorizontal, FileText, Printer, Calculator, RefreshCw, X, BookOpen, Briefcase, ChevronDown, ChevronUp, Undo2, QrCode, CreditCard
} from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, AreaChart, Area, Cell, PieChart as RePieChart, Pie
} from "recharts"
import { 
  getFinancialTransactions, 
  addFinancialTransaction, 
  updateFinancialTransaction, 
  deleteFinancialTransaction,
  getStudentTuitions,
  syncStudentTuition,
  syncBatchTuitions,
  updateTuition,
  processTuitionPayment,
  revertTuitionPayment,
  getStudents,
  getDisciplines,
  getFinancialSettings,
  updateFinancialSettings,
  getProfessorAccounts,
  getAllProfessorDisciplines,
  processProfessorPayment,
  type FinancialTransaction,
  type StudentTuition,
  type StudentProfile,
  type Discipline,
  type ProfessorAccount,
  type FinancialSettings,
  type ProfessorDiscipline
} from "@/lib/store"
import { cn } from "@/lib/utils"
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription 
} from "@/components/ui/dialog"
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { printFinancialDRE_PDF, printTuitionReportPDF, printReceiptPDF, printProfessorReceiptPDF, printInstallmentsReportPDF, printRevenueReportPDF, printExpensesReportPDF, printProLaboreReportPDF } from "@/lib/pdf"

// --- Constants ---
const CATEGORIES = [
  "Alimento", "Limpeza", "Professores", "Material de Escritório", "Transporte", 
  "Pessoal", "Aluguel", "Energia/Água", "Internet", "Marketing", "Eventos", "Material Didático", "Outros"
]

const COLORS = ["#f97316", "#0ea5e9", "#8b5cf6", "#10b981", "#f43f5e", "#eab308", "#6366f1", "#14b8a6", "#ec4899", "#475569"]

export function FinancialManager() {
  const [tab, setTab] = useState<"dashboard" | "income" | "expenses" | "prolabore" | "reports">("dashboard")
  const [allTransactions, setAllTransactions] = useState<FinancialTransaction[]>([])
  const [transactions, setTransactions] = useState<FinancialTransaction[]>([])
  const [tuitions, setTuitions] = useState<StudentTuition[]>([])
  const [students, setStudents] = useState<StudentProfile[]>([])
  const [disciplines, setDisciplines] = useState<Discipline[]>([])
  const [professors, setProfessors] = useState<ProfessorAccount[]>([])
  const [profLinks, setProfLinks] = useState<ProfessorDiscipline[]>([])
  const [settings, setSettings] = useState<FinancialSettings>({ tuitionRate: 0, proLaboreRate: 0 })
  const [loading, setLoading] = useState(true)
  const [competencia, setCompetencia] = useState(new Date().toISOString().substring(0, 7)) // YYYY-MM
  const [viewScope, setViewScope] = useState<"month" | "year" | "all">("month")

  // States for Modals
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false)
  const [isInstallmentModalOpen, setIsInstallmentModalOpen] = useState(false)
  const [isSyncOpen, setIsSyncOpen] = useState(false)
  const [isConfigOpen, setIsConfigOpen] = useState(false)
  
  // Payment Confirmation State
  const [paymentTuition, setPaymentTuition] = useState<{id: string, amount: number, studentName: string} | null>(null)
  const [isPaymentConfirmOpen, setIsPaymentConfirmOpen] = useState(false)

  // Local draft state for the config dialog — always mirrors the last persisted settings
  const [configDraft, setConfigDraft] = useState({
    tuitionRate: settings.tuitionRate,
    proLaboreRate: settings.proLaboreRate,
    pixKey: settings.pixKey || "",
    pixQRCode: settings.pixQRCode || ""
  })

  // Sync configDraft whenever settings updates from the database
  useEffect(() => {
    setConfigDraft({
      tuitionRate: settings.tuitionRate,
      proLaboreRate: settings.proLaboreRate,
      pixKey: settings.pixKey || "",
      pixQRCode: settings.pixQRCode || ""
    })
  }, [settings])

  async function loadData() {
    setLoading(true)
    try {
      const [allT, tu, st, di, se, pr, pl] = await Promise.all([
        getFinancialTransactions(), // Fetch all for accumulation
        getStudentTuitions(),
        getStudents(),
        getDisciplines(),
        getFinancialSettings(),
        getProfessorAccounts(),
        getAllProfessorDisciplines()
      ])
      setAllTransactions(allT)
      setTransactions(allT.filter(t => t.competencia === competencia))
      setTuitions(tu)
      setStudents(st)
      setDisciplines(di)
      setSettings(se)
      setProfessors(pr)
      setProfLinks(pl)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [competencia])

  // --- Calculations ---
  const stats = useMemo(() => {
    // Escopo de Filtragem Principal
    const currentYear = competencia.substring(0, 4)
    const scopeTransactions = allTransactions.filter(t => {
      if (viewScope === 'month') return t.competencia === competencia
      if (viewScope === 'year') return t.competencia?.startsWith(currentYear)
      return true // 'all'
    })

    const plannedIncome = scopeTransactions.filter(t => t.type === 'income' && t.status === 'planned').reduce((acc, t) => acc + t.amount, 0)
    const realizedIncome = scopeTransactions.filter(t => t.type === 'income' && t.status === 'realized').reduce((acc, t) => acc + t.amount, 0)
    const plannedExpense = scopeTransactions.filter(t => t.type === 'expense' && t.status === 'planned').reduce((acc, t) => acc + t.amount, 0)
    const realizedExpense = scopeTransactions.filter(t => t.type === 'expense' && t.status === 'realized').reduce((acc, t) => acc + t.amount, 0)

    // Filtramos mensalidades e disciplinas pela competência baseada no escopo
    const tuitionsScope = tuitions.filter(tu => {
      if (!tu.dueDate) return false
      if (viewScope === 'month') return tu.dueDate.startsWith(competencia)
      if (viewScope === 'year') return tu.dueDate.startsWith(currentYear)
      return true
    })

    const pendingTuition = tuitionsScope.filter(tu => tu.status === 'pending' || tu.status === 'overdue').reduce((acc, tu) => acc + tu.amount, 0)
    
    // Projeção de pro-labore (mantido por agora para o escopo selecionado)
    const disciplinesScope = disciplines.filter(d => {
      if (!d.executionDate) return false
      if (viewScope === 'month') return d.executionDate.startsWith(competencia)
      if (viewScope === 'year') return d.executionDate.startsWith(currentYear)
      return true
    })

    const proLaboreProjected = disciplinesScope.length > 0 
      ? disciplinesScope.length * settings.proLaboreRate 
      : 0
    
    // Receita projetada: Baseada no escopo
    const activeStudents = students.filter(s => s.status === 'active')
    const activeStudentIds = new Set(activeStudents.map(s => s.id))
    const tuitionsActive = tuitionsScope.filter(tu => activeStudentIds.has(tu.studentId))
    
    const generatedAmount = tuitionsActive.reduce((acc, tu) => acc + tu.amount, 0)
    // Para simplificar a projeção futura em escopos maiores, mantemos a lógica base baseada no que foi filtrado
    const revenueProjected = generatedAmount 

    const netRealized = realizedIncome - realizedExpense

    // Acumulado: Soma de todas as transações realizadas ATÉ a competência atual
    const accumulatedIncome = allTransactions
      .filter(t => t.type === 'income' && t.status === 'realized' && (!t.competencia || t.competencia <= competencia))
      .reduce((acc, t) => acc + t.amount, 0)
    
    const accumulatedExpense = allTransactions
      .filter(t => t.type === 'expense' && t.status === 'realized' && (!t.competencia || t.competencia <= competencia))
      .reduce((acc, t) => acc + t.amount, 0)

    // Total de despesas projetadas (planned) no escopo selecionado + pro-labore pendente
    const realizedProlaboreDiscIds = new Set(
      allTransactions
        .filter(t => t.type === 'expense' && t.category === 'Professores' && t.status === 'realized' && t.disciplineId)
        .map(t => t.disciplineId as string)
    )
    const pendingProLaboreCount = disciplinesScope.filter(d => !realizedProlaboreDiscIds.has(d.id)).length
    const pendingProLaboreTotal = pendingProLaboreCount * settings.proLaboreRate

    const plannedExpenseTotal = scopeTransactions
      .filter(t => t.type === 'expense' && t.status === 'planned')
      .reduce((acc, t) => acc + t.amount, 0) + pendingProLaboreTotal

    return {
      plannedIncome, realizedIncome,
      plannedExpense, realizedExpense,
      pendingTuition,
      proLaboreProjected,
      revenueProjected,
      accumulatedIncome,
      accumulatedExpense,
      plannedExpenseTotal,
      netPlanned: plannedIncome - plannedExpense,
      netRealized
    }
  }, [allTransactions, tuitions, disciplines, settings, students, competencia, viewScope])

  const chartData = useMemo(() => {
    if (viewScope === 'month') {
      return [
        { name: "Receitas", Previsto: stats.plannedIncome + stats.realizedIncome, Realizado: stats.realizedIncome },
        { name: "Despesas", Previsto: stats.plannedExpense + stats.realizedExpense, Realizado: stats.realizedExpense }
      ]
    }

    if (viewScope === 'year') {
      const year = competencia.substring(0, 4)
      const data = []
      const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"]
      
      for (let m = 1; m <= 12; m++) {
        const comp = `${year}-${m.toString().padStart(2, '0')}`
        const monthTransactions = allTransactions.filter(t => t.competencia === comp)
        
        const income = monthTransactions.filter(t => t.type === 'income' && t.status === 'realized').reduce((acc, t) => acc + t.amount, 0)
        const expense = monthTransactions.filter(t => t.type === 'expense' && t.status === 'realized').reduce((acc, t) => acc + t.amount, 0)
        const pIncome = monthTransactions.filter(t => t.type === 'income' && t.status === 'planned').reduce((acc, t) => acc + t.amount, 0)
        const pExpense = monthTransactions.filter(t => t.type === 'expense' && t.status === 'planned').reduce((acc, t) => acc + t.amount, 0)

        data.push({
          name: monthNames[m-1],
          Realizado: income,
          Previsto: expense,
          originalReceita: income,
          originalDespesa: expense
        })
      }
      return data
    }

    // viewScope === 'all'
    const years = Array.from(new Set(allTransactions.map(t => t.competencia?.substring(0, 4)).filter(Boolean))).sort()
    return years.map(year => {
      const yearTransactions = allTransactions.filter(t => t.competencia?.startsWith(year))
      const income = yearTransactions.filter(t => t.type === 'income' && t.status === 'realized').reduce((acc, t) => acc + t.amount, 0)
      const expense = yearTransactions.filter(t => t.type === 'expense' && t.status === 'realized').reduce((acc, t) => acc + t.amount, 0)
      return { 
        name: year, 
        Realizado: income, 
        Previsto: expense, // Usando Previsto como "Despesa" para manter compatibilidade com as cores do gráfico original
        originalReceita: income,
        originalDespesa: expense
      }
    })
  }, [viewScope, stats, allTransactions, competencia])

  const expenseDistribution = useMemo(() => {
    const scopeYear = competencia.substring(0, 4)
    const realization = allTransactions.filter(t => {
      if (t.type !== 'expense' || t.status !== 'realized') return false
      if (viewScope === 'month') return t.competencia === competencia
      if (viewScope === 'year') return t.competencia?.startsWith(scopeYear)
      return true
    })

    return CATEGORIES.map(cat => {
      const total = realization.filter(t => t.category === cat).reduce((acc, t) => acc + t.amount, 0)
      return { name: cat, value: total }
    }).filter(d => d.value > 0)
  }, [allTransactions, viewScope, competencia])

  // --- Handlers ---
  async function handleAddExpense(data: any) {
    await addFinancialTransaction({
      ...data,
      type: "expense",
      competencia: competencia || new Date().toISOString().substring(0, 7)
    })
    setIsAddExpenseOpen(false)
    loadData()
  }

  async function handleSyncAll() {
    setLoading(true)
    try {
       await syncBatchTuitions(students.filter(s => s.status === 'active').map(s => s.id))
       toast.success("Sincronização concluída com sucesso!")
    } catch (e) {
       toast.error("Erro na sincronização!")
    }
    await loadData()
    setLoading(false)
    setIsSyncOpen(false)
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header section with Stats Cards */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight text-foreground flex items-center gap-4 flex-wrap">
            Gestão Financeira
            <div className="flex bg-muted p-1 rounded-lg border text-[10px] uppercase font-bold tracking-wider">
              <button 
                onClick={() => setViewScope('month')}
                className={cn("px-4 py-1.5 rounded-md transition-all", viewScope === 'month' ? "bg-background shadow-sm text-orange" : "text-muted-foreground hover:text-foreground")}
              >Mês</button>
              <button 
                onClick={() => setViewScope('year')}
                className={cn("px-4 py-1.5 rounded-md transition-all border-x", viewScope === 'year' ? "bg-background shadow-sm text-orange" : "text-muted-foreground hover:text-foreground")}
              >Ano</button>
              <button 
                onClick={() => setViewScope('all')}
                className={cn("px-4 py-1.5 rounded-md transition-all", viewScope === 'all' ? "bg-background shadow-sm text-orange" : "text-muted-foreground hover:text-foreground")}
              >Geral</button>
            </div>
          </h1>
          <p className="text-muted-foreground text-sm">Controle de caixa, mensalidades e projeções.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          <Input 
            type="month" 
            value={competencia} 
            onChange={e => setCompetencia(e.target.value)}
            className="flex-1 lg:w-40 border-primary/20 bg-primary/5 h-9 text-sm"
          />
          <Button onClick={loadData} variant="outline" size="icon" className="h-9 w-9">
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
          </Button>
          <div className="flex gap-2 w-full sm:w-auto">
              <Button variant="outline" size="sm" className="flex-1 sm:flex-none border-primary text-primary h-9 text-xs" onClick={() => setIsConfigOpen(true)}>
                 <Calculator className="h-4 w-4 mr-1.5" /> Configurações
              </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard 
          title="Mensalidades em Aberto" 
          value={stats.pendingTuition} 
          subtitle={viewScope === 'month' ? 'Previsão do mês' : viewScope === 'year' ? `Previsão do ano ${competencia.substring(0, 4)}` : 'Previsão geral'}
          icon={<Calculator className="text-orange" />}
        />
        <StatCard 
          title="Receita Realizada" 
          value={stats.realizedIncome} 
          subtitle={viewScope === 'month' ? `No mês. Acumulado: R$ ${(stats.accumulatedIncome ?? 0).toLocaleString('pt-BR')}` : viewScope === 'year' ? `Acumulado do ano ${competencia.substring(0, 4)}` : 'Acumulado geral (todas as operações)'}
          icon={<ArrowUpRight className="text-emerald-500" />}
          trend="positive"
        />
        <StatCard 
          title="Despesas Projetadas" 
          value={stats.plannedExpenseTotal} 
          subtitle={viewScope === 'month' ? 'Previsto no mês' : viewScope === 'year' ? `Previsto no ano ${competencia.substring(0, 4)}` : 'Previsto total acumulado'}
          icon={<TrendingDown className="text-rose-400" />}
          trend="negative"
        />
        <StatCard 
          title="Despesa Realizada" 
          value={stats.realizedExpense} 
          subtitle={viewScope === 'month' ? `No mês. Acumulado: R$ ${(stats.accumulatedExpense ?? 0).toLocaleString('pt-BR')}` : viewScope === 'year' ? `Acumulado do ano ${competencia.substring(0, 4)}` : 'Acumulado geral (todas as operações)'}
          icon={<ArrowDownRight className="text-rose-500" />}
          trend="negative"
        />
        <StatCard 
          title="Saldo Líquido (Real)" 
          value={stats.netRealized} 
          subtitle={viewScope === 'month' ? 'Entradas - Saídas (mês)' : viewScope === 'year' ? `Entradas - Saídas (${competencia.substring(0, 4)})` : 'Entradas - Saídas (geral)'}
          icon={<Wallet className="text-primary" />}
          highlight
        />
      </div>

      {/* Tabs */}
      <div className="overflow-x-auto scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0">
        <div className="flex border-b border-border/50 gap-4 lg:gap-8 min-w-max">
          <TabButton active={tab === "dashboard"} onClick={() => setTab("dashboard")} icon={<PieChart className="h-4 w-4" />}>Dashboard</TabButton>
          <TabButton active={tab === "income"} onClick={() => setTab("income")} icon={<DollarSign className="h-4 w-4" />}>Receitas</TabButton>
          <TabButton active={tab === "expenses"} onClick={() => setTab("expenses")} icon={<TrendingDown className="h-4 w-4" />}>Despesas</TabButton>
          <TabButton active={tab === "prolabore"} onClick={() => setTab("prolabore")} icon={<Briefcase className="h-4 w-4" />}>Pro-labore</TabButton>
          <TabButton active={tab === "reports"} onClick={() => setTab("reports")} icon={<FileText className="h-4 w-4" />}>Relatórios</TabButton>
        </div>
      </div>

      {/* Tab Content */}
      <div className="min-h-[500px]">
        {tab === "dashboard" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="premium-shadow overflow-hidden">
              <CardHeader className="bg-muted/30">
                <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-orange" /> Fluxo: Previsto vs Realizado
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                      <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `R$ ${val}`} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #eee', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                        formatter={(val: number) => `R$ ${(val ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                      />
                      <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                      <Bar dataKey="Previsto" fill="#cbd5e1" radius={[4, 4, 0, 0]} barSize={40} />
                      <Bar dataKey="Realizado" fill="#f97316" radius={[4, 4, 0, 0]} barSize={40} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="premium-shadow">
              <CardHeader className="bg-muted/30">
                <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" /> Distribuição de Gastos
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 flex justify-center items-center">
                 <div className="h-[300px] w-full max-w-[400px]">
                    {expenseDistribution.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <RePieChart>
                          <Pie
                            data={expenseDistribution}
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                            animationBegin={0}
                            animationDuration={1500}
                          >
                            {expenseDistribution.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip 
                            contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #eee', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                            formatter={(val: number) => `R$ ${(val ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                          />
                          <Legend iconType="circle" layout="vertical" align="right" verticalAlign="middle" wrapperStyle={{ fontSize: '10px' }} />
                        </RePieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-center p-6 bg-muted/5 rounded-xl border-2 border-dashed border-muted">
                        <PieChart className="h-8 w-8 text-muted-foreground/30 mb-2" />
                        <p className="text-sm font-medium text-muted-foreground">Nenhuma despesa realizada</p>
                        <p className="text-[10px] text-muted-foreground/60 italic">As despesas aparecem aqui após serem "Quitadas"</p>
                      </div>
                    )}
                 </div>
              </CardContent>
            </Card>
          </div>
        )}

        {tab === "income" && (
          <div className="flex flex-col gap-6">
           <Card className="premium-shadow">
              <CardContent className="p-0">
                 <div className="p-4 border-b flex justify-between items-center bg-muted/20">
                    <h3 className="font-bold flex items-center gap-2"><DollarSign className="h-4 w-4 text-emerald-600" /> Mensalidades de Alunos</h3>
                    <div className="flex gap-2">
                       <Button size="sm" variant="outline" onClick={() => setIsSyncOpen(true)}>
                          <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} /> Sincronizar Todos (Lote)
                       </Button>
                    </div>
                 </div>
                 <div className="p-4 gap-2 flex flex-col min-h-[400px]">
                    {students.filter(s => s.status === 'active').sort((a,b) => a.name.localeCompare(b.name)).map(student => (
                        <StudentTuitionRow 
                           key={student.id} 
                           student={student} 
                           disciplines={disciplines} 
                           tuitions={tuitions.filter(t => t.studentId === student.id)} 
                           onSync={async (id) => { await syncStudentTuition(id); await loadData(); }}
                           onPayment={(id, amount) => { 
                             setPaymentTuition({ id, amount, studentName: student.name }); 
                             setIsPaymentConfirmOpen(true); 
                           }}
                           onRevert={async (id) => { await revertTuitionPayment(id); await loadData(); }}
                           onUpdateDate={async (id, dt) => { await updateTuition(id, { dueDate: dt }); await loadData(); }}
                           onPrintReceipt={(tu, st, ds) => printReceiptPDF(tu, st, ds, "Cosme de Farias")}
                        />
                    ))}
                    {students.filter(s => s.status === 'active').length === 0 && (
                        <div className="p-20 text-center text-muted-foreground border rounded-md">
                            Nenhum aluno ativo encontrado no sistema.
                        </div>
                    )}
                 </div>
              </CardContent>
           </Card>

           {/* Tabela de Entradas Confirmadas - transações income */}
           <Card className="premium-shadow">
              <CardContent className="p-0">
                 <div className="p-4 border-b flex justify-between items-center bg-emerald-50">
                    <h3 className="font-bold flex items-center gap-2 text-emerald-800"><ArrowUpRight className="h-4 w-4 text-emerald-600" /> Entradas Confirmadas (Receita)</h3>
                    <span className="text-xs text-emerald-600 font-medium">{transactions.filter(t => t.type === 'income').length} registro(s)</span>
                 </div>
                 <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                       <thead className="bg-muted/30 border-b">
                          <tr>
                             <th className="p-4 font-bold">Data</th>
                             <th className="p-4 font-bold">Descrição</th>
                             <th className="p-4 font-bold">Valor</th>
                             <th className="p-4 font-bold">Competência</th>
                             <th className="p-4 font-bold">Status</th>
                             <th className="p-4">Ação</th>
                          </tr>
                       </thead>
                       <tbody>
                          {transactions.filter(t => t.type === 'income').length === 0 ? (
                             <tr><td colSpan={6} className="p-12 text-center text-muted-foreground">Nenhuma entrada de receita registrada. Este painel será preenchido automaticamente quando pagamentos forem confirmados.</td></tr>
                          ) : (
                             transactions.filter(t => t.type === 'income').map(t => (
                               <tr key={t.id} className="border-b hover:bg-muted/10">
                                 <td className="p-4">{new Date(t.date).toLocaleDateString('pt-BR')}</td>
                                 <td className="p-4 text-xs">{t.description}</td>
                                 <td className="p-4 text-emerald-600 font-bold">R$ {(t.amount ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                                 <td className="p-4"><span className="px-2 py-1 bg-muted rounded text-[10px] font-bold uppercase">{t.competencia || '---'}</span></td>
                                 <td className="p-4"><StatusBadge status={t.status} /></td>
                                 <td className="p-4">
                                    <Button size="sm" variant="ghost" className="text-destructive" onClick={async () => {
                                       if (confirm('Deseja excluir permanentemente esta entrada de receita?')) {
                                          await deleteFinancialTransaction(t.id);
                                          await loadData();
                                       }
                                    }}>
                                       <Trash2 className="h-4 w-4" />
                                    </Button>
                                 </td>
                               </tr>
                             ))
                          )}
                       </tbody>
                    </table>
                 </div>
              </CardContent>
           </Card>
          </div>
        )}

        {tab === "expenses" && (
           <Card className="premium-shadow">
              <CardContent className="p-0">
                 <div className="p-4 border-b flex justify-between items-center bg-muted/20">
                    <h3 className="font-bold flex items-center gap-2"><ArrowDownRight className="h-4 w-4 text-rose-600" /> Despesas de Custeio</h3>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => printInstallmentsReportPDF(allTransactions, "Cosme de Farias")}>
                        <Download className="h-4 w-4 mr-2" /> Relatório Projeções
                      </Button>
                      <Button size="sm" onClick={() => setIsInstallmentModalOpen(true)} variant="secondary" className="bg-orange/10 text-orange hover:bg-orange/20 border-orange/20">
                        <Calendar className="h-4 w-4 mr-2" /> Despesas Parceladas
                      </Button>
                      <Button size="sm" onClick={() => setIsAddExpenseOpen(true)}>
                        <Plus className="h-4 w-4 mr-2" /> Nova Despesa
                      </Button>
                    </div>
                 </div>
                 <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                       <thead className="bg-muted/30 border-b">
                          <tr>
                             <th className="p-4 font-bold">Data</th>
                             <th className="p-4 font-bold">Categoria</th>
                             <th className="p-4 font-bold">Descrição</th>
                             <th className="p-4 font-bold">Valor</th>
                             <th className="p-4 font-bold">Status</th>
                             <th className="p-4">Ação</th>
                          </tr>
                       </thead>
                       <tbody>
                          {transactions.filter(t => t.type === 'expense').length === 0 ? (
                             <tr><td colSpan={6} className="p-20 text-center text-muted-foreground">Nenhuma despesa registrada para este período.</td></tr>
                          ) : (
                             transactions.filter(t => t.type === 'expense').map(t => {
                               const installMatch = t.description?.match(/^(.+?)\s*\((\d+)\/(\d+)\)$/)
                               const isInstallment = !!installMatch
                               const installBase = installMatch ? installMatch[1].trim() : null
                               const installTotal = installMatch ? parseInt(installMatch[3]) : 0
                               return (
                               <tr key={t.id} className="border-b hover:bg-muted/10">
                                 <td className="p-4">{new Date(t.date).toLocaleDateString('pt-BR')}</td>
                                 <td className="p-4"><span className="px-2 py-1 bg-muted rounded text-[10px] font-bold uppercase">{t.category}</span></td>
                                 <td className="p-4">
                                   {t.description}
                                   {isInstallment && (
                                     <span className="ml-2 text-[9px] bg-orange/10 text-orange border border-orange/20 px-1.5 py-0.5 rounded-full font-bold">{installTotal}x</span>
                                   )}
                                 </td>
                                 <td className="p-4 text-rose-600 font-bold">R$ {(t.amount ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                                 <td className="p-4">
                                    <StatusBadge status={t.status} />
                                 </td>
                                 <td className="p-4">
                                    <div className="flex gap-1 items-center">
                                      {t.status === 'planned' && (
                                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0" title="Dar Baixa" onClick={async () => { await updateFinancialTransaction(t.id, { status: 'realized' }); await loadData(); }}>
                                           <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                                        </Button>
                                      )}
                                      {t.status === 'realized' && (
                                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0" title="Estornar para Previsto" onClick={async () => {
                                          if (confirm('Estornar esta despesa para status "Previsto"?')) {
                                            await updateFinancialTransaction(t.id, { status: 'planned' });
                                            await loadData();
                                          }
                                        }}>
                                           <Undo2 className="h-4 w-4 text-amber-500" />
                                        </Button>
                                      )}
                                      {isInstallment && (
                                        <Button size="sm" variant="ghost" className="h-8 px-2 text-[10px] font-bold text-rose-500 hover:bg-rose-50" title={`Excluir todas as ${installTotal} parcelas`}
                                          onClick={async () => {
                                            if (confirm(`Excluir TODAS as ${installTotal} parcelas de "${installBase}"?\nEsta ação não pode ser desfeita.`)) {
                                              const safeBase = installBase?.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') ?? ''
                                              const toDelete = allTransactions.filter(tx =>
                                                tx.type === 'expense' &&
                                                new RegExp(`^${safeBase}\\s*\\(\\d+\\/${installTotal}\\)$`).test(tx.description ?? '')
                                              )
                                              for (const tx of toDelete) { await deleteFinancialTransaction(tx.id) }
                                              await loadData();
                                            }
                                          }}
                                        >
                                          <Trash2 className="h-3 w-3 mr-1" />{installTotal}x
                                        </Button>
                                      )}
                                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10" title="Excluir este lançamento" onClick={async () => {
                                         if (confirm('Excluir permanentemente este lançamento?')) {
                                            await deleteFinancialTransaction(t.id);
                                            await loadData();
                                         }
                                      }}>
                                         <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </div>
                                 </td>
                               </tr>
                               )
                             })
                          )}
                       </tbody>
                    </table>
                 </div>
              </CardContent>
           </Card>
        )}

        {tab === "prolabore" && (
           <Card className="premium-shadow">
              <CardContent className="p-0">
                 <div className="p-4 border-b flex justify-between items-center bg-muted/20">
                    <h3 className="font-bold flex items-center gap-2"><Briefcase className="h-4 w-4 text-blue-600" /> Pro-labore (Pagamento Professores)</h3>
                    <p className="text-[10px] text-muted-foreground">Vinculado à Grade Curricular</p>
                 </div>
                 <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                       <thead className="bg-muted/30 border-b">
                          <tr>
                             <th className="p-4 font-bold">Mês/Ano</th>
                             <th className="p-4 font-bold">Disciplina</th>
                             <th className="p-4 font-bold">Professor</th>
                             <th className="p-4 font-bold">Custo Provisório</th>
                             <th className="p-4 font-bold">Status</th>
                             <th className="p-4">Ação</th>
                          </tr>
                       </thead>
                       <tbody>
                          {disciplines.sort((a,b) => (a.order || 0) - (b.order || 0)).map((d, index) => {
                             const link = profLinks.find(l => l.disciplineId === d.id)
                             const prof = professors.find(p => p.id === link?.professorId)
                             const alreadyPaid = transactions.find(t => t.type === 'expense' && t.category === 'Professores' && t.disciplineId === d.id && t.status === 'realized')
                             
                             return (
                              <tr key={d.id} className="border-b transition-colors hover:bg-muted/10">
                                 <td className="p-4 font-mono text-xs">{d.executionDate || competencia}</td>
                                <td className="p-4 font-medium"><span className="text-muted-foreground mr-2">{index + 1}.</span> {d.name}</td>
                                <td className="p-4">
                                   <div className="flex flex-col">
                                      <span className="font-semibold">{prof?.name || d.professorName || "Não definido"}</span>
                                      {prof?.pix_key && <span className="text-[10px] text-muted-foreground">PIX: {prof.pix_key}</span>}
                                   </div>
                                </td>
                                <td className="p-4 font-bold text-rose-600">R$ {settings.proLaboreRate.toFixed(2)}</td>
                                <td className="p-4">
                                   <span className={cn(
                                      "px-2 py-0.5 rounded-full text-[10px] font-black uppercase border",
                                      alreadyPaid ? "bg-emerald-50 text-emerald-600 border-emerald-200" : "bg-orange-50 text-orange border-orange/20"
                                   )}>
                                      {alreadyPaid ? "Quitado" : "Pendente"}
                                   </span>
                                </td>
                                <td className="p-4 flex gap-2">
                                   {!alreadyPaid && (
                                     <>
                                       <Button 
                                         size="sm" 
                                         variant="default" 
                                         disabled={!prof}
                                         onClick={async () => {
                                            if (!prof) return
                                            await processProfessorPayment({
                                              professorId: prof.id,
                                              disciplineId: d.id,
                                              amount: settings.proLaboreRate,
                                              paymentDate: new Date().toISOString().split('T')[0]
                                            })
                                            loadData()
                                         }}
                                       >
                                          Dar Baixa
                                       </Button>
                                       <Button 
                                         size="sm" 
                                         variant="outline"
                                         className="text-muted-foreground hover:text-emerald-700 hover:border-emerald-500/50"
                                         disabled={!prof}
                                         title="Baixa isenta de taxa (Voluntário)"
                                         onClick={async () => {
                                            if (!prof || !confirm(`Dar baixa administrativa em ${d.name} para o professor voluntário ${prof.name} (R$ 0,00)?\nNenhuma despesa de caixa será gerada.`)) return
                                            await processProfessorPayment({
                                              professorId: prof.id,
                                              disciplineId: d.id,
                                              amount: 0,
                                              paymentDate: new Date().toISOString().split('T')[0]
                                            })
                                            loadData()
                                         }}
                                       >
                                          Voluntário
                                       </Button>
                                     </>
                                   )}
                                   {alreadyPaid && (
                                     <>
                                       <Button 
                                         size="sm" 
                                         variant="outline"
                                         onClick={() => {
                                            if (prof) printProfessorReceiptPDF(alreadyPaid as any, prof as any, d as any, "Cosme de Farias")
                                         }}
                                       >
                                          <Printer className="h-4 w-4 mr-2" /> Recibo
                                       </Button>
                                       <Button 
                                         size="sm" 
                                         variant="ghost"
                                         className="text-destructive hover:bg-destructive/10"
                                         onClick={async () => {
                                            if (confirm('Tem certeza que deseja estornar este pagamento?')) {
                                               await deleteFinancialTransaction(alreadyPaid.id);
                                               loadData();
                                            }
                                         }}
                                       >
                                          <Undo2 className="h-4 w-4" />
                                       </Button>
                                     </>
                                    )}
                                </td>
                              </tr>
                             )
                          })}
                       </tbody>
                    </table>
                 </div>
              </CardContent>
           </Card>
        )}

        {tab === "reports" && (
          <ReportsTab
            allTransactions={allTransactions}
            tuitions={tuitions}
            students={students}
            disciplines={disciplines}
            professors={professors}
            profLinks={profLinks}
            hubName="Cosme de Farias"
          />
        )}
      </div>

      <Dialog open={isConfigOpen} onOpenChange={(open) => {
        // Sync draft with latest persisted settings every time dialog opens
        if (open) setConfigDraft({
          tuitionRate: settings.tuitionRate,
          proLaboreRate: settings.proLaboreRate,
          pixKey: settings.pixKey || "",
          pixQRCode: settings.pixQRCode || ""
        })
        setIsConfigOpen(open)
      }}>
        <DialogContent className="max-w-md">
           <DialogHeader><DialogTitle>Configurações Financeiras</DialogTitle></DialogHeader>
           <form onSubmit={async (e) => {
              e.preventDefault();
              await updateFinancialSettings({
                tuitionRate: configDraft.tuitionRate,
                proLaboreRate: configDraft.proLaboreRate,
                pixKey: configDraft.pixKey,
                pixQRCode: configDraft.pixQRCode
              });
              setIsConfigOpen(false);
              await loadData(); // await so state is fresh before any re-render
              toast.success('Configurações salvas com sucesso!');
           }} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2">
                    <Label>Mensalidade (Alunos)</Label>
                    <div className="relative">
                       <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                       <Input
                         type="number" step="0.01"
                         value={configDraft.tuitionRate}
                         onChange={e => setConfigDraft(d => ({ ...d, tuitionRate: Number(e.target.value) }))}
                         className="pl-10 h-9 text-sm"
                       />
                    </div>
                 </div>
                 <div className="space-y-2">
                    <Label>Pro-labore (Profas)</Label>
                    <div className="relative">
                       <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                       <Input
                         type="number" step="0.01"
                         value={configDraft.proLaboreRate}
                         onChange={e => setConfigDraft(d => ({ ...d, proLaboreRate: Number(e.target.value) }))}
                         className="pl-10 h-9 text-sm"
                       />
                    </div>
                 </div>
              </div>

              <div className="space-y-2 p-3 bg-muted/30 rounded-lg border border-muted-foreground/10">
                 <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-2">
                    <QrCode className="h-3 w-3" /> Dados para Recebimento (PIX)
                 </h4>
                 <div className="space-y-3">
                    <div className="space-y-1">
                       <Label className="text-[11px]">Chave PIX (E-mail, CPF, Tel ou Aleatória)</Label>
                       <Input
                         value={configDraft.pixKey}
                         onChange={e => setConfigDraft(d => ({ ...d, pixKey: e.target.value }))}
                         placeholder="Ex: financeiro@teoglobal.com" className="h-9 text-sm"
                       />
                    </div>
                    <div className="space-y-1">
                       <Label className="text-[11px]">Código PIX Copia e Cola (Payload)</Label>
                       <textarea
                          value={configDraft.pixQRCode}
                          onChange={e => setConfigDraft(d => ({ ...d, pixQRCode: e.target.value }))}
                          placeholder="Cole aqui o payload do seu QR Code estático..."
                          className="w-full min-h-[80px] text-xs p-2 rounded-md border bg-background resize-none focus:outline-none focus:ring-1 focus:ring-primary"
                       />
                       <p className="text-[9px] text-muted-foreground">Este código permite que o aluno utilize a função "Copia e Cola" no app do banco.</p>
                    </div>
                 </div>
              </div>

              <DialogFooter className="pt-2">
                 <Button type="button" variant="ghost" onClick={() => setIsConfigOpen(false)}>Cancelar</Button>
                 <Button type="submit" className="accent-gradient">Salvar Configurações</Button>
              </DialogFooter>
           </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isAddExpenseOpen} onOpenChange={setIsAddExpenseOpen}>
        <DialogContent>
           <DialogHeader><DialogTitle>Nova Despesa</DialogTitle></DialogHeader>
           <form onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              handleAddExpense({
                category: fd.get('category'),
                description: fd.get('description'),
                amount: Number(fd.get('amount')),
                date: fd.get('date'),
                status: 'planned'
              });
           }} className="space-y-4">
              <div className="space-y-1">
                 <Label>Categoria</Label>
                 <Select name="category" required>
                    <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                    <SelectContent>
                       {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                 </Select>
              </div>
              <div className="space-y-1">
                 <Label>Descrição</Label>
                 <Input name="description" required placeholder="Ex: Compra de café e papel higiênico" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-1">
                    <Label>Valor (R$)</Label>
                    <Input name="amount" type="number" step="0.01" required />
                 </div>
                 <div className="space-y-1">
                    <Label>Data</Label>
                    <Input name="date" type="date" required defaultValue={new Date().toISOString().split('T')[0]} />
                 </div>
              </div>
              <DialogFooter>
                 <Button type="button" variant="ghost" onClick={() => setIsAddExpenseOpen(false)}>Cancelar</Button>
                 <Button type="submit">Salvar Projeção</Button>
              </DialogFooter>
           </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isSyncOpen} onOpenChange={setIsSyncOpen}>
        <DialogContent>
           <DialogHeader><DialogTitle>Sincronizar Mensalidades em Lote</DialogTitle></DialogHeader>
           <div className="space-y-4 pt-2">
              <p className="text-sm text-muted-foreground">Esta ação irá verificar o currículo de todos os alunos ativos e gerar faturamentos pendentes para quaisquer disciplinas que ainda não possuam mensalidade lançada. Nenhum pagamento já faturado será duplicado ou afetado.</p>
              <DialogFooter>
                 <Button type="button" variant="ghost" onClick={() => setIsSyncOpen(false)}>Cancelar</Button>
                 <Button onClick={async () => {
                    setLoading(true)
                    setIsSyncOpen(false)
                    try {
                      const activeStudents = students.filter(s => s.status === 'active')
                      toast.loading('Sincronizando mensalidades...', { id: 'sync' })
                      await syncBatchTuitions(activeStudents.map(s => s.id))
                      await loadData()
                      toast.success(`Sincronização concluída! ${activeStudents.length} alunos processados.`, { id: 'sync' })
                    } catch (e) {
                      console.error(e)
                      toast.error('Ocorreu um erro durante a sincronização.', { id: 'sync' })
                    } finally {
                      setLoading(false)
                    }
                 }}>Confirmar Sincronização</Button>
              </DialogFooter>
           </div>
        </DialogContent>
      </Dialog>

      <InstallmentExpenseModal
        isOpen={isInstallmentModalOpen}
        onClose={() => setIsInstallmentModalOpen(false)}
        onSave={async (installments) => {
          setLoading(true)
          try {
            for (const item of installments) {
              await addFinancialTransaction(item)
            }
            toast.success(`${installments.length} parcelas lançadas com sucesso!`)
            await loadData()
          } catch (err) {
            toast.error("Erro ao lançar parcelas.")
          } finally {
            setLoading(false)
            setIsInstallmentModalOpen(false)
          }
        }}
      />

      <PaymentConfirmationModal
        isOpen={isPaymentConfirmOpen}
        onClose={() => setIsPaymentConfirmOpen(false)}
        tuition={paymentTuition}
        onConfirm={async (id, date, method, receivedAmount) => {
          setLoading(true)
          try {
            await processTuitionPayment(id, date, method, receivedAmount)
            toast.success("Pagamento confirmado!")
            await loadData()
          } catch (err) {
            toast.error("Erro ao confirmar pagamento.")
          } finally {
            setLoading(false)
            setIsPaymentConfirmOpen(false)
          }
        }}
      />
    </div>
  )
}

// --- Helper Components ---

function StatCard({ title, value, subtitle, icon, trend, highlight }: { title: string, value: number, subtitle: string, icon: React.ReactNode, trend?: "positive" | "negative", highlight?: boolean }) {
  return (
    <Card className={cn("premium-shadow border-none overflow-hidden relative", highlight && "accent-gradient text-white")}>
      {highlight && <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-12 -mt-12 blur-2xl" />}
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className={cn("text-xs font-bold uppercase tracking-widest", highlight ? "text-white/70" : "text-muted-foreground")}>{title}</CardTitle>
        <div className={cn("p-2 rounded-lg", highlight ? "bg-white/20" : "bg-muted")}>{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-black">R$ {(value ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
        <p className={cn("text-[10px] mt-1 font-medium", highlight ? "text-white/60" : "text-muted-foreground")}>{subtitle}</p>
      </CardContent>
    </Card>
  )
}

function TabButton({ children, active, onClick, icon }: { children: React.ReactNode, active: boolean, onClick: () => void, icon?: React.ReactNode }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "py-4 px-2 text-sm font-bold flex items-center gap-2 border-b-2 transition-all",
        active ? "border-orange text-orange" : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted"
      )}
    >
      {icon} {children}
    </button>
  )
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string, color: string }> = {
    'planned': { label: 'Previsto', color: 'bg-slate-100 text-slate-600 border-slate-200' },
    'realized': { label: 'Realizado', color: 'bg-emerald-50 text-emerald-600 border-emerald-200' },
    'pending': { label: 'Pendente', color: 'bg-orange-50 text-orange-600 border-orange-200' },
    'paid': { label: 'Pago', color: 'bg-emerald-100 text-emerald-700 border-emerald-300' },
    'overdue': { label: 'Atrasado', color: 'bg-rose-50 text-rose-600 border-rose-200' }
  }
  const config = map[status] || { label: status, color: 'bg-muted text-muted-foreground' }
  return (
    <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-black uppercase border", config.color)}>
      {config.label}
    </span>
  )
}

function StudentTuitionRow({ student, disciplines, tuitions, onSync, onPayment, onRevert, onUpdateDate, onPrintReceipt }: {
  student: StudentProfile;
  disciplines: Discipline[];
  tuitions: StudentTuition[];
  onSync: (studentId: string) => Promise<void>;
  onPayment: (tuitionId: string, amount: number) => void;
  onRevert: (tuitionId: string) => Promise<void>;
  onUpdateDate: (tuitionId: string, customDate: string) => Promise<void>;
  onPrintReceipt: (tuition: StudentTuition, student: StudentProfile, discipline: Discipline) => void;
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)

  const handleSync = async () => {
    setIsSyncing(true)
    await onSync(student.id)
    setIsSyncing(false)
  }

  const sortedDisciplines = [...disciplines].sort((a, b) => (a.order || 0) - (b.order || 0))
  
  return (
    <div className="border rounded-lg overflow-hidden bg-white shadow-sm transition-all duration-200">
       <button onClick={() => setIsOpen(!isOpen)} className="w-full flex items-center justify-between p-4 bg-muted/5 hover:bg-muted/20 transition-colors">
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 flex-1">
             <div className="font-bold text-left text-sm sm:text-base text-navy">{student.name}</div>
             <div className="text-xs text-muted-foreground mr-4 text-left font-mono">{student.enrollment_number || student.cpf}</div>
             <div className="flex gap-2 mt-1 sm:mt-0">
                 <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 uppercase border border-slate-200 shadow-sm">{tuitions.length} Lançamentos</span>
                 {tuitions.filter(t => t.status === 'overdue').length > 0 && <span className="px-2 py-0.5 rounded-full text-[10px] bg-rose-50 text-rose-700 uppercase font-bold border border-rose-200">{tuitions.filter(t => t.status === 'overdue').length} em atraso</span>}
                 {tuitions.filter(t => t.status === 'paid').length > 0 && <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-50 text-emerald-700 uppercase font-bold border border-emerald-200">{tuitions.filter(t => t.status === 'paid').length} pagos</span>}
             </div>
          </div>
          <div className="ml-4 p-2 rounded-full bg-muted/50 text-muted-foreground hover:bg-primary hover:text-white transition-colors">
            {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </div>
       </button>
       
       {isOpen && (
          <div className="p-0 sm:p-4 border-t animate-in slide-in-from-top-2 duration-300">
             <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 sm:p-0 mb-4 gap-4">
                <div>
                   <h4 className="font-bold text-sm text-navy uppercase tracking-widest flex items-center gap-2"><PieChart className="w-4 h-4 text-orange" /> Panorama Financeiro</h4>
                   <p className="text-xs text-muted-foreground">Visão geral do faturamento disciplinar deste aluno ativo.</p>
                </div>
                <Button size="sm" variant="outline" className="w-full sm:w-auto shadow-sm" onClick={handleSync} disabled={isSyncing}>
                   <RefreshCw className={cn("h-3 w-3 mr-2", isSyncing && "animate-spin")} />
                   Sincronizar Grade Completa
                </Button>
             </div>
             
             <div className="overflow-x-auto rounded-lg border bg-white premium-shadow">
                <table className="w-full text-xs text-left">
                   <thead className="bg-muted/30">
                      <tr>
                         <th className="p-3 font-extrabold uppercase text-navy border-b">Disciplina</th>
                         <th className="p-3 font-extrabold uppercase text-navy border-b">Vencimento</th>
                         <th className="p-3 font-extrabold uppercase text-navy border-b">Valor</th>
                         <th className="p-3 font-extrabold uppercase text-navy border-b">Status</th>
                         <th className="p-3 font-extrabold uppercase text-navy border-b">Ação</th>
                      </tr>
                   </thead>
                   <tbody>
                      {sortedDisciplines.length === 0 && (
                         <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">Nenhuma disciplina cadastrada na grade curricular.</td></tr>
                      )}
                      {sortedDisciplines.map((d, i) => {
                         const tuition = tuitions.find(t => t.disciplineId === d.id)
                         return (
                           <tr key={d.id} className="border-b last:border-0 hover:bg-orange/5 transition-colors group">
                              <td className="p-3 font-medium flex items-center gap-2">
                                 <span className="w-5 h-5 flex items-center justify-center rounded-full bg-muted text-[10px] font-bold text-muted-foreground group-hover:bg-orange/20 group-hover:text-orange transition-colors">{i+1}</span>
                                 {d.name}
                              </td>
                              {tuition ? (
                                <>
                                 <td className="p-3">
                                     <Input 
                                        type="date" 
                                        defaultValue={tuition.dueDate || ""} 
                                        className="h-8 text-xs border-transparent hover:border-border focus:border-border p-1 w-32 shadow-none bg-transparent hover:bg-white"
                                        onBlur={(e) => onUpdateDate(tuition.id, e.target.value)}
                                     />
                                 </td>
                                 <td className="p-3 font-bold text-navy">R$ {(tuition.amount ?? 0).toFixed(2)}</td>
                                 <td className="p-3"><StatusBadge status={tuition.status} /></td>
                                 <td className="p-3">
                                     <div className="flex gap-2">
                                     {tuition.status === 'paid' ? (
                                        <>
                                          <Button size="sm" variant="outline" className="h-8 shadow-sm hover:shadow-md transition-shadow focus:ring-2 focus:ring-emerald-500/20" onClick={() => onPrintReceipt(tuition, student, d)}>
                                              <Printer className="h-3 w-3 sm:mr-2" /> <span className="hidden sm:inline">Emissão Recibo</span>
                                          </Button>
                                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10" onClick={async () => {
                                            if (confirm('Tem certeza que deseja estornar este pagamento?')) {
                                               await onRevert(tuition.id)
                                            }
                                          }} title="Estornar">
                                              <Undo2 className="h-4 w-4" />
                                          </Button>
                                        </>
                                     ) : (
                                        <Button size="sm" className="h-8 shadow-sm hover:shadow-md transition-shadow bg-blue-600 hover:bg-blue-700" onClick={() => onPayment(tuition.id, tuition.amount)}>
                                            <DollarSign className="h-3 w-3 sm:mr-2" /> <span className="hidden sm:inline">Confirmar Pgto</span>
                                        </Button>
                                     )}
                                     </div>
                                 </td>
                                </>
                              ) : (
                                <>
                                 <td className="p-3 text-muted-foreground/70 italic text-[11px]" colSpan={4}>Faturamento não gerado para esta matéria. Sincronize para criar.</td>
                                </>
                              )}
                           </tr>
                         )
                      })}
                   </tbody>
                </table>
             </div>
          </div>
       )}
    </div>
  )
}


// --- Componente de Cadastro de Despesas Parceladas ---

function InstallmentExpenseModal({ isOpen, onClose, onSave }: { isOpen: boolean, onClose: () => void, onSave: (data: any[]) => void }) {
  const [formData, setFormData] = useState({
    description: "",
    category: CATEGORIES[0],
    totalAmount: 0,
    firstDueDate: new Date().toISOString().split('T')[0],
    installmentsCount: 12
  })

  // Pre-calculate installments for preview
  const preview = useMemo(() => {
    if (!formData.totalAmount || !formData.installmentsCount || formData.installmentsCount <= 0) return []
    
    const installments = []
    const amountPerInstallment = Number((formData.totalAmount / formData.installmentsCount).toFixed(2))
    
    // Use a date object for calculation, specifying time to avoid DST/timezone issues
    const startDate = new Date(formData.firstDueDate + 'T12:00:00')
    
    for (let i = 0; i < formData.installmentsCount; i++) {
       const date = new Date(startDate)
       date.setMonth(startDate.getMonth() + i)
       
       const competencia = date.toISOString().substring(0, 7)
       const formattedDate = date.toISOString().split('T')[0]
       
       installments.push({
         category: formData.category,
         description: `${formData.description} (${i + 1}/${formData.installmentsCount})`,
         amount: amountPerInstallment,
         date: formattedDate,
         competencia: competencia,
         status: 'planned' as const,
         type: 'expense' as const
       })
    }
    return installments
  }, [formData])

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-orange" /> Lançamento de Despesas Parceladas
          </DialogTitle>
          <DialogDescription>As parcelas serão criadas como despesas previstas no DRE dos meses correspondentes.</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
          <div className="space-y-4">
            <div className="space-y-1">
              <Label>Descrição da Despesa</Label>
              <Input 
                 placeholder="Ex: Compra de Equipamentos"
                 value={formData.description}
                 onChange={e => setFormData(d => ({ ...d, description: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label>Categoria</Label>
              <Select value={formData.category} onValueChange={v => setFormData(d => ({ ...d, category: v }))}>
                 <SelectTrigger><SelectValue /></SelectTrigger>
                 <SelectContent>
                    {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                 </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-1">
                 <Label>Valor Total (R$)</Label>
                 <Input 
                   type="number" step="0.01"
                   value={formData.totalAmount || ''}
                   onChange={e => setFormData(d => ({ ...d, totalAmount: Number(e.target.value) }))}
                 />
               </div>
               <div className="space-y-1">
                 <Label>Nº Parcelas</Label>
                 <Input 
                   type="number"
                   value={formData.installmentsCount || ''}
                   onChange={e => setFormData(d => ({ ...d, installmentsCount: Number(e.target.value) }))}
                 />
               </div>
            </div>
            <div className="space-y-1">
               <Label>Data 1º Vencimento</Label>
               <Input 
                 type="date"
                 value={formData.firstDueDate}
                 onChange={e => setFormData(d => ({ ...d, firstDueDate: e.target.value }))}
               />
            </div>
          </div>

          <div className="flex flex-col border rounded-lg bg-muted/20 overflow-hidden">
             <div className="p-2 bg-muted font-bold text-[10px] uppercase tracking-wider flex justify-between">
                <span>Pré-visualização</span>
                <span>{preview.length} Parcelas</span>
             </div>
             <ScrollArea className="flex-1 h-[280px] p-3">
                <div className="space-y-2">
                   {preview.map((p, i) => (
                     <div key={i} className="flex justify-between items-center text-xs p-2 bg-background border rounded-md">
                        <div className="flex flex-col">
                           <span className="font-bold">{p.date.split('-').reverse().join('/')}</span>
                           <span className="text-[10px] text-muted-foreground">{p.description}</span>
                        </div>
                        <span className="font-bold text-rose-600">R$ {(p.amount ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                     </div>
                   ))}
                   {preview.length === 0 && (
                     <div className="h-full flex flex-col items-center justify-center text-muted-foreground italic py-10">
                        <Calendar className="h-8 w-8 opacity-20 mb-2" />
                        <p className="text-xs">Preencha os dados ao lado</p>
                     </div>
                   )}
                </div>
             </ScrollArea>
          </div>
        </div>

        <DialogFooter className="mt-6">
           <Button variant="ghost" onClick={onClose}>Cancelar</Button>
           <Button 
             className="accent-gradient"
             disabled={!formData.description || !formData.totalAmount || preview.length === 0}
             onClick={() => onSave(preview)}
           >
             Gerar e Lançar Parcelas
           </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// --- Modal de Confirmação de Pagamento ---

function PaymentConfirmationModal({ isOpen, onClose, tuition, onConfirm }: { 
  isOpen: boolean, 
  onClose: () => void, 
  tuition: { id: string, amount: number, studentName: string } | null,
  onConfirm: (id: string, date: string, method: string, receivedAmount: number) => void
}) {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [method, setMethod] = useState("Pix")
  const [receivedAmount, setReceivedAmount] = useState(0)

  useEffect(() => {
    if (isOpen && tuition) {
      setDate(new Date().toISOString().split('T')[0])
      setMethod("Pix")
      setReceivedAmount(tuition.amount ?? 0)
    }
  }, [isOpen, tuition])

  if (!tuition) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-600" /> Confirmar Recebimento
          </DialogTitle>
          <DialogDescription>
            Confirme os detalhes do pagamento de <strong>{tuition.studentName}</strong>.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="received-amount">Valor Recebido (R$)</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-muted-foreground">R$</span>
              <Input 
                id="received-amount" 
                type="number" 
                step="0.01" 
                min="0"
                value={receivedAmount}
                onChange={(e) => setReceivedAmount(Number(e.target.value))}
                className="pl-10 text-lg font-black text-emerald-600"
              />
            </div>
            {receivedAmount !== (tuition.amount ?? 0) && (
              <p className="text-[10px] text-amber-600 font-bold flex items-center gap-1">
                <AlertCircle className="h-3 w-3" /> Valor original: R$ {(tuition.amount ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} — alteração apenas neste recebimento.
              </p>
            )}
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="payment-date">Data do Pagamento</Label>
            <Input 
              id="payment-date" 
              type="date" 
              value={date} 
              onChange={(e) => setDate(e.target.value)} 
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="payment-method">Meio de Pagamento</Label>
            <Select value={method} onValueChange={setMethod}>
              <SelectTrigger id="payment-method">
                <SelectValue placeholder="Selecione o meio" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Pix">
                  <div className="flex items-center gap-2">
                    <QrCode className="h-3.5 w-3.5 text-emerald-600" /> Pix
                  </div>
                </SelectItem>
                <SelectItem value="Espécie">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-3.5 w-3.5 text-orange" /> Espécie
                  </div>
                </SelectItem>
                <SelectItem value="Cartão">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-3.5 w-3.5 text-blue-600" /> Cartão
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button 
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
            onClick={() => onConfirm(tuition.id, date, method, receivedAmount)}
            disabled={receivedAmount <= 0}
          >
            Confirmar Pagamento
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ——— ReportsTab Component ——————————————————————————————————————————————————————

interface ReportsTabProps {
  allTransactions: FinancialTransaction[]
  tuitions: StudentTuition[]
  students: StudentProfile[]
  disciplines: Discipline[]
  professors: ProfessorAccount[]
  profLinks: ProfessorDiscipline[]
  hubName: string
}

function ReportsTab({ allTransactions, tuitions, students, disciplines, professors, profLinks, hubName }: ReportsTabProps) {
  // — Mensalidades filters —
  const [rTuitionStudent, setRTuitionStudent] = useState("all")
  const [rTuitionStatus, setRTuitionStatus] = useState("all")

  // — Receita Realizada filters —
  const [rRevenueMonth, setRRevenueMonth] = useState("")
  const [rRevenueMin, setRRevenueMin] = useState("")
  const [rRevenueMax, setRRevenueMax] = useState("")

  // — Despesas filters —
  const [rExpCat, setRExpCat] = useState("all")
  const [rExpMonth, setRExpMonth] = useState("")
  const [rExpStatus, setRExpStatus] = useState("all")

  // — DRE filters —
  const [rDreMonth, setRDreMonth] = useState(new Date().toISOString().substring(0, 7))
  const [rDreAccumulated, setRDreAccumulated] = useState(false)

  // — Parcelamentos filters —
  const [rInstCat, setRInstCat] = useState("all")
  const [rInstStatus, setRInstStatus] = useState("all")
  const [rInstMonth, setRInstMonth] = useState("")

  // — Pro-labore filters —
  const [rProfId, setRProfId] = useState("all")
  const [rProfMonth, setRProfMonth] = useState("")
  const [rProfStatus, setRProfStatus] = useState<"all" | "pending" | "paid">("all")

  const EXPENSE_CATEGORIES = [
    "Alimento", "Limpeza", "Professores", "Material de Escritório", "Transporte",
    "Pessoal", "Aluguel", "Energia/Água", "Internet", "Marketing", "Eventos", "Material Didático", "Outros"
  ]

  function handleDRE() {
    if (rDreAccumulated) {
      const accumulated = allTransactions.filter(t => t.competencia && t.competencia <= rDreMonth)
      printFinancialDRE_PDF(accumulated, rDreMonth, hubName, undefined, `DRE Acumulado até ${rDreMonth}`)
    } else {
      const monthly = allTransactions.filter(t => t.competencia === rDreMonth)
      printFinancialDRE_PDF(monthly, rDreMonth, hubName)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Card 1: Mensalidades */}
        <Card className="premium-shadow border-t-4 border-t-orange">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
              <FileText className="h-4 w-4 text-orange" /> Mensalidades
            </CardTitle>
            <CardDescription className="text-xs">Relatório por aluno e situação de pagamento.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-muted-foreground">Aluno</label>
                <Select value={rTuitionStudent} onValueChange={setRTuitionStudent}>
                  <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Alunos</SelectItem>
                    {students.filter(s => s.status === "active").sort((a, b) => a.name.localeCompare(b.name)).map(s => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-muted-foreground">Status</label>
                <Select value={rTuitionStatus} onValueChange={setRTuitionStatus}>
                  <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="pending">Pendente</SelectItem>
                    <SelectItem value="paid">Pago</SelectItem>
                    <SelectItem value="overdue">Atrasado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button
              size="sm" className="w-full bg-orange/10 text-orange hover:bg-orange/20 border border-orange/30"
              onClick={() => printTuitionReportPDF(tuitions, students, hubName, undefined, { studentId: rTuitionStudent, status: rTuitionStatus })}
            >
              <Printer className="h-4 w-4 mr-2" /> Imprimir PDF
            </Button>
          </CardContent>
        </Card>

        {/* Card 2: Receita Realizada */}
        <Card className="premium-shadow border-t-4 border-t-emerald-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
              <ArrowUpRight className="h-4 w-4 text-emerald-600" /> Receita Realizada
            </CardTitle>
            <CardDescription className="text-xs">Entradas confirmadas com filtros por período e valor.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-3 space-y-1">
                <label className="text-[10px] font-bold uppercase text-muted-foreground">Mês/Ano</label>
                <Input type="month" value={rRevenueMonth} onChange={e => setRRevenueMonth(e.target.value)} className="h-9 text-xs" />
              </div>
              <div className="col-span-1.5 space-y-1">
                <label className="text-[10px] font-bold uppercase text-muted-foreground">Valor Mín (R$)</label>
                <Input type="number" placeholder="0,00" value={rRevenueMin} onChange={e => setRRevenueMin(e.target.value)} className="h-9 text-xs" />
              </div>
              <div className="col-span-1.5 space-y-1">
                <label className="text-[10px] font-bold uppercase text-muted-foreground">Valor Máx (R$)</label>
                <Input type="number" placeholder="∞" value={rRevenueMax} onChange={e => setRRevenueMax(e.target.value)} className="h-9 text-xs" />
              </div>
            </div>
            <Button
              size="sm" className="w-full bg-emerald-600/10 text-emerald-700 hover:bg-emerald-600/20 border border-emerald-300"
              onClick={() => printRevenueReportPDF(allTransactions, hubName, undefined, {
                monthYear: rRevenueMonth || undefined,
                minValue: rRevenueMin ? Number(rRevenueMin) : undefined,
                maxValue: rRevenueMax ? Number(rRevenueMax) : undefined
              })}
            >
              <Printer className="h-4 w-4 mr-2" /> Imprimir PDF
            </Button>
          </CardContent>
        </Card>

        {/* Card 3: Despesas */}
        <Card className="premium-shadow border-t-4 border-t-rose-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
              <ArrowDownRight className="h-4 w-4 text-rose-600" /> Despesas
            </CardTitle>
            <CardDescription className="text-xs">Projetadas e realizadas com filtros por categoria e período.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-muted-foreground">Categoria</label>
                <Select value={rExpCat} onValueChange={setRExpCat}>
                  <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    {EXPENSE_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-muted-foreground">Status</label>
                <Select value={rExpStatus} onValueChange={setRExpStatus}>
                  <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="planned">Previsto</SelectItem>
                    <SelectItem value="realized">Realizado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2 space-y-1">
                <label className="text-[10px] font-bold uppercase text-muted-foreground">Mês/Ano</label>
                <Input type="month" value={rExpMonth} onChange={e => setRExpMonth(e.target.value)} className="h-9 text-xs" />
              </div>
            </div>
            <Button
              size="sm" className="w-full bg-rose-600/10 text-rose-700 hover:bg-rose-600/20 border border-rose-300"
              onClick={() => printExpensesReportPDF(allTransactions, hubName, undefined, {
                category: rExpCat,
                monthYear: rExpMonth || undefined,
                status: rExpStatus
              })}
            >
              <Printer className="h-4 w-4 mr-2" /> Imprimir PDF
            </Button>
          </CardContent>
        </Card>

        {/* Card 4: DRE */}
        <Card className="premium-shadow border-t-4 border-t-primary">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" /> DRE — Demonstrativo de Resultado
            </CardTitle>
            <CardDescription className="text-xs">Receitas vs despesas de um mês ou acumulado.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-muted-foreground">Competência</label>
              <Input type="month" value={rDreMonth} onChange={e => setRDreMonth(e.target.value)} className="h-9 text-xs" />
            </div>
            <div className="flex items-center gap-2 p-2 rounded-md border bg-muted/30 cursor-pointer" onClick={() => setRDreAccumulated(v => !v)}>
              <div className={cn("w-4 h-4 rounded border-2 flex items-center justify-center transition-colors", rDreAccumulated ? "bg-primary border-primary" : "border-muted-foreground")}>
                {rDreAccumulated && <span className="text-white font-black text-[10px]">✓</span>}
              </div>
              <span className="text-xs font-medium">Acumulado até este mês</span>
            </div>
            <Button
              size="sm" className="w-full"
              onClick={handleDRE}
            >
              <Printer className="h-4 w-4 mr-2" /> Imprimir PDF
            </Button>
          </CardContent>
        </Card>

        {/* Card 5: Parcelamentos */}
        <Card className="premium-shadow border-t-4 border-t-purple-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
              <Calendar className="h-4 w-4 text-purple-600" /> Parcelamentos e Projeções
            </CardTitle>
            <CardDescription className="text-xs">Despesas parceladas e previstas por categoria e período.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-muted-foreground">Categoria</label>
                <Select value={rInstCat} onValueChange={setRInstCat}>
                  <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    {EXPENSE_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-muted-foreground">Status</label>
                <Select value={rInstStatus} onValueChange={setRInstStatus}>
                  <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="planned">Previsto</SelectItem>
                    <SelectItem value="realized">Realizado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2 space-y-1">
                <label className="text-[10px] font-bold uppercase text-muted-foreground">Mês/Ano</label>
                <Input type="month" value={rInstMonth} onChange={e => setRInstMonth(e.target.value)} className="h-9 text-xs" />
              </div>
            </div>
            <Button
              size="sm" className="w-full bg-purple-600/10 text-purple-700 hover:bg-purple-600/20 border border-purple-300"
              onClick={() => printInstallmentsReportPDF(allTransactions, hubName, undefined, {
                category: rInstCat,
                status: rInstStatus,
                monthYear: rInstMonth || undefined
              })}
            >
              <Printer className="h-4 w-4 mr-2" /> Imprimir PDF
            </Button>
          </CardContent>
        </Card>

        {/* Card 6: Pro-labore */}
        <Card className="premium-shadow border-t-4 border-t-blue-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-blue-600" /> Pro-labore
            </CardTitle>
            <CardDescription className="text-xs">Pagamentos por professor, mês e status.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-muted-foreground">Professor</label>
                <Select value={rProfId} onValueChange={setRProfId}>
                  <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {professors.filter(p => p.active).sort((a, b) => a.name.localeCompare(b.name)).map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-muted-foreground">Status</label>
                <Select value={rProfStatus} onValueChange={v => setRProfStatus(v as "all" | "pending" | "paid")}>
                  <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="pending">Pendente</SelectItem>
                    <SelectItem value="paid">Pago</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2 space-y-1">
                <label className="text-[10px] font-bold uppercase text-muted-foreground">Mês/Ano</label>
                <Input type="month" value={rProfMonth} onChange={e => setRProfMonth(e.target.value)} className="h-9 text-xs" />
              </div>
            </div>
            <Button
              size="sm" className="w-full bg-blue-600/10 text-blue-700 hover:bg-blue-600/20 border border-blue-300"
              onClick={() => printProLaboreReportPDF(disciplines, allTransactions, professors, profLinks, hubName, undefined, {
                professorId: rProfId,
                monthYear: rProfMonth || undefined,
                status: rProfStatus
              })}
            >
              <Printer className="h-4 w-4 mr-2" /> Imprimir PDF
            </Button>
          </CardContent>
        </Card>

      </div>
    </div>
  )
}
