'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Check } from 'lucide-react'
import { updateFinancialSettings, type FinancialSettings } from '@/lib/financial'

interface FinancialSettingsProps {
  onSettingsUpdated?: () => void
}

export function FinancialSettings({ onSettingsUpdated }: FinancialSettingsProps) {
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const [settings, setSettings] = useState<Partial<FinancialSettings>>({
    disciplinePrice: 60.0,
    paymentDueDay: 10,
    professorSalaryPerDiscipline: 500.0,
    periodStartMonth: '2025-08',
    periodEndMonth: '2027-10',
    pixKey: 'seu@email.com',
    creditCardUrl: 'https://example.com/pagamento',
  })

  async function handleSave() {
    try {
      setSaving(true)
      await updateFinancialSettings(settings as FinancialSettings, 'master-id')
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
      onSettingsUpdated?.()
    } catch (error) {
      console.error('Erro ao salvar configurações:', error)
      alert('Erro ao salvar configurações')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Configurações Financeiras</CardTitle>
          <CardDescription>Customize os parâmetros do sistema financeiro</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {saved && (
            <Alert variant="default" className="border-green-600 bg-green-50">
              <Check className="h-4 w-4" />
              <AlertDescription className="text-green-800">
                Configurações salvas com sucesso!
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            <div>
              <Label htmlFor="disciplinePrice">Valor por Disciplina (Mensal)</Label>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-lg font-semibold">R$</span>
                <Input
                  id="disciplinePrice"
                  type="number"
                  step="0.01"
                  value={settings.disciplinePrice || 0}
                  onChange={(e) =>
                    setSettings({ ...settings, disciplinePrice: parseFloat(e.target.value) })
                  }
                  className="max-w-xs"
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Este é o valor que cada aluno pagará por disciplina a cada mês
              </p>
            </div>

            <div>
              <Label htmlFor="paymentDueDay">Dia de Vencimento do Mês</Label>
              <Input
                id="paymentDueDay"
                type="number"
                min="1"
                max="28"
                value={settings.paymentDueDay || 10}
                onChange={(e) =>
                  setSettings({ ...settings, paymentDueDay: parseInt(e.target.value) })
                }
                className="max-w-xs mt-2"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Os alunos terão que pagar até este dia do mês (padrão: 10)
              </p>
            </div>

            <div>
              <Label htmlFor="professorSalary">Salário Professor por Disciplina</Label>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-lg font-semibold">R$</span>
                <Input
                  id="professorSalary"
                  type="number"
                  step="0.01"
                  value={settings.professorSalaryPerDiscipline || 0}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      professorSalaryPerDiscipline: parseFloat(e.target.value),
                    })
                  }
                  className="max-w-xs"
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Salário fixo que cada professor recebe por disciplina lecionada
              </p>
            </div>
          </div>

          <div className="border-t pt-6 space-y-4">
            <h3 className="text-lg font-semibold">Período de Cobrança</h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="periodStart">Data de Início</Label>
                <Input
                  id="periodStart"
                  type="month"
                  value={settings.periodStartMonth || '2025-08'}
                  onChange={(e) =>
                    setSettings({ ...settings, periodStartMonth: e.target.value })
                  }
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="periodEnd">Data de Término</Label>
                <Input
                  id="periodEnd"
                  type="month"
                  value={settings.periodEndMonth || '2027-10'}
                  onChange={(e) =>
                    setSettings({ ...settings, periodEndMonth: e.target.value })
                  }
                  className="mt-2"
                />
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              Total de 26 meses: agosto 2025 até outubro 2027
            </p>
          </div>

          <div className="border-t pt-6 space-y-4">
            <h3 className="text-lg font-semibold">Chaves de Pagamento</h3>

            <div>
              <Label htmlFor="pixKey">Chave PIX</Label>
              <Input
                id="pixKey"
                type="text"
                placeholder="seu@email.com ou CPF"
                value={settings.pixKey || ''}
                onChange={(e) => setSettings({ ...settings, pixKey: e.target.value })}
                className="mt-2"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Será usada nos QR Codes PIX dos boletos
              </p>
            </div>

            <div>
              <Label htmlFor="creditCardUrl">URL Cartão de Crédito</Label>
              <Input
                id="creditCardUrl"
                type="url"
                placeholder="https://..."
                value={settings.creditCardUrl || ''}
                onChange={(e) =>
                  setSettings({ ...settings, creditCardUrl: e.target.value })
                }
                className="mt-2"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Link externo para pagamento via cartão de crédito
              </p>
            </div>
          </div>

          <Button onClick={handleSave} disabled={saving} size="lg" className="w-full">
            {saving ? 'Salvando...' : 'Salvar Configurações'}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

export default FinancialSettings
