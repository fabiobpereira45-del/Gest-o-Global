import { useEffect, useState } from "react"
import { FileText, Award, CalendarCheck, Loader2, Calculator, CheckCircle2, Clock, Lock } from "lucide-react"
import {
    type Discipline, type Semester, type StudentSubmission, type Attendance, type Assessment, type StudentGrade, type GradingSettings,
    getDisciplines, getSemesters, getSubmissions, getAttendances, getAttendancesByStudent, getAssessments, getStudentGrades, getGradingSettings
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
                const mySubs = sub.filter(s => {
                    const assessment = asses.find(a => a.id === s.assessmentId)
                    return s.studentEmail === studentEmail && assessment?.releaseResults === true
                })
                setSubmissions(mySubs)

                const flatAtts = await getAttendancesByStudent(studentId)
                setAttendances(flatAtts)

                // Encontrar IDs de disciplinas com atividade RELEVANTE (Submissões Liberadas)
                const activeDisciplineIds = new Set<string>();
                mySubs.forEach(s => {
                    const assessment = asses.find(a => a.id === s.assessmentId);
                    if (assessment?.disciplineId) activeDisciplineIds.add(assessment.disciplineId);
                });

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
                            customDivisor: 2,
                            isReleased: true,
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
        let presencialScore = 0;
        let onlineScore = 0;

        const maxPresencial = gradingSettings?.pointsPerPresence || 3
        const maxOnline = gradingSettings?.onlinePresencePoints || 2

        // Dynamic Exam Grade
        if (grade.disciplineId) {
            const disciplineAssessments = assessments.filter(a => a.disciplineId === grade.disciplineId && a.releaseResults === true);
            const assessmentIds = disciplineAssessments.map(a => a.id);
            const studentDisciplineSubs = submissions.filter(s => assessmentIds.includes(s.assessmentId));
            if (studentDisciplineSubs.length > 0) {
                // Normaliza para escala 0-10 usando percentage (mais confiável)
                // percentage está em 0-100, então ÷ 10 = escala 0-10
                finalExamGrade = Math.max(...studentDisciplineSubs.map(s => {
                    const pct = Number(s.percentage || 0);
                    const rawScore = Number(s.score || 0);
                    const totalPts = Number(s.totalPoints || 0);
                    if (pct > 0) return Math.round((pct / 10) * 100) / 100;
                    if (totalPts > 0 && rawScore > 10) return Math.round((rawScore / totalPts) * 10 * 100) / 100;
                    return rawScore;
                }));
            }

            // Dynamic Attendance by type
            const disciplineAtts = attendances.filter(a => a.disciplineId === grade.disciplineId && a.isPresent);
            const presencialAtts = disciplineAtts.filter(a => (a.type || 'presencial') === 'presencial');
            const onlineAtts = disciplineAtts.filter(a => a.type === 'ead');
            
            // Unique attended dates per type
            const uniquePresencialPresent = new Set(presencialAtts.map(a => a.date)).size;
            const uniqueOnlinePresent = new Set(onlineAtts.map(a => a.date)).size;

            // MODELO FIXO: cada presença vale os pontos cheios configurados,
            // com cap no máximo. Ex: 1 presença presencial = 3pt (não proporcional).
            if (uniquePresencialPresent > 0) {
                presencialScore = Math.min(uniquePresencialPresent * maxPresencial, maxPresencial);
            }
            if (uniqueOnlinePresent > 0) {
                onlineScore = Math.min(uniqueOnlinePresent * maxOnline, maxOnline);
            }
        }

        const frequenciaTotal = Math.round((presencialScore + onlineScore) * 100) / 100;
        const videoAula = grade.participationBonus || 0;
        const leituraLivro = grade.worksGrade || 0;
        const questionarioLivro = grade.seminarGrade || 0;

        const notaAtividades = Math.round((presencialScore + onlineScore + videoAula + leituraLivro + questionarioLivro) * 100) / 100;
        const media = (notaAtividades + finalExamGrade) / 2;

        return {
            presencialScore: Math.round(presencialScore * 100) / 100,
            onlineScore: Math.round(onlineScore * 100) / 100,
            videoAula,
            leituraLivro,
            questionarioLivro,
            notaAtividades: Math.min(notaAtividades, 10),
            examGrade: finalExamGrade,
            media: Math.round(media * 100) / 100,
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
                            // Normaliza passingAverage: pode estar em escala 0-100 (ex: 70)
                            // enquanto dyn.media está em escala 0-10. Divide por 10 se > 10.
                            const rawPassing = gradingSettings?.passingAverage || 7
                            const passingGrade = rawPassing > 10 ? rawPassing / 10 : rawPassing
                            const isPassing = dyn.media >= passingGrade

                            // Check if exam was released by professor
                            const examReleased = grade.isReleased && (grade.examGrade > 0 || dyn.examGrade > 0)

                            return (
                                <div key={grade.id} className="bg-card border border-border rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                                    <div className="flex flex-col md:flex-row justify-between gap-4 mb-4">
                                        <div className="space-y-1">
                                            <h4 className="font-bold text-lg text-foreground">{disc?.name || "Disciplina Geral"}</h4>
                                            <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Semestre: {semesters.find(s => s.id === disc?.semesterId)?.name || "N/A"}</p>
                                        </div>

                                        <div className="flex items-center gap-4 bg-muted/50 p-3 rounded-xl border border-border">
                                            <div className="text-right">
                                                <div className="text-[10px] uppercase font-bold text-muted-foreground">Média Final</div>
                                                <div className={`text-2xl font-black ${isPassing ? 'text-green-600' : 'text-amber-600'}`}>
                                                    {dyn.media.toFixed(2)}
                                                </div>
                                            </div>
                                            <div className={`h-10 w-10 border rounded-full flex items-center justify-center ${isPassing ? 'bg-green-100 text-green-600 border-green-200' : 'bg-red-100 text-red-600 border-red-200'}`}>
                                                {isPassing ? <CheckCircle2 className="h-6 w-6" /> : <Award className="h-6 w-6" />}
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className={`mb-4 text-sm font-bold p-3 rounded-lg flex items-center gap-2 ${isPassing ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                        <CheckCircle2 className="h-5 w-5" />
                                        {isPassing ? 'Aprovado' : 'Reprovado'}
                                    </div>

                                    {/* Nota das Atividades - Breakdown */}
                                    <div className="mb-4">
                                        <div className="text-[10px] uppercase font-bold text-blue-600 tracking-wider mb-2">📋 Composição das Notas de Atividades</div>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                                            <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-3 text-center">
                                                <div className="text-[9px] text-emerald-600 font-bold uppercase mb-1">📍 Presencial</div>
                                                <div className="font-black text-emerald-700 text-lg">{dyn.presencialScore.toFixed(1)}</div>
                                                <div className="text-[9px] text-emerald-500">máx {gradingSettings?.pointsPerPresence || 3}</div>
                                            </div>
                                            <div className="bg-sky-50 border border-sky-100 rounded-lg p-3 text-center">
                                                <div className="text-[9px] text-sky-600 font-bold uppercase mb-1">💻 Online</div>
                                                <div className="font-black text-sky-700 text-lg">{dyn.onlineScore.toFixed(1)}</div>
                                                <div className="text-[9px] text-sky-500">máx {gradingSettings?.onlinePresencePoints || 2}</div>
                                            </div>
                                            <div className="bg-purple-50 border border-purple-100 rounded-lg p-3 text-center">
                                                <div className="text-[9px] text-purple-600 font-bold uppercase mb-1">🎬 Vídeo Aula</div>
                                                <div className="font-black text-purple-700 text-lg">{dyn.videoAula.toFixed(1)}</div>
                                                <div className="text-[9px] text-purple-500">máx {gradingSettings?.interactionPoints || 1}</div>
                                            </div>
                                            <div className="bg-amber-50 border border-amber-100 rounded-lg p-3 text-center">
                                                <div className="text-[9px] text-amber-600 font-bold uppercase mb-1">📖 Leitura</div>
                                                <div className="font-black text-amber-700 text-lg">{dyn.leituraLivro.toFixed(1)}</div>
                                                <div className="text-[9px] text-amber-500">máx {gradingSettings?.bookActivityPoints || 3}</div>
                                            </div>
                                            <div className="bg-rose-50 border border-rose-100 rounded-lg p-3 text-center">
                                                <div className="text-[9px] text-rose-600 font-bold uppercase mb-1">❓ Questionário</div>
                                                <div className="font-black text-rose-700 text-lg">{dyn.questionarioLivro.toFixed(1)}</div>
                                                <div className="text-[9px] text-rose-500">máx 1</div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Totais */}
                                    <div className="grid grid-cols-3 gap-3">
                                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                                            <div className="text-[10px] text-blue-600 font-bold uppercase mb-1">Nota Atividades</div>
                                            <div className="font-black text-blue-700 text-xl">{dyn.notaAtividades.toFixed(1)}</div>
                                            <div className="text-[9px] text-blue-400">máx 10</div>
                                        </div>
                                        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 text-center">
                                            <div className="text-[10px] text-indigo-600 font-bold uppercase mb-1">Prova Online</div>
                                            {examReleased ? (
                                                <>
                                                    <div className="font-black text-indigo-700 text-xl">{dyn.examGrade.toFixed(1)}</div>
                                                    <div className="text-[9px] text-indigo-400">máx 10</div>
                                                </>
                                            ) : (
                                                <div className="flex flex-col items-center gap-1 py-1">
                                                    <Lock className="h-4 w-4 text-indigo-300" />
                                                    <div className="text-[10px] text-indigo-400 font-semibold">Aguardando</div>
                                                </div>
                                            )}
                                        </div>
                                        <div className={`rounded-lg p-4 text-center border-2 ${isPassing ? 'bg-green-50 border-green-300' : 'bg-red-50 border-red-200'}`}>
                                            <div className={`text-[10px] font-bold uppercase mb-1 ${isPassing ? 'text-green-600' : 'text-red-600'}`}>Média Final</div>
                                            <div className={`font-black text-xl ${isPassing ? 'text-green-700' : 'text-red-700'}`}>{dyn.media.toFixed(2)}</div>
                                            <div className={`text-[9px] ${isPassing ? 'text-green-400' : 'text-red-400'}`}>(Ativ + Prova) / 2</div>
                                        </div>
                                    </div>

                                    <div className="mt-3 text-[10px] text-muted-foreground text-right italic">
                                        Fórmula: (Nota Atividades + Prova Online) / 2 — Aprovação: {passingGrade.toFixed(1)}
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
