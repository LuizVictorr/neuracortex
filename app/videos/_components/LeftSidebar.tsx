"use client";

import { useState } from "react";
import { AreaConhecimento } from "../types";
import { ChevronDown, ChevronRight, BookOpen, Layers, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { CommandSearch } from "@/components/command-search";

interface LeftSidebarProps {
    data: AreaConhecimento[];
    selectedDisciplinaId: string | null;
    onSelectDisciplina: (disciplinaId: string) => void;
}

export default function LeftSidebar({
    data,
    selectedDisciplinaId,
    onSelectDisciplina,
}: LeftSidebarProps) {
    const [searchOpen, setSearchOpen] = useState(false);
    // Estado para controlar quais Áreas de Conhecimento estão abertas
    const [openAreas, setOpenAreas] = useState<Record<string, boolean>>(() => {
        // Inicia com todas as áreas abertas por padrão
        const initialState: Record<string, boolean> = {};
        data.forEach((area) => {
            initialState[area.id] = true;
        });
        return initialState;
    });

    const toggleArea = (areaId: string) => {
        setOpenAreas((prev) => ({
            ...prev,
            [areaId]: !prev[areaId],
        }));
    };

    return (
        <div className="w-full h-full overflow-y-auto flex flex-col">
            <CommandSearch open={searchOpen} setOpen={setSearchOpen} />

            <div className="pt-6 mb-4 flex items-center justify-between">
                <h2 className="text-xl font-bold flex items-center gap-2 text-sidebar-foreground tracking-tight">
                    Disciplinas
                </h2>
            </div>

            <div className="mb-6">
                <Button
                    variant="outline"
                    onClick={() => setSearchOpen(true)}
                    className="w-full justify-start text-muted-foreground font-normal bg-muted/20 border-border/40 hover:bg-muted/30 hover:border-primary/30 group transition-all duration-300 rounded-lg px-3 h-9"
                >
                    <Search className="mr-2 h-4 w-4 group-hover:text-primary transition-colors" />
                    <span className="flex-1 text-left">Pesquisar...</span>
                    <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100 uppercase">
                        <span className="text-xs">Ctrl+</span>K
                    </kbd>
                </Button>
            </div>

            <div className="flex-1">
                {data.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center mt-8">
                        Nenhuma área de conhecimento encontrada.
                    </p>
                ) : (
                    data.map((area) => (
                        <div key={area.id} className="space-y-1">
                            {/* Cabeçalho da Área de Conhecimento */}
                            <button
                                onClick={() => toggleArea(area.id)}
                                className={cn(
                                    "flex w-full items-center gap-2 mb-1 rounded-md px-2 py-1.5 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
                                    "text-foreground"
                                )}
                            >
                                {openAreas[area.id] ? (
                                    <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                                ) : (
                                    <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                                )}
                                <Layers className="h-4 w-4 shrink-0 text-muted-foreground" />
                                <span className="truncate">{area.nome}</span>
                            </button>

                            {/* Lista de Disciplinas (Sanfona interna) */}
                            {openAreas[area.id] && (
                                <ul className="flex flex-col gap-1 ml-4 border-l pl-2 animate-in slide-in-from-top-2 duration-200">
                                    {area.disciplinas.map((disciplina) => {
                                        const isSelected = selectedDisciplinaId === disciplina.id;
                                        return (
                                            <li key={disciplina.id}>
                                                <button
                                                    onClick={() => onSelectDisciplina(disciplina.id)}
                                                    className={cn(
                                                        "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
                                                        isSelected
                                                            ? "bg-accent text-accent-foreground font-semibold"
                                                            : "text-muted-foreground"
                                                    )}
                                                >
                                                    <BookOpen className="h-4 w-4 shrink-0" />
                                                    <span className="truncate">{disciplina.nome}</span>
                                                </button>
                                            </li>
                                        );
                                    })}
                                    {area.disciplinas.length === 0 && (
                                        <li className="text-xs text-muted-foreground pl-2 py-1.5 italic">
                                            Nenhuma disciplina cadastrada.
                                        </li>
                                    )}
                                </ul>
                            )}
                        </div>
                    ))
                )}
            </div>

        </div>
    );
}
