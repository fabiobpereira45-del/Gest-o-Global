'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  DollarSign, Clock, CheckCircle, AlertTriangle, 
  Download, QrCode, FileText, CalendarCheck 
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getStudentPaymentSchedule, type StudentPaymentSchedule } from '@/lib/financial'

interface Props {
  studentId: string
}

export function StudentFinancialTab({ studentId }: Props) {
  const [schedules, setSchedules] = useState<StudentPaymentSchedule[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        setLoading(true)
        const data = await getStudentPaymentSchedule(studentId)
        setSchedules(data)
      } catch (err) {
        console.error('Erro ao buscar dados financeiros:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [studentId])

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-600">Pago</Badge>
      case 'pending':
        return <Badge variant="secondary">Pendente</Badge>
      case 'overdue':
        return <Badge variant="destructive">Atrasado</Badge>
      case 'scholarship_100':
        return <Badge className="bg-blue-600">Bolsa 100%</Badge>
      case 'scholarship_50':
        return <Badge className="bg-blue-500">Bolsa 50%</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-primary/5 to-transparent border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Status Financeiro</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center gap-2">
              <CalendarCheck className="h-5 w-5 text-green-500" />
              Regular
            </div>
            <p className="text-xs text-muted-foreground mt-1">Conforme cronograma</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-xl bg-white/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle>Cronograma de Mensalidades</CardTitle>
          <CardDescription>Acompanhe seus vencimentos e gere comprovantes</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px] pr-4">
            <div className="space-y-3">
              {schedules.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  Nenhum registro financeiro encontrado.
                </div>
              ) : (
                schedules.map((item) => (
                  <div 
                    key={item.id} 
                    className="flex flex-col md:flex-row items-start md:items-center justify-between p-4 rounded-2xl bg-white border border-border/50 hover:border-primary/30 transition-all group"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-xl bg-slate-50 group-hover:bg-primary/5 transition-colors`}>
                        <DollarSign className="h-5 w-5 text-slate-400 group-hover:text-primary" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-slate-900">Mês {item.paymentMonth}</p>
                          <span className="text-slate-300">•</span>
                          <p className="text-xs font-medium text-slate-500">{item.monthYear}</p>
                        </div>
                        <p className="text-sm text-slate-600">Vencimento: {new Date(item.dueDate).toLocaleDateString('pt-BR')}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6 mt-4 md:mt-0 w-full md:w-auto">
                      <div className="text-right flex-1 md:flex-none">
                        <p className="text-lg font-bold text-slate-900">R$ {item.finalAmount.toFixed(2)}</p>
                        <div className="flex justify-end mt-1">{getStatusBadge(item.status)}</div>
                      </div>

                      <div className="flex items-center gap-2">
                        {item.status === 'pending' || item.status === 'overdue' ? (
                          <>
                            <Button size="icon" variant="ghost" className="rounded-xl hover:bg-primary/10 hover:text-primary transition-all" title="Ver PIX">
                              <QrCode className="h-4 w-4" />
                            </Button>
                            <Button size="icon" variant="ghost" className="rounded-xl hover:bg-primary/10 hover:text-primary transition-all" title="Baixar Boleto">
                              <FileText className="h-4 w-4" />
                            </Button>
                          </>
                        ) : item.status === 'paid' && (
                          <Button size="icon" variant="ghost" className="rounded-xl hover:bg-green-100 hover:text-green-600 transition-all" title="Baixar Recibo">
                            <Download className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}
