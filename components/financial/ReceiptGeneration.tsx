'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Download } from 'lucide-react'

interface ReceiptGenerationProps {
  onDataChange?: () => void
}

export function ReceiptGeneration({ onDataChange }: ReceiptGenerationProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recibos de Pagamento</CardTitle>
        <CardDescription>Visualize e gere recibos (SEQ-YYYY-XXXXXX)</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-muted-foreground p-4 bg-muted rounded-lg">
          <p className="font-semibold mb-2">Componente em desenvolvimento</p>
          <p>Será possível:</p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>Visualizar histórico de recibos emitidos</li>
            <li>Gerar recibos com número sequencial único</li>
            <li>Exportar recibos em PDF</li>
            <li>Buscar recibos por aluno, período ou valor</li>
            <li>Re-emitir recibos perdidos</li>
          </ul>
        </div>

        <Button disabled>
          <Download className="h-4 w-4 mr-2" />
          Gerar Recibo
        </Button>
      </CardContent>
    </Card>
  )
}

export default ReceiptGeneration
