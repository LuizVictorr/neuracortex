"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Search, FileText, BookOpen, GraduationCap, Video, HelpCircle } from "lucide-react"
import {
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
} from "@/components/ui/command"
import { globalSearch, SearchResult } from "@/app/actions/global-search"
import { useDebounce } from "@/hooks/use-debounce"

export function CommandSearch({
    open,
    setOpen,
    container
}: {
    open: boolean;
    setOpen: (open: boolean) => void;
    container?: React.ComponentProps<typeof CommandDialog>["container"]
}) {
    const router = useRouter()
    const [query, setQuery] = React.useState("")
    const [results, setResults] = React.useState<SearchResult[]>([])
    const [loading, setLoading] = React.useState(false)
    const debouncedQuery = useDebounce(query, 300)

    React.useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault()
                setOpen(true)
            }
        }

        document.addEventListener("keydown", down)
        return () => document.removeEventListener("keydown", down)
    }, [setOpen])

    React.useEffect(() => {
        const fetchResults = async () => {
            if (debouncedQuery.length < 2) {
                setResults([])
                return
            }
            setLoading(true)
            try {
                const data = await globalSearch(debouncedQuery)
                setResults(data)
            } catch (err) {
                console.error(err)
            } finally {
                setLoading(false)
            }
        }

        fetchResults()
    }, [debouncedQuery])

    const onSelect = (url: string) => {
        setOpen(false)
        router.push(url)
    }

    const categories = {
        Conhecimento: results.filter(r => r.category === "Conhecimento"),
        Anotações: results.filter(r => r.category === "Anotações"),
        Disciplinas: results.filter(r => r.category === "Disciplinas"),
        Questões: results.filter(r => r.category === "Questões"),
    }

    return (
        <CommandDialog open={open} onOpenChange={setOpen} container={container}>
            <CommandInput
                placeholder="Busque em conhecimentos, anotações ou aulas..."
                value={query}
                onValueChange={setQuery}
            />
            <CommandList className="max-h-[450px]">
                {loading && (
                    <div className="p-4 text-center text-sm text-muted-foreground animate-pulse">
                        Buscando informações...
                    </div>
                )}
                <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>

                {categories.Conhecimento.length > 0 && (
                    <CommandGroup heading="Conhecimento">
                        {categories.Conhecimento.map((res) => (
                            <CommandItem
                                key={res.id}
                                value={res.title}
                                onSelect={() => onSelect(res.url)}
                                className="flex items-center gap-2 cursor-pointer"
                            >
                                <FileText className="w-4 h-4 text-emerald-500" />
                                <div className="flex flex-col">
                                    <span className="font-medium">{res.title}</span>
                                    {res.description && (
                                        <span className="text-[10px] text-muted-foreground line-clamp-1">
                                            {res.description}
                                        </span>
                                    )}
                                </div>
                            </CommandItem>
                        ))}
                    </CommandGroup>
                )}

                {categories.Anotações.length > 0 && (
                    <CommandGroup heading="Anotações">
                        {categories.Anotações.map((res) => (
                            <CommandItem
                                key={res.id}
                                value={res.title}
                                onSelect={() => onSelect(res.url)}
                                className="flex items-center gap-2 cursor-pointer"
                            >
                                <BookOpen className="w-4 h-4 text-amber-500" />
                                <div className="flex flex-col">
                                    <span className="font-medium">{res.title}</span>
                                    {res.description && (
                                        <span className="text-[10px] text-muted-foreground line-clamp-1">
                                            {res.description}
                                        </span>
                                    )}
                                </div>
                            </CommandItem>
                        ))}
                    </CommandGroup>
                )}

                {categories.Disciplinas.length > 0 && (
                    <CommandGroup heading="Disciplinas">
                        {categories.Disciplinas.map((res) => (
                            <CommandItem
                                key={res.id}
                                value={res.title}
                                onSelect={() => onSelect(res.url)}
                                className="flex items-center gap-2 cursor-pointer"
                            >
                                <Video className="w-4 h-4 text-primary" />
                                <div className="flex flex-col">
                                    <span className="font-medium">{res.title}</span>
                                    {res.description && (
                                        <span className="text-[10px] text-muted-foreground line-clamp-1">
                                            {res.description}
                                        </span>
                                    )}
                                </div>
                            </CommandItem>
                        ))}
                    </CommandGroup>
                )}

                {categories.Questões.length > 0 && (
                    <CommandGroup heading="Questões do Banco">
                        {categories.Questões.map((res) => (
                            <CommandItem
                                key={res.id}
                                value={res.title + " " + res.description}
                                onSelect={() => onSelect(res.url)}
                                className="flex items-center gap-2 cursor-pointer"
                            >
                                <GraduationCap className="w-4 h-4 text-purple-500" />
                                <div className="flex flex-col">
                                    <span className="font-medium">{res.title}</span>
                                    {res.description && (
                                        <span className="text-[10px] text-muted-foreground line-clamp-1">
                                            {res.description}
                                        </span>
                                    )}
                                </div>
                            </CommandItem>
                        ))}
                    </CommandGroup>
                )}
            </CommandList>
        </CommandDialog>
    )
}
