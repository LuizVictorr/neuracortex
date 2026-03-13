"use client"

import { useState } from "react"
import { CheckCircle2, XCircle, GraduationCap, Calendar, BarChart2, Hash, Minus, BookOpen } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card"
import { toggleQuestionStatus } from "../actions"
import { toast } from "sonner"

interface QuestionItemProps {
    question: {
        id: string
        textoBase: string
        referencia?: string | null
        comando: string
        alternativas: string // JSON string
        instituicao?: string | null
        ano?: number | null
        dificuldade?: string | null
        jaAcertei: boolean
        jaErrei: boolean
        disciplina: { nome: string }
        assunto: { nome: string }
    }
}

export function QuestionItem({ question }: QuestionItemProps) {
    const [status, setStatus] = useState({
        acertei: question.jaAcertei,
        errei: question.jaErrei
    })
    const [loading, setLoading] = useState(false)
    const [selectedIdx, setSelectedIdx] = useState<number | null>(null)
    const [showResult, setShowResult] = useState(false)
    const [strikedIndices, setStrikedIndices] = useState<Set<number>>(new Set())

    const alternativas = JSON.parse(question.alternativas)

    const toggleStrike = (idx: number, e: React.MouseEvent) => {
        e.stopPropagation()
        setStrikedIndices(prev => {
            const newSet = new Set(prev)
            if (newSet.has(idx)) newSet.delete(idx)
            else newSet.add(idx)
            return newSet
        })
    }

    const handleToggle = async (type: 'acertei' | 'errei', value: boolean) => {
        setLoading(true)
        const res = await toggleQuestionStatus(question.id, type, value)
        if (res.success) {
            setStatus(prev => ({
                ...prev,
                [type]: value,
                ...(type === 'acertei' && value ? { errei: false } : {}),
                ...(type === 'errei' && value ? { acertei: false } : {}),
            }))
        }
        setLoading(false)
    }

    const handleSelectOption = (idx: number) => {
        if (showResult) return // Prevent clicking again after confirmation
        setSelectedIdx(idx)
    }

    const handleConfirm = async () => {
        if (selectedIdx === null || showResult) return

        setShowResult(true)
        const isCorrect = alternativas.options[selectedIdx].isCorrect

        if (isCorrect) {
            toast.success("Resposta Correta! ✨")
            await handleToggle('acertei', true)
        } else {
            toast.error("Resposta Incorreta. Tente novamente!")
            await handleToggle('errei', true)
        }
    }

    return (
        <Card className="border-border/60 hover:border-primary/40 transition-all duration-500 bg-card/30 backdrop-blur-xl overflow-hidden group shadow-2xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 bg-muted/30 border-b border-border/40">
                <div className="flex flex-wrap gap-2.5">
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[11px] font-bold uppercase tracking-wider">
                        <GraduationCap className="w-3.5 h-3.5" />
                        {question.disciplina.nome}
                    </div>
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-muted/50 border border-border/50 text-foreground text-[11px] font-semibold uppercase tracking-wider">
                        <BookOpen className="w-3.5 h-3.5 text-muted-foreground" />
                        {question.assunto.nome}
                    </div>
                    {question.instituicao && (
                        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-background/40 border border-border/30 text-muted-foreground text-[11px] font-medium">
                            <Hash className="w-3.5 h-3.5" />
                            {question.instituicao}
                        </div>
                    )}
                    {question.ano && (
                        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-background/40 border border-border/30 text-muted-foreground text-[11px] font-medium">
                            <Calendar className="w-3.5 h-3.5" />
                            {question.ano}
                        </div>
                    )}
                    {question.dificuldade && (
                        <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-[11px] font-bold uppercase tracking-tighter
                            ${question.dificuldade === 'Fácil' ? 'text-emerald-500 border-emerald-500/30 bg-emerald-500/5' : ''}
                            ${question.dificuldade === 'Médio' ? 'text-amber-500 border-amber-500/30 bg-amber-500/5' : ''}
                            ${question.dificuldade === 'Difícil' ? 'text-rose-500 border-rose-500/30 bg-rose-500/5' : ''}
                        `}>
                            <BarChart2 className="w-3.5 h-3.5" />
                            {question.dificuldade}
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-2 bg-background/20 p-1 rounded-full border border-border/40">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleToggle('acertei', !status.acertei)}
                        disabled={loading}
                        className={`h-8 w-8 rounded-full transition-all duration-300 ${status.acertei ? "text-emerald-500 bg-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.2)]" : "text-muted-foreground hover:text-emerald-500 hover:bg-emerald-500/10"}`}
                        title="Marcar como Acertei"
                    >
                        <CheckCircle2 className="w-4.5 h-4.5" />
                    </Button>
                    <div className="w-[1px] h-4 bg-border/40" />
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleToggle('errei', !status.errei)}
                        disabled={loading}
                        className={`h-8 w-8 rounded-full transition-all duration-300 ${status.errei ? "text-rose-500 bg-rose-500/20 shadow-[0_0_10px_rgba(244,63,94,0.2)]" : "text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10"}`}
                        title="Marcar como Errei"
                    >
                        <XCircle className="w-4.5 h-4.5" />
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
                {/* Texto Base */}
                <div
                    className="text-sm leading-relaxed prose prose-invert max-w-none text-muted-foreground prose-img:mx-auto prose-img:rounded-xl"
                    dangerouslySetInnerHTML={{ __html: question.textoBase }}
                />

                {question.referencia && (
                    <p className="text-[10px] text-muted-foreground italic border-l-2 border-primary/20 pl-2">
                        {question.referencia}
                    </p>
                )}

                {/* Comando */}
                <div className="bg-muted/10 p-4 rounded-lg border border-border/50">
                    <p className="font-medium text-foreground text-sm">
                        {question.comando}
                    </p>
                </div>

                {/* Alternativas */}
                <div className="space-y-3 pl-2">
                    {alternativas.options.map((opt: any, idx: number) => {
                        const isSelected = selectedIdx === idx;
                        const isCorrect = opt.isCorrect;
                        const isStriked = strikedIndices.has(idx);

                        let stateClasses = "border-border bg-muted/40 group-hover/opt:border-primary group-hover/opt:text-primary";

                        if (showResult) {
                            if (isCorrect) stateClasses = "border-green-500 bg-green-500/20 text-green-400";
                            else if (isSelected) stateClasses = "border-red-500 bg-red-500/20 text-red-400";
                        } else if (isSelected) {
                            stateClasses = "border-foreground bg-muted/90 text-foreground ring-1 ring-foreground/30";
                        } else if (isStriked) {
                            stateClasses = "border-border/10 bg-transparent text-muted-foreground/20";
                        }

                        return (
                            <div
                                key={idx}
                                onClick={() => !isStriked && handleSelectOption(idx)}
                                className={`relative flex items-center justify-between gap-3 text-sm group/opt cursor-pointer p-4 rounded-xl border transition-all 
                                    ${showResult && isCorrect ? "bg-green-500/10 border-green-500 ring-2 ring-green-500/20" :
                                        isSelected ? "bg-muted border-white ring-2 ring-white/20" :
                                            isStriked ? "opacity-30 border-dashed border-border/40 grayscale" : "hover:bg-muted/70 border-border/50 bg-card/40"}
                                `}
                            >
                                {/* Strike-through Line */}
                                {isStriked && (
                                    <div className="absolute left-4 right-14 h-[1px] bg-muted-foreground/70 top-1/2 z-10" />
                                )}

                                <div className="flex items-center gap-4 flex-1 overflow-hidden z-0">
                                    <span className={`flex-shrink-0 w-9 h-9 rounded-full border-2 flex items-center justify-center transition-colors text-xs font-black ${stateClasses}`}>
                                        {String.fromCharCode(65 + idx)}
                                    </span>
                                    <div 
                                        className={`pt-0.5 transition-all duration-300 text-base leading-snug [&_p]:m-0 [&_img]:inline-block [&_img]:max-h-32 [&_img]:rounded-md [&_img]:my-1 ${showResult && isCorrect ? "text-foreground font-semibold" : isSelected ? "text-foreground font-medium" : "text-muted-foreground group-hover/opt:text-foreground"}`}
                                        dangerouslySetInnerHTML={{ __html: opt.text }}
                                    />
                                </div>

                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={(e) => toggleStrike(idx, e)}
                                    className={`h-8 w-8 rounded-full transition-all z-20 ${isStriked ? "bg-muted text-muted-foreground" : "text-muted-foreground/50 hover:text-foreground hover:bg-muted"}`}
                                >
                                    <Minus className="w-4 h-4" />
                                </Button>
                            </div>
                        );
                    })}
                </div>
            </CardContent>
            <CardFooter className="bg-muted/5 py-4 border-t border-border/5 flex items-center justify-between">
                <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
                    {showResult ? (
                        alternativas.options[selectedIdx!].isCorrect ?
                            <span className="text-green-500">ACERTOU! ✨</span> :
                            <span className="text-red-500">ERROU. TENTE OUTRA!</span>
                    ) : (
                        <span>Selecione uma opção</span>
                    )}
                </div>
                {/* Confirm Button Area */}
                {!showResult && (
                    <div className="pt-4 flex justify-end">
                        <Button
                            onClick={handleConfirm}
                            disabled={selectedIdx === null || loading}
                            className="w-full md:w-auto px-8"
                        >
                            Confirmar Resposta
                        </Button>
                    </div>
                )}
            </CardFooter>
        </Card>
    )
}
