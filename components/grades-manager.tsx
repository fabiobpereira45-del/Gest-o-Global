import { useState, useEffect, useMemo, memo } from "react"
import {
    Plus, Pencil, Trash2, GraduationCap, Calculator, Loader2, Save, X, Download, Eye, EyeOff, CheckCheck, RefreshCw, Search
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
    StudentGrade, getStudentGrades, saveStudentGrade, deleteStudentGrade, saveBatchGrades,
    StudentProfile, getStudents, Discipline, getDisciplines, releaseAllGrades, syncGradesForDiscipline
} from "@/lib/store"
import { printGradesReportPDF } from "@/lib/pdf"
import { ErrorBoundary } from "@/components/error-boundary"
import { Switch } from "@/components/ui/switch"

// --- Sub-componente Memoizado para cada Linha de Nota (Expansível) ---
const GradeCard = memo(({ 
    grade, 
    disciplines, 
    isMaster, 
    onEdit, 
    onDelete,
    calculateAverage 
}: { 
    grade: StudentGrade, 
    disciplines: Discipline[], 
    isMaster: boolean, 
    onEdit: (g: StudentGrade) => void, 
    onDelete: (id: string) => void,
    calculateAverage: (g: StudentGrade) => string
}) => {
    const [isExpanded, setIsExpanded] = useState(false)
    const discipline = disciplines.find(d => d.id === grade.disciplineId)
    const average = calculateAverage(grade)
    const isApproved = parseFloat(average) >= 7

    return (
        <div className={`overflow-hidden transition-all duration-300 border-l-4 ${isExpanded ? 'bg-slate-50/80 border-primary' : 'hover:bg-slate-50/50 border-transparent bg-white'}`}>
            {/* Cabeçalho do Card (Sempre Visível) */}
            <div 
                className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer select-none"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex-1 flex items-center gap-4">
                    <div className={`h-10 w-10 rounded-xl flex items-center justify-center font-black text-sm shadow-sm border ${isApproved ? 'bg-green-100 text-green-700 border-green-200' : 'bg-amber-100 text-amber-700 border-amber-200'}`}>
                        {grade.studentName.charAt(0)}
                    </div>
                    <div>
                        <div className="flex items-center flex-wrap gap-2 mb-0.5">
                            <h4 className="font-bold text-foreground text-base tracking-tight">{grade.studentName}</h4>
                            {discipline && (
                                <span className="bg-primary/5 text-primary text-[10px] px-2 py-0.5 rounded-full font-black uppercase tracking-widest">
                                    {discipline.name}
                                </span>
                            )}
                        </div>
                        <p className="text-[10px] text-muted-foreground font-mono opacity-60">ID: {grade.studentIdentifier}</p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="text-right hidden sm:block">
                        <div className="text-[9px] text-muted-foreground uppercase font-black tracking-widest mb-0.5">Média</div>
                        <div className={`text-xl font-black tabular-nums ${isApproved ? 'text-green-600' : 'text-amber-600'}`}>
                            {average}
                        </div>
                    </div>
                    <div className={`p-2 rounded-full transition-transform duration-300 ${isExpanded ? 'rotate-180 bg-primary/10 text-primary' : 'bg-slate-100 text-slate-400'}`}>
                        <Plus className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-45' : ''}`} />
                    </div>
                </div>
            </div>

            {/* Conteúdo Detalhado (Expansível) */}
            {isExpanded && (
                <div className="px-5 pb-6 pt-2 animate-in slide-in-from-top-2 duration-300">
                    <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
                            {[
                                { label: 'Prova Online', val: grade.examGrade, color: 'text-blue-600' },
                                { label: 'Leitura Livro', val: grade.worksGrade, color: 'text-slate-600' },
                                { label: 'Quest. Livro', val: grade.seminarGrade, color: 'text-slate-600' },
                                { label: 'Vídeo Aula', val: grade.participationBonus, color: 'text-purple-600' },
                                { label: 'Frequência', val: grade.attendanceScore, color: 'text-green-600' },
                            ].map(tag => (
                                <div key={tag.label} className="flex flex-col gap-1">
                                    <span className="text-[9px] font-black uppercase text-slate-400 tracking-tighter">{tag.label}</span>
                                    <span className={`text-sm font-black tabular-nums ${tag.color}`}>{tag.val}</span>
                                </div>
                            ))}
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-4 pt-6 border-t border-slate-50">
                            <div className="flex items-center gap-2">
                                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black border uppercase tracking-wider ${grade.isReleased ? 'bg-green-500 text-white border-green-600 shadow-lg shadow-green-500/20' : 'bg-amber-100 text-amber-700 border-amber-200'}`}>
                                    {grade.isReleased ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                                    {grade.isReleased ? 'Liberada para o Aluno' : 'Oculta no Boletim'}
                                </span>
                                <span className={`text-[10px] font-black uppercase px-3 py-1.5 rounded-full border ${isApproved ? 'bg-green-50 text-green-700 border-green-100' : 'bg-red-50 text-red-700 border-red-100'}`}>
                                    {isApproved ? 'Aprovado' : 'Reprovado / Pendente'}
                                </span>
                            </div>

                            <div className="flex gap-2">
                                <Button variant="outline" size="sm" className="h-10 px-5 font-bold border-slate-200 hover:bg-primary/5 hover:text-primary transition-all rounded-xl" onClick={(e) => { e.stopPropagation(); onEdit(grade); }}>
                                    <Pencil className="h-3.5 w-3.5 mr-2" /> Editar Notas
                                </Button>
                                {isMaster && (
                                    <Button variant="ghost" size="sm" className="h-10 px-5 font-bold text-red-400 hover:text-red-600 hover:bg-red-50 transition-all rounded-xl" onClick={(e) => { e.stopPropagation(); onDelete(grade.id); }}>
                                        <Trash2 className="h-3.5 w-3.5 mr-2" /> Remover
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
})

GradeCard.displayName = "GradeCard"

export function GradesManager({ isMaster }: { isMaster: boolean }) {
    const [grades, setGrades] = useState<StudentGrade[]>([])
    const [students, setStudents] = useState<StudentProfile[]>([])
    const [disciplines, setDisciplines] = useState<Discipline[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [isEditing, setIsEditing] = useState<string | null>(null)
    const [isCreating, setIsCreating] = useState(false)
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
    const [bulkReleaseConfirm, setBulkReleaseConfirm] = useState(false)
    const [selectedDiscipline, setSelectedDiscipline] = useState<string>("")
    const [searchName, setSearchName] = useState("")
    const [isSyncing, setIsSyncing] = useState(false)

    // Form State
    const [formData, setFormData] = useState<any>({
        studentIdentifier: "",
        studentName: "",
        disciplineId: "",
        isPublic: false,
        examGrade: "",
        worksGrade: "",
        seminarGrade: "",
        participationBonus: "",
        attendanceScore: "",
        customDivisor: "2",
        isReleased: true
    })

    const loadData = async () => {
        try {
            setLoading(true)
            const [fetchedGrades, fetchedStudents, fetchedDisciplines] = await Promise.all([
                getStudentGrades(selectedDiscipline || undefined),
                getStudents(),
                getDisciplines()
            ])
            setGrades(fetchedGrades)
            setStudents(fetchedStudents)
            setDisciplines(fetchedDisciplines)
            setError(null)
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadData()
    }, [selectedDiscipline])

    const handleCreateOrUpdate = async () => {
        try {
            const studentName = formData.studentName?.trim()
            const studentIdentifier = formData.studentIdentifier?.trim()

            if (!studentName || !studentIdentifier) {
                throw new Error("O nome e identificador do aluno são obrigatórios.")
            }
            
            if (!isEditing) {
                const alreadyExists = grades.find(g => 
                    g.studentIdentifier === formData.studentIdentifier && 
                    g.disciplineId === (formData.disciplineId || null)
                )
                if (alreadyExists && !confirm(`Atenção: Já existe um registro de notas para este aluno nesta disciplina (${disciplines.find(d => d.id === formData.disciplineId)?.name || "Geral"}). Deseja criar um novo registro duplicado?`)) {
                    return
                }
            }

            const gradeToSave = {
                studentIdentifier,
                studentName,
                disciplineId: formData.disciplineId,
                isPublic: formData.isPublic || false,
                examGrade: parseFloat(formData.examGrade) || 0,
                worksGrade: parseFloat(formData.worksGrade) || 0,
                seminarGrade: parseFloat(formData.seminarGrade) || 0,
                participationBonus: parseFloat(formData.participationBonus) || 0,
                attendanceScore: parseFloat(formData.attendanceScore) || 0,
                customDivisor: parseFloat(formData.customDivisor) || 4,
                isReleased: formData.isReleased
            }

            await saveStudentGrade(
                gradeToSave as Omit<StudentGrade, 'id' | 'createdAt'>,
                isEditing || undefined
            )

            setIsCreating(false)
            setIsEditing(null)
            loadData()
        } catch (err: any) {
            alert("Erro ao salvar notas: " + err.message)
        }
    }

    const handleDelete = async (id: string) => {
        try {
            await deleteStudentGrade(id)
            setDeleteConfirm(null)
            loadData()
        } catch (err: any) {
            alert("Erro ao deletar: " + err.message)
        }
    }

    const handleBulkRelease = async () => {
        try {
            setLoading(true)
            await releaseAllGrades(true)
            setBulkReleaseConfirm(false)
            await loadData()
            alert("Todas as notas foram liberadas para os alunos!")
        } catch (err: any) {
            alert("Erro ao liberar notas: " + err.message)
        } finally {
            setLoading(false)
        }
    }

    const [statusFilter, setStatusFilter] = useState<"all" | "released" | "hidden">("all")

    const handleSync = async () => {

        if (!selectedDiscipline) {
            alert("Selecione uma disciplina no filtro abaixo para sincronizar.")
            return
        }

        try {
            setIsSyncing(true)
            const syncData = await syncGradesForDiscipline(selectedDiscipline)
            
            if ((syncData as any).reason) {
                alert((syncData as any).reason)
                setIsSyncing(false)
                return
            }

            // Converter os resultados em um ÚNICO lote de salvamento (Muito mais rápido)
            const recordsToSave = Object.entries(syncData).map(([identifier, data]) => {
                const existing = grades.find(g => 
                    g.studentIdentifier.toLowerCase().trim() === identifier && 
                    g.disciplineId === selectedDiscipline
                )

                return {
                    studentIdentifier: identifier,
                    studentName: (data as any).name,
                    disciplineId: selectedDiscipline as string,
                    isPublic: false,
                    examGrade: (data as any).examGrade,
                    worksGrade: existing?.worksGrade || 0,
                    seminarGrade: existing?.seminarGrade || 0,
                    participationBonus: existing?.participationBonus || 0,
                    attendanceScore: (data as any).attendanceScore,
                    customDivisor: existing?.customDivisor || 4,
                    isReleased: true,
                    id: existing?.id
                }
            })

            await saveBatchGrades(recordsToSave)
            alert("Sincronização concluída com sucesso!")
            loadData()
        } catch (err: any) {
            alert("Erro na sincronização: " + err.message)
        } finally {
            setIsSyncing(false)
        }
    }

    const handlePublishFiltered = async (isReleased: boolean) => {
        if (!selectedDiscipline) {
            alert("Selecione uma disciplina para atualizar a visibilidade em massa.")
            return
        }

        try {
            setLoading(true)
            const filtered = grades.filter(g => g.disciplineId === selectedDiscipline)
            const promises = filtered.map(g => saveStudentGrade({ ...g, isReleased }, g.id))
            await Promise.all(promises)
            alert(isReleased ? "Notas da disciplina liberadas!" : "Notas da disciplina ocultadas!")
            loadData()
        } catch (err: any) {
            alert("Erro ao atualizar visibilidade: " + err.message)
        } finally {
            setLoading(false)
        }
    }

    const calculateAverage = (grade: StudentGrade) => {
        const notaAtividades = 
            (parseFloat(grade.worksGrade as any) || 0) +
            (parseFloat(grade.seminarGrade as any) || 0) +
            (parseFloat(grade.participationBonus as any) || 0) +
            (parseFloat(grade.attendanceScore as any) || 0)

        const provaOnline = parseFloat(grade.examGrade as any) || 0
        const media = (notaAtividades + provaOnline) / 2
        return media.toFixed(2)
    }

    // --- Listas Memoizadas para Performance ---
    const filteredGrades = useMemo(() => {
        const raw = grades
            .filter(g => {
                const matchDiscipline = !selectedDiscipline || g.disciplineId === selectedDiscipline
                const matchName = !searchName || g.studentName.toLowerCase().includes(searchName.toLowerCase()) || g.studentIdentifier.toLowerCase().includes(searchName.toLowerCase())
                const matchStatus = statusFilter === "all" || (statusFilter === "released" ? g.isReleased : !g.isReleased)
                return matchDiscipline && matchName && matchStatus
            })
            .sort((a, b) => a.studentName.localeCompare(b.studentName))

        // DEDUPLICAÇÃO: Agrupar por estudante + disciplina para evitar duplicidade visual
        const uniqueGradesMap = new Map<string, StudentGrade>();
        raw.forEach(g => {
            const key = `${String(g.studentIdentifier || "").trim().toLowerCase()}-${g.disciplineId || 'geral'}`;
            const existing = uniqueGradesMap.get(key);
            
            if (!existing) {
                uniqueGradesMap.set(key, g);
            } else {
                // Se o novo registro tiver mais notas (ex: examGrade > 0), ele substitui o "vazio"
                const existingPoints = (existing.examGrade || 0) + (existing.attendanceScore || 0);
                const newPoints = (g.examGrade || 0) + (g.attendanceScore || 0);
                if (newPoints > existingPoints) {
                    uniqueGradesMap.set(key, g);
                }
            }
        });

        return Array.from(uniqueGradesMap.values());
    }, [grades, selectedDiscipline, searchName, statusFilter])

    const listMatriculados = useMemo(() => filteredGrades.filter(g => !g.isPublic), [filteredGrades])
    const listPublicos = useMemo(() => filteredGrades.filter(g => g.isPublic), [filteredGrades])

    if (loading) {
        return (
            <div className="flex flex-col h-96 items-center justify-center gap-4">
                <div className="relative">
                   <Loader2 className="h-12 w-12 animate-spin text-primary" />
                   <div className="absolute inset-0 flex items-center justify-center">
                       <div className="h-6 w-6 rounded-full bg-primary/20 blur-sm animate-pulse"></div>
                   </div>
                </div>
                <p className="text-sm font-black uppercase tracking-[0.2em] text-primary/60 animate-pulse">Carregando Diários...</p>
            </div>
        )
    }

    if (error) {
        return (
            <div className="rounded-2xl border-2 border-red-100 bg-red-50/50 p-8 text-red-600 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-400 text-center">
                <div className="bg-red-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                    <X className="h-6 w-6" />
                </div>
                <p className="font-bold text-xl mb-2">Erro ao carregar notas</p>
                <p className="text-sm opacity-80 mb-6 max-w-md mx-auto">{error}</p>
                <Button variant="outline" onClick={loadData} className="border-red-200 hover:bg-red-100 transition-all font-bold">
                    Tentar Novamente
                </Button>
            </div>
        )
    }

    return (
        <ErrorBoundary>
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                    <div>
                        <h2 className="text-3xl flex items-center gap-3 font-black tracking-tighter text-foreground">
                            <GraduationCap className="h-8 w-8 text-primary p-1.5 bg-primary/10 rounded-xl" />
                            Gestão de Notas e Diários
                        </h2>
                        <p className="text-muted-foreground mt-1 text-sm font-medium">Controle acadêmico de alunos matriculados e inscrições de prova pública.</p>
                    </div>
                    <div className="flex flex-wrap gap-3 w-full lg:w-auto">
                        {isMaster && (
                            <Button variant="outline" onClick={() => printGradesReportPDF(grades, "Relatório Geral de Notas", "Cosme de Farias")} className="flex-1 lg:flex-none border-slate-200 text-slate-600 hover:bg-slate-50 font-bold h-11">
                                <Download className="h-4 w-4 mr-2" />
                                Exportar PDF
                            </Button>
                        )}
                        <div className="relative group flex-1 lg:flex-none">
                            <Button 
                                variant="secondary" 
                                onClick={handleSync} 
                                disabled={isSyncing || !selectedDiscipline}
                                className="w-full bg-amber-500 text-white hover:bg-amber-600 shadow-lg shadow-amber-500/20 font-black h-11 px-6 uppercase text-[10px] tracking-widest disabled:opacity-30 disabled:bg-slate-300 disabled:text-slate-500 transition-all"
                            >
                                {isSyncing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                                Sincronizar Diário
                            </Button>
                            {!selectedDiscipline && !isSyncing && (
                                <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-xl font-bold">
                                    Selecione uma disciplina para sincronizar
                                </div>
                            )}
                        </div>
                        <Button variant="outline" onClick={() => setBulkReleaseConfirm(true)} className="flex-1 lg:flex-none border-green-600 text-green-600 hover:bg-green-500 hover:text-white font-black h-11 px-6 uppercase text-[10px] tracking-widest transition-all">
                            <CheckCheck className="h-4 w-4 mr-2" />
                            Liberar Tudo
                        </Button>
                        <Button onClick={() => {
                            setFormData({
                                studentIdentifier: "", studentName: "", disciplineId: selectedDiscipline || "", isPublic: false,
                                examGrade: "", worksGrade: "", seminarGrade: "", participationBonus: "", attendanceScore: "", customDivisor: "4", isReleased: true
                            })
                            setIsCreating(true)
                            setIsEditing(null)
                            window.scrollTo({ top: 0, behavior: 'smooth' })
                        }} className="flex-1 lg:flex-none bg-primary text-white hover:bg-primary/90 shadow-xl shadow-primary/20 font-black h-11 px-8 uppercase text-[10px] tracking-widest transition-all hover:scale-105 active:scale-95 group">
                            <Plus className="h-5 w-5 mr-1 group-hover:rotate-90 transition-transform" />
                            Lançar Notas
                        </Button>
                    </div>
                </div>

                {/* Filtro e Pesquisa Otimizados */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center bg-white p-5 rounded-3xl border border-slate-100 shadow-sm relative z-20">
                    <div className="md:col-span-4 flex flex-col gap-1.5">
                        <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1 tracking-widest">Disciplina Base</Label>
                        <select
                            className="flex h-12 w-full items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-bold focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer"
                            value={selectedDiscipline}
                            onChange={(e) => setSelectedDiscipline(e.target.value)}
                        >
                            <option value="">Todas as Disciplinas</option>
                            {disciplines.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                        </select>
                    </div>

                    <div className="md:col-span-2 flex flex-col gap-1.5">
                        <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1 tracking-widest">Situação</Label>
                        <select
                            className="flex h-12 w-full items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-bold focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value as any)}
                        >
                            <option value="all">Todas</option>
                            <option value="released">Liberadas</option>
                            <option value="hidden">Ocultas</option>
                        </select>
                    </div>

                    <div className="md:col-span-6 flex flex-col gap-1.5">
                        <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1 tracking-widest">Localizar Aluno</Label>
                        <div className="relative group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                            <Input 
                                placeholder="Nome, matrícula ou CPF..." 
                                value={searchName}
                                onChange={(e) => setSearchName(e.target.value)}
                                className="pl-11 h-12 bg-slate-50 border-slate-200 rounded-2xl focus:ring-primary/20 transition-all font-medium"
                            />
                        </div>
                    </div>
                    
                    <div className="md:col-span-3 flex items-end justify-end h-full py-0.5">
                        {selectedDiscipline && (
                            <div className="flex gap-2 w-full sm:w-auto">
                                <Button variant="ghost" size="sm" onClick={() => handlePublishFiltered(true)} className="flex-1 text-green-600 font-bold hover:bg-green-50 rounded-xl h-11 border border-transparent hover:border-green-100">
                                    <Eye className="h-4 w-4 mr-2" /> Liberar
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => handlePublishFiltered(false)} className="flex-1 text-amber-600 font-bold hover:bg-amber-50 rounded-xl h-11 border border-transparent hover:border-amber-100">
                                    <EyeOff className="h-4 w-4 mr-2" /> Ocultar
                                </Button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Formulário (Lançamento / Edição) */}
                {(isCreating || isEditing) && (
                    <div className="bg-white border border-slate-100 shadow-2xl rounded-[2rem] p-8 mb-8 animate-in zoom-in-95 duration-300">
                        <div className="flex justify-between items-center mb-8 border-b border-slate-100 pb-6">
                            <h3 className="text-xl font-black flex items-center gap-3 tracking-tight">
                                <Calculator className="h-6 w-6 text-primary" />
                                {isEditing ? "Editar Registro de Notas" : "Lançar Novo Boletim Individual"}
                            </h3>
                            <Button variant="ghost" size="icon" onClick={() => { setIsCreating(false); setIsEditing(null); }} className="rounded-full hover:bg-red-50 hover:text-red-500">
                                <X className="h-6 w-6" />
                            </Button>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            <div className="space-y-2 lg:col-span-2">
                                <Label className="font-bold text-slate-700">Aluno</Label>
                                <div className="flex flex-col sm:flex-row gap-3">
                                    <div className="flex-1 group relative">
                                        <Input
                                            value={formData.studentName || ""}
                                            onChange={(e) => setFormData({ ...formData, studentName: e.target.value })}
                                            placeholder="Nome completo..."
                                            className="h-12 bg-slate-50 border-slate-200 rounded-xl focus:ring-primary/20 pl-10"
                                        />
                                        <Plus className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                    </div>
                                    {!formData.isPublic && (
                                        <select
                                            className="h-12 w-full sm:w-[300px] rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold shadow-sm focus:ring-2 focus:ring-primary/20"
                                            value={students.find(s => (s.cpf === formData.studentIdentifier || s.enrollment_number === formData.studentIdentifier))?.id || ""}
                                            onChange={(e) => {
                                                const std = students.find(s => s.id === e.target.value)
                                                if (std) {
                                                    setFormData({ ...formData, studentName: std.name, studentIdentifier: std.cpf || std.enrollment_number || "" })
                                                } else {
                                                    // Se selecionar "Localizar...", não limpa necessariamente o que o user digitou à esquerda
                                                    // mas o ideal é deixar o user escolher.
                                                }
                                            }}
                                        >
                                            <option value="">Selecione um aluno da lista...</option>
                                            {students.map(s => <option key={s.id} value={s.id}>{s.name} ({s.enrollment_number})</option>)}
                                        </select>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className="font-bold text-slate-700">Identificador Único</Label>
                                <Input
                                    value={formData.studentIdentifier || ""}
                                    onChange={(e) => setFormData({ ...formData, studentIdentifier: e.target.value })}
                                    placeholder="CPF, Matrícula ou Email"
                                    className="h-12 bg-slate-50 border-slate-200 rounded-xl"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label className="font-bold text-slate-700">Disciplina / Módulo</Label>
                                <select
                                    className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-bold transition-all focus:ring-2 focus:ring-primary/20"
                                    value={formData.disciplineId || ""}
                                    onChange={(e) => setFormData({ ...formData, disciplineId: e.target.value })}
                                >
                                    <option value="">Geral / Indefinido</option>
                                    {disciplines.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                </select>
                            </div>

                            <div className="space-y-2 flex items-center justify-between border border-primary/10 bg-primary/5 rounded-2xl p-4">
                                <div>
                                    <Label className="font-black text-primary uppercase text-[10px] tracking-widest">Prova Pública?</Label>
                                    <p className="text-[10px] text-primary/60 max-w-[150px] leading-tight mt-1">Marque se o aluno não for matriculado regular.</p>
                                </div>
                                <Switch
                                    checked={formData.isPublic}
                                    onCheckedChange={(c) => setFormData({ ...formData, isPublic: c })}
                                />
                            </div>

                            <div className="space-y-2 flex items-center justify-between border border-blue-100 bg-blue-50/30 rounded-2xl p-4">
                                <div>
                                    <Label className="font-black text-blue-700 uppercase text-[10px] tracking-widest">Liberar Boletim?</Label>
                                    <p className="text-[10px] text-blue-600/60 max-w-[150px] leading-tight mt-1">Se ativo, o aluno vê o resultado no portal.</p>
                                </div>
                                <Switch
                                    checked={formData.isReleased}
                                    onCheckedChange={(c) => setFormData({ ...formData, isReleased: c })}
                                />
                            </div>

                            <div className="grid grid-cols-2 lg:grid-cols-3 gap-6 lg:col-span-3 pt-4">
                               <div className="space-y-2">
                                   <Label className="text-xs font-bold text-blue-500 uppercase tracking-widest">📝 Prova Online</Label>
                                   <Input type="number" step="0.1" value={formData.examGrade} disabled className="h-11 bg-blue-50 border-blue-100 rounded-lg font-mono font-bold text-blue-700" />
                                   <p className="text-[10px] text-muted-foreground">Sincronizada automaticamente das avaliações.</p>
                               </div>
                               <div className="space-y-2">
                                   <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest">📚 Leitura do Livro (máx 3)</Label>
                                   <Input type="number" step="0.1" min="0" max="3" value={formData.worksGrade} onChange={(e) => setFormData({ ...formData, worksGrade: e.target.value })} className="h-11 bg-white border-slate-200 rounded-lg font-mono font-bold" />
                               </div>
                               <div className="space-y-2">
                                   <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest">❓ Quest. Livro (máx 1)</Label>
                                   <Input type="number" step="0.1" min="0" max="1" value={formData.seminarGrade} onChange={(e) => setFormData({ ...formData, seminarGrade: e.target.value })} className="h-11 bg-white border-slate-200 rounded-lg font-mono font-bold" />
                               </div>
                               <div className="space-y-2">
                                   <Label className="text-xs font-bold text-purple-500 uppercase tracking-widest">🎬 Vídeo Aula (máx 1)</Label>
                                   <Input type="number" step="0.1" min="0" max="1" value={formData.participationBonus} onChange={(e) => setFormData({ ...formData, participationBonus: e.target.value })} className="h-11 bg-white border-slate-200 rounded-lg font-mono font-bold" />
                               </div>
                               <div className="space-y-2">
                                   <Label className="text-xs font-bold text-green-500 uppercase tracking-widest">📊 Frequência (auto)</Label>
                                   <Input type="number" step="0.1" value={formData.attendanceScore} disabled className="h-11 bg-green-50 border-green-100 rounded-lg font-mono font-bold text-green-700" />
                                   <p className="text-[10px] text-muted-foreground">Calculada das chamadas (Presencial + Online).</p>
                               </div>
                               <div className="space-y-2">
                                   <Label className="text-xs font-bold text-slate-400 uppercase tracking-widest">÷ Divisor</Label>
                                   <Input type="number" value={2} disabled className="h-11 bg-slate-100 border-none rounded-lg font-mono font-bold text-slate-400" />
                                   <p className="text-[10px] text-muted-foreground">Fixo: (Atividades + Prova) / 2</p>
                               </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 mt-10 pt-6 border-t border-slate-100">
                            <Button variant="ghost" onClick={() => { setIsCreating(false); setIsEditing(null); }} className="px-8 font-bold uppercase text-xs tracking-widest text-slate-400 hover:text-slate-600">
                                <X className="h-4 w-4 mr-2" /> Descartar
                            </Button>
                            <Button onClick={handleCreateOrUpdate} className="px-12 h-12 bg-primary hover:bg-primary/90 text-white shadow-xl shadow-primary/20 font-black uppercase text-xs tracking-widest transition-all hover:scale-105 active:scale-95">
                                <Save className="h-5 w-5 mr-3" /> Confirmar Lançamento
                            </Button>
                        </div>
                    </div>
                )}

                {/* Listagem de Notas com Virtualização de Lógica (Memo) */}
                <div className="space-y-10 pb-20">
                    {['matriculados', 'publicos'].map((tipo) => {
                        const list = tipo === 'matriculados' ? listMatriculados : listPublicos
                        if (list.length === 0) return null

                        return (
                            <div key={tipo} className="bg-white rounded-[2rem] overflow-hidden shadow-sm border border-slate-100 transition-all">
                                <div className="bg-slate-50/50 px-8 py-6 border-b border-slate-100 flex items-center justify-between">
                                    <h3 className="font-black text-slate-800 flex items-center gap-3">
                                        <div className={`w-2 h-6 rounded-full ${tipo === 'publicos' ? 'bg-amber-400' : 'bg-primary'}`}></div>
                                        {tipo === 'publicos' ? 'Alunos de Prova Pública' : 'Alunos Matriculados'} 
                                        <span className="bg-slate-200 text-slate-600 px-3 py-1 rounded-full text-xs font-bold tabular-nums">{list.length}</span>
                                    </h3>
                                </div>
                                <div className="divide-y divide-slate-100">
                                    {list.map((grade) => (
                                        <GradeCard 
                                            key={grade.id} 
                                            grade={grade} 
                                            disciplines={disciplines}
                                            isMaster={isMaster}
                                            calculateAverage={calculateAverage}
                                            onEdit={(g) => {
                                                setFormData(g)
                                                setIsEditing(g.id)
                                                window.scrollTo({ top: 0, behavior: 'smooth' })
                                            }}
                                            onDelete={(id) => setDeleteConfirm(id)}
                                        />
                                    ))}
                                </div>
                            </div>
                        )
                    })}

                    {grades.length === 0 && !isCreating && (
                        <div className="bg-slate-50/50 border-2 border-dashed border-slate-200 rounded-[3rem] p-24 text-center">
                            <div className="bg-white w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border border-slate-100">
                                <Calculator className="h-8 w-8 text-slate-300" />
                            </div>
                            <h3 className="text-xl font-black text-slate-800 mb-2">Sem registros para exibir</h3>
                            <p className="text-sm text-slate-400 max-w-sm mx-auto">Não encontramos nenhuma nota lançada com os filtros atuais. Selecione outra disciplina ou inicie um novo lançamento.</p>
                            <Button variant="link" className="mt-4 text-primary font-bold" onClick={() => { setSelectedDiscipline(""); setSearchName(""); }}>Limpar Filtros</Button>
                        </div>
                    )}
                </div>

                {/* Diálogos de Confirmação */}
                <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
                    <AlertDialogContent className="rounded-3xl border-none shadow-2xl p-8">
                        <AlertDialogHeader>
                            <AlertDialogTitle className="text-2xl font-black tracking-tight flex items-center gap-3">
                                <Trash2 className="h-7 w-7 text-red-500" />
                                Excluir Registro Permanente?
                            </AlertDialogTitle>
                            <AlertDialogDescription className="text-slate-500 font-medium py-4 text-base">
                                Você está prestes a remover o boletim deste aluno. Esta ação é irreversível e afetará o acesso do aluno no portal.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter className="gap-3">
                            <AlertDialogCancel className="rounded-xl border-slate-200 font-bold h-12 uppercase text-xs tracking-widest">Não, cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deleteConfirm && handleDelete(deleteConfirm)} className="bg-red-500 hover:bg-red-600 rounded-xl h-12 font-black uppercase text-xs tracking-widest shadow-lg shadow-red-500/20 px-8">
                                Sim, excluir agora
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>

                <AlertDialog open={bulkReleaseConfirm} onOpenChange={setBulkReleaseConfirm}>
                    <AlertDialogContent className="rounded-3xl border-none shadow-2xl p-8">
                        <AlertDialogHeader>
                            <AlertDialogTitle className="text-2xl font-black tracking-tight flex items-center gap-3">
                                <CheckCheck className="h-7 w-7 text-green-600" />
                                Liberar Visibilidade de Notas?
                            </AlertDialogTitle>
                            <AlertDialogDescription className="text-slate-500 font-medium py-4 text-base">
                                Esta ação tornará **todas as notas lançadas** (matriculados e públicos) visíveis imediatamente para os alunos em seus respectivos boletins.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter className="gap-3">
                            <AlertDialogCancel className="rounded-xl border-slate-200 font-bold h-12 uppercase text-xs tracking-widest">Voltar</AlertDialogCancel>
                            <AlertDialogAction onClick={handleBulkRelease} className="bg-green-600 hover:bg-green-700 rounded-xl h-12 font-black uppercase text-xs tracking-widest shadow-lg shadow-green-600/20 px-8">
                                Confirmar Liberação
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </ErrorBoundary>
    )
}
