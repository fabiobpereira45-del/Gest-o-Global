'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Download } from 'lucide-react'

interface BillGenerationProps {
  onDataChange?: () => void
}

export function BillGeneration({ onDataChange }: BillGenerationProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Geração de Boletos</CardTitle>
        <CardDescription>Gere boletos com código de barras e PIX QR Code</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-muted-foreground p-4 bg-muted rounded-lg">
          <p className="font-semibold mb-2">Componente em desenvolvimento</p>
          <p>Será possível:</p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>Gerar boletos com código de barras sequencial</li>
            <li>Gerar QR Code PIX dinâmico</li>
            <li>Exportar boletos em PDF</li>
            <li>Gerar múltiplos boletos em lote</li>
            <li>Armazenar URLs de boletos gerados</li>
          </ul>
        </div>

        <Button disabled>
          <Download className="h-4 w-4 mr-2" />
          Gerar Boletos Selecionados
        </Button>
      </CardContent>
    </Card>
  )
}

export default BillGeneration
