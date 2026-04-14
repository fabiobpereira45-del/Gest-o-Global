"use client"

import { useState, useEffect, useMemo } from "react"
import { 
  BarChart3, TrendingUp, TrendingDown, DollarSign, Calendar, Filter, Download, Plus, 
  Trash2, CheckCircle2, AlertCircle, PieChart, Wallet, ArrowUpRight, ArrowDownRight,
  MoreHorizontal, FileText, Printer, Calculator, RefreshCw, X, BookOpen, Briefcase, ChevronDown, ChevronUp, Undo2, QrCode
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
import { printFinancialDRE_PDF, printTuitionReportPDF, printReceiptPDF, printProfessorReceiptPDF, printInstallmentsReportPDF } from "@/lib/pdf"

// --- Constants ---
const CATEGORIES = [
  "Alimento", "Limpeza", "Professores", "Material de Escritório", "Transporte", 
  "Pessoal", "Aluguel", "Energia/Água", "Internet", "Marketing", "Eventos", "Material Didático", "Outros"
]

const COLORS = ["#f97316", "#0ea5e9", "#8b5cf6", "#10b981", "#f43f5e", "#eab308", "#6366f1", "#14b8a6", "#ec4899", "#475569"]

export function FinancialManager() {
  const [tab, setTab] = useState<"dashboard" | "income" | "expenses" | "prolabore">("dashboard")
  const [allTransactions, setAllTransactions] = useState<FinancialTransaction[]>([])
  const [transactions, setTransactions] = useState<FinancialTransaction[]>([])
  const [tuitions, setTuitions] = useState<StudentTuition[]>([])
  const [students, setStudents] = useState<StudentProfile[]>([])
  const [disciplines, setDisciplines] = useState<Discipline[]>([])
  const [professors, setProfessors] = useState<ProfessorAccount[]>([])
  const [profLinks, setProfLinks] = useState<ProfessorDiscipline[]>([])
  const [settings, setSettings] = useState<FinancialSettings>({ tuitionRate: 300, proLaboreRate: 300 })
  const [loading, setLoading] = useState(true)
  const [competencia, setCompetencia] = useState(new Date().toISOString().substring(0, 7)) // YYYY-MM
  
  // States for Modals
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false)
  const [isInstallmentModalOpen, setIsInstallmentModalOpen] = useState(false)
  const [isSyncOpen, setIsSyncOpen] = useState(false)
  const [isConfigOpen, setIsConfigOpen] = useState(false)

  // Local draft state for the config dialog — always mirrors the last persisted settings
  const [configDraft, setConfigDraft] = useState({
    tuitionRate: settings.tuitionRate,
    proLaboreRate: settings.proLaboreRate,
    pixKey: settings.pixKey || "",
    pixQRCode: settings.pixQRCode || ""
  })

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
    const plannedIncome = transactions.filter(t => t.type === 'income' && t.status === 'planned').reduce((acc, t) => acc + t.amount, 0)
    const realizedIncome = transactions.filter(t => t.type === 'income' && t.status === 'realized').reduce((acc, t) => acc + t.amount, 0)
    const plannedExpense = transactions.filter(t => t.type === 'expense' && t.status === 'planned').reduce((acc, t) => acc + t.amount, 0)
    const realizedExpense = transactions.filter(t => t.type === 'expense' && t.status === 'realized').reduce((acc, t) => acc + t.amount, 0)

    // Filtramos mensalidades e disciplinas pela competência (mês) selecionada
    const tuitionsThisMonth = tuitions.filter(tu => tu.dueDate?.startsWith(competencia))
    const disciplinesThisMonth = disciplines.filter(d => d.executionDate?.startsWith(competencia))

    const pendingTuition = tuitionsThisMonth.filter(tu => tu.status === 'pending' || tu.status === 'overdue').reduce((acc, tu) => acc + tu.amount, 0)
    
    // Projeção de pro-labore: total geral (todas as disciplinas × taxa configurada)
    const proLaboreProjected = disciplines.length > 0 
      ? disciplines.length * settings.proLaboreRate 
      : 0
    
    // Receita projetada: Total das mensalidades já geradas + (saldo de mensalidades não geradas × taxa padrão selecionada)
    const activeStudents = students.filter(s => s.status === 'active')
    const activeStudentIds = new Set(activeStudents.map(s => s.id))
    const tuitionsActive = tuitions.filter(tu => activeStudentIds.has(tu.studentId))
    
    const generatedAmount = tuitionsActive.reduce((acc, tu) => acc + tu.amount, 0)
    const totalExpectedCount = activeStudents.length * disciplines.length
    const generatedCount = tuitionsActive.length
    const remainingCount = Math.max(0, totalExpectedCount - generatedCount)
    
    const revenueProjected = generatedAmount + (remainingCount * settings.tuitionRate)

    const netRealized = realizedIncome - realizedExpense

    // Acumulado: Soma de todas as transações realizadas ATÉ a competência atual
    // Ordenamos as competências alfabeticamente para o filtro (YYYY-MM)
    const accumulatedIncome = allTransactions
      .filter(t => t.type === 'income' && t.status === 'realized' && (!t.competencia || t.competencia <= competencia))
      .reduce((acc, t) => acc + t.amount, 0)
    
    const accumulatedExpense = allTransactions
      .filter(t => t.type === 'expense' && t.status === 'realized' && (!t.competencia || t.competencia <= competencia))
      .reduce((acc, t) => acc + t.amount, 0)

    return {
      plannedIncome, realizedIncome,
      plannedExpense, realizedExpense,
      pendingTuition,
      proLaboreProjected,
      revenueProjected,
      accumulatedIncome,
      accumulatedExpense,
      netPlanned: plannedIncome - plannedExpense,
      netRealized
    }
  }, [allTransactions, tuitions, disciplines, settings, students, competencia])

  const chartData = useMemo(() => [
    { name: "Receitas", Previsto: stats.plannedIncome + stats.realizedIncome, Realizado: stats.realizedIncome },
    { name: "Despesas", Previsto: stats.plannedExpense + stats.realizedExpense, Realizado: stats.realizedExpense },
  ], [stats])

  const expenseDistribution = useMemo(() => {
    const realization = transactions.filter(t => t.type === 'expense' && t.status === 'realized')
    return CATEGORIES.map(cat => {
      const total = realization.filter(t => t.category === cat).reduce((acc, t) => acc + t.amount, 0)
      return { name: cat, value: total }
    }).filter(d => d.value > 0)
  }, [transactions])

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
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-navy to-orange bg-clip-text text-transparent">Gestão Financeira</h1>
          <p className="text-muted-foreground text-xs lg:text-sm">Controle de caixa, mensalidades e projeções.</p>
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
              <Button variant="outline" size="sm" className="flex-1 sm:flex-none h-9 text-xs" onClick={() => printFinancialDRE_PDF(transactions, competencia, "Cosme de Farias")}>
                <Download className="h-4 w-4 mr-1.5" /> DRE
              </Button>
              <Button variant="outline" size="sm" className="flex-1 sm:flex-none h-9 text-xs border-primary/40 text-primary" onClick={() => {
                const accTransactions = allTransactions.filter(t => !t.competencia || t.competencia <= competencia)
                printFinancialDRE_PDF(accTransactions, competencia, "Cosme de Farias", null, `DRE ACUMULADO - Até ${competencia}`)
              }}>
                <Download className="h-4 w-4 mr-1.5" /> DRE Acumulado
              </Button>
              <Button variant="outline" size="sm" className="flex-1 sm:flex-none h-9 text-xs" onClick={() => printTuitionReportPDF(tuitions, students, "Cosme de Farias")}>
                <Printer className="h-4 w-4 mr-1.5" /> Relatório
              </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Receita Realizada" 
          value={stats.realizedIncome} 
          subtitle={`No mês. Acumulado: R$ ${stats.accumulatedIncome.toLocaleString('pt-BR')}`}
          icon={<ArrowUpRight className="text-emerald-500" />}
          trend="positive"
        />
        <StatCard 
          title="Despesa Realizada" 
          value={stats.realizedExpense} 
          subtitle={`No mês. Acumulado: R$ ${stats.accumulatedExpense.toLocaleString('pt-BR')}`}
          icon={<ArrowDownRight className="text-rose-500" />}
          trend="negative"
        />
        <StatCard 
          title="Saldo Líquido (Real)" 
          value={stats.netRealized} 
          subtitle="Entradas - Saídas"
          icon={<Wallet className="text-primary" />}
          highlight
        />
        <StatCard 
          title="Mensalidades em Aberto" 
          value={stats.pendingTuition} 
          subtitle="Previsão de Recebimento"
          icon={<Calculator className="text-orange" />}
        />
      </div>

      {/* Tabs */}
      <div className="overflow-x-auto scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0">
        <div className="flex border-b border-border/50 gap-4 lg:gap-8 min-w-max">
          <TabButton active={tab === "dashboard"} onClick={() => setTab("dashboard")} icon={<PieChart className="h-4 w-4" />}>Dashboard</TabButton>
          <TabButton active={tab === "income"} onClick={() => setTab("income")} icon={<DollarSign className="h-4 w-4" />}>Receitas</TabButton>
          <TabButton active={tab === "expenses"} onClick={() => setTab("expenses")} icon={<TrendingDown className="h-4 w-4" />}>Despesas</TabButton>
          <TabButton active={tab === "prolabore"} onClick={() => setTab("prolabore")} icon={<Briefcase className="h-4 w-4" />}>Pro-labore</TabButton>
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
                        formatter={(val: number) => `R$ ${val.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
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
                            formatter={(val: number) => `R$ ${val.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
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
                           onPayment={async (id) => { await processTuitionPayment(id, new Date().toISOString().split('T')[0]); await loadData(); }}
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
                                 <td className="p-4 text-emerald-600 font-bold">R$ {t.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
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
                             transactions.filter(t => t.type === 'expense').map(t => (
                               <tr key={t.id} className="border-b hover:bg-muted/10">
                                 <td className="p-4">{new Date(t.date).toLocaleDateString('pt-BR')}</td>
                                 <td className="p-4"><span className="px-2 py-1 bg-muted rounded text-[10px] font-bold uppercase">{t.category}</span></td>
                                 <td className="p-4">{t.description}</td>
                                 <td className="p-4 text-rose-600 font-bold">R$ {t.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                                 <td className="p-4">
                                    <StatusBadge status={t.status} />
                                 </td>
                                 <td className="p-4">
                                    {t.status === 'planned' && (
                                      <Button size="sm" variant="ghost" onClick={() => updateFinancialTransaction(t.id, { status: 'realized' })} title="Dar Baixa">
                                         <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                                      </Button>
                                    )}
                                    <Button size="sm" variant="ghost" className="text-destructive" onClick={async () => {
                                       if (confirm('Deseja excluir permanentemente este lançamento?')) {
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
        <div className="text-2xl font-black">R$ {value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
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
  onPayment: (tuitionId: string) => Promise<void>;
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
                                 <td className="p-3 font-bold text-navy">R$ {tuition.amount.toFixed(2)}</td>
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
                                        <Button size="sm" className="h-8 shadow-sm hover:shadow-md transition-shadow bg-blue-600 hover:bg-blue-700" onClick={() => onPayment(tuition.id)}>
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
                        <span className="font-bold text-rose-600">R$ {p.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
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
