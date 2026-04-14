"use client"

import { useState, useEffect, useMemo } from "react"
import { 
  DollarSign, Calendar, CheckCircle2, Clock, AlertCircle, 
  ArrowRight, Download, CreditCard, Filter, ChevronRight, Copy, QrCode, FileText
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { 
  getStudentTuitions, 
  getDisciplines, 
  processTuitionPayment,
  getStudentProfile,
  getFinancialSettings,
  type StudentTuition, 
  type Discipline,
  type StudentProfile,
  type FinancialSettings
} from "@/lib/store"
import { printReceiptPDF, printTuitionReportPDF } from "@/lib/pdf"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

interface Props {
  studentId: string
}

export function StudentFinancialView({ studentId }: Props) {
  const [tuitions, setTuitions] = useState<StudentTuition[]>([])
  const [disciplines, setDisciplines] = useState<Discipline[]>([])
  const [student, setStudent] = useState<StudentProfile | null>(null)
  const [settings, setSettings] = useState<FinancialSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<"all" | "pending" | "paid">("all")
  const [pixModalOpen, setPixModalOpen] = useState(false)
  const [activePaymentTitle, setActivePaymentTitle] = useState("")

  const pixKey = settings?.pixKey || "Chave não configurada"

  async function load() {
    setLoading(true)
    try {
      const [t, d, s, setts] = await Promise.all([
        getStudentTuitions(studentId),
        getDisciplines(),
        getStudentProfile(studentId),
        getFinancialSettings()
      ])
      setTuitions(t)
      setDisciplines(d)
      setStudent(s)
      setSettings(setts)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [studentId])

  const filteredTuitions = useMemo(() => {
    // Filtra por status
    let list = filter === "all"
      ? tuitions
      : tuitions.filter(t => t.status === filter || (filter === "pending" && t.status === "overdue"))
    
    // SEMPRE ordena pela posição original da disciplina na grade curricular
    return [...list].sort((a, b) => {
      const dA = disciplines.find(d => d.id === a.disciplineId)
      const dB = disciplines.find(d => d.id === b.disciplineId)
      return (dA?.order ?? 999) - (dB?.order ?? 999)
    })
  }, [tuitions, filter, disciplines])

  const totals = useMemo(() => {
    const paid = tuitions.filter(t => t.status === 'paid').reduce((acc, t) => acc + t.amount, 0)
    const pending = tuitions.filter(t => t.status !== 'paid').reduce((acc, t) => acc + t.amount, 0)
    return { paid, pending, total: paid + pending }
  }, [tuitions])

  async function handleBulkPayment() {
    const pendingOnes = tuitions.filter(t => t.status !== 'paid')
    if (pendingOnes.length === 0) return toast.info("Não há pagamentos pendentes.")
    
    if (!confirm(`Deseja simular o pagamento em lote de ${pendingOnes.length} mensalidades?`)) return

    try {
      setLoading(true)
      for (const t of pendingOnes) {
        await processTuitionPayment(t.id, new Date().toISOString().split('T')[0])
      }
      toast.success("Pagamentos processados com sucesso!")
      load()
    } catch (err) {
      toast.error("Erro ao processar pagamentos.")
    } finally {
      setLoading(false)
    }
  }

  if (loading && tuitions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 space-y-4">
        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        <p className="text-muted-foreground animate-pulse">Carregando extrato financeiro...</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 w-full max-w-4xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Meu Extrato Financeiro</h2>
          <p className="text-sm text-muted-foreground">Acompanhe suas mensalidades vinculadas ao currículo acadêmico.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Button 
            variant="outline"
            className="font-bold whitespace-nowrap"
            onClick={() => student && printTuitionReportPDF(tuitions, [student], "Cosme de Farias")}
          >
            <FileText className="h-4 w-4 mr-2" /> Baixar Relatório PDF
          </Button>
          <Button 
            className="accent-gradient font-bold shadow-lg shadow-orange/20 whitespace-nowrap"
            onClick={() => {
              setActivePaymentTitle("Pagamento em Lote")
              setPixModalOpen(true)
            }}
            disabled={loading || tuitions.filter(t => t.status !== 'paid').length === 0}
          >
            <CreditCard className="h-4 w-4 mr-2" /> Pagar Tudo em Lote
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <SummaryCard title="Total Pago" value={totals.paid} icon={<CheckCircle2 className="text-emerald-500" />} color="emerald" />
        <SummaryCard title="Total a Pagar" value={totals.pending} icon={<Clock className="text-orange" />} color="orange" />
        <SummaryCard title="Investimento Total" value={totals.total} icon={<DollarSign className="text-primary" />} color="primary" />
      </div>

      <Card className="border-border/50 shadow-sm overflow-hidden">
        <CardHeader className="bg-muted/30 border-b pb-4">
          <div className="flex items-center justify-between">
            <div className="flex gap-2 p-1 bg-background rounded-lg border">
              <FilterTab active={filter === "all"} onClick={() => setFilter("all")}>Todas</FilterTab>
              <FilterTab active={filter === "pending"} onClick={() => setFilter("pending")}>Pendentes</FilterTab>
              <FilterTab active={filter === "paid"} onClick={() => setFilter("paid")}>Pagas</FilterTab>
            </div>
            <p className="text-xs text-muted-foreground font-medium">Exibindo {filteredTuitions.length} parcelas</p>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="flex flex-col divide-y divide-border/50">
            {filteredTuitions.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground">Nenhuma mensalidade encontrada para este filtro.</div>
            ) : (
              filteredTuitions.map((tu, idx) => {
                const discipline = disciplines.find(d => d.id === tu.disciplineId)
                return (
                  <div key={tu.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-muted/10 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground">
                        {idx + 1}
                      </div>
                      <div>
                        <p className="font-bold text-sm">{discipline?.name || "Disciplina"}</p>
                        <div className="flex items-center gap-3 text-[10px] text-muted-foreground font-medium uppercase tracking-wider mt-0.5">
                          <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> Venc: {tu.dueDate ? new Date(tu.dueDate).toLocaleDateString('pt-BR') : "A definir"}</span>
                          {tu.paidAt && <span className="flex items-center gap-1 text-emerald-600"><CheckCircle2 className="h-3 w-3" /> Pago em: {new Date(tu.paidAt).toLocaleDateString('pt-BR')}</span>}
                        </div>
                      </div>
                    </div>
                      <div className="flex items-center justify-between sm:justify-end gap-2">
                        <div className="text-right mr-4">
                          <p className="font-black text-foreground">R$ {(tu.amount ?? 0).toFixed(2)}</p>
                          <StatusBadge status={tu.status} />
                        </div>
                        {tu.status === 'paid' && (
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="h-8"
                            onClick={() => {
                              if (student && discipline) printReceiptPDF(tu, student, discipline, "Cosme de Farias")
                            }}
                          >
                            <Download className="h-3 w-3 mr-1" /> Recibo
                          </Button>
                        )}
                        {tu.status !== 'paid' && (
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="text-primary hover:bg-primary/5 font-bold h-8"
                            onClick={() => {
                              setActivePaymentTitle(discipline?.name || "Mensalidade")
                              setPixModalOpen(true)
                            }}
                          >
                            Pagar <ChevronRight className="h-4 w-4 ml-1" />
                          </Button>
                        )}
                      </div>
                  </div>
                )
              })
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={pixModalOpen} onOpenChange={setPixModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><QrCode className="h-5 w-5 text-primary" /> Pagamento via PIX</DialogTitle>
            <DialogDescription>
              Escaneie o QR Code ou copie a chave abaixo para quitar <strong>{activePaymentTitle}</strong>.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center p-6 space-y-6 bg-muted/20 rounded-lg">
             <div className="w-48 h-48 bg-white border rounded-xl flex items-center justify-center shadow-sm relative overflow-hidden">
                <QrCode className="h-32 w-32 text-slate-800 opacity-20" />
                <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
                   <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">QR Code</p>
                   <p className="text-[9px] text-muted-foreground leading-tight">Escaneie pelo App do Banco ou use o código abaixo</p>
                </div>
             </div>
             <div className="w-full space-y-2">
                <p className="text-sm font-bold text-center text-muted-foreground uppercase tracking-widest">Chave PIX ou Copia e Cola</p>
                <div className="flex items-center gap-2 w-full">
                   <div className="flex-1 bg-white border border-border p-3 rounded-md text-center font-mono font-bold text-xs select-all break-all h-[52px] flex items-center justify-center">
                      {settings?.pixQRCode ? (settings.pixQRCode.substring(0, 30) + "...") : pixKey}
                   </div>
                   <Button size="icon" variant="default" className="h-[52px] w-[52px] shadow-md flex-shrink-0" title="Copiar Código" onClick={() => {
                      const toCopy = settings?.pixQRCode || settings?.pixKey || ""
                      if (!toCopy) return toast.error("Chave não configurada.")
                      navigator.clipboard.writeText(toCopy)
                      toast.success(settings?.pixQRCode ? "Código Copia e Cola copiado!" : "Chave PIX copiada!")
                   }}>
                      <Copy className="h-5 w-5" />
                   </Button>
                </div>
                {settings?.pixQRCode && (
                  <p className="text-[10px] text-center text-emerald-600 font-bold">✓ Código "Copia e Cola" disponível!</p>
                )}
             </div>
          </div>
          <div className="bg-orange/10 p-3 rounded-md border border-orange/20 mt-2">
             <p className="text-xs text-orange-700 text-center font-medium">
               Após realizar a transferência, notifique a secretaria com o comprovante. Seu recibo oficial ficará disponível nesta página assim que for confirmado!
             </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function SummaryCard({ title, value, icon, color }: { title: string, value: number, icon: React.ReactNode, color: "emerald" | "orange" | "primary" }) {
  const colorMap = {
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
    orange: "bg-orange-50 text-orange-600 border-orange-100",
    primary: "bg-primary/5 text-primary border-primary/10"
  }
  
  return (
    <div className={cn("p-4 rounded-xl border flex items-center justify-between gap-4 shadow-sm", colorMap[color])}>
      <div className="space-y-1">
        <p className="text-[10px] font-bold uppercase tracking-widest opacity-80">{title}</p>
        <p className="text-xl font-black">R$ {(value ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
      </div>
      <div className="p-2 rounded-lg bg-white/50">{icon}</div>
    </div>
  )
}

function FilterTab({ children, active, onClick }: { children: React.ReactNode, active: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "px-3 py-1.5 text-xs font-bold rounded-md transition-all",
        active ? "bg-primary text-white shadow-md shadow-primary/20" : "text-muted-foreground hover:bg-muted"
      )}
    >
      {children}
    </button>
  )
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string, color: string }> = {
    'pending': { label: 'Pendente', color: 'bg-orange-50 text-orange-600 border-orange-200' },
    'paid': { label: 'Pago', color: 'bg-emerald-50 text-emerald-600 border-emerald-200' },
    'overdue': { label: 'Atrasado', color: 'bg-rose-50 text-rose-600 border-rose-200' }
  }
  const config = map[status] || { label: status, color: 'bg-muted text-muted-foreground' }
  return (
    <span className={cn("px-2 py-0.5 rounded-full text-[9px] font-black uppercase border", config.color)}>
      {config.label}
    </span>
  )
}
