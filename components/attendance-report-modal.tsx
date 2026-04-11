"use client"

import { useState, useMemo } from "react"
import { 
    Search, Download, Filter, X, FileText, Calendar, Users, BookOpen
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog"
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { 
    type Discipline, type StudentProfile, type ClassRoom, type Attendance,
    getAttendancesByDate
} from "@/lib/store"
import { printAttendanceReportPDF } from "@/lib/pdf"

interface AttendanceReportModalProps {
    disciplines: Discipline[]
    classes: ClassRoom[]
    students: StudentProfile[]
    allAttendances: Attendance[] // We might need to fetch all or pass them
}

export function AttendanceReportModal({ disciplines, classes, students, allAttendances }: AttendanceReportModalProps) {
    const [open, setOpen] = useState(false)
    const [filterDisciplineId, setFilterDisciplineId] = useState<string>("all")
    const [filterClassId, setFilterClassId] = useState<string>("all")
    const [filterDate, setFilterDate] = useState<string>("")
    const [filterName, setFilterName] = useState("")

    const reportData = useMemo(() => {
        if (!students || students.length === 0) return []
        const safeAllAttendances = allAttendances || []

        let filtered = [...safeAllAttendances]

        if (filterDisciplineId && filterDisciplineId !== "all") {
            filtered = filtered.filter(a => a?.disciplineId === filterDisciplineId)
        }
        if (filterDate) {
            filtered = filtered.filter(a => a?.date === filterDate)
        }

        return (students || [])
            .filter(s => {
                if (!s) return false
                const matchName = (s.name || "").toLowerCase().includes((filterName || "").toLowerCase())
                const matchClass = filterClassId === "all" || s.class_id === filterClassId
                return matchName && matchClass
            })
            .map(student => {
                const studentAtts = filtered.filter(a => a?.studentId === student.id)
                const presents = studentAtts.filter(a => a?.isPresent).length
                const total = studentAtts.length
                const pct = total > 0 ? (presents / total) * 100 : 0
                
                return {
                    id: student.id,
                    name: student.name,
                    enrollment: student.enrollment_number || "-",
                    presents,
                    total,
                    pct: pct.toFixed(0) + "%"
                }
            })
    }, [allAttendances, students, filterDisciplineId, filterClassId, filterDate, filterName])

    async function handleExportPDF() {
        const discName = filterDisciplineId === "all" ? "Todas as Disciplinas" : disciplines.find(d => d.id === filterDisciplineId)?.name || ""
        
        // Final filter for PDF
        const pdfAttendances = filterDisciplineId === "all" ? allAttendances : allAttendances.filter(a => a.disciplineId === filterDisciplineId)
        
        printAttendanceReportPDF(
            pdfAttendances, 
            students.filter(s => filterClassId === "all" || s.class_id === filterClassId), 
            discName, 
            "Cosme de Farias"
        )
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="border-primary text-primary hover:bg-primary/10 font-bold transition-all hover:scale-105">
                    <FileText className="h-4 w-4 mr-2" />
                    Relatório de Frequência
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-7xl w-[95vw] max-h-[95vh] overflow-hidden flex flex-col p-0 gap-0 border-none rounded-2xl shadow-2xl">
                <DialogHeader className="p-6 bg-gradient-to-r from-primary/10 to-transparent border-b">
                    <DialogTitle className="flex items-center gap-3 text-2xl font-black tracking-tight text-primary">
                        <div className="p-2 bg-primary/10 rounded-xl">
                            <BookOpen className="h-7 w-7" />
                        </div>
                        Relatório de Diário de Classe (Frequência)
                    </DialogTitle>
                </DialogHeader>

                <div className="flex-1 overflow-hidden flex flex-col p-6 space-y-6 bg-slate-50/30">
                    {/* Filtros Premium */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 p-6 bg-white rounded-2xl border border-border/50 shadow-sm">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Disciplina / Matéria</Label>
                            <Select value={filterDisciplineId} onValueChange={setFilterDisciplineId}>
                                <SelectTrigger className="bg-slate-50 border-slate-200 h-11 focus:ring-primary/20 transition-all">
                                    <SelectValue placeholder="Todas" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todas as Disciplinas</SelectItem>
                                    {disciplines.map(d => (
                                        <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Turma / Núcleo</Label>
                            <Select value={filterClassId} onValueChange={setFilterClassId}>
                                <SelectTrigger className="bg-slate-50 border-slate-200 h-11 focus:ring-primary/20 transition-all">
                                    <SelectValue placeholder="Todas" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todas as Turmas</SelectItem>
                                    {classes.map(c => (
                                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Data Específica</Label>
                            <div className="relative group">
                                <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                <Input 
                                    type="date" 
                                    value={filterDate}
                                    onChange={(e) => setFilterDate(e.target.value)}
                                    className="pl-10 h-11 bg-slate-50 border-slate-200 focus:ring-primary/20 transition-all"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Pesquisar Aluno</Label>
                            <div className="relative group">
                                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                <Input 
                                    placeholder="Filtrar por nome ou matrícula..." 
                                    value={filterName}
                                    onChange={(e) => setFilterName(e.target.value)}
                                    className="pl-10 h-11 bg-slate-50 border-slate-200 focus:ring-primary/20 transition-all"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Tabela de Resultados */}
                    <div className="flex-1 overflow-auto bg-white rounded-2xl border border-border/50 shadow-sm relative">
                        <table className="w-full text-sm text-left border-collapse">
                            <thead className="bg-slate-50/80 backdrop-blur-sm text-slate-500 text-[10px] uppercase font-black tracking-widest sticky top-0 z-10 border-b">
                                <tr>
                                    <th className="px-8 py-5">Informações do Aluno</th>
                                    <th className="px-8 py-5">Matrícula</th>
                                    <th className="px-8 py-5 text-center">Presenças</th>
                                    <th className="px-8 py-5 text-center">Aulas Totais</th>
                                    <th className="px-8 py-5 text-right">Frequência (%)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {reportData.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="py-24 text-center">
                                            <div className="flex flex-col items-center gap-3 opacity-30">
                                                <Users className="h-12 w-12" />
                                                <p className="font-medium">Nenhum registro encontrado para os filtros selecionados.</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    reportData.map(row => (
                                        <tr key={row.id} className="hover:bg-slate-50/50 transition-colors group">
                                            <td className="px-8 py-5 font-bold text-slate-800 text-base">{row.name}</td>
                                            <td className="px-8 py-5 text-slate-500 font-mono text-xs tracking-tighter">{row.enrollment}</td>
                                            <td className="px-8 py-5 text-center">
                                                <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-green-50 text-green-700 font-black text-sm">
                                                    {row.presents}
                                                </div>
                                            </td>
                                            <td className="px-8 py-5 text-center text-slate-400 font-medium">{row.total}</td>
                                            <td className="px-8 py-5 text-right">
                                                <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-black shadow-sm border ${
                                                    parseInt(row.pct) >= 70 ? "bg-green-500 text-white border-green-600" : "bg-red-500 text-white border-red-600"
                                                }`}>
                                                    {row.pct}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="p-6 bg-white border-t flex flex-col sm:flex-row justify-between items-center gap-4 rounded-b-2xl">
                    <div className="bg-slate-100 px-4 py-2 rounded-lg border border-slate-200">
                        <p className="text-xs text-slate-600 font-medium">
                            Total: <strong className="text-primary">{reportData.length}</strong> alunos listados
                        </p>
                    </div>
                    <div className="flex gap-4 w-full sm:w-auto">
                        <Button variant="ghost" onClick={() => setOpen(false)} className="flex-1 sm:flex-none uppercase text-xs font-bold tracking-widest hover:bg-slate-100">
                            Fechar Janela
                        </Button>
                        <Button onClick={handleExportPDF} className="flex-1 sm:flex-none bg-primary hover:bg-primary/90 text-white shadow-xl shadow-primary/20 px-8 h-12 uppercase text-xs font-black tracking-widest transition-all hover:scale-105 active:scale-95">
                            <Download className="h-5 w-5 mr-3" />
                            Gerar Relatório PDF
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
