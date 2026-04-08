'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { TrendingUp } from 'lucide-react'

export function FinancialProjection() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Projeções Financeiras</CardTitle>
        <CardDescription>Análise de cenários (otimista, realista, pessimista)</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 border rounded-lg border-green-300 bg-green-50">
            <p className="text-sm font-medium text-green-800">Cenário Otimista</p>
            <p className="text-xl font-bold text-green-600 mt-2">R$ 180K</p>
            <p className="text-xs text-green-700 mt-1">+15% receita, -5% despesa</p>
          </div>

          <div className="p-4 border rounded-lg border-blue-300 bg-blue-50">
            <p className="text-sm font-medium text-blue-800">Cenário Realista</p>
            <p className="text-xl font-bold text-blue-600 mt-2">R$ 156K</p>
            <p className="text-xs text-blue-700 mt-1">Sem variação</p>
          </div>

          <div className="p-4 border rounded-lg border-orange-300 bg-orange-50">
            <p className="text-sm font-medium text-orange-800">Cenário Pessimista</p>
            <p className="text-xl font-bold text-orange-600 mt-2">R$ 125K</p>
            <p className="text-xs text-orange-700 mt-1">-15% receita, +10% despesa</p>
          </div>
        </div>

        <div className="text-sm text-muted-foreground p-4 bg-muted rounded-lg">
          <p className="font-semibold mb-2">Componente em desenvolvimento</p>
          <p>Será possível:</p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>Visualizar projeção financeira completa (26 meses)</li>
            <li>Comparar cenários lado a lado</li>
            <li>Ajustar premissas de cálculo</li>
            <li>Exportar análise em PDF</li>
            <li>Acompanhar projeção vs realizado</li>
          </ul>
        </div>

        <Button>
          <TrendingUp className="h-4 w-4 mr-2" />
          Ver Projeção Completa
        </Button>
      </CardContent>
    </Card>
  )
}

export default FinancialProjection
