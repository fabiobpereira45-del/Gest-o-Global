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
                <Button variant="outline" className="border-primary text-primary hover:bg-primary/10 font-bold">
                    <FileText className="h-4 w-4 mr-2" />
                    Relatório de Frequência
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl font-bold text-primary">
                        <BookOpen className="h-6 w-6" />
                        Relatório de Diário de Classe (Frequência)
                    </DialogTitle>
                </DialogHeader>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-muted/30 rounded-lg border border-border mt-4">
                    <div className="space-y-1.5">
                        <Label className="text-xs font-bold uppercase text-muted-foreground">Disciplina</Label>
                        <Select value={filterDisciplineId} onValueChange={setFilterDisciplineId}>
                            <SelectTrigger className="bg-white">
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

                    <div className="space-y-1.5">
                        <Label className="text-xs font-bold uppercase text-muted-foreground">Turma</Label>
                        <Select value={filterClassId} onValueChange={setFilterClassId}>
                            <SelectTrigger className="bg-white">
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

                    <div className="space-y-1.5">
                        <Label className="text-xs font-bold uppercase text-muted-foreground">Data Específica</Label>
                        <div className="relative">
                            <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                            <Input 
                                type="date" 
                                value={filterDate}
                                onChange={(e) => setFilterDate(e.target.value)}
                                className="pl-8 bg-white"
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-xs font-bold uppercase text-muted-foreground">Nome do Aluno</Label>
                        <div className="relative">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                            <Input 
                                placeholder="Filtrar aluno..." 
                                value={filterName}
                                onChange={(e) => setFilterName(e.target.value)}
                                className="pl-8 bg-white"
                            />
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-auto mt-6 border rounded-xl shadow-inner bg-white">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase font-bold sticky top-0 border-b">
                            <tr>
                                <th className="px-6 py-3">Aluno</th>
                                <th className="px-6 py-3">Matrícula</th>
                                <th className="px-6 py-3 text-center">Presenças</th>
                                <th className="px-6 py-3 text-center">Aulas Totais</th>
                                <th className="px-6 py-3 text-right">% Freq.</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {reportData.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="py-20 text-center text-muted-foreground italic">
                                        Nenhum registro encontrado para os filtros selecionados.
                                    </td>
                                </tr>
                            ) : (
                                reportData.map(row => (
                                    <tr key={row.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4 font-bold text-slate-700">{row.name}</td>
                                        <td className="px-6 py-4 text-slate-500 font-mono text-xs">{row.enrollment}</td>
                                        <td className="px-6 py-4 text-center font-bold text-green-600">{row.presents}</td>
                                        <td className="px-6 py-4 text-center text-slate-400">{row.total}</td>
                                        <td className="px-6 py-4 text-right">
                                            <span className={`px-2 py-1 rounded-md text-xs font-bold ${
                                                parseInt(row.pct) >= 70 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                                            }`}>
                                                {row.pct}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="flex justify-between items-center p-4 bg-slate-50 border-t mt-auto rounded-b-lg">
                    <p className="text-xs text-muted-foreground">
                        Mostrando <strong>{reportData.length}</strong> alunos filtrados
                    </p>
                    <div className="flex gap-3">
                        <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
                        <Button onClick={handleExportPDF} className="bg-primary hover:bg-primary/90 text-white shadow-md">
                            <Download className="h-4 w-4 mr-2" />
                            Exportar para PDF
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
