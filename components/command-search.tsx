"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Search, FileText } from "lucide-react"
import {
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
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

    const conhecimentoResults = results.filter(r => r.category === "Conhecimento")

    return (
        <CommandDialog open={open} onOpenChange={setOpen} container={container}>
            <CommandInput
                placeholder="Busque em conhecimentos..."
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

                {conhecimentoResults.length > 0 && (
                    <CommandGroup heading="Conhecimento">
                        {conhecimentoResults.map((res) => (
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
            </CommandList>
        </CommandDialog>
    )
}
