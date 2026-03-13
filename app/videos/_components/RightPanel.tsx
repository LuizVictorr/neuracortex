"use client";

import { useMemo } from "react";
import { AreaConhecimento, Disciplina } from "../types";
import { Video, PlayCircle, BookOpen, Clock } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";

interface RightPanelProps {
    data: AreaConhecimento[];
    selectedDisciplinaId: string | null;
}

export default function RightPanel({ data, selectedDisciplinaId }: RightPanelProps) {
    // Encontra a disciplina atual baseada no ID selecionado
    const currentDisciplina: Disciplina | null = useMemo(() => {
        if (!selectedDisciplinaId) return null;
        for (const area of data) {
            const found = area.disciplinas.find((d) => d.id === selectedDisciplinaId);
            if (found) return found;
        }
        return null;
    }, [data, selectedDisciplinaId]);

    if (!currentDisciplina) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center bg-background p-8 text-center mt-32">
                <Video className="w-16 h-16 text-muted-foreground/30 mb-4" />
                <h3 className="text-2xl font-bold text-foreground">Nenhuma disciplina selecionada</h3>
                <p className="text-muted-foreground mt-2 max-w-md">
                    Selecione uma disciplina no painel à esquerda para ver os assuntos e aulas disponíveis.
                </p>
            </div>
        );
    }

    return (
        <div className="flex-1 bg-background p-4 md:p-8">
            <div className="mx-auto w-full max-w-5xl">
                <header className="mb-8">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary mb-4 text-sm font-medium">
                        <Video className="w-4 h-4" />
                        Aulas
                    </div>
                    <h1 className="text-4xl font-extrabold tracking-tight mb-2">
                        {currentDisciplina.nome}
                    </h1>
                    <p className="text-muted-foreground text-lg">
                        Explore os assuntos e assista às vídeo-aulas.
                    </p>
                </header>

                <div className="space-y-4">
                    {currentDisciplina.assuntos.length === 0 ? (
                        <div className="p-8 border rounded-xl border-dashed flex flex-col items-center justify-center text-center bg-card">
                            <p className="text-muted-foreground">
                                Ainda não há assuntos cadastrados para esta disciplina.
                            </p>
                        </div>
                    ) : (
                        <Accordion type="multiple" className="space-y-4 w-full flex flex-col gap-4">
                            {currentDisciplina.assuntos.map((assunto) => {
                                const progresso = 0; // Mock de progresso
                                const max_aulas = assunto.aulas.length;

                                return (
                                    <AccordionItem
                                        key={assunto.id}
                                        value={assunto.id}
                                        className="border border-border/40 rounded-xl bg-card transition-all overflow-hidden"
                                    >
                                        <AccordionTrigger className="hover:no-underline px-5 py-6 group">
                                            <div className="flex flex-1 items-center justify-between gap-4 mr-4 text-left">
                                                {/* Left Content: Title + Subtitle + Icon */}
                                                <div className="flex items-start gap-4">
                                                    <div className="mt-1 flex items-center justify-center">
                                                        <BookOpen className="w-5 h-5 text-red-500/90" />
                                                    </div>
                                                    <div className="flex flex-col gap-1.5">
                                                        <h3 className="text-[1.05rem] font-bold text-foreground group-hover:text-foreground/90 transition-colors tracking-wide">
                                                            {assunto.nome}
                                                        </h3>
                                                        <span className="text-xs text-muted-foreground font-medium">
                                                            {progresso}/{max_aulas} aulas concluídas
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Right Content: Progress Bar + Tag */}
                                                <div className="flex items-center gap-4">
                                                    {/* Percentage Text */}
                                                    <span className="text-xs font-bold text-muted-foreground mr-1">
                                                        {max_aulas === 0 ? "0%" : `${Math.round((progresso / max_aulas) * 100)}%`}
                                                    </span>

                                                    {/* Progress Bar Line */}
                                                    <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden hidden sm:block">
                                                        <div
                                                            className="h-full bg-blue-500 rounded-full"
                                                            style={{ width: max_aulas === 0 ? '0%' : `${(progresso / max_aulas) * 100}%` }}
                                                        />
                                                    </div>

                                                    {/* Tag pill */}
                                                    <div className="bg-muted/80 px-3 py-1 rounded-full flex items-center justify-center">
                                                        <span className="text-[0.7rem] font-bold text-foreground/80">{max_aulas} tópicos</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </AccordionTrigger>

                                        <AccordionContent className="pt-0 pb-0 shadow-inner">
                                            <div className="border-t border-border/30 bg-black/10 px-6 py-6">
                                                <div className="flex flex-col gap-3">
                                                    {assunto.aulas.length === 0 ? (
                                                        <p className="text-sm text-muted-foreground italic py-2">
                                                            Nenhuma aula cadastrada neste assunto.
                                                        </p>
                                                    ) : (
                                                        assunto.aulas.map((aula, index) => (
                                                            <Link
                                                                key={aula.id}
                                                                href={`/videos/${aula.id}`}
                                                                className="group flex items-center justify-between p-4 rounded-xl border border-border/30 bg-card hover:border-border hover:bg-muted/10 transition-all duration-200"
                                                            >
                                                                {/* Aula Left side */}
                                                                <div className="flex items-center gap-4">
                                                                    <PlayCircle className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors stroke-[1.5]" />
                                                                    <h4 className="font-semibold text-[0.95rem] text-foreground/90 group-hover:text-foreground transition-colors tracking-wide">
                                                                        {aula.titulo}
                                                                    </h4>
                                                                </div>
                                                                {/* Aula Right side */}
                                                                <div className="flex items-center gap-5 space-x-4 text-xs font-semibold text-muted-foreground">
                                                                    <div className="flex items-center gap-1.5 group-hover:text-blue-500 transition-colors">
                                                                        <PlayCircle className="w-3.5 h-3.5 stroke-[2]" />
                                                                        <span>1 aula</span>
                                                                    </div>
                                                                    <div className="flex items-center gap-1.5 group-hover:text-foreground transition-colors">
                                                                        <Clock className="w-3.5 h-3.5 stroke-[2]" />
                                                                        <span>0 min</span>
                                                                    </div>
                                                                </div>
                                                            </Link>
                                                        ))
                                                    )}
                                                </div>
                                            </div>
                                        </AccordionContent>
                                    </AccordionItem>
                                );
                            })}
                        </Accordion>
                    )}
                </div>
            </div>
        </div>
    );
}
