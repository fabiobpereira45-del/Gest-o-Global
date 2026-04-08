'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

interface TeacherPayrollManagementProps {
  onDataChange?: () => void
}

export function TeacherPayrollManagement({ onDataChange }: TeacherPayrollManagementProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Gestão de Folha de Pagamento</CardTitle>
        <CardDescription>Calcule e pague os professores</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-muted-foreground p-4 bg-muted rounded-lg">
          <p className="font-semibold mb-2">Componente em desenvolvimento</p>
          <p>Será possível:</p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>Calcular salário por professor e disciplina</li>
            <li>Aplicar bônus de desempenho</li>
            <li>Gerar folha de pagamento mensal</li>
            <li>Exportar para conta bancária</li>
            <li>Acompanhar histórico de pagamentos</li>
          </ul>
        </div>

        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Calcular Folha
        </Button>
      </CardContent>
    </Card>
  )
}

export default TeacherPayrollManagement
