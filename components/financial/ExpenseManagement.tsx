'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

interface ExpenseManagementProps {
  onDataChange?: () => void
}

export function ExpenseManagement({ onDataChange }: ExpenseManagementProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Gestão de Despesas</CardTitle>
        <CardDescription>Registre e acompanhe despesas por categoria</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-4 border rounded-lg">
            <p className="text-sm font-medium text-muted-foreground">Material Didático</p>
            <p className="text-2xl font-bold">R$ 2.500</p>
            <p className="text-xs text-muted-foreground">Orçado: R$ 3.000</p>
          </div>
          <div className="p-4 border rounded-lg">
            <p className="text-sm font-medium text-muted-foreground">Transporte</p>
            <p className="text-2xl font-bold">R$ 1.200</p>
            <p className="text-xs text-muted-foreground">Orçado: R$ 1.500</p>
          </div>
          <div className="p-4 border rounded-lg">
            <p className="text-sm font-medium text-muted-foreground">Alimento</p>
            <p className="text-2xl font-bold">R$ 2.000</p>
            <p className="text-xs text-muted-foreground">Orçado: R$ 2.500</p>
          </div>
          <div className="p-4 border rounded-lg">
            <p className="text-sm font-medium text-muted-foreground">Aluguel</p>
            <p className="text-2xl font-bold">R$ 7.500</p>
            <p className="text-xs text-muted-foreground">Orçado: R$ 7.500</p>
          </div>
        </div>

        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Registrar Despesa
        </Button>

        <p className="text-sm text-muted-foreground p-4 bg-muted rounded-lg">
          Componente em desenvolvimento. Em breve será possível registrar e gerenciar despesas com filtros, análises de orçamento vs gasto, e relatórios detalhados.
        </p>
      </CardContent>
    </Card>
  )
}

export default ExpenseManagement
