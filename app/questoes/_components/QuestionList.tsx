"use client"

import { QuestionItem } from "./QuestionItem"
import { Inbox, BookOpen } from "lucide-react"

interface QuestionListProps {
    questions: any[]
    hasAppliedFilter: boolean
}

export function QuestionList({ questions, hasAppliedFilter }: QuestionListProps) {
    if (!hasAppliedFilter) {
        return (
            <div className="flex flex-col items-center justify-center py-32 text-center border-2 border-dashed border-border rounded-3xl bg-muted/5">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                    <BookOpen className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">Selecione os filtros</h3>
                <p className="text-muted-foreground text-sm max-w-xs mx-auto">
                    Utilize o painel lateral para filtrar as questões de acordo com seus objetivos de estudo.
                </p>
            </div>
        )
    }

    if (questions.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-32 text-center border-2 border-dashed border-border rounded-3xl bg-muted/5">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-6">
                    <Inbox className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">Nenhuma questão encontrada</h3>
                <p className="text-muted-foreground text-sm max-w-xs mx-auto">
                    Não encontramos questões com os filtros selecionados. Tente ajustar suas opções.
                </p>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="p-4 md:px-6 md:py-4 rounded-xl border border-border/60 bg-card/30 backdrop-blur-xl shadow-xl flex items-center justify-between">
                <h2 className="text-sm md:text-base font-bold flex items-center gap-3 text-foreground">
                    <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                    Resultados
                </h2>
                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] md:text-xs font-bold">
                    {questions.length} questões encontradas
                </div>
            </div>

            <div className="grid gap-6">
                {questions.map((q) => (
                    <QuestionItem key={q.id} question={q} />
                ))}
            </div>
        </div>
    )
}
