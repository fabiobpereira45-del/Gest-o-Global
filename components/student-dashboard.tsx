import { useState, useEffect } from "react"
import {
    LogOut, BookOpen, Clock, FileText, Loader2, ArrowLeft,
    CalendarDays, MessageSquare, CheckCircle2,
    Users, Menu, GraduationCap, Home, AlertCircle,
    Library, BookOpenCheck, ChevronRight, User, X, DollarSign
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    type StudentSession, type StudentProfile, getStudentProfileAuth, logoutStudentAuth,
    type Semester, type Discipline, type StudyMaterial, type ClassRoom, type ClassSchedule,
    getSemesters, getDisciplines, getStudyMaterials, getClasses, getClassSchedules,
    getClassmates, getStudentGrades, type StudentGrade
} from "@/lib/store"
import { StudentFinancialView } from "@/components/student-financial-view"
import { StudentAuth } from "@/components/student-auth"
import { StudentChatView } from "@/components/student-chat-view"
import { StudentGradesView } from "@/components/student-grades-view"
import { StudentAssessmentView } from "@/components/student-assessment-view"
import { AvatarUpload } from "@/components/avatar-upload"
import { createClient } from "@/lib/supabase/client"
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { OverviewTab } from "./student/tabs/OverviewTab"
import { ClassInfoTab } from "./student/tabs/ClassInfoTab"
import { CurriculumTab } from "./student/tabs/CurriculumTab"
import { MaterialsTab } from "./student/tabs/MaterialsTab"
import { ProfileTab } from "./student/tabs/ProfileTab"

const DAY_LABEL: Record<string, string> = {
    monday: "Segunda-feira", tuesday: "Terça-feira", wednesday: "Quarta-feira",
    thursday: "Quinta-feira", friday: "Sexta-feira", saturday: "Sábado", sunday: "Domingo"
}
const SHIFT_LABEL: Record<string, string> = {
    morning: "Manhã", afternoon: "Tarde", evening: "Noite", ead: "EAD/Online"
}

interface Props {
    session: StudentSession | null
    onBack: () => void
    onLogout: () => void
}

type Tab = "overview" | "class-info" | "curriculum" | "materials" | "grades" | "exams" | "chat" | "perfil" | "financeiro"

