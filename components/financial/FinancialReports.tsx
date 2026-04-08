'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FileText, Download } from 'lucide-react'

export function FinancialReports() {
  const reports = [
    { name: 'Receita por Disciplina', description: 'Análise de receita por cada disciplina' },
    { name: 'Despesa por Categoria', description: 'Distribuição de gastos por categoria' },
    { name: 'Inadimplência', description: 'Lista de alunos com pagamentos atrasados' },
    { name: 'Fluxo de Caixa', description: 'Movimento de entradas e saídas' },
    { name: 'Folha de Pagamento', description: 'Relatório de pagamentos a professores' },
    { name: 'Extrato Financeiro', description: 'Movimentação detalhada por período' },
    { name: 'Projeção vs Realizado', description: 'Comparativa entre planejado e realizado' },
    { name: 'Orçamento vs Gasto', description: 'Análise de orçamento por categoria' },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Relatórios Financeiros</CardTitle>
        <CardDescription>Gere e exporte relatórios em PDF</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {reports.map((report, idx) => (
            <div key={idx} className="p-4 border rounded-lg hover:border-primary transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="font-medium flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    {report.name}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">{report.description}</p>
                </div>
              </div>
              <Button variant="outline" size="sm" className="mt-3 w-full" disabled>
                <Download className="h-3 w-3 mr-1" />
                Gerar
              </Button>
            </div>
          ))}
        </div>

        <div className="text-sm text-muted-foreground p-4 bg-muted rounded-lg">
          <p className="font-semibold mb-2">Componente em desenvolvimento</p>
          <p>Todos os 8 relatórios acima terão:</p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>Filtros avançados (período, disciplina, categoria)</li>
            <li>Exportação em PDF com logos e cabeçalhos</li>
            <li>Gráficos inclusos no relatório</li>
            <li>Opção de enviar por email</li>
            <li>Salvamento de relatórios frequentes</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}

export default FinancialReports
