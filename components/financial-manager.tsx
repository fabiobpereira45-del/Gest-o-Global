"use client"

import { useState, useEffect, useMemo } from "react"
import { 
  BarChart3, TrendingUp, TrendingDown, DollarSign, Calendar, Filter, Download, Plus, 
  Trash2, CheckCircle2, AlertCircle, PieChart, Wallet, ArrowUpRight, ArrowDownRight,
  MoreHorizontal, FileText, Printer, Calculator, RefreshCw, X, BookOpen, Briefcase
} from "lucide-react"
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
  updateTuition,
  processTuitionPayment,
  getStudents,
  getDisciplines,
  type FinancialTransaction,
  type StudentTuition,
  type StudentProfile,
  type Discipline,
} from "@/lib/store"
import { cn } from "@/lib/utils"
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter 
} from "@/components/ui/dialog"
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
// import { printFinancialDRE_PDF, printTuitionReportPDF } from "@/lib/pdf"

// --- Constants ---
const CATEGORIES = [
  "Alimento", "Limpeza", "Professores", "Material de Escritório", "Transporte", 
  "Pessoal", "Aluguel", "Energia/Água", "Internet", "Marketing", "Eventos", "Outros"
]

const COLORS = ["#f97316", "#1e3a5f", "#4c1d95", "#16a34a", "#dc2626", "#8b5cf6", "#eab308"]