export function StudentDashboard({ session, onBack, onLogout }: Props) {
    const [profile, setProfile] = useState<StudentProfile | null>(null)
    const [loading, setLoading] = useState(true)
    const [tab, setTab] = useState<Tab>("overview")
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
    const supabase = createClient()

    const [semesters, setSemesters] = useState<Semester[]>([])
    const [disciplines, setDisciplines] = useState<Discipline[]>([])
    const [materials, setMaterials] = useState<StudyMaterial[]>([])
    const [myClass, setMyClass] = useState<ClassRoom | null>(null)
    const [mySchedules, setMySchedules] = useState<ClassSchedule[]>([])
    const [classmates, setClassmates] = useState<StudentProfile[]>([])
    const [officialGrades, setOfficialGrades] = useState<StudentGrade[]>([])

    const [dataLoading, setDataLoading] = useState(false)

    async function checkAuth() {
        setLoading(true)
        try {
            const p = await getStudentProfileAuth()
            setProfile(p)
            if (p) {
                setDataLoading(true)
                try {
                    const [s, d, m, cls, sch, allGrades] = await Promise.all([
                        getSemesters(), getDisciplines(), getStudyMaterials(),
                        getClasses(), getClassSchedules(), getStudentGrades()
                    ])
                    setSemesters(s)
                    setDisciplines(d)
                    setMaterials(m)
                    if (p.class_id) {
                        const foundClass = cls.find(cl => cl.id === p.class_id)
                        if (foundClass) setMyClass(foundClass)
                        setMySchedules(sch.filter(sh => sh.classId === p.class_id))
                        
                        const mates = await getClassmates(p.class_id)
                        setClassmates(mates)
                        
                        const myGradesRaw = allGrades.filter(g => {
                            const ident = (g.studentIdentifier || "").toLowerCase().trim()
                            return (
                                ident === p.cpf?.toLowerCase().trim() ||
                                ident === p.enrollment_number?.toLowerCase().trim() ||
                                ident === p.email?.toLowerCase().trim()
                            )
                        })

                        // CONSOLIDAÇÃO: Mescla registros fragmentados da mesma disciplina
                        const consolidatedMap = new Map<string, StudentGrade>();
                        myGradesRaw.forEach(g => {
                            const discKey = g.disciplineId || 'geral';
                            const existing = consolidatedMap.get(discKey);
                            if (!existing) {
                                consolidatedMap.set(discKey, { ...g });
                            } else {
                                // Pega o melhor valor de cada campo entre os fragmentos
                                consolidatedMap.set(discKey, {
                                    ...existing,
                                    examGrade: Math.max(existing.examGrade || 0, g.examGrade || 0),
                                    worksGrade: Math.max(existing.worksGrade || 0, g.worksGrade || 0),
                                    seminarGrade: Math.max(existing.seminarGrade || 0, g.seminarGrade || 0),
                                    participationBonus: Math.max(existing.participationBonus || 0, g.participationBonus || 0),
                                    attendanceScore: Math.max(existing.attendanceScore || 0, g.attendanceScore || 0),
                                    // Se algum estiver liberado, o consolidado também está
                                    isReleased: existing.isReleased || g.isReleased
                                });
                            }
                        });
                        
                        setOfficialGrades(Array.from(consolidatedMap.values()))
                    }
                } catch (err) {
                    console.error("Erro ao carregar dados acadêmicos:", err)
                } finally {
                    setDataLoading(false)
                }
            }
        } catch (err) {
            console.error("Erro na autenticação do aluno:", err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        checkAuth()
    }, [])

    async function handlePortalLogout() {
        await logoutStudentAuth()
        setProfile(null)
    }

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-screen opacity-50 bg-background">
                <Loader2 className="h-10 w-10 animate-spin mb-4 text-primary" />
                <p className="font-medium">Verificando acesso...</p>
            </div>
        )
    }

    if (!profile) {
        return (
            <div className="flex flex-col gap-4 p-8 max-w-lg mx-auto min-h-screen justify-center">
                <div className="flex justify-start mb-2">
                    <Button variant="ghost" onClick={onBack} className="text-muted-foreground hover:text-primary transition-colors">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Voltar para o Site
                    </Button>
                </div>
                <StudentAuth onSuccess={checkAuth} />
            </div>
        )
    }

    const navItems: { id: Tab; label: string; icon: any }[] = [
        { id: "overview", label: "Visão Geral", icon: Home },
        { id: "class-info", label: "Meu Núcleo", icon: Users },
        { id: "curriculum", label: "Grade Curricular do Sistema", icon: CalendarDays },
        { id: "materials", label: "Materiais EAD", icon: Library },
        { id: "exams", label: "Avaliações", icon: BookOpenCheck },
        { id: "grades", label: "Boletim e Notas", icon: FileText },
        { id: "financeiro", label: "Financeiro", icon: DollarSign },
        { id: "chat", label: "Mensagens", icon: MessageSquare },
        { id: "perfil", label: "Meu Perfil", icon: User },
    ]

    const filteredMaterials = materials

    const renderSidebar = () => (
        <div className="flex flex-col h-[100dvh] text-slate-100 pt-[env(safe-area-inset-top,0px)]" style={{ backgroundColor: '#0f172a' }}>
            <div className="p-6 border-b border-white/20 mb-4 bg-black/40 backdrop-blur-md">
                <div className="relative mb-4 group inline-block">
                    <AvatarUpload 
                        currentUrl={profile.avatar_url} 
                        userId={profile.id} 
                        userName={profile.name} 
                        type="student" 
                        onUploadSuccess={(url) => setProfile(prev => prev ? { ...prev, avatar_url: url } : null)}
                    />
                </div>
                <h2 className="text-base font-bold tracking-tight text-white">{profile.name}</h2>
                <p className="text-[10px] text-slate-300 uppercase tracking-[2px] font-bold">Portal do Aluno</p>
            </div>

            <ScrollArea className="flex-1 px-3">
                <div className="flex flex-col gap-1.5 mb-8">
                    {navItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => {
                                setTab(item.id)
                                setIsMobileMenuOpen(false)
                            }}
                            className={cn(
                                "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group",
                                tab === item.id
                                    ? "text-white shadow-md shadow-[#7c3aed]/20"
                                    : "text-slate-400 hover:text-white hover:bg-white/10"
                            )}
                            style={tab === item.id ? { backgroundColor: '#7c3aed' } : {}}
                        >
                            <item.icon className={cn("h-5 w-5 transition-colors", tab === item.id ? "text-white" : "text-slate-500 group-hover:text-slate-200")} />
                            {item.label}
                            {tab === item.id && <ChevronRight className="h-4 w-4 ml-auto opacity-70" />}
                        </button>
                    ))}
                </div>

                <div className="mt-4 px-3">
                    <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                        <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: '#7c3aed' }}>Suporte Direto</p>
                        <p className="text-xs text-slate-400 mb-4 leading-relaxed">Dúvidas sobre o curso ou notas? Fale conosco.</p>
                        <Button variant="outline" size="sm" className="w-full bg-white/10 text-xs text-white border-white/20 hover:bg-white/20 h-8 gap-2" asChild>
                            <a href={`https://wa.me/5571987483103`} target="_blank" rel="noopener noreferrer">
                                <MessageSquare className="h-3 w-3" /> WhatsApp
                            </a>
                        </Button>
                    </div>
                </div>
            </ScrollArea>

            <div className="p-4 mt-auto border-t border-white/10 bg-black/10 pb-[calc(1rem+env(safe-area-inset-bottom,20px))]">
                <button
                    onClick={handlePortalLogout}
                    className="flex items-center gap-3 w-full px-4 py-3 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl text-sm font-medium transition-colors"
                >
                    <LogOut className="h-5 w-5" />
                    Sair do Portal
                </button>
            </div>
        </div>
    )

    return (
        <div className="flex h-screen w-full bg-[#f8fafc] overflow-hidden fixed inset-0">
            {/* Desktop Sidebar */}
            <aside className="hidden lg:block w-72 h-full flex-shrink-0 animate-in slide-in-from-left duration-500">
                {renderSidebar()}
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
                {/* Header */}
                <header className="h-[calc(5rem+env(safe-area-inset-top,0px))] md:h-20 flex-shrink-0 border-b border-border/50 bg-white shadow-sm flex items-center justify-between px-6 z-30 pt-[env(safe-area-inset-top,0px)]">
                    <div className="flex items-center gap-4">
                        <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                            <SheetTrigger asChild>
                                <Button variant="ghost" size="icon" className="lg:hidden">
                                    <Menu className="h-6 w-6" />
                                </Button>
                            </SheetTrigger>
                            <SheetContent side="left" className="p-0 w-72 border-r-0" style={{ backgroundColor: '#0f172a' }}>
                                {renderSidebar()}
                            </SheetContent>
                        </Sheet>
                        <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                                {tab !== "overview" && (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => setTab("overview")}
                                        className="h-8 w-8 rounded-lg hover:bg-slate-100 -ml-1"
                                    >
                                        <ArrowLeft className="h-4 w-4 text-muted-foreground" />
                                    </Button>
                                )}
                                <h2 className="font-bold text-lg text-foreground tracking-tight flex items-center gap-2">
                                    <GraduationCap className="h-5 w-5 text-accent" />
                                    {navItems.find(t => t.id === tab)?.label || "Menu"}
                                </h2>
                            </div>
                            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest leading-none mt-1">
                                {profile.enrollment_number} • Teologia Bíblica (Básico)
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="hidden md:flex flex-col text-right pr-4 border-r border-border">
                            <p className="text-sm font-bold text-foreground leading-none">{profile.name}</p>
                            <p className="text-[11px] text-muted-foreground mt-1 leading-none">Matrícula Ativa</p>
                        </div>

                        <div className="h-10 w-10 rounded-full overflow-hidden border border-border shadow-sm flex-shrink-0 bg-muted flex items-center justify-center">
                            {profile.avatar_url ? (
                                <img src={profile.avatar_url} alt={profile.name} className="w-full h-full object-cover" />
                            ) : (
                                <User className="h-5 w-5 text-muted-foreground" />
                            )}
                        </div>

                        <Button variant="outline" size="sm" onClick={onBack} className="hidden sm:flex gap-2 text-xs font-bold rounded-xl border-accent/20 text-accent hover:bg-accent/10 h-10 px-4">
                            <BookOpen className="h-4 w-4" /> Sala de Provas
                        </Button>

                        <Button 
                            variant="ghost" 
                            onClick={handlePortalLogout}
                            className="flex items-center gap-2 text-red-500 hover:text-red-600 hover:bg-red-50 h-10 px-3 rounded-xl transition-colors border border-transparent hover:border-red-100"
                            title="Sair do Portal"
                        >
                            <LogOut className="h-5 w-5" />
                            <span className="hidden sm:inline font-bold text-sm">Sair</span>
                        </Button>
                    </div>
                </header>

                {/* Content View */}
                <main className="flex-1 overflow-y-auto p-4 md:p-8 animate-in fade-in slide-in-from-bottom-2 duration-700 bg-slate-50/50">
                    {dataLoading ? (
                        <div className="flex flex-col justify-center items-center h-full gap-3">
                            <Loader2 className="h-10 w-10 animate-spin text-primary opacity-40" />
                            <p className="text-sm font-medium text-muted-foreground">Sincronizando dados acadêmicos...</p>
                        </div>
                    ) : (
                        <div className="w-full max-w-[1600px] mx-auto">
                            {tab === "overview" && <OverviewTab profile={profile} onTabChange={setTab} />}
                            {tab === "class-info" && <ClassInfoTab myClass={myClass} classmates={classmates} mySchedules={mySchedules} disciplines={disciplines} officialGrades={officialGrades} />}
                            {tab === "curriculum" && <CurriculumTab semesters={semesters} disciplines={disciplines} />}
                            {tab === "materials" && <MaterialsTab filteredMaterials={filteredMaterials} disciplines={disciplines} />}
                            {tab === "exams" && <StudentAssessmentView studentId={profile.id} studentName={profile.name} studentEmail={session?.email || ""} studentDoc={profile.cpf} />}
                            {tab === "grades" && <StudentGradesView studentId={profile.id} studentEmail={session?.email || ""} studentDoc={profile.cpf} />}
                            {tab === "financeiro" && <StudentFinancialView studentId={profile.id} />}
                            {tab === "chat" && <StudentChatView studentId={profile.id} studentName={profile.name} />}
                            {tab === "perfil" && <ProfileTab profile={profile} onUpdateSuccess={checkAuth} />}
                        </div>
                    )}
                </main>
            </div>
        </div >
    )
}
