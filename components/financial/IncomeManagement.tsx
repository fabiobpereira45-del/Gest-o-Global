'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, Plus, CheckCircle, Clock, AlertTriangle, Download } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  getAllPaymentSchedules,
  recordStudentPayment,
  type StudentPaymentSchedule,
} from '@/lib/financial'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'

interface IncomeManagementProps {
  onDataChange?: () => void
}

export function IncomeManagement({ onDataChange }: IncomeManagementProps) {
  const [schedules, setSchedules] = useState<StudentPaymentSchedule[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('all')
  const [selectedSchedule, setSelectedSchedule] = useState<StudentPaymentSchedule | null>(null)
  const [recordingPayment, setRecordingPayment] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'boleto' | 'bank_transfer' | 'cash'>('pix')

  useEffect(() => {
    loadSchedules()
  }, [filterStatus])

  async function loadSchedules() {
    try {
      setLoading(true)
      const data = await getAllPaymentSchedules({
        status: filterStatus === 'all' ? undefined : filterStatus,
      })
      setSchedules(data)
    } catch (error) {
      console.error('Erro ao carregar cronogramas:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleRecordPayment() {
    if (!selectedSchedule) return

    try {
      setRecordingPayment(true)
      await recordStudentPayment(
        selectedSchedule.id,
        paymentMethod,
        undefined,
        'master-id' // Em produção, usar ID real do master logado
      )

      setSelectedSchedule(null)
      await loadSchedules()
      onDataChange?.()
    } catch (error) {
      console.error('Erro ao registrar pagamento:', error)
      alert('Erro ao registrar pagamento')
    } finally {
      setRecordingPayment(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />
      case 'overdue':
        return <AlertTriangle className="h-4 w-4 text-red-500" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge variant="default" className="bg-green-600">Pago</Badge>
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

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    )
  }

  const stats = {
    total: schedules.length,
    paid: schedules.filter((s) => s.status === 'paid').length,
    pending: schedules.filter((s) => s.status === 'pending').length,
    overdue: schedules.filter((s) => s.status === 'overdue').length,
  }

  return (
    <div className="space-y-4">
      {/* Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-600">Pagos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.paid}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-yellow-600">Pendentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-red-600">Atrasados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.overdue}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Cronograma de Pagamentos</CardTitle>
          <CardDescription>Gerencie as cobranças dos alunos</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <Label>Filtrar por Status</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="paid">Pago</SelectItem>
                  <SelectItem value="overdue">Atrasado</SelectItem>
                  <SelectItem value="cancelled">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Dialog>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Pagamento
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Registrar Pagamento de Aluno</DialogTitle>
                </DialogHeader>
                {selectedSchedule && (
                  <div className="space-y-4">
                    <div>
                      <Label>Aluno</Label>
                      <Input value={selectedSchedule.studentId} disabled />
                    </div>

                    <div>
                      <Label>Disciplina</Label>
                      <Input value={selectedSchedule.disciplineId} disabled />
                    </div>

                    <div>
                      <Label>Valor</Label>
                      <Input value={`R$ ${selectedSchedule.finalAmount.toFixed(2)}`} disabled />
                    </div>

                    <div>
                      <Label>Forma de Pagamento</Label>
                      <Select value={paymentMethod} onValueChange={(value: any) => setPaymentMethod(value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pix">PIX</SelectItem>
                          <SelectItem value="boleto">Boleto</SelectItem>
                          <SelectItem value="bank_transfer">Transferência</SelectItem>
                          <SelectItem value="cash">Dinheiro</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <Button
                      onClick={handleRecordPayment}
                      disabled={recordingPayment}
                      className="w-full"
                    >
                      {recordingPayment ? 'Processando...' : 'Confirmar Pagamento'}
                    </Button>
                  </div>
                )}
              </DialogContent>
            </Dialog>
          </div>

          {/* Tabela */}
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Aluno</TableHead>
                  <TableHead>Disciplina</TableHead>
                  <TableHead>Mês</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-center">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {schedules.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Nenhum cronograma encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  schedules.map((schedule) => (
                    <TableRow key={schedule.id}>
                      <TableCell className="font-medium">{schedule.studentId.substring(0, 8)}...</TableCell>
                      <TableCell>{schedule.disciplineId}</TableCell>
                      <TableCell>{schedule.monthYear}</TableCell>
                      <TableCell>{new Date(schedule.dueDate).toLocaleDateString('pt-BR')}</TableCell>
                      <TableCell className="text-right font-mono">
                        R$ {schedule.finalAmount.toFixed(2)}
                      </TableCell>
                      <TableCell>{getStatusBadge(schedule.status)}</TableCell>
                      <TableCell className="text-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedSchedule(schedule)}
                          disabled={schedule.status === 'paid'}
                        >
                          {getStatusIcon(schedule.status)}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default IncomeManagement
