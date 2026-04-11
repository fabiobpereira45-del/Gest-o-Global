"use client"

import { useState, useEffect } from "react"
import { Save, Loader2, BookOpen, Presentation, CalendarCheck, Percent, Video, FileQuestion } from "lucide-react"
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

    // Calcular preview da nota
    const notaAtividades = (settings.pointsPerPresence || 0) + (settings.onlinePresencePoints || 0) + (settings.interactionPoints || 0) + (settings.bookActivityPoints || 0) + 1 // +1 para questionário fixo
    const previewMedia = ((notaAtividades + 10) / 2).toFixed(1)

    return (
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm mb-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-600"></div>
            <div className="flex items-center gap-2 mb-2 text-card-foreground">
                <BookOpen className="h-5 w-5 text-blue-600" />
                <h3 className="font-bold">Composição da Média Final</h3>
            </div>
            <p className="text-xs text-muted-foreground mb-6">
                Média = (Nota das Atividades + Prova Online) / 2
            </p>

            {/* Nota das Atividades */}
            <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-5 mb-6">
                <h4 className="text-sm font-bold text-blue-700 mb-4 uppercase tracking-wider">📋 Nota das Atividades (máx 10)</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    <div>
                        <label className="text-xs font-semibold text-muted-foreground block mb-1">📍 Frequência Presencial (máx)</label>
                        <div className="relative">
                            <CalendarCheck className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            <input
                                type="number"
                                step="0.5"
                                min="0"
                                max="10"
                                className="w-full border border-input rounded-lg pl-9 pr-3 py-2 text-sm bg-background focus:ring-2 focus:ring-blue-600"
                                value={settings.pointsPerPresence}
                                onChange={(e) => setSettings({ ...settings, pointsPerPresence: Number(e.target.value) })}
                            />
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-1">Proporcional às presenças nas aulas presenciais.</p>
                    </div>
                    <div>
                        <label className="text-xs font-semibold text-muted-foreground block mb-1">💻 Presença Online (máx)</label>
                        <div className="relative">
                            <Presentation className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            <input
                                type="number"
                                step="0.5"
                                min="0"
                                max="10"
                                className="w-full border border-input rounded-lg pl-9 pr-3 py-2 text-sm bg-background focus:ring-2 focus:ring-blue-600"
                                value={settings.onlinePresencePoints}
                                onChange={(e) => setSettings({ ...settings, onlinePresencePoints: Number(e.target.value) })}
                            />
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-1">Proporcional às presenças nas aulas online.</p>
                    </div>
                    <div>
                        <label className="text-xs font-semibold text-muted-foreground block mb-1">🎬 Vídeo Aula (máx)</label>
                        <div className="relative">
                            <Video className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            <input
                                type="number"
                                step="0.5"
                                min="0"
                                max="10"
                                className="w-full border border-input rounded-lg pl-9 pr-3 py-2 text-sm bg-background focus:ring-2 focus:ring-blue-600"
                                value={settings.interactionPoints}
                                onChange={(e) => setSettings({ ...settings, interactionPoints: Number(e.target.value) })}
                            />
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-1">Professor lança manualmente.</p>
                    </div>
                    <div>
                        <label className="text-xs font-semibold text-muted-foreground block mb-1">📖 Leitura do Livro (máx)</label>
                        <div className="relative">
                            <BookOpen className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            <input
                                type="number"
                                step="0.5"
                                min="0"
                                max="10"
                                className="w-full border border-input rounded-lg pl-9 pr-3 py-2 text-sm bg-background focus:ring-2 focus:ring-blue-600"
                                value={settings.bookActivityPoints}
                                onChange={(e) => setSettings({ ...settings, bookActivityPoints: Number(e.target.value) })}
                            />
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-1">Professor lança manualmente.</p>
                    </div>
                    <div>
                        <label className="text-xs font-semibold text-muted-foreground block mb-1">❓ Questionário do Livro (fixo)</label>
                        <div className="relative">
                            <FileQuestion className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            <input
                                type="number"
                                className="w-full border border-input rounded-lg pl-9 pr-3 py-2 text-sm bg-muted/50 cursor-not-allowed"
                                value={1}
                                disabled
                            />
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-1">Valor fixo = 1 ponto.</p>
                    </div>
                    <div>
                        <label className="text-xs font-semibold text-muted-foreground block mb-1">🎯 Média de Aprovação</label>
                        <div className="relative">
                            <Percent className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            <input
                                type="number"
                                step="0.5"
                                min="0"
                                max="10"
                                className="w-full border border-input rounded-lg pl-9 pr-3 py-2 text-sm bg-background focus:ring-2 focus:ring-blue-600"
                                value={settings.passingAverage}
                                onChange={(e) => setSettings({ ...settings, passingAverage: Number(e.target.value) })}
                            />
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-1">Nota mínima para aprovação (escala 0-10).</p>
                    </div>
                </div>
            </div>

            {/* Preview */}
            <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-4 mb-6">
                <h4 className="text-sm font-bold text-emerald-700 mb-2">📊 Preview da Composição (valores máximos)</h4>
                <div className="text-xs text-emerald-600 space-y-1">
                    <p>Presencial ({settings.pointsPerPresence}) + Online ({settings.onlinePresencePoints}) + Vídeo Aula ({settings.interactionPoints}) + Leitura ({settings.bookActivityPoints}) + Questionário (1) = <strong>Atividades ({notaAtividades})</strong></p>
                    <p>Prova Online (10)</p>
                    <p className="font-bold text-emerald-800">Média = ({notaAtividades} + 10) / 2 = {previewMedia}</p>
                </div>
            </div>

            <Button onClick={handleSave} disabled={saving} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold h-10">
                {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                Salvar Regras de Avaliação
            </Button>
        </div>
    )
}
