"use client"

import { useState, useEffect } from "react"
import { Search, Filter, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { CommandSearch } from "@/components/command-search"
import { getFilterOptions, QuestionFilterParams } from "../actions"

interface QuestionFilterProps {
    onApply: (filters: QuestionFilterParams) => void
}

export function QuestionFilter({ onApply }: QuestionFilterProps) {
    const [options, setOptions] = useState<{
        disciplinas: { id: string; nome: string }[]
        areas: { id: string; nome: string }[]
        assuntos: { id: string; nome: string }[]
    }>({ disciplinas: [], areas: [], assuntos: [] })

    const [filters, setFilters] = useState<QuestionFilterParams>({
        take: 10
    })
    const [searchOpen, setSearchOpen] = useState(false)

    useEffect(() => {
        async function loadOptions() {
            const res = await getFilterOptions()
            if (res.success) {
                setOptions({
                    disciplinas: res.disciplinas || [],
                    areas: res.areas || [],
                    assuntos: res.assuntos || []
                })
            }
        }
        loadOptions()
    }, [])

    const handleReset = () => {
        setFilters({ take: 10 })
    }

    const handleApply = () => {
        onApply(filters)
    }

    return (
        <Card className="sticky top-20 border-border bg-card/50 backdrop-blur-sm">
            <CardHeader className="pb-3">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                    <Filter className="w-5 h-5 text-primary" />
                    Filtros
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Search Trigger */}
                <div className="space-y-2">
                    <Label className="text-xs uppercase tracking-wider text-muted-foreground">Pesquisar no banco</Label>
                    <Button
                        variant="outline"
                        onClick={() => setSearchOpen(true)}
                        className="w-full justify-start text-muted-foreground font-normal bg-background/50 border-border/60 hover:bg-muted/30 hover:border-primary/30 group transition-all duration-300 rounded-lg px-3 h-10"
                    >
                        <Search className="mr-2 h-4 w-4 group-hover:text-primary transition-colors" />
                        <span className="flex-1 text-left">Fazer busca global...</span>
                        <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100 uppercase">
                            <span className="text-xs">Ctrl+</span>K
                        </kbd>
                    </Button>
                    <CommandSearch open={searchOpen} setOpen={setSearchOpen} />
                </div>

                <Separator />

                {/* Grupo 1: Área, Disciplina, Assunto */}
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Conhecimento</Label>
                            <Select
                                value={filters.areaConhecimentoId || "all"}
                                onValueChange={(v) => {
                                    const newAreaId = v === "all" ? undefined : v
                                    setFilters(prev => ({
                                        ...prev,
                                        areaConhecimentoId: newAreaId,
                                        disciplinaId: undefined, // Reset child
                                        assuntoId: undefined    // Reset grandchild
                                    }))
                                }}
                            >
                                <SelectTrigger className="bg-background/50 w-full">
                                    <SelectValue placeholder="Área" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todas as Áreas</SelectItem>
                                    {options.areas.map(area => (
                                        <SelectItem key={area.id} value={area.id}>{area.nome}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Disciplina</Label>
                            <Select
                                value={filters.disciplinaId || "all"}
                                onValueChange={(v) => {
                                    const newDiscId = v === "all" ? undefined : v
                                    setFilters(prev => ({
                                        ...prev,
                                        disciplinaId: newDiscId,
                                        assuntoId: undefined // Reset child
                                    }))
                                }}
                            >
                                <SelectTrigger className="bg-background/50 w-full">
                                    <SelectValue placeholder="Disciplina" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todas as Disciplinas</SelectItem>
                                    {options.disciplinas
                                        .filter(d => !filters.areaConhecimentoId || (d as any).areaConhecimentoId === filters.areaConhecimentoId)
                                        .map(dis => (
                                            <SelectItem key={dis.id} value={dis.id}>{dis.nome}</SelectItem>
                                        ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Assunto</Label>
                            <Select
                                value={filters.assuntoId || "all"}
                                onValueChange={(v) => setFilters(prev => ({ ...prev, assuntoId: v === "all" ? undefined : v }))}
                            >
                                <SelectTrigger className="bg-background/50 w-full">
                                    <SelectValue placeholder="Assunto" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todos os Assuntos</SelectItem>
                                    {options.assuntos
                                        .filter(a => !filters.disciplinaId || (a as any).disciplinaId === filters.disciplinaId)
                                        .map(as => (
                                            <SelectItem key={as.id} value={as.id}>{as.nome}</SelectItem>
                                        ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>

                <Separator />

                {/* Grupo 2: Instituição, Ano, Dificuldade, Qtde */}
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Instituição</Label>
                            <Input
                                placeholder="Ex: ENEM"
                                value={filters.instituicao || ""}
                                onChange={(e) => setFilters(prev => ({ ...prev, instituicao: e.target.value }))}
                                className="bg-background/50 w-full"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Ano</Label>
                            <Input
                                type="number"
                                placeholder="AAAA"
                                value={filters.ano || ""}
                                onChange={(e) => setFilters(prev => ({ ...prev, ano: parseInt(e.target.value) || undefined }))}
                                className="bg-background/50 w-full"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Dificuldade</Label>
                            <Select
                                value={filters.dificuldade || "all"}
                                onValueChange={(v) => setFilters(prev => ({ ...prev, dificuldade: v === "all" ? undefined : v }))}
                            >
                                <SelectTrigger className="bg-background/50 w-full">
                                    <SelectValue placeholder="Nível" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todas</SelectItem>
                                    <SelectItem value="Fácil">Fácil</SelectItem>
                                    <SelectItem value="Médio">Médio</SelectItem>
                                    <SelectItem value="Difícil">Difícil</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Qtde</Label>
                            <Input
                                type="number"
                                value={filters.take || 10}
                                onChange={(e) => setFilters(prev => ({ ...prev, take: parseInt(e.target.value) || 10 }))}
                                className="bg-background/50 w-full"
                            />
                        </div>
                    </div>
                </div>

                <Separator />

                {/* Grupo 3: Já Acertei e Já Errei */}
                <div className="space-y-4 pt-1">
                    <label
                        htmlFor="jaAcertei"
                        className="flex items-center justify-between group cursor-pointer hover:bg-muted/30 p-2 -mx-2 rounded-lg transition-colors border border-transparent hover:border-border/40"
                    >
                        <div className="space-y-0.5">
                            <span className="text-sm font-medium">Já Acertei</span>
                            <p className="text-[10px] text-muted-foreground">Questões resolvidas</p>
                        </div>
                        <Switch
                            id="jaAcertei"
                            checked={filters.jaAcertei || false}
                            onCheckedChange={(checked) => setFilters(prev => ({ ...prev, jaAcertei: checked ? true : undefined }))}
                        />
                    </label>
                    <label
                        htmlFor="jaErrei"
                        className="flex items-center justify-between group cursor-pointer hover:bg-muted/30 p-2 -mx-2 rounded-lg transition-colors border border-transparent hover:border-border/40"
                    >
                        <div className="space-y-0.5">
                            <span className="text-sm font-medium">Já Errei</span>
                            <p className="text-[10px] text-muted-foreground">Questões com erro</p>
                        </div>
                        <Switch
                            id="jaErrei"
                            checked={filters.jaErrei || false}
                            onCheckedChange={(checked) => setFilters(prev => ({ ...prev, jaErrei: checked ? true : undefined }))}
                        />
                    </label>
                </div>
            </CardContent>

            <Separator className="bg-border/40" />

            {/* Grupo 4: Botões */}
            <CardFooter className="flex gap-2 pt-6 pb-6 shadow-[0_-10px_20px_rgba(0,0,0,0.02)]">
                <Button variant="outline" className="flex-1 font-semibold hover:bg-muted/50 border-border/60" onClick={handleReset}>
                    <RotateCcw className="w-4 h-4 mr-2 opacity-50" />
                    Limpar
                </Button>
                <Button className="flex-1 font-bold shadow-lg shadow-primary/10" onClick={handleApply}>
                    <Search className="w-4 h-4 mr-2" />
                    Aplicar
                </Button>
            </CardFooter>
        </Card>
    )
}
