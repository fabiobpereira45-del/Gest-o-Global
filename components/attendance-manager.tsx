"use client"

import { useEffect, useState } from "react"
import { CalendarDays, Save, CheckCircle2, User, Search, RefreshCw, AlertCircle, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { 
    type Discipline, type StudentProfile, type Attendance, type ClassRoom,
    getDisciplines, getStudents, getAttendances, saveAttendance, getProfessorSession, getDisciplinesByProfessor, getClasses, saveBatchAttendances,
    getAttendanceFinalization, finalizeAttendance, unfinalizeAttendance, getAttendancesByDate
} from "@/lib/store"
import { AttendanceReportModal } from "./attendance-report-modal"
import { printAttendanceReportPDF } from "@/lib/pdf"

export function AttendanceManager() {
    const [disciplines, setDisciplines] = useState<Discipline[]>([])
    const [students, setStudents] = useState<StudentProfile[]>([])

    const [selectedDisciplineId, setSelectedDisciplineId] = useState<string>("none")
    const [selectedClassId, setSelectedClassId] = useState<string>("all")
    const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split("T")[0])
    const [lessonType, setLessonType] = useState<"presencial" | "ead">("presencial")
    const [searchTerm, setSearchTerm] = useState("")

    const [classes, setClasses] = useState<ClassRoom[]>([])

    const [attendances, setAttendances] = useState<Record<string, boolean>>({})
    const [allAttendances, setAllAttendances] = useState<Attendance[]>([])
    const [isFinalized, setIsFinalized] = useState(false)
    const [isMaster, setIsMaster] = useState(false)
    const [loading, setLoading] = useState(false)
    const [saving, setSaving] = useState(false)
    const [finalizing, setFinalizing] = useState(false)
    const [progress, setProgress] = useState<{ current: number; total: number } | null>(null)

    // Initialize
    useEffect(() => {
        async function loadData() {
            setLoading(true)
            try {
                const session = getProfessorSession()
                let d: Discipline[] = []
                
                if (session?.role === 'master') {
                    setIsMaster(true)
                    d = await getDisciplines()
                } else if (session?.professorId) {
                    setIsMaster(false)
                    d = await getDisciplinesByProfessor(session.professorId)
                }
                
                const [c, s] = await Promise.all([getClasses(), getStudents()])
                
                // Pre-load all attendances for the report modal - USANDO CHUNKING PARA EVITAR TRAVAMENTO
                let allAtt: Attendance[] = []
                if (d.length > 0) {
                    const chunkSize = 5
                    for (let i = 0; i < d.length; i += chunkSize) {
                        const chunk = d.slice(i, i + chunkSize)
                        const results = await Promise.all(chunk.map(disc => getAttendances(disc.id)))
                        allAtt = [...allAtt, ...results.flat()]
                    }
                }

                setDisciplines(d)
                setClasses(c)
                setStudents(s)
                setAllAttendances(allAtt)
            } catch (err) {
                console.error("Erro ao carregar dados iniciais do AttendanceManager:", err)
            } finally {
                setLoading(false)
            }
        }
        loadData()
    }, [])

    // Load attendances when discipline or date changes
    useEffect(() => {
        async function fetchAttendances() {
            if (selectedDisciplineId === "none" || !selectedDate) {
                setAttendances({})
                setIsFinalized(false)
                return
            }
            setLoading(true)
            try {
                const [data, finalized] = await Promise.all([
                    getAttendancesByDate(selectedDisciplineId, selectedDate, lessonType),
                    getAttendanceFinalization(selectedDisciplineId, selectedDate)
                ])

                const attMap: Record<string, boolean> = {}
                data.forEach(a => {
                    attMap[a.studentId] = a.isPresent
                })
                setAttendances(attMap)
                setIsFinalized(finalized)
            } catch (err) {
                console.error("Erro ao carregar chamada:", err)
            } finally {
                setLoading(false)
            }
        }
        fetchAttendances()
    }, [selectedDisciplineId, selectedDate, lessonType])

    async function handleSave() {
        if (selectedDisciplineId === "none" || !selectedDate) return
        setSaving(true)
        setProgress(null)
        
        try {
            // Prepare all attendance records in batch
            const batchData = filteredStudents.map(student => ({
                studentId: student.id,
                disciplineId: selectedDisciplineId,
                date: selectedDate,
                isPresent: attendances[student.id] === true,
                type: lessonType
            }))

            // Save with progress tracking (compatible loop)
            await saveBatchAttendances(batchData, (current: number, total: number) => {
                setProgress({ current, total })
            })

            // Hard refresh - fetch latest data for this date and all data for report
            const [updatedDateAtt, updatedAllAtt] = await Promise.all([
                getAttendancesByDate(selectedDisciplineId, selectedDate),
                getAttendances(selectedDisciplineId)
            ])

            // Update local state for current view
            const attMap: Record<string, boolean> = {}
            updatedDateAtt.forEach(a => {
                attMap[a.studentId] = a.isPresent
            })
            setAttendances(attMap)

            // Update allAttendances for the report modal (only for selected discipline to keep it clean)
            setAllAttendances(prev => {
                const others = prev.filter(a => a.disciplineId !== selectedDisciplineId)
                return [...others, ...updatedAllAtt]
            })

            alert("Frequência salva e sincronizada com sucesso no banco de dados!")
        } catch (e: any) {
            console.error("Erro crítico ao salvar chamada:", e)
            alert("Erro ao salvar: " + e.message)
        } finally {
            setSaving(false)
            setProgress(null)
        }
    }

    async function handleFinalize() {
        if (!confirm("Deseja realmente GRAVAR esta chamada? Uma vez gravada, apenas o Master poderá desbloquear para novas alterações.")) return
        
        if (selectedDisciplineId === "none" || !selectedDate) return
        setFinalizing(true)
        try {
            // First save everything normally
            await handleSave()
            
            const session = getProfessorSession()
            if (session?.professorId) {
                await finalizeAttendance(selectedDisciplineId, selectedDate, session.professorId)
                setIsFinalized(true)
                alert("Chamada GRAVADA e trancada com sucesso! As notas dos alunos já foram atualizadas automaticamente.")
            }
        } catch (e: any) {
            if (e.message === "RLS_ERROR" && isMaster) {
                // If it's an RLS error but the user is Master, we consider it "locally finalized"
                // because the records WERE saved in handleSave() above.
                setIsFinalized(true)
                alert("Chamada salva com sucesso! (Nota: O trancamento administrativo no banco teve uma restrição de permissão, mas os dados estão seguros).")
            } else {
                alert("Erro ao gravar: " + e.message)
            }
        } finally {
            setFinalizing(false)
        }
    }

    async function handleUnlock() {
        if (!confirm("Deseja DESBLOQUEAR esta chamada para edição?")) return
        try {
            await unfinalizeAttendance(selectedDisciplineId, selectedDate)
            setIsFinalized(false)
            alert("Chamada desbloqueada!")
        } catch (e: any) {
            alert("Erro ao desbloquear: " + e.message)
        }
    }

    function toggleAttendance(studentId: string) {
        if (isFinalized && !isMaster) return
        setAttendances(prev => ({
            ...prev,
            [studentId]: prev[studentId] === false ? true : false
        }))
    }

    // Filter students based on search and class
    const filteredStudents = students.filter(s => {
        const matchSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) || s.enrollment_number.includes(searchTerm)
        const matchClass = selectedClassId === "all" || s.class_id === selectedClassId
        return matchSearch && matchClass
    })

    return (
        <div className="flex flex-col gap-6 w-full max-w-[1400px] mx-auto">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-semibold text-foreground">Diário de Classe (Frequência)</h2>
                    <p className="text-sm text-muted-foreground">Registre a presença dos alunos nas suas disciplinas</p>
                </div>
                <div className="flex gap-2">
                    <AttendanceReportModal 
                        disciplines={disciplines}
                        classes={classes}
                        students={students}
                        allAttendances={allAttendances}
                    />

                    {isFinalized ? (
                        <div className="flex items-center gap-2">
                             <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-bold bg-amber-100 text-amber-700 border border-amber-200 shadow-sm">
                                <AlertCircle className="h-4 w-4" /> Gravação Finalizada
                            </span>
                            {isMaster && (
                                <Button onClick={handleUnlock} variant="destructive" className="rounded-lg shadow-lg">
                                    <RefreshCw className="h-4 w-4 mr-2" /> Desbloquear
                                </Button>
                            )}
                        </div>
                    ) : (
                        <div className="flex gap-2">
                            <Button variant="secondary" onClick={handleSave} disabled={saving || selectedDisciplineId === "none" || !selectedDate} className="bg-slate-100 text-slate-700 hover:bg-slate-200">
                                {saving ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                                Salvar
                            </Button>
                            <Button onClick={handleFinalize} disabled={finalizing || saving || selectedDisciplineId === "none" || !selectedDate} className="bg-primary hover:bg-primary/90 text-white shadow-lg">
                                {finalizing ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
                                Gravar Chamada
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 bg-muted/30 border border-border rounded-xl p-4">
                <div className="flex flex-col gap-1.5 align-bottom">
                    <Label>Disciplina *</Label>
                    <Select value={selectedDisciplineId} onValueChange={setSelectedDisciplineId}>
                        <SelectTrigger>
                            <SelectValue placeholder="Selecione a disciplina" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="none">Selecione uma disciplina...</SelectItem>
                            {disciplines.map(d => (
                                <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                
                <div className="flex flex-col gap-1.5 align-bottom">
                    <Label>Tipo de Aula *</Label>
                    <Select value={lessonType} onValueChange={(val) => setLessonType(val as "presencial" | "ead")}>
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="presencial">📍 Presencial</SelectItem>
                            <SelectItem value="ead">💻 Online</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="flex flex-col gap-1.5 align-bottom">
                    <Label>Data da Aula *</Label>
                    <div className="relative">
                        <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                </div>

                <div className="flex flex-col gap-1.5 align-bottom">
                    <Label>Turma (Opcional)</Label>
                    <Select value={selectedClassId} onValueChange={setSelectedClassId}>
                        <SelectTrigger>
                            <SelectValue placeholder="Todos os Núcleos" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos os Núcleos</SelectItem>
                            {classes.map(c => (
                                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="flex flex-col gap-1.5 align-bottom">
                    <Label>Buscar Aluno</Label>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Nome ou Matrícula"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                </div>
            </div>

            {selectedDisciplineId === "none" ? (
                <div className="bg-card border border-border border-dashed rounded-xl p-12 text-center flex flex-col items-center">
                    <User className="h-12 w-12 text-muted-foreground opacity-30 mb-4" />
                    <h3 className="text-lg font-semibold text-foreground mb-1">Selecione uma disciplina</h3>
                    <p className="text-muted-foreground text-sm max-w-md">Para realizar a chamada, primeiro selecione a disciplina e a data desejada.</p>
                </div>
            ) : (
                <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
                    {loading ? (
                        <div className="flex justify-center p-8"><RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" /></div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-muted/50 text-muted-foreground text-xs uppercase font-semibold">
                                    <tr>
                                        <th className="px-4 py-3 w-16 text-center">Nº</th>
                                        <th className="px-4 py-3 min-w-[200px]">Nome do Aluno</th>
                                        <th className="px-4 py-3">Matrícula</th>
                                        <th className="px-4 py-3 text-center">Status</th>
                                        <th className="px-4 py-3 text-center">Presença</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {filteredStudents.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="px-4 py-6 text-center text-muted-foreground italic">
                                                Nenhum aluno encontrado na busca.
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredStudents.map((student, idx) => {
                                            // Defaulting to absent if it wasn't explicitly saved as present in the DB
                                            const isPresent = attendances[student.id] === true

                                            return (
                                                <tr key={student.id} className="hover:bg-muted/30 transition-colors">
                                                    <td className="px-4 py-3 text-center text-muted-foreground font-mono">
                                                        {(idx + 1).toString().padStart(2, '0')}
                                                    </td>
                                                    <td className="px-4 py-3 font-medium text-foreground">
                                                        {student.name}
                                                    </td>
                                                    <td className="px-4 py-3 text-muted-foreground font-mono">
                                                        {student.enrollment_number}
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                        {isPresent ? (
                                                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-semibold bg-green-100 text-green-700">
                                                                <CheckCircle2 className="h-3.5 w-3.5" /> Presente
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-semibold bg-red-100 text-red-700">
                                                                <AlertCircle className="h-3.5 w-3.5" /> Faltou
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3 text-center flex justify-center">
                                                        <button
                                                            onClick={() => toggleAttendance(student.id)}
                                                            disabled={isFinalized && !isMaster}
                                                            className={`w-12 h-6 rounded-full transition-colors flex items-center px-1 ${isPresent ? "bg-green-500 justify-end" : "bg-red-400 justify-start"
                                                                } ${isFinalized && !isMaster ? "opacity-50 cursor-not-allowed" : ""}`}
                                                        >
                                                            <div className="w-4 h-4 rounded-full bg-white shadow-sm" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            )
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
