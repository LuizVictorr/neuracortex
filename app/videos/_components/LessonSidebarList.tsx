"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, ArrowLeft, CheckCircle2, Eye, EyeOff, Video, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toggleAulaConcluida } from "@/app/videos/actions";
import { toast } from "sonner";

interface Lesson {
    id: string;
    titulo: string;
    concluida: boolean;
    ordem: number;
}

interface LessonSidebarListProps {
    lessons: Lesson[];
    currentLessonId: string;
}

export function LessonSidebarList({ lessons, currentLessonId }: LessonSidebarListProps) {
    const router = useRouter();
    const [showOnlyUnwatched, setShowOnlyUnwatched] = useState(false);
    const [loadingIds, setLoadingIds] = useState<Set<string>>(new Set());

    const currentIndex = lessons.findIndex(a => a.id === currentLessonId);
    const prevAula = lessons[currentIndex - 1];
    const nextAula = lessons[currentIndex + 1];

    const handleToggleStatus = async (e: React.MouseEvent, lessonId: string, currentStatus: boolean) => {
        e.preventDefault();
        e.stopPropagation();

        setLoadingIds(prev => new Set(prev).add(lessonId));

        try {
            const res = await toggleAulaConcluida(lessonId, !currentStatus);
            if (res.success) {
                toast.success(!currentStatus ? "Aula concluída!" : "Aula marcada como não assistida");
                router.refresh();
            } else {
                toast.error("Erro ao atualizar status");
            }
        } catch (error) {
            toast.error("Erro de conexão");
        } finally {
            setLoadingIds(prev => {
                const next = new Set(prev);
                next.delete(lessonId);
                return next;
            });
        }
    };

    const filteredLessons = showOnlyUnwatched
        ? lessons.filter(l => !l.concluida || l.id === currentLessonId)
        : lessons;

    return (
        <div className="p-5 border rounded-2xl bg-card shadow-sm border-border overflow-hidden">
            <div className="flex items-center justify-between mb-4">
                <h4 className="font-bold text-sm uppercase tracking-wider text-foreground flex items-center gap-2">
                    <Video className="w-4 h-4 text-primary" />
                    Aulas
                </h4>

                <div className="flex items-center gap-1">
                    {/* Filter Toggle */}
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setShowOnlyUnwatched(!showOnlyUnwatched)}
                        className={`h-8 w-8 rounded-lg transition-colors ${showOnlyUnwatched
                            ? "bg-primary/20 text-primary hover:bg-primary/30"
                            : "hover:bg-muted text-muted-foreground hover:text-foreground"
                            }`}
                        title={showOnlyUnwatched ? "Mostrando apenas não assistidas" : "Filtrar não assistidas"}
                    >
                        {showOnlyUnwatched ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>

                    <div className="w-px h-4 bg-border mx-1" />

                    {/* Sequential Navigation Buttons */}
                    <Button
                        variant="ghost"
                        size="icon"
                        asChild
                        disabled={!prevAula}
                        className="h-8 w-8 rounded-lg hover:bg-primary/10 hover:text-primary transition-colors disabled:opacity-30"
                        title={prevAula?.titulo ? `Anterior: ${prevAula.titulo}` : "Primeira aula"}
                    >
                        {prevAula ? (
                            <Link href={`/videos/${prevAula.id}`}>
                                <ArrowLeft className="w-4 h-4" />
                            </Link>
                        ) : <div className="cursor-not-allowed opacity-30 px-2 py-2"><ArrowLeft className="w-4 h-4" /></div>}
                    </Button>

                    <Button
                        variant="ghost"
                        size="icon"
                        asChild
                        disabled={!nextAula}
                        className="h-8 w-8 rounded-lg hover:bg-primary/10 hover:text-primary transition-colors disabled:opacity-30"
                        title={nextAula?.titulo ? `Próxima: ${nextAula.titulo}` : "Última aula"}
                    >
                        {nextAula ? (
                            <Link href={`/videos/${nextAula.id}`}>
                                <ArrowRight className="w-4 h-4" />
                            </Link>
                        ) : <div className="cursor-not-allowed opacity-30 px-2 py-2"><ArrowRight className="w-4 h-4" /></div>}
                    </Button>
                </div>
            </div>

            <div className="h-[400px] pr-2 overflow-y-auto no-scrollbar">
                <div className="space-y-3 pb-4">
                    {filteredLessons.map((item) => {
                        const isCurrent = item.id === currentLessonId;
                        const isLoading = loadingIds.has(item.id);

                        return (
                            <Link
                                key={item.id}
                                href={`/videos/${item.id}`}
                                className={`flex items-center gap-3 p-3 rounded-xl text-sm transition-all group border ${isCurrent
                                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/20 font-medium border-primary"
                                    : "hover:bg-muted text-muted-foreground hover:text-foreground border-transparent hover:border-border bg-muted/50"
                                    }`}
                            >
                                <button
                                    onClick={(e) => handleToggleStatus(e, item.id, item.concluida)}
                                    disabled={isLoading}
                                    className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center border transition-all hover:scale-110 active:scale-95 ${isCurrent
                                        ? "border-primary-foreground/30 bg-primary-foreground/10 hover:bg-primary-foreground/20"
                                        : item.concluida
                                            ? "border-green-500/50 bg-green-500/10 text-green-500 hover:bg-green-500/20"
                                            : "border-muted-foreground/30 bg-muted/50 hover:border-primary/50"
                                        }`}
                                    title={item.concluida ? "Marcar como não assistida" : "Marcar como concluída"}
                                >
                                    {isLoading ? (
                                        <Loader2 className="w-3 h-3 animate-spin" />
                                    ) : item.concluida ? (
                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                    ) : (
                                        <span className="text-[10px]">{item.ordem + 1 || item.ordem}</span>
                                    )}
                                </button>
                                <span className="truncate flex-1">{item.titulo}</span>
                                {!isCurrent && (
                                    <div className="w-1.5 h-1.5 rounded-full bg-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                                )}
                            </Link>
                        );
                    })}

                    {filteredLessons.length === 0 && (
                        <div className="py-8 text-center text-muted-foreground opacity-50 italic text-xs">
                            Todas as aulas foram concluídas! 🎉
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
