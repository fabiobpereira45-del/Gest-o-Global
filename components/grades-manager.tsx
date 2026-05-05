import { useState, useEffect, useMemo, memo, useRef } from "react"
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
    StudentProfile, getStudents, Discipline, getDisciplines, releaseAllGrades, syncGradesForDiscipline,
    Attendance, GradingSettings, getGradingSettings, calculateAttendanceScore, calculateFinalGrade
} from "@/lib/store"
import { getAttendances } from "@/lib/store"
import { printGradesReportPDF } from "@/lib/pdf"
import { ErrorBoundary } from "@/components/error-boundary"
import { Switch } from "@/components/ui/switch"

// --- StudentCard: 1 card por aluno, com todas as disciplinas agrupadas ---
const StudentCard = memo(({
    studentName,
    grades,
    disciplines,
    isMaster,
    onEdit,
    onDelete,
    calculateAverage,
    computeFrequency
}: {
    studentName: string,
    grades: StudentGrade[],
    disciplines: Discipline[],
    isMaster: boolean,
    onEdit: (g: StudentGrade) => void,
    onDelete: (id: string) => void,
    calculateAverage: (g: StudentGrade) => string,
    computeFrequency: (g: StudentGrade) => { presencial: number; online: number; total: number }
}) => {
    const [isExpanded, setIsExpanded] = useState(false)
    const [selectedDisc, setSelectedDisc] = useState<string | null>(null)

    // Média de todas as disciplinas para o card principal
    const averages = grades.map(g => parseFloat(calculateAverage(g)) || 0)
    const globalAvg = (averages.reduce((a, b) => a + b, 0) / (averages.length || 1)).toFixed(1)
    const isAnyApproved = parseFloat(globalAvg) >= 7
    const initial = studentName.charAt(0).toUpperCase()

    // Disciplina ativa para detalhes (abaixo)
    const activeGrade = selectedDisc
        ? (grades.find(g => g.id === selectedDisc) || grades[0])
        : grades[0]

    return (
        <div className={`overflow-hidden transition-all duration-300 border-l-4 rounded-b-xl mb-3
            ${isExpanded ? 'bg-slate-50 border-primary shadow-md' : 'hover:bg-slate-50/50 border-transparent bg-white shadow-sm'}`}>

            {/* Cabeçalho do Card — Nome e Média */}
            <div
                className="p-6 flex items-center justify-between cursor-pointer select-none"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center gap-4">
                    <div className={`h-12 w-12 rounded-2xl flex items-center justify-center font-black text-lg shadow-sm border
                        ${isAnyApproved ? 'bg-green-100 text-green-700 border-green-200' : 'bg-amber-100 text-amber-700 border-amber-200'}`}>
                        {initial}
                    </div>
                    <div>
                        <h4 className="font-black text-slate-800 text-lg tracking-tight uppercase">{studentName}</h4>
                        <div className="flex items-center gap-2 mt-0.5">
                           <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-100 px-2 py-0.5 rounded-full">
                                {grades.length} {grades.length === 1 ? 'Disciplina' : 'Disciplinas'}
                           </span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    <div className={`p-2.5 rounded-xl transition-all duration-300
                        ${isExpanded ? 'rotate-180 bg-primary text-white shadow-lg' : 'bg-slate-100 text-slate-400'}`}>
                        <Plus className={`h-5 w-5 transition-transform ${isExpanded ? 'rotate-45 text-white' : ''}`} />
                    </div>
                </div>
            </div>

            {/* Conteúdo expandido — seletor de disciplina + detalhes */}
            {isExpanded && (
                <div className="px-5 pb-6 pt-1 animate-in slide-in-from-top-2 duration-300">
                    {/* Tabs de disciplina */}
                    {grades.length > 1 && (
                        <div className="flex flex-wrap gap-2 mb-4">
                            {grades.map(g => {
                                const disc = disciplines.find(d => d.id === g.disciplineId)
                                const isActive = (selectedDisc || grades[0].id) === g.id
                                return (
                                    <button
                                        key={g.id}
                                        onClick={e => { e.stopPropagation(); setSelectedDisc(g.id) }}
                                        className={`px-4 py-1.5 rounded-full text-xs font-black border transition-all
                                            ${isActive
                                                ? 'bg-primary text-white border-primary shadow-sm'
                                                : 'bg-white text-slate-500 border-slate-200 hover:border-primary/40 hover:text-primary'}`}
                                    >
                                        {disc?.name || 'Geral'}
                                    </button>
                                )
                            })}
                        </div>
                    )}

                    {/* Detalhes da disciplina selecionada */}
                    {(() => {
                        const g = activeGrade
                        const disc = disciplines.find(d => d.id === g.disciplineId)
                        const freq = computeFrequency(g)
                        const average = calculateAverage(g)
                        const isApproved = parseFloat(average) >= 7
                        return (
                            <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="font-bold text-sm text-primary">{disc?.name || 'Disciplina Geral'}</div>
                                    <div className="flex items-center gap-2">
                                        <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full border
                                            ${isApproved ? 'bg-green-50 text-green-700 border-green-100' : 'bg-red-50 text-red-700 border-red-100'}`}>
                                            {isApproved ? 'Aprovado' : 'Reprovado'}
                                        </span>
                                        <span className={`text-lg font-black tabular-nums ${isApproved ? 'text-green-600' : 'text-amber-600'}`}>
                                            {average}
                                        </span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 lg:gap-3 mb-5">
                                    {[
                                        { label: 'Prova Online', val: g.examGrade, color: 'text-blue-600' },
                                        { label: 'Leitura', val: g.worksGrade, color: 'text-slate-600' },
                                        { label: 'Questionário', val: g.seminarGrade, color: 'text-slate-600' },
                                        { label: 'Vídeo Aula', val: g.participationBonus, color: 'text-purple-600' },
                                    ].map(tag => (
                                        <div key={tag.label} className="bg-slate-50 rounded-lg p-2 flex flex-col gap-0.5">
                                            <span className="text-[8px] lg:text-[9px] font-black uppercase text-slate-400 tracking-tighter">{tag.label}</span>
                                            <span className={`text-xs lg:text-sm font-black tabular-nums ${tag.color}`}>{tag.val}</span>
                                        </div>
                                    ))}
                                    <div className="bg-green-50 rounded-lg p-2 flex flex-col gap-0.5 col-span-2 md:col-span-1">
                                        <span className="text-[8px] lg:text-[9px] font-black uppercase text-green-400 tracking-tighter">Frequência</span>
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs lg:text-sm font-black tabular-nums text-green-600">{freq.total.toFixed(1)}</span>
                                            <span className="text-[8px] lg:text-[9px] text-green-400">📍{freq.presencial.toFixed(0)} 💻{freq.online.toFixed(0)}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-50">
                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black border uppercase
                                        ${g.isReleased ? 'bg-green-500 text-white border-green-600 shadow-sm shadow-green-500/20' : 'bg-amber-100 text-amber-700 border-amber-200'}`}>
                                        {g.isReleased ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                                        {g.isReleased ? 'Liberada para o Aluno' : 'Oculta no Boletim'}
                                    </span>
                                    <div className="flex gap-2">
                                        <Button variant="outline" size="sm"
                                            className="h-9 px-4 font-bold border-slate-200 hover:bg-primary/5 hover:text-primary transition-all rounded-xl"
                                            onClick={e => { e.stopPropagation(); onEdit(g) }}>
                                            <Pencil className="h-3.5 w-3.5 mr-1.5" /> Editar
                                        </Button>
                                        {isMaster && (
                                            <Button variant="ghost" size="sm"
                                                className="h-9 px-4 font-bold text-red-400 hover:text-red-600 hover:bg-red-50 transition-all rounded-xl"
                                                onClick={e => { e.stopPropagation(); onDelete(g.id) }}>
                                                <Trash2 className="h-3.5 w-3.5 mr-1.5" /> Remover
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )
                    })()}
                </div>
            )}
        </div>
    )
})

StudentCard.displayName = "StudentCard"

export function GradesManager({ isMaster }: { isMaster: boolean }) {
    const [grades, setGrades] = useState<StudentGrade[]>([])
    const [students, setStudents] = useState<StudentProfile[]>([])
    const [disciplines, setDisciplines] = useState<Discipline[]>([])
    const [attendances, setAttendances] = useState<Attendance[]>([])
    const [gradingSettings, setGradingSettings] = useState<GradingSettings | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [isEditing, setIsEditing] = useState<string | null>(null)
    const [isCreating, setIsCreating] = useState(false)
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
    const [bulkReleaseConfirm, setBulkReleaseConfirm] = useState(false)
    const [selectedDiscipline, setSelectedDiscipline] = useState<string>("")
    const [searchName, setSearchName] = useState("")
    const [isSyncing, setIsSyncing] = useState(false)
    // Ref para preservar scroll ao editar/salvar
    const savedScrollY = useRef(0)

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
            const discId = selectedDiscipline || undefined
            const [fetchedGrades, fetchedStudents, fetchedDisciplines, fetchedSettings] = await Promise.all([
                getStudentGrades(discId),
                getStudents(),
                getDisciplines(),
                getGradingSettings()
            ])
            setGrades(fetchedGrades)
            setStudents(fetchedStudents)
            setDisciplines(fetchedDisciplines)
            setGradingSettings(fetchedSettings)

            // Carregar presenças da disciplina selecionada (ou todas se nenhuma filtrada)
            if (selectedDiscipline) {
                const atts = await getAttendances(selectedDiscipline)
                setAttendances(atts)
            } else {
                // Sem disciplina filtrada: busca todas as disciplinas e combina
                const allAtts = await Promise.all(
                    fetchedDisciplines.map(d => getAttendances(d.id).catch(() => [] as Attendance[]))
                )
                setAttendances(allAtts.flat())
            }
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

            if (!formData.disciplineId) {
                throw new Error("Selecione uma disciplina. O lançamento geral não é permitido no momento.")
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
                customDivisor: parseFloat(formData.customDivisor) || 2,
                isReleased: formData.isReleased
            }

            await saveStudentGrade(
                gradeToSave as Omit<StudentGrade, 'id' | 'createdAt'>,
                isEditing || undefined
            )

            // Atualiza localmente sem recarregar (mantém ordem e posição do scroll)
            setGrades(prev => {
                const updatedGrade: StudentGrade = {
                    ...gradeToSave,
                    id: isEditing || `temp-${Date.now()}`,
                    createdAt: new Date().toISOString()
                }
                if (isEditing) {
                    // Substituir o registro existente no mesmo índice
                    return prev.map(g => g.id === isEditing ? updatedGrade : g)
                } else {
                    // Inserir novo e manter ordem alfabética
                    return [...prev, updatedGrade].sort((a, b) =>
                        a.studentName.localeCompare(b.studentName, 'pt-BR')
                    )
                }
            })

            setIsCreating(false)
            setIsEditing(null)

            // Restaurar scroll para onde o aluno estava antes da edição
            requestAnimationFrame(() => {
                window.scrollTo({ top: savedScrollY.current, behavior: 'smooth' })
            })
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
            // A função sync agora salva os resultados no banco de dados automaticamente
            await syncGradesForDiscipline(selectedDiscipline)
            
            alert("Sincronização concluída com sucesso! Os diários foram atualizados com as presenças e notas de avaliações.")
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

    // Calcula a frequência dinâmica (presencial + online) com base nos registros reais de presença
    const computeFrequency = (grade: StudentGrade): { presencial: number; online: number; total: number } => {
        if (!gradingSettings) return { presencial: 0, online: 0, total: 0 }
        
        // Encontra o aluno pelo identifier para obter o ID
        const student = students.find(s => {
            const id = String(grade.studentIdentifier || "").trim().toLowerCase()
            return (
                (s.email || "").toLowerCase() === id ||
                (s.cpf || "").replace(/\D/g, "") === id.replace(/\D/g, "") ||
                (s.enrollment_number || "").toLowerCase() === id
            )
        })
        if (!student || !grade.disciplineId) {
            // Sem aluno identificado: usa o attendanceScore armazenado como fallback
            const stored = parseFloat(grade.attendanceScore as any) || 0
            return { presencial: stored, online: 0, total: stored }
        }

        const discAtts = attendances.filter(a => a.disciplineId === grade.disciplineId && a.isPresent)
        const myPresencialDates = new Set(
            discAtts.filter(a => a.studentId === student.id && (a.type || 'presencial') === 'presencial').map(a => a.date)
        )
        const myOnlineDates = new Set(
            discAtts.filter(a => a.studentId === student.id && a.type === 'ead').map(a => a.date)
        )

        const total = calculateAttendanceScore(myPresencialDates.size, myOnlineDates.size, gradingSettings)
        
        return { 
            presencial: myPresencialDates.size * (gradingSettings.pointsPerPresence || 3), 
            online: myOnlineDates.size * (gradingSettings.onlinePresencePoints || 2), 
            total 
        }
    }

    const calculateAverage = (grade: StudentGrade) => {
        const freq = computeFrequency(grade)
        return calculateFinalGrade(grade, freq.total).toFixed(2)
    }

    // --- Listas Memoizadas para Performance e Agrupamento ---
    const groupedGrades = useMemo(() => {
        const raw = grades
            .filter(g => {
                const matchName = !searchName || 
                                 g.studentName.toLowerCase().includes(searchName.toLowerCase()) || 
                                 g.studentIdentifier.toLowerCase().includes(searchName.toLowerCase())
                const matchStatus = statusFilter === "all" || (statusFilter === "released" ? g.isReleased : !g.isReleased)
                return matchName && matchStatus
            })

        // AGRUPAMENTO: Um card por estudante, consolidando múltiplos registros/identificadores
        const groupsMap = new Map<string, { studentName: string; studentIdentifier: string; isPublic: boolean; grades: StudentGrade[] }>();
        
        // Helper para normalizar nome (remove acentos e espaços extras)
        const normalize = (str: string) => 
            str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

        // Helper para similaridade (Levenshtein simples)
        const getSimilarity = (s1: string, s2: string) => {
            const longer = s1.length > s2.length ? s1 : s2;
            const shorter = s1.length > s2.length ? s2 : s1;
            if (longer.length === 0) return 1.0;
            
            const editDistance = (a: string, b: string) => {
                const costs = [];
                for (let i = 0; i <= a.length; i++) {
                    let lastValue = i;
                    for (let j = 0; j <= b.length; j++) {
                        if (i === 0) costs[j] = j;
                        else {
                            if (j > 0) {
                                let newValue = costs[j - 1];
                                if (a.charAt(i - 1) !== b.charAt(j - 1))
                                    newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
                                costs[j - 1] = lastValue;
                                lastValue = newValue;
                            }
                        }
                    }
                    if (i > 0) costs[b.length] = lastValue;
                }
                return costs[b.length];
            };
            return (longer.length - editDistance(longer, shorter)) / longer.length;
        };

        // 1. Tenta identificar o aluno pelo perfil oficial (CPF, Matrícula, Email) ou Correspondência de Nome Parcial
        raw.forEach(g => {
            const rawId = String(g.studentIdentifier || "").trim().toLowerCase();
            const rawName = normalize(g.studentName);
            const nameWords = rawName.split(/\s+/).filter(w => w.length > 2); // Palavras com mais de 2 letras

            let student = students.find(s => {
                const sName = normalize(s.name);
                const sWords = sName.split(/\s+/);
                
                // Match por ID oficial (forte)
                const matchId = (s.email || "").toLowerCase() === rawId ||
                               (s.cpf || "").replace(/\D/g, "") === rawId.replace(/\D/g, "") ||
                               (s.enrollment_number || "").toLowerCase() === rawId;
                
                if (matchId) return true;

                // Match por correspondência de palavras (Fuzzy)
                // Se TODAS as palavras do nome da nota (mínimo 2) estão no perfil OU similaridade > 85%
                if (nameWords.length >= 2) {
                    const allWordsMatch = nameWords.every(w => sWords.some(sw => sw === w || sw.includes(w)));
                    if (allWordsMatch) return true;
                }
                
                if (getSimilarity(sName, rawName) > 0.85) return true;

                // Caso contrário, match exato de nome normalizado
                return sName === rawName;
            });

            // Se não encontrou aluno mas a nota parece pertencer a alguém já identificado em outro grupo pelo nome
            // (Processa depois do find do perfil primário)
            const key = student ? `profile-${student.id}` : `name-${rawName}`;
            
            // Tentativa extra de merge por sub-string contra chaves já existentes
            let finalKey = key;
            if (!student) {
                // Se é apenas um nome, tenta ver se já existe um card que "contém" este nome ou vice-versa
                for (const existingKey of groupsMap.keys()) {
                    if (existingKey.startsWith('name-')) {
                        const existingName = existingKey.replace('name-', '');
                        if (existingName.includes(rawName) || rawName.includes(existingName)) {
                            finalKey = existingKey;
                            break;
                        }
                    } else if (existingKey.startsWith('profile-')) {
                        const profileName = normalize(groupsMap.get(existingKey)!.studentName);
                        if (profileName.includes(rawName) || rawName.includes(profileName)) {
                            finalKey = existingKey;
                            break;
                        }
                    }
                }
            }

            const existing = groupsMap.get(finalKey);
            if (!existing) {
                groupsMap.set(finalKey, {
                    studentName: student ? student.name : g.studentName,
                    studentIdentifier: g.studentIdentifier,
                    isPublic: g.isPublic,
                    grades: [g]
                });
            } else {
                // Mescla a nota se for de disciplina diferente ou se for uma atualização
                const discId = g.disciplineId || 'geral';
                const alreadyHasDisc = existing.grades.find(eg => (eg.disciplineId || 'geral') === discId);
                
                if (!alreadyHasDisc) {
                    existing.grades.push(g);
                } else {
                    // Mantém a versão com mais dados (ex: com nota 4.8 em vez de 0.0)
                    const existingScore = parseFloat(calculateAverage(alreadyHasDisc));
                    const newScore = parseFloat(calculateAverage(g));
                    if (newScore > existingScore) {
                        existing.grades = existing.grades.map(eg => (eg.disciplineId || 'geral') === discId ? g : eg);
                    }
                }
            }
        });

        // Filtragem por disciplina base (feita após o agrupamento para mostrar o card do aluno se ele tiver nota na disciplina)
        let result = Array.from(groupsMap.values());
        if (selectedDiscipline) {
            result = result.filter(group => 
                group.grades.some(g => g.disciplineId === selectedDiscipline)
            );
        }

        // Retorna os grupos ordenados por nome
        return result.sort((a, b) => a.studentName.localeCompare(b.studentName, 'pt-BR'));
    }, [grades, selectedDiscipline, searchName, statusFilter, students])

    const listMatriculados = useMemo(() => groupedGrades.filter(g => !g.isPublic), [groupedGrades])
    const listPublicos = useMemo(() => groupedGrades.filter(g => g.isPublic), [groupedGrades])

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
                <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
                    <div>
                        <h2 className="text-2xl lg:text-3xl flex items-center gap-3 font-black tracking-tighter text-foreground">
                            <GraduationCap className="h-7 w-7 lg:h-8 lg:w-8 text-primary p-1.5 bg-primary/10 rounded-xl" />
                            Gestão de Notas
                        </h2>
                        <p className="text-muted-foreground mt-1 text-xs lg:text-sm font-medium">Controle acadêmico e boletins individuais.</p>
                    </div>
                    <div className="flex flex-wrap gap-2 w-full xl:w-auto">
                        {isMaster && (
                            <Button variant="outline" size="sm" onClick={() => printGradesReportPDF(grades, "Relatório Geral de Notas", "Cosme de Farias")} className="flex-1 lg:flex-none border-slate-200 text-slate-600 hover:bg-slate-50 font-bold h-10">
                                <Download className="h-4 w-4 mr-1.5" /> <span className="hidden sm:inline">Exportar PDF</span> <span className="sm:hidden">PDF</span>
                            </Button>
                        )}
                        <div className="relative group flex-1 lg:flex-none">
                            <Button 
                                variant="secondary" 
                                size="sm"
                                onClick={handleSync} 
                                disabled={isSyncing || !selectedDiscipline}
                                className="w-full bg-amber-500 text-white hover:bg-amber-600 shadow-lg shadow-amber-500/20 font-black h-10 px-4 uppercase text-[10px] tracking-widest transition-all"
                            >
                                {isSyncing ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-1.5" />}
                                Sincronizar
                            </Button>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => setBulkReleaseConfirm(true)} className="flex-1 lg:flex-none border-green-600 text-green-600 hover:bg-green-500 hover:text-white font-black h-10 px-4 uppercase text-[10px] tracking-widest">
                            <CheckCheck className="h-4 w-4 mr-1.5" /> <span className="hidden sm:inline">Liberar Tudo</span> <span className="sm:hidden">Liberar</span>
                        </Button>
                        <Button onClick={() => {
                            setFormData({
                                studentIdentifier: "", studentName: "", disciplineId: selectedDiscipline || "", isPublic: false,
                                examGrade: "", worksGrade: "", seminarGrade: "", participationBonus: "", attendanceScore: "", customDivisor: "2", isReleased: true
                            })
                            setIsCreating(true)
                            setIsEditing(null)
                            window.scrollTo({ top: 0, behavior: 'smooth' })
                        }} className="w-full xl:w-auto bg-primary text-white hover:bg-primary/90 shadow-xl shadow-primary/20 font-black h-10 px-6 uppercase text-[10px] tracking-widest transition-all group">
                            <Plus className="h-5 w-5 mr-1 group-hover:rotate-90 transition-transform" />
                            Lançar Notas
                        </Button>
                    </div>
                </div>

                {/* Filtro e Pesquisa Otimizados */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4 items-end bg-white p-4 lg:p-5 rounded-3xl border border-slate-100 shadow-sm relative z-20">
                    <div className="lg:col-span-3 flex flex-col gap-1.5">
                        <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1 tracking-widest">Disciplina Base</Label>
                        <select
                            className="flex h-10 w-full items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer"
                            value={selectedDiscipline}
                            onChange={(e) => setSelectedDiscipline(e.target.value)}
                        >
                            <option value="">Todas as Disciplinas</option>
                            {disciplines.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                        </select>
                    </div>

                    <div className="lg:col-span-2 flex flex-col gap-1.5">
                        <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1 tracking-widest">Situação</Label>
                        <select
                            className="flex h-10 w-full items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value as any)}
                        >
                            <option value="all">Todas</option>
                            <option value="released">Liberadas</option>
                            <option value="hidden">Ocultas</option>
                        </select>
                    </div>

                    <div className="lg:col-span-4 flex flex-col gap-1.5">
                        <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1 tracking-widest">Localizar Aluno</Label>
                        <div className="relative group">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                            <Input 
                                placeholder="Busca..." 
                                value={searchName}
                                onChange={(e) => setSearchName(e.target.value)}
                                className="pl-9 h-10 bg-slate-50 border-slate-200 rounded-xl focus:ring-primary/20 transition-all text-xs"
                            />
                        </div>
                    </div>
                    
                    <div className="lg:col-span-3">
                        {selectedDiscipline && (
                            <div className="flex gap-2">
                                <Button variant="ghost" size="sm" onClick={() => handlePublishFiltered(true)} className="flex-1 text-[10px] text-green-600 font-bold hover:bg-green-50 rounded-lg h-10 border border-slate-100">
                                    Liberar
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => handlePublishFiltered(false)} className="flex-1 text-[10px] text-amber-600 font-bold hover:bg-amber-50 rounded-lg h-10 border border-slate-100">
                                    Ocultar
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
                                   <Input 
                                       type="number" 
                                       step="0.1" 
                                       value={formData.examGrade} 
                                       onChange={(e) => setFormData({ ...formData, examGrade: e.target.value })}
                                       className="h-11 bg-blue-50 border-blue-100 rounded-lg font-mono font-bold text-blue-700" 
                                   />
                                   <p className="text-[10px] text-muted-foreground italic">Sincronizada automaticamente, mas permite ajuste manual.</p>
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
                                   <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest">÷ Divisor</Label>
                                   <Input 
                                       type="number" 
                                       step="0.1"
                                       value={formData.customDivisor} 
                                       onChange={(e) => setFormData({ ...formData, customDivisor: e.target.value })}
                                       className="h-11 bg-white border-slate-200 rounded-lg font-mono font-bold" 
                                   />
                                   <p className="text-[10px] text-muted-foreground">Fórmula: (Atividades + Prova) / Divisor</p>
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
                                    {list.map((group) => (
                                        <StudentCard 
                                            key={group.studentIdentifier} 
                                            studentName={group.studentName}
                                            grades={group.grades}
                                            disciplines={disciplines}
                                            isMaster={isMaster}
                                            calculateAverage={calculateAverage}
                                            computeFrequency={computeFrequency}
                                            onEdit={(g) => {
                                                savedScrollY.current = window.scrollY
                                                setFormData({
                                                    ...g,
                                                    examGrade: String(g.examGrade || ""),
                                                    worksGrade: String(g.worksGrade || ""),
                                                    seminarGrade: String(g.seminarGrade || ""),
                                                    participationBonus: String(g.participationBonus || ""),
                                                    attendanceScore: String(g.attendanceScore || ""),
                                                    customDivisor: String(g.customDivisor || "2")
                                                })
                                                setIsEditing(g.id)
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
