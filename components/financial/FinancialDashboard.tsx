'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { AlertCircle, DollarSign, TrendingUp, Users, AlertTriangle, Download } from 'lucide-react'
import { getFinancialKPIs, getFinancialSettings, type FinancialKPIs } from '@/lib/financial'
import IncomeManagement from './IncomeManagement'
import ExpenseManagement from './ExpenseManagement'
import TeacherPayrollManagement from './TeacherPayrollManagement'
import BillGeneration from './BillGeneration'
import ReceiptGeneration from './ReceiptGeneration'
import FinancialProjection from './FinancialProjection'
import FinancialReports from './FinancialReports'
import FinancialSettings from './FinancialSettings'

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899']

export function FinancialDashboard() {
  const [kpis, setKpis] = useState<FinancialKPIs | null>(null)
  const [settings, setSettings] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('dashboard')

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      setLoading(true)
      const [kpisData, settingsData] = await Promise.all([
        getFinancialKPIs(),
        getFinancialSettings(),
      ])
      setKpis(kpisData)
      setSettings(settingsData)
    } catch (error) {
      console.error('Erro ao carregar dados financeiros:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!kpis) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>Erro ao carregar dados financeiros. Tente novamente.</AlertDescription>
      </Alert>
    )
  }

  // Dados para gráficos (simulados - em produção viriam do banco)
  const cashFlowData = [
    { month: 'Ago', income: 6000, expense: 4000 },
    { month: 'Set', income: 6200, expense: 4100 },
    { month: 'Out', income: 6100, expense: 4050 },
    { month: 'Nov', income: 6300, expense: 4200 },
    { month: 'Dez', income: 6400, expense: 4300 },
  ]

  const revenueByDiscipline = [
    { name: 'Hermenêutica', value: kpis.totalIncome * 0.25 },
    { name: 'Teologia Sistemática', value: kpis.totalIncome * 0.20 },
    { name: 'Introdução Bíblica', value: kpis.totalIncome * 0.20 },
    { name: 'Outros', value: kpis.totalIncome * 0.35 },
  ]

  const expenseByCategory = [
    { name: 'Aluguel', value: kpis.totalExpense * 0.40 },
    { name: 'Salários', value: kpis.totalExpense * 0.35 },
    { name: 'Material', value: kpis.totalExpense * 0.15 },
    { name: 'Outros', value: kpis.totalExpense * 0.10 },
  ]

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground">IBAD Finance Pro</h2>
          <p className="text-sm text-muted-foreground">Painel de Gestão Financeira</p>
        </div>
        <Button variant="outline" onClick={loadData}>
          <Download className="h-4 w-4 mr-2" />
          Atualizar
        </Button>
      </div>

      {/* Alertas */}
      {kpis.delinquencyRate > 5 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Taxa de inadimplência de {kpis.delinquencyRate.toFixed(1)}% detectada. Existem {kpis.overduePayments} pagamentos atrasados.
          </AlertDescription>
        </Alert>
      )}

      {/* KPIs Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {(kpis.totalIncome / 1000).toFixed(1)}K
            </div>
            <p className="text-xs text-muted-foreground">Até hoje</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Despesa Total</CardTitle>
            <TrendingUp className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {(kpis.totalExpense / 1000).toFixed(1)}K
            </div>
            <p className="text-xs text-muted-foreground">Até hoje</p>
          </CardContent>
        </Card>

        <Card className={kpis.balance >= 0 ? '' : 'border-red-500'}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo</CardTitle>
            <DollarSign className={`h-4 w-4 ${kpis.balance >= 0 ? 'text-green-500' : 'text-red-500'}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${kpis.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              R$ {(kpis.balance / 1000).toFixed(1)}K
            </div>
            <p className="text-xs text-muted-foreground">Dinâmico</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.pendingPayments}</div>
            <p className="text-xs text-muted-foreground">Pagamentos pendentes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Atrasados</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.overduePayments}</div>
            <p className="text-xs text-muted-foreground">Taxa: {kpis.delinquencyRate.toFixed(1)}%</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo Projetado</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {(kpis.projectedBalance / 1000).toFixed(1)}K
            </div>
            <p className="text-xs text-muted-foreground">Período completo</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-8">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="receita">Receita</TabsTrigger>
          <TabsTrigger value="despesa">Despesa</TabsTrigger>
          <TabsTrigger value="professores">Profs</TabsTrigger>
          <TabsTrigger value="boletos">Boletos</TabsTrigger>
          <TabsTrigger value="recibos">Recibos</TabsTrigger>
          <TabsTrigger value="projecoes">Projeções</TabsTrigger>
          <TabsTrigger value="relatorios">Relatórios</TabsTrigger>
        </TabsList>

        {/* Dashboard Tab */}
        <TabsContent value="dashboard" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Fluxo de Caixa */}
            <Card>
              <CardHeader>
                <CardTitle>Fluxo de Caixa</CardTitle>
                <CardDescription>Receita vs Despesa (últimos 5 meses)</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={cashFlowData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="income" fill="#10B981" name="Receita" />
                    <Bar dataKey="expense" fill="#EF4444" name="Despesa" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Receita por Disciplina */}
            <Card>
              <CardHeader>
                <CardTitle>Receita por Disciplina</CardTitle>
                <CardDescription>Distribuição da receita</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={revenueByDiscipline}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {revenueByDiscipline.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `R$ ${(value / 1000).toFixed(1)}K`} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Despesa por Categoria */}
            <Card>
              <CardHeader>
                <CardTitle>Despesa por Categoria</CardTitle>
                <CardDescription>Distribuição de gastos</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={expenseByCategory}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {expenseByCategory.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `R$ ${(value / 1000).toFixed(1)}K`} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Quadro de Resumo */}
            <Card>
              <CardHeader>
                <CardTitle>Resumo Financeiro</CardTitle>
                <CardDescription>Status do período (agosto 2025 - outubro 2027)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between py-2 border-b">
                  <span className="text-sm font-medium">Valor Disciplina:</span>
                  <span className="text-sm">R$ {settings?.disciplinePrice.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b">
                  <span className="text-sm font-medium">Vencimento:</span>
                  <span className="text-sm">Dia {settings?.paymentDueDay}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b">
                  <span className="text-sm font-medium">Salário Professor:</span>
                  <span className="text-sm">R$ {settings?.professorSalaryPerDiscipline.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b">
                  <span className="text-sm font-medium">Período:</span>
                  <span className="text-sm">{settings?.periodStartMonth} a {settings?.periodEndMonth}</span>
                </div>
                <div className="flex items-center justify-between py-2 text-lg font-bold text-green-600">
                  <span>Saldo Projetado:</span>
                  <span>R$ {(kpis.projectedBalance / 1000).toFixed(1)}K</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Outras Abas */}
        <TabsContent value="receita">
          <IncomeManagement onDataChange={loadData} />
        </TabsContent>

        <TabsContent value="despesa">
          <ExpenseManagement onDataChange={loadData} />
        </TabsContent>

        <TabsContent value="professores">
          <TeacherPayrollManagement onDataChange={loadData} />
        </TabsContent>

        <TabsContent value="boletos">
          <BillGeneration onDataChange={loadData} />
        </TabsContent>

        <TabsContent value="recibos">
          <ReceiptGeneration onDataChange={loadData} />
        </TabsContent>

        <TabsContent value="projecoes">
          <FinancialProjection />
        </TabsContent>

        <TabsContent value="relatorios">
          <FinancialReports />
        </TabsContent>
      </Tabs>

      {/* Botão de Configurações no rodapé */}
      <div className="flex justify-end">
        <Button
          variant="outline"
          onClick={() => setActiveTab('configuracoes')}
        >
          ⚙️ Configurações
        </Button>
      </div>

      {/* Tab de Configurações (fora do TabsContent para fácil acesso) */}
      {activeTab === 'configuracoes' && <FinancialSettings onSettingsUpdated={loadData} />}
    </div>
  )
}

export default FinancialDashboard
