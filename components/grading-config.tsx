"use client"

import { useState, useEffect } from "react"
import { Save, Loader2, BookOpen, Presentation, CalendarCheck, Percent, LayoutDashboard } from "lucide-react"
import { getGradingSettings, updateGradingSettings, type GradingSettings } from "@/lib/store"
import { Button } from "@/components/ui/button"

export function GradingConfig() {
    const [settings, setSettings] = useState<GradingSettings | null>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        getGradingSettings().then(s => {
            setSettings(s)
            setLoading(false)
        })
    }, [])

    const handleSave = async () => {
        if (!settings) return
        setSaving(true)
        try {
            await updateGradingSettings(settings)
            alert("Configurações de avaliação salvas com sucesso!")
        } catch (err: any) {
            alert("Erro ao salvar: " + err.message)
        } finally {
            setSaving(false)
        }
    }

    if (loading) return <div className="p-8 text-center"><Loader2 className="mx-auto animate-spin text-primary" /></div>
    if (!settings) return null

    return (
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm mb-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-600"></div>
            <div className="flex items-center gap-2 mb-6 text-card-foreground">
                <BookOpen className="h-5 w-5 text-blue-600" />
                <h3 className="font-bold">Avaliações e Notas - Configuração Master</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                <div>
                    <label className="text-xs font-semibold text-muted-foreground block mb-1">Ponto por Presença (Presencial)</label>
                    <div className="relative">
                        <CalendarCheck className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <input
                            type="number"
                            className="w-full border border-input rounded-lg pl-9 pr-3 py-2 text-sm bg-background focus:ring-2 focus:ring-blue-600"
                            value={settings.pointsPerPresence}
                            onChange={(e) => setSettings({ ...settings, pointsPerPresence: Number(e.target.value) })}
                        />
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1">Soma-se ao diário por aula dada.</p>
                </div>
                <div>
                    <label className="text-xs font-semibold text-muted-foreground block mb-1">Ponto por Presença (EAD)</label>
                    <div className="relative">
                        <LayoutDashboard className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <input
                            type="number"
                            className="w-full border border-input rounded-lg pl-9 pr-3 py-2 text-sm bg-background focus:ring-2 focus:ring-blue-600"
                            value={settings.onlinePresencePoints}
                            onChange={(e) => setSettings({ ...settings, onlinePresencePoints: Number(e.target.value) })}
                        />
                    </div>
                </div>

                <div>
                    <label className="text-xs font-semibold text-muted-foreground block mb-1">Valoração Máx. Interação</label>
                    <div className="relative">
                        <Presentation className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <input
                            type="number"
                            className="w-full border border-input rounded-lg pl-9 pr-3 py-2 text-sm bg-background focus:ring-2 focus:ring-blue-600"
                            value={settings.interactionPoints}
                            onChange={(e) => setSettings({ ...settings, interactionPoints: Number(e.target.value) })}
                        />
                    </div>
                </div>
                <div>
                    <label className="text-xs font-semibold text-muted-foreground block mb-1">Valoração Máx. Livro</label>
                    <div className="relative">
                        <BookOpen className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <input
                            type="number"
                            className="w-full border border-input rounded-lg pl-9 pr-3 py-2 text-sm bg-background focus:ring-2 focus:ring-blue-600"
                            value={settings.bookActivityPoints}
                            onChange={(e) => setSettings({ ...settings, bookActivityPoints: Number(e.target.value) })}
                        />
                    </div>
                </div>
                <div>
                    <label className="text-xs font-semibold text-muted-foreground block mb-1">Média de Aprovação (%)</label>
                    <div className="relative">
                        <Percent className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <input
                            type="number"
                            className="w-full border border-input rounded-lg pl-9 pr-3 py-2 text-sm bg-background focus:ring-2 focus:ring-blue-600"
                            value={settings.passingAverage}
                            onChange={(e) => setSettings({ ...settings, passingAverage: Number(e.target.value) })}
                        />
                    </div>
                </div>
                <div>
                    <label className="text-xs font-semibold text-muted-foreground block mb-1">Divisão Total de Pontos (Divisor)</label>
                    <div className="relative">
                        <input
                            type="number"
                            className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background focus:ring-2 focus:ring-blue-600"
                            value={settings.totalDivisor}
                            onChange={(e) => setSettings({ ...settings, totalDivisor: Number(e.target.value) })}
                        />
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1">Ex: SOMA / 4 = Média</p>
                </div>
            </div>

            <Button onClick={handleSave} disabled={saving} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold h-10">
                {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                Salvar Regras de Avaliação
            </Button>
        </div>
    )
}
