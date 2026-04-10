import { useEffect, useState } from "react"
import { FileText, Award, CalendarCheck, Loader2, Calculator, CheckCircle2 } from "lucide-react"
import {
    type Discipline, type Semester, type StudentSubmission, type Attendance, type Assessment, type StudentGrade, type GradingSettings,
    getDisciplines, getSemesters, getSubmissions, getAttendances, getAssessments, getStudentGrades, getGradingSettings
} from "@/lib/store"

interface Props {
    studentId: string
    studentEmail: string
    studentDoc?: string
}

export function StudentGradesView({ studentId, studentEmail, studentDoc }: Props) {
    const [disciplines, setDisciplines] = useState<Discipline[]>([])
    const [semesters, setSemesters] = useState<Semester[]>([])
    const [officialGrades, setOfficialGrades] = useState<StudentGrade[]>([])
    const [submissions, setSubmissions] = useState<StudentSubmission[]>([])
    const [attendances, setAttendances] = useState<Attendance[]>([])
    const [gradingSettings, setGradingSettings] = useState<GradingSettings | null>(null)
    const [assessments, setAssessments] = useState<Assessment[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function loadData() {
            setLoading(true)
            try {
                const [d, sem, sub, allGrades, setts, asses] = await Promise.all([
                    getDisciplines(),
                    getSemesters(),
                    getSubmissions(),
                    getStudentGrades(),
                    getGradingSettings(),
                    getAssessments()
                ])

                setDisciplines(d)
                setSemesters(sem)
                setGradingSettings(setts)
                setAssessments(asses)

                // Filter and CONSOLIDATE official grades by student identifier and discipline
                const consolidatedGradesMap = new Map<string, StudentGrade>();

                allGrades.forEach(g => {
                    if (!g.isReleased) return;
                    const gId = String(g.studentIdentifier || "").trim().toLowerCase();
                    const sEmail = String(studentEmail || "").trim().toLowerCase();
                    const sId = String(studentId || "").trim().toLowerCase();
                    const sDoc = String(studentDoc || "").replace(/\D/g, "");
                    const gIdClean = gId.replace(/\D/g, "");

                    const isMe = (gId === sEmail || gId === sId || (sDoc && (gId === sDoc || gIdClean === sDoc)));

                    if (isMe) {
                        const discKey = g.disciplineId || 'geral';
                        const existing = consolidatedGradesMap.get(discKey);
                        if (!existing) {
                            consolidatedGradesMap.set(discKey, { ...g });
                        } else {
                            consolidatedGradesMap.set(discKey, {
                                ...existing,
                                examGrade: Math.max(existing.examGrade, g.examGrade),
                                worksGrade: Math.max(existing.worksGrade, g.worksGrade),
                                seminarGrade: Math.max(existing.seminarGrade, g.seminarGrade),
                                participationBonus: Math.max(existing.participationBonus, g.participationBonus),
                                attendanceScore: Math.max(existing.attendanceScore, g.attendanceScore),
                            });
                        }
                    }
                });

                // --- AUTO-INJEÇÃO DE DISCIPLINAS ATIVAS ---
                // Verifica se há submissões ou frequências em disciplinas que ainda não estão no mapa
                const mySubs = sub.filter(s => {
                    const assessment = asses.find(a => a.id === s.assessmentId)
                    return s.studentEmail === studentEmail && assessment?.releaseResults === true
                })
                setSubmissions(mySubs)

                const attPromises = d.map(disc => getAttendances(disc.id))
                const allAttsArray = await Promise.all(attPromises)
                const flatAtts = allAttsArray.flat().filter(a => a.studentId === studentId)
                setAttendances(flatAtts)

                // Encontrar IDs de disciplinas com atividade RELEVANTE (Submissões Liberadas)
                const activeDisciplineIds = new Set<string>();
                mySubs.forEach(s => {
                    const assessment = asses.find(a => a.id === s.assessmentId);
                    if (assessment?.disciplineId) activeDisciplineIds.add(assessment.disciplineId);
                });

                // REMOVIDO: flatAtts.forEach(...) para não forçar exibição baseada apenas em presença
                // Desta forma, se o Admin deletar o registro oficial, e não houver prova liberada,
                // a disciplina deixará de ser injetada automaticamente.

                // Injetar no mapa se não existir
                activeDisciplineIds.forEach(discId => {
                    if (!consolidatedGradesMap.has(discId)) {
                        consolidatedGradesMap.set(discId, {
                            id: `auto-${discId}-${studentId}`,
                            studentIdentifier: studentEmail || studentId,
                            studentName: "", 
                            disciplineId: discId,
                            isPublic: false,
                            examGrade: 0,
                            worksGrade: 0,
                            seminarGrade: 0,
                            participationBonus: 0,
                            attendanceScore: 0,
                            customDivisor: 4,
                            isReleased: true, // Auto-liberado para visualização dinâmica
                            createdAt: new Date().toISOString()
                        });
                    }
                });

                setOfficialGrades(Array.from(consolidatedGradesMap.values()))

            } catch (err) {
                console.error("Erro ao carregar notas:", err)
            } finally {
                setLoading(false)
            }
        }

        loadData()
    }, [studentId, studentEmail])

    if (loading) {
        return <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
    }

    const calculateDynamicGrade = (grade: StudentGrade) => {
        let finalExamGrade = grade.examGrade || 0;
        let finalAttendanceScore = grade.attendanceScore || 0;

        // Dynamic Exam Grade
        if (grade.disciplineId) {
            const disciplineAssessments = assessments.filter(a => a.disciplineId === grade.disciplineId && a.releaseResults === true);
            const assessmentIds = disciplineAssessments.map(a => a.id);
            const studentDisciplineSubs = submissions.filter(s => assessmentIds.includes(s.assessmentId));
            if (studentDisciplineSubs.length > 0) {
                // Get highest score (weighted to 10 points or actual points)
                // We use s.score instead of s.percentage to avoid the 40.0 vs 4.0 confusion
                finalExamGrade = Math.max(...studentDisciplineSubs.map(s => Number(s.score || 0)));
            }

            // Dynamic Attendance
            const disciplineAtts = attendances.filter(a => a.disciplineId === grade.disciplineId && a.isPresent);
            if (gradingSettings && disciplineAtts.length > 0) {
                let score = 0;
                disciplineAtts.forEach(att => {
                    score += att.type === 'ead' ? gradingSettings.onlinePresencePoints : gradingSettings.pointsPerPresence;
                });
                finalAttendanceScore = score;
            }
        }

        const total =
            finalExamGrade +
            (grade.worksGrade || 0) +
            (grade.seminarGrade || 0) +
            (grade.participationBonus || 0) +
            finalAttendanceScore;

        const divisor = gradingSettings?.totalDivisor && gradingSettings.totalDivisor > 0 ? gradingSettings.totalDivisor : (grade.customDivisor > 0 ? grade.customDivisor : 1);
        
        return {
            examGrade: finalExamGrade,
            attendanceScore: finalAttendanceScore,
            total,
            avg: (total / divisor).toFixed(2),
            divisor
        }
    }

    return (
        <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

            {/* Resumo de Destaque */}
            <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6 flex flex-col md:flex-row items-center gap-6 shadow-sm">
                <div className="h-16 w-16 bg-primary text-primary-foreground rounded-2xl flex items-center justify-center shadow-lg">
                    <Award className="h-8 w-8" />
                </div>
                <div className="flex-1 text-center md:text-left">
                    <h3 className="text-xl font-bold text-foreground">Meu Desempenho Oficial</h3>
                    <p className="text-sm text-muted-foreground">Aqui você encontra as notas finais lançadas e validadas pela secretaria e professores.</p>
                </div>
                <div className="flex gap-4">
                    <div className="text-center">
                        <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest mb-1">Disciplinas</div>
                        <div className="text-2xl font-black text-primary">{officialGrades.length}</div>
                    </div>
                </div>
            </div>

            <div className="flex flex-col gap-6">
                <h3 className="text-xl font-bold font-serif text-foreground border-b border-border pb-2 flex items-center gap-2">
                    <Calculator className="h-5 w-5 text-primary" />
                    Boletim de Notas
                </h3>

                {officialGrades.length === 0 ? (
                    <div className="bg-card border border-border border-dashed rounded-xl p-10 text-center text-muted-foreground">
                        <FileText className="h-10 w-10 mx-auto opacity-20 mb-3" />
                        <p className="text-sm">Nenhuma nota oficial lançada ou liberada até o momento.</p>
                        <p className="text-[10px] mt-2 italic opacity-60">Se você realizou uma avaliação recentemente, aguarde a correção e liberação do professor.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4">
                        {officialGrades.map(grade => {
                            const disc = disciplines.find(d => d.id === grade.disciplineId)
                            const dyn = calculateDynamicGrade(grade)
                            const avg = parseFloat(dyn.avg)
                            const minAverage = gradingSettings?.passingAverage || 70
                            const isPassing = avg >= minAverage

                            return (
                                <div key={grade.id} className="bg-card border border-border rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                                    <div className="flex flex-col md:flex-row justify-between gap-4 mb-4">
                                        <div className="space-y-1">
                                            <h4 className="font-bold text-lg text-foreground">{disc?.name || "Disciplina Geral"}</h4>
                                            <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Semestre: {semesters.find(s => s.id === disc?.semesterId)?.name || "N/A"}</p>
                                        </div>

                                        <div className="flex items-center gap-4 bg-muted/50 p-3 rounded-xl border border-border">
                                            <div className="text-right">
                                                <div className="text-[10px] uppercase font-bold text-muted-foreground">Média Final ({dyn.total} / {dyn.divisor})</div>
                                                <div className={`text-2xl font-black ${isPassing ? 'text-green-600' : 'text-amber-600'}`}>
                                                    {avg.toFixed(2)}
                                                </div>
                                            </div>
                                            <div className={`h-10 w-10 border rounded-full flex items-center justify-center ${isPassing ? 'bg-green-100 text-green-600 border-green-200' : 'bg-red-100 text-red-600 border-red-200'}`}>
                                                {isPassing ? <CheckCircle2 className="h-6 w-6" /> : <Award className="h-6 w-6" />}
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className={`mb-6 text-sm font-bold p-3 rounded-lg flex items-center gap-2 ${isPassing ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                        <CheckCircle2 className="h-5 w-5" />
                                        {isPassing ? 'Aprovado' : 'Reprovado'}
                                    </div>

                                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-6">
                                        {[
                                            { label: "Prova Online", val: dyn.examGrade },
                                            { label: "Ativ. Livro", val: grade.worksGrade || 0 },
                                            { label: "Trabalhos Extras", val: grade.seminarGrade || 0 },
                                            { label: "Interação", val: grade.participationBonus || 0 },
                                            { label: "Presença", val: dyn.attendanceScore },
                                        ].map(item => (
                                            <div key={item.label} className="bg-background border border-border rounded-lg p-3 text-center">
                                                <div className="text-[10px] text-muted-foreground font-bold uppercase mb-1">{item.label}</div>
                                                <div className="font-bold text-foreground">{item.val.toFixed(1)}</div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="mt-4 text-[10px] text-muted-foreground text-right italic">
                                        Cálculo: (Soma das notas) / {dyn.divisor} ({gradingSettings?.passingAverage}% para fechar)
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>

            {/* Histórico de Tentativas (Submissões de Prova) */}
            {submissions.length > 0 && (
                <div className="mt-4">
                    <h4 className="text-lg font-bold text-foreground mb-4 opacity-70">Histórico de Respostas (Simulados/Provas Online)</h4>
                    <div className="space-y-3">
                        {submissions.map(sub => (
                            <div key={sub.id} className="bg-muted/30 border border-border rounded-lg p-4 flex items-center justify-between text-sm">
                                <div>
                                    <p className="font-semibold text-foreground">Resultado de Prova Online</p>
                                    <p className="text-xs text-muted-foreground">Enviado em {new Date(sub.submittedAt).toLocaleDateString()}</p>
                                </div>
                                <div className="text-right">
                                    <div className="font-bold">{sub.score} / {sub.totalPoints} pts</div>
                                    <div className="text-xs text-primary">{sub.percentage}% de acerto</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}