export function FinancialManager() {
  const [tab, setTab] = useState<"dashboard" | "income" | "expenses" | "prolabore">("dashboard")
  const [transactions, setTransactions] = useState<FinancialTransaction[]>([])
  const [tuitions, setTuitions] = useState<StudentTuition[]>([])
  const [students, setStudents] = useState<StudentProfile[]>([])
  const [disciplines, setDisciplines] = useState<Discipline[]>([])
  const [loading, setLoading] = useState(true)
  const [competencia, setCompetencia] = useState(new Date().toISOString().substring(0, 7)) // YYYY-MM
  
  // States for Modals
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false)
  const [isSyncOpen, setIsSyncOpen] = useState(false)

  async function loadData() {
    setLoading(true)
    try {
      const [t, tu, st, di] = await Promise.all([
        getFinancialTransactions({ competencia }),
        getStudentTuitions(),
        getStudents(),
        getDisciplines()
      ])
      setTransactions(t)
      setTuitions(tu)
      setStudents(st)
      setDisciplines(di)
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

    const pendingTuition = tuitions.filter(tu => tu.status === 'pending' || tu.status === 'overdue').reduce((acc, tu) => acc + tu.amount, 0)
    
    return {
      plannedIncome, realizedIncome,
      plannedExpense, realizedExpense,
      pendingTuition,
      netPlanned: plannedIncome - plannedExpense,
      netRealized: realizedIncome - realizedExpense
    }
  }, [transactions, tuitions])

  const chartData = useMemo(() => [
    { name: "Receitas", Previsto: stats.plannedIncome + stats.realizedIncome, Realizado: stats.realizedIncome },
    { name: "Despesas", Previsto: stats.plannedExpense + stats.realizedExpense, Realizado: stats.realizedExpense },
  ], [stats])

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
    for (const student of students) {
      await syncStudentTuition(student.id)
    }
    await loadData()
    setLoading(false)
    setIsSyncOpen(false)
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header section with Stats Cards */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-navy to-orange bg-clip-text text-transparent">Gestão Financeira</h1>
          <p className="text-muted-foreground">Controle de fluxo de caixa, mensalidades e projeções acadêmicas.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Input 
            type="month" 
            value={competencia} 
            onChange={e => setCompetencia(e.target.value)}
            className="w-40 border-primary/20 bg-primary/5"
          />
          <Button onClick={loadData} variant="outline" size="icon">
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
          </Button>
          {/* <Button variant="outline" onClick={() => printFinancialDRE_PDF(transactions, competencia)}>
            <Download className="h-4 w-4 mr-2" /> PDF DRE
          </Button> */}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Receita Realizada" 
          value={stats.realizedIncome} 
          subtitle={`Previsto: R$ ${stats.plannedIncome.toFixed(2)}`}
          icon={<ArrowUpRight className="text-emerald-500" />}
          trend="positive"
        />
        <StatCard 
          title="Despesa Realizada" 
          value={stats.realizedExpense} 
          subtitle={`Previsto: R$ ${stats.plannedExpense.toFixed(2)}`}
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
      <div className="flex border-b border-border/50 gap-6">
        <TabButton active={tab === "dashboard"} onClick={() => setTab("dashboard")} icon={<PieChart className="h-4 w-4" />}>Painel & Gráficos</TabButton>
        <TabButton active={tab === "income"} onClick={() => setTab("income")} icon={<DollarSign className="h-4 w-4" />}>Receitas / Cobranças</TabButton>
        <TabButton active={tab === "expenses"} onClick={() => setTab("expenses")} icon={<TrendingDown className="h-4 w-4" />}>Despesas Diversas</TabButton>
        <TabButton active={tab === "prolabore"} onClick={() => setTab("prolabore")} icon={<BookOpen className="h-4 w-4" />}>Aulas (Prolabore)</TabButton>
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
              <CardContent className="pt-6 flex justify-center">
                 <div className="h-[300px] w-full max-w-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <RePieChart>
                        <Pie
                          data={COLORS.map((c, i) => ({ name: CATEGORIES[i % CATEGORIES.length], value: Math.random() * 1000 + 500 }))}
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {COLORS.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(val: number) => `R$ ${val.toFixed(2)}`} />
                        <Legend iconType="rect" layout="vertical" align="right" verticalAlign="middle" />
                      </RePieChart>
                    </ResponsiveContainer>
                 </div>
              </CardContent>
            </Card>
          </div>
        )}

        {tab === "income" && (
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
                 <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                       <thead>
                          <tr className="bg-muted/30 text-muted-foreground font-bold text-left border-b">
                             <th className="p-4">Aluno</th>
                             <th className="p-4">Disciplina</th>
                             <th className="p-4">Vencimento</th>
                             <th className="p-4">Valor</th>
                             <th className="p-4">Status</th>
                             <th className="p-4">Ação</th>
                          </tr>
                       </thead>
                       <tbody>
                          {tuitions.length === 0 ? (
                            <tr><td colSpan={6} className="p-20 text-center text-muted-foreground">Nenhuma cobrança gerada. Clique em sincronizar para aplicar o currículo aos alunos.</td></tr>
                          ) : (
                            tuitions.slice(0, 50).map(tu => {
                               const student = students.find(s => s.id === tu.studentId)
                               const discipline = disciplines.find(d => d.id === tu.disciplineId)
                               return (
                                 <tr key={tu.id} className="border-b hover:bg-muted/10 transition-colors">
                                    <td className="p-4 font-medium">{student?.name || "Desconhecido"}</td>
                                    <td className="p-4">{discipline?.name || "---"}</td>
                                    <td className="p-4">
                                       <Input 
                                          type="date" 
                                          defaultValue={tu.dueDate || ""} 
                                          className="h-8 text-xs border-none hover:bg-white p-0"
                                          onBlur={async (e) => await updateTuition(tu.id, { dueDate: e.target.value })}
                                       />
                                    </td>
                                    <td className="p-4">R$ {tu.amount.toFixed(2)}</td>
                                    <td className="p-4">
                                       <StatusBadge status={tu.status} />
                                    </td>
                                    <td className="p-4">
                                       {tu.status !== 'paid' && (
                                         <Button size="sm" onClick={() => processTuitionPayment(tu.id, new Date().toISOString().split('T')[0])}>
                                            Receber
                                         </Button>
                                       )}
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

        {tab === "expenses" && (
           <Card className="premium-shadow">
              <CardContent className="p-0">
                 <div className="p-4 border-b flex justify-between items-center bg-muted/20">
                    <h3 className="font-bold flex items-center gap-2"><ArrowDownRight className="h-4 w-4 text-rose-600" /> Despesas de Custeio</h3>
                    <Button size="sm" onClick={() => setIsAddExpenseOpen(true)}>
                       <Plus className="h-4 w-4 mr-2" /> Nova Despesa
                    </Button>
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
                                   <Button size="sm" variant="ghost" className="text-destructive" onClick={() => deleteFinancialTransaction(t.id)}>
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
                          {disciplines.sort((a,b) => a.order - b.order).map((d, index) => (
                             <tr key={d.id} className="border-b transition-colors hover:bg-muted/10">
                                <td className="p-4 font-mono text-xs">{competencia}</td>
                                <td className="p-4 font-medium"><span className="text-muted-foreground mr-2">{index + 1}.</span> {d.name}</td>
                                <td className="p-4">{d.professorName || "Não definido"}</td>
                                <td className="p-4 font-bold text-rose-600">R$ 300,00</td>
                                <td className="p-4">
                                   <span className="px-2 py-0.5 rounded-full text-[10px] bg-orange/10 text-orange border border-orange/20 font-black uppercase">Provisão</span>
                                </td>
                                <td className="p-4">
                                   <Button size="sm" variant="outline">Dar Baixa Fiscal</Button>
                                </td>
                             </tr>
                          ))}
                       </tbody>
                    </table>
                 </div>
              </CardContent>
           </Card>
        )}
      </div>

      {/* Modals Implementation */}
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
