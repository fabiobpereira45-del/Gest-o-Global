"use client"

import { BookOpen, CheckCircle2 } from "lucide-react"
import type { Semester, Discipline } from "@/lib/store"

interface CurriculumTabProps {
    semesters: Semester[]
    disciplines: Discipline[]
}

export function CurriculumTab({ semesters, disciplines }: CurriculumTabProps) {
    return (
        <div className="flex flex-col gap-10 animate-in fade-in slide-in-from-right-2 duration-500">
            {semesters.length === 0 ? (
                <div className="text-center py-20 text-muted-foreground border-2 border-border border-dashed rounded-3xl bg-white">
                    <BookOpen className="h-12 w-12 mx-auto opacity-20 mb-4" />
                    <p className="font-medium italic">Nenhuma grade curricular cadastrada no momento.</p>
                </div>
            ) : (
                semesters.map((sem, idx) => {
                    const semDisciplines = disciplines.filter(d => d.semesterId === sem.id)
                    return (
                        <div key={sem.id} className="relative">
                            <div className="flex items-center gap-4 mb-8">
                                <div className={`flex h-12 w-12 items-center justify-center rounded-2xl font-bold text-xl shadow-lg transition-colors ${sem.is_completed ? 'bg-green-600 text-white shadow-green-600/20' : 'bg-navy text-accent shadow-navy/20'}`}>
                                    {sem.is_completed ? <CheckCircle2 className="h-6 w-6" /> : idx + 1}
                                </div>
                                <div className="flex flex-col">
                                    <div className="flex items-center gap-3">
                                        <h3 className="text-2xl font-bold text-foreground">{sem.name}</h3>
                                        {sem.is_completed && <span className="bg-green-100 text-green-800 text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full">Concluído</span>}
                                    </div>
                                    <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">{sem.shift || "Turno Regular"}</p>
                                </div>
                                <div className="h-px bg-border flex-1 ml-4" />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 ml-4 lg:ml-16">
                                {semDisciplines.length === 0 ? (
                                    <p className="text-sm text-muted-foreground italic col-span-full">Disciplinas em definição para este semestre.</p>
                                ) : (
                                    semDisciplines.map(disc => (
                                        <div key={disc.id} className={`border rounded-2xl p-6 flex flex-col transition-all group ${disc.is_realized ? 'bg-green-50/50 border-green-200/60 shadow-sm' : 'bg-white border-border/50 shadow-sm hover:shadow-xl hover:border-primary/30'}`}>
                                            <div className="mb-4">
                                                <div className="flex items-start justify-between gap-2 mb-2">
                                                    <h4 className={`font-bold text-lg leading-tight ${disc.is_realized ? 'text-green-800' : 'text-foreground group-hover:text-primary transition-colors'}`}>{disc.name}</h4>
                                                    {disc.is_realized && <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />}
                                                </div>
                                                {disc.description && <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{disc.description}</p>}
                                            </div>

                                            <div className={`mt-auto pt-4 border-t ${disc.is_realized ? 'border-green-200/50' : 'border-border/50'}`}>
                                                <div className="flex justify-between items-center text-[10px] uppercase font-bold tracking-widest">
                                                    <span className="text-muted-foreground">Docente</span>
                                                    <span className={disc.is_realized ? "text-green-700" : "text-navy"}>{disc.professorName || "A definir"}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )
                })
            )}
        </div>
    )
}
