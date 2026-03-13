"use client"

import * as React from "react"
import { DrawingCanvas } from "@/components/drawing-canvas"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { BookPlus, Trash2, PlusCircle, AlertCircle, Pen, Eraser, Highlighter, Undo2, Redo2, FileText, Printer, RemoveFormatting, ChevronDown, Type, Maximize, Minimize } from "lucide-react"
import { createNotebook, deleteNotebook, updateNotebookTitle } from "@/app/anotacoes/actions"
import { useTheme } from "next-themes"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ResizableSidebar } from "@/components/resizable-sidebar"
import { CommandSearch } from "@/components/command-search"
import { Search } from "lucide-react"

interface NotebookPage {
    id: string
    pageNumber: number
    canvasData: string
}

interface Notebook {
    id: string
    title: string
    backgroundNoteSlug?: string | null
    backgroundContentNode?: React.ReactNode
    pages: NotebookPage[]
}

interface AvailableNote {
    slug: string
    title: string
    description: string
}

export function AnotacoesClient({
    initialNotebooks,
    availableNotes = []
}: {
    initialNotebooks: Notebook[],
    availableNotes?: { slug: string, title: string, description: string }[]
}) {
    const router = useRouter()
    const [notebooks, setNotebooks] = React.useState<Notebook[]>(initialNotebooks)

    // Sync update se o servidor atualizar o nó de renderização (ex: refresh do MDXRemote)
    React.useEffect(() => {
        setNotebooks(initialNotebooks)
    }, [initialNotebooks])

    const [activeId, setActiveId] = React.useState<string | null>(initialNotebooks[0]?.id || null)
    const [isCreating, setIsCreating] = React.useState(false)
    const [isDialogOpen, setIsDialogOpen] = React.useState(false)
    const [isEditingTitle, setIsEditingTitle] = React.useState(false)
    const [editTitle, setEditTitle] = React.useState("")
    const [searchOpen, setSearchOpen] = React.useState(false)
    const [isFullscreen, setIsFullscreen] = React.useState(false)
    const titleInputRef = React.useRef<HTMLInputElement>(null)
    const notebookRef = React.useRef<HTMLDivElement>(null)

    // Global Canvas Tools State
    const { resolvedTheme } = useTheme()
    const [strokeColor, setStrokeColor] = React.useState("#000000")
    const [penThickness, setPenThickness] = React.useState<number>(4)
    const [highlighterThickness, setHighlighterThickness] = React.useState<number>(5)

    const getPenStrokeWidth = () => {
        // Map 1-10 to pixel sizes: e.g., 1 -> 1px, 10 -> 20px
        return Math.max(1, penThickness * 2);
    }

    const getHighlighterStrokeWidth = () => {
        // Map 1-10 to pixel sizes for highlighter: e.g., 1 -> 10px, 10 -> 46px
        return 10 + ((highlighterThickness - 1) * 4);
    }

    const [activeTool, setActiveTool] = React.useState<"pen" | "highlighter" | "eraser" | "stroke-eraser" | "select" | "text">("pen")
    const [highlighterColor, setHighlighterColor] = React.useState("#facc15")
    const [zoomLevel, setZoomLevel] = React.useState(1)
    const [isPinching, setIsPinching] = React.useState(false)

    // Touch Pinch Zoom Refs
    const pinchStartDistRef = React.useRef<number | null>(null)
    const pinchStartZoomRef = React.useRef<number>(1)
    const pinchStartCenterRef = React.useRef<{ x: number, y: number } | null>(null)
    const pinchStartScrollRef = React.useRef<{ x: number, y: number } | null>(null)
    const scrollAreaRef = React.useRef<HTMLDivElement>(null)
    const activePointersRef = React.useRef<Set<number>>(new Set())

    // Canvas Ref for Undo/Redo
    const canvasRef = React.useRef<{ undo: () => void, redo: () => void }>(null)

    // Automatically adapt standard brush color to the theme (Black/White)
    React.useEffect(() => {
        if (resolvedTheme === "dark") {
            setStrokeColor(prev => prev === "#000000" ? "#ffffff" : prev)
        } else if (resolvedTheme === "light") {
            setStrokeColor(prev => prev === "#ffffff" ? "#000000" : prev)
        }
    }, [resolvedTheme])

    React.useEffect(() => {
        setNotebooks(initialNotebooks)
        if (!activeId && initialNotebooks.length > 0) {
            setActiveId(initialNotebooks[0].id)
        }
    }, [initialNotebooks])

    React.useEffect(() => {
        setIsEditingTitle(false)
    }, [activeId])

    React.useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement)
        }

        document.addEventListener("fullscreenchange", handleFullscreenChange)
        return () => document.removeEventListener("fullscreenchange", handleFullscreenChange)
    }, [])

    const toggleFullScreen = () => {
        if (!document.fullscreenElement) {
            notebookRef.current?.requestFullscreen().catch(err => {
                console.error(`Error attempting to enable full-screen mode: ${err.message}`)
            })
        } else {
            document.exitFullscreen()
        }
    }

    const activeNotebook = notebooks.find(n => n.id === activeId)

    const handleSaveSuccess = React.useCallback((notebookId: string, pageId: string, newCanvasData: string) => {
        setNotebooks(prev => prev.map(n => {
            if (n.id === notebookId) {
                return {
                    ...n,
                    pages: n.pages.map(p => p.id === pageId ? { ...p, canvasData: newCanvasData } : p)
                }
            }
            return n
        }))
    }, [])

    const handleCreate = async (customTitle?: string, backgroundNoteSlug?: string) => {
        setIsCreating(true)
        const title = customTitle || `Caderno ${notebooks.length + 1}`
        const result = await createNotebook(title, backgroundNoteSlug)
        if (result.success && result.notebook) {
            const newNotebook = {
                ...result.notebook,
                pages: (result.notebook as any).pages || []
            }
            // Adiciona localmente rápido (sem backgroundNode) para UX fluída
            setNotebooks([newNotebook as any, ...notebooks])
            setActiveId(result.notebook.id)
            if (backgroundNoteSlug) setIsDialogOpen(false) // Close dialog se usou

            // Força a recarga do Servidor para buscar o backgroundContentNode caso exista
            if (backgroundNoteSlug) {
                router.refresh()
            }
        }
        setIsCreating(false)
    }

    const handleDelete = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation()
        const confirmDelete = window.confirm("Deseja mesmo apagar este caderno?")
        if (confirmDelete) {
            const result = await deleteNotebook(id)
            if (result.success) {
                setNotebooks(notebooks.filter(n => n.id !== id))
                if (activeId === id) {
                    setActiveId(notebooks.filter(n => n.id !== id)[0]?.id || null)
                }
            }
        }
    }

    const handleTitleDoubleClick = () => {
        if (activeNotebook) {
            setEditTitle(activeNotebook.title)
            setIsEditingTitle(true)
            setTimeout(() => titleInputRef.current?.focus(), 50)
        }
    }

    const handleTitleSave = async () => {
        if (!activeNotebook || !editTitle.trim() || editTitle === activeNotebook.title) {
            setIsEditingTitle(false)
            return
        }

        // Optimistic UI update
        const newTitle = editTitle.trim()
        setNotebooks(prev => prev.map(n => n.id === activeNotebook.id ? { ...n, title: newTitle } : n))
        setIsEditingTitle(false)

        await updateNotebookTitle(activeNotebook.id, newTitle)
    }

    const handleTitleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') handleTitleSave()
        if (e.key === 'Escape') setIsEditingTitle(false)
    }

    const firstPage = activeNotebook?.pages?.[0]

    if (notebooks.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-[calc(100vh-8rem)] w-full text-center">
                <AlertCircle className="h-10 w-10 text-muted-foreground mb-4" />
                <h2 className="text-xl font-semibold">Nenhum caderno encontrado</h2>
                <p className="text-muted-foreground mt-2 mb-6">Crie seu primeiro caderno para começar a desenhar.</p>
                <div className="flex items-center gap-4">
                    <Button onClick={() => handleCreate()} disabled={isCreating}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        {isCreating ? "Criando..." : "Novo Caderno"}
                    </Button>
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline" disabled={isCreating}>
                                <FileText className="mr-2 h-4 w-4" />
                                Caderno com Fundo
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px]" container={notebookRef.current || undefined}>
                            <DialogHeader>
                                <DialogTitle>Criar a partir de uma Nota</DialogTitle>
                            </DialogHeader>
                            <ScrollArea className="h-[300px] mt-4 pr-4">
                                <div className="space-y-2">
                                    {availableNotes.map((note) => (
                                        <div
                                            key={note.slug}
                                            onClick={() => handleCreate(`Anotações: ${note.title}`, note.slug)}
                                            className="p-3 rounded-md border cursor-pointer hover:bg-accent hover:border-accent-foreground transition-colors group"
                                        >
                                            <h4 className="font-semibold text-sm group-hover:text-primary">{note.title}</h4>
                                            {note.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{note.description}</p>}
                                        </div>
                                    ))}
                                    {availableNotes.length === 0 && (
                                        <p className="text-sm text-muted-foreground text-center py-8">Nenhuma nota encontrada no Conhecimento.</p>
                                    )}
                                </div>
                            </ScrollArea>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>
        )
    }

    return (
        <>
            <CommandSearch open={searchOpen} setOpen={setSearchOpen} container={notebookRef.current || undefined} />
            <ResizableSidebar defaultWidth={280}>
                <div className="flex items-center justify-between pt-6 mb-4 px-1">
                    <h2 className="text-xl font-bold tracking-tight">Meus Cadernos</h2>
                </div>

                <div className="mb-4">
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

                <p className="text-xs text-muted-foreground mb-4 px-1">
                    Seus desenhos são salvos automaticamente no banco de dados local.
                </p>

                <div className="px-1 mb-6">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="w-full text-muted-foreground" disabled={isCreating}>
                                Criar Caderno
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-[240px]">
                            <DropdownMenuItem onClick={() => handleCreate()} className="cursor-pointer gap-2">
                                <PlusCircle className="h-4 w-4 text-muted-foreground" />
                                <span>Caderno Vazio</span>
                            </DropdownMenuItem>

                            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                                <DialogTrigger asChild>
                                    <DropdownMenuItem
                                        onSelect={(e) => {
                                            e.preventDefault(); // Prevent dropdown from closing immediately
                                            setIsDialogOpen(true);
                                        }}
                                        className="cursor-pointer gap-2"
                                    >
                                        <FileText className="h-4 w-4 text-muted-foreground" />
                                        <span>A partir de Nota do Conhecimento</span>
                                    </DropdownMenuItem>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-[425px]" container={notebookRef.current || undefined}>
                                    <DialogHeader>
                                        <DialogTitle>Criar a partir de uma Nota</DialogTitle>
                                    </DialogHeader>
                                    <ScrollArea className="h-[300px] mt-4 pr-4">
                                        <div className="space-y-2">
                                            {availableNotes.map((note) => (
                                                <div
                                                    key={note.slug}
                                                    onClick={() => {
                                                        handleCreate(`Anotações: ${note.title}`, note.slug);
                                                        setIsDialogOpen(false); // Close dialog explicitly here
                                                    }}
                                                    className="p-3 rounded-md border cursor-pointer hover:bg-accent hover:border-accent-foreground transition-colors group"
                                                >
                                                    <h4 className="font-semibold text-sm group-hover:text-primary">{note.title}</h4>
                                                    {note.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{note.description}</p>}
                                                </div>
                                            ))}
                                            {availableNotes.length === 0 && (
                                                <p className="text-sm text-muted-foreground text-center py-8">Nenhuma nota encontrada no Conhecimento.</p>
                                            )}
                                        </div>
                                    </ScrollArea>
                                </DialogContent>
                            </Dialog>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                <ScrollArea className="flex-1 -mx-2 px-3">
                    <div className="space-y-1 pb-12">
                        {notebooks.map((notebook) => (
                            <div
                                key={notebook.id}
                                onClick={() => setActiveId(notebook.id)}
                                className={`flex items-center justify-between gap-3 rounded-md px-3 py-2 text-sm font-medium cursor-pointer group transition-colors ${activeId === notebook.id
                                    ? "bg-primary text-primary-foreground"
                                    : "hover:bg-accent hover:text-accent-foreground text-foreground"
                                    }`}
                            >
                                <div className="flex items-center gap-2 truncate">
                                    <BookPlus className={`h-4 w-4 shrink-0 ${activeId === notebook.id ? "text-primary-foreground" : "text-blue-500"}`} />
                                    <span className="truncate">{notebook.title}</span>
                                </div>
                                <div
                                    onClick={(e) => handleDelete(e, notebook.id)}
                                    className={`shrink-0 opacity-0 group-hover:opacity-100 hover:text-red-400 p-1 rounded-sm ${activeId === notebook.id ? "hover:bg-primary-foreground/20" : "hover:bg-muted"}`}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </div>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
            </ResizableSidebar>

            <main className="flex h-full w-full flex-col overflow-hidden pl-4 print:pl-0 print:overflow-visible print:block print:h-auto">
                <div ref={notebookRef} className="flex flex-col h-full w-full print:block print:h-auto bg-background p-4 sm:p-0">
                    <div className="mb-4 flex items-center justify-between pt-2 group print:hidden">
                        {isEditingTitle ? (
                            <input
                                ref={titleInputRef}
                                value={editTitle}
                                onChange={(e) => setEditTitle(e.target.value)}
                                onBlur={handleTitleSave}
                                onKeyDown={handleTitleKeyDown}
                                className="text-3xl font-extrabold tracking-tight bg-transparent border-b border-primary outline-none px-1 w-full max-w-md"
                            />
                        ) : (
                            <>
                                <h1
                                    className="text-3xl font-extrabold tracking-tight cursor-text hover:text-muted-foreground transition-colors"
                                    onDoubleClick={handleTitleDoubleClick}
                                    title="Dê um duplo clique para renomear"
                                >
                                    {activeNotebook?.title}
                                </h1>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={toggleFullScreen}
                                        title={isFullscreen ? "Sair da Tela Cheia" : "Modo Tela Cheia"}
                                        className="shrink-0"
                                    >
                                        {isFullscreen ? <Minimize className="w-4 h-4 mr-2" /> : <Maximize className="w-4 h-4 mr-2" />}
                                        {isFullscreen ? "Reduzir" : "Tela Cheia"}
                                    </Button>
                                    <Button variant="outline" size="sm" onClick={() => window.print()} title="Exportar para PDF / Imprimir" className="shrink-0">
                                        <Printer className="w-4 h-4 mr-2" />
                                        Exportar
                                    </Button>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Global Toolbar */}
                    {activeNotebook && (
                        <div className="flex items-center p-3 mb-2 rounded-md border bg-muted/40 backdrop-blur-md print:hidden gap-3">
                            <Button
                                variant={activeTool === "select" ? "default" : "outline"}
                                size="icon"
                                className="w-9 h-9"
                                onClick={() => setActiveTool("select")}
                                title="Ferramenta de Seleção"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h.01" /><path d="M4 8h.01" /><path d="M4 12h.01" /><path d="M4 16h.01" /><path d="M4 20h.01" /><path d="M8 4h.01" /><path d="M12 4h.01" /><path d="M16 4h.01" /><path d="M20 4h.01" /><path d="M20 8h.01" /><path d="M20 12h.01" /><path d="M20 16h.01" /><path d="M20 20h.01" /><path d="M8 20h.01" /><path d="M12 20h.01" /><path d="M16 20h.01" /></svg>
                            </Button>

                            <Button
                                variant={activeTool === "text" ? "default" : "outline"}
                                size="icon"
                                className="w-9 h-9"
                                onClick={() => setActiveTool("text")}
                                title="Ferramenta de Texto"
                            >
                                <Type className="w-4 h-4" />
                            </Button>

                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant={["pen", "highlighter"].includes(activeTool) ? "default" : "outline"}
                                        size="icon"
                                        className="w-9 h-9"
                                        title="Caneta / Marca Texto"
                                    >
                                        {activeTool === "highlighter" ? <Highlighter className="w-4 h-4" /> : <Pen className="w-4 h-4" />}
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="start" className="min-w-[280px] p-1.5" container={notebookRef.current || undefined}>
                                    <div className="flex flex-col gap-1">
                                        <div
                                            className={`flex items-center justify-between p-1.5 px-2 rounded-md cursor-pointer ${activeTool === "pen" ? "bg-accent text-accent-foreground" : "hover:bg-accent/50"}`}
                                            onClick={() => setActiveTool("pen")}
                                        >
                                            <div className="flex items-center">
                                                <Pen className="w-4 h-4 mr-2" />
                                                <span className="font-medium text-sm">Caneta</span>
                                            </div>
                                            <div className="flex items-center gap-2 ml-2">
                                                <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
                                                    <span className="text-xs text-muted-foreground w-4 text-right">{penThickness}</span>
                                                    <input
                                                        type="range"
                                                        min="1"
                                                        max="10"
                                                        value={penThickness}
                                                        onChange={(e) => setPenThickness(parseInt(e.target.value))}
                                                        className="w-16 accent-primary"
                                                        title="Espessura da Caneta (1-10)"
                                                    />
                                                </div>
                                                <input
                                                    type="color"
                                                    value={strokeColor}
                                                    onChange={(e) => setStrokeColor(e.target.value)}
                                                    className="w-5 h-5 rounded-full cursor-pointer focus:outline-none"
                                                    title="Cor da Caneta"
                                                    onClick={(e) => { e.stopPropagation(); setActiveTool("pen") }}
                                                />
                                            </div>
                                        </div>

                                        <DropdownMenuSeparator className="my-0.5" />

                                        <div
                                            className={`flex items-center justify-between p-1.5 px-2 rounded-md cursor-pointer ${activeTool === "highlighter" ? "bg-accent text-accent-foreground" : "hover:bg-accent/50"}`}
                                            onClick={() => setActiveTool("highlighter")}
                                        >
                                            <div className="flex items-center">
                                                <Highlighter className="w-4 h-4 mr-2" />
                                                <span className="font-medium text-sm">Marca Texto</span>
                                            </div>
                                            <div className="flex items-center gap-2 ml-2">
                                                <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
                                                    <span className="text-xs text-muted-foreground w-4 text-right">{highlighterThickness}</span>
                                                    <input
                                                        type="range"
                                                        min="1"
                                                        max="10"
                                                        value={highlighterThickness}
                                                        onChange={(e) => setHighlighterThickness(parseInt(e.target.value))}
                                                        className="w-16 accent-primary"
                                                        title="Espessura do Marca Texto (1-10)"
                                                    />
                                                </div>
                                                <input
                                                    type="color"
                                                    value={highlighterColor}
                                                    onChange={(e) => setHighlighterColor(e.target.value)}
                                                    className="w-5 h-5 rounded-full cursor-pointer focus:outline-none"
                                                    title="Cor do Marca Texto"
                                                    onClick={(e) => { e.stopPropagation(); setActiveTool("highlighter") }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </DropdownMenuContent>
                            </DropdownMenu>

                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant={["eraser", "stroke-eraser"].includes(activeTool) ? "default" : "outline"}
                                        size="icon"
                                        className="w-9 h-9"
                                        title="Borracha / Apagar Traço"
                                    >
                                        {activeTool === "stroke-eraser" ? <RemoveFormatting className="w-4 h-4" /> : <Eraser className="w-4 h-4" />}
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="start" className="min-w-[160px]" container={notebookRef.current || undefined}>
                                    <DropdownMenuItem onClick={() => setActiveTool("eraser")} className="cursor-pointer flex flex-col items-start gap-1 py-2">
                                        <div className="flex items-center">
                                            <Eraser className="w-4 h-4 mr-2 text-muted-foreground" />
                                            <span>Borracha Padrão</span>
                                        </div>
                                        <p className="text-[10px] text-muted-foreground leading-tight ml-6">Apaga pequenos pedaços e rabiscos.</p>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setActiveTool("stroke-eraser")} className="cursor-pointer flex flex-col items-start gap-1 py-2">
                                        <div className="flex items-center">
                                            <RemoveFormatting className="w-4 h-4 mr-2 text-muted-foreground" />
                                            <span>Apagar Traço Inteiro</span>
                                        </div>
                                        <p className="text-[10px] text-muted-foreground leading-tight ml-6">Remove a linha conectada por inteiro.</p>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>

                            <div className="flex items-center gap-1 border-l pl-3 ml-1">
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => canvasRef.current?.undo()}
                                    title="Desfazer"
                                >
                                    <Undo2 className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => canvasRef.current?.redo()}
                                    title="Refazer"
                                >
                                    <Redo2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Zoom Indicator */}
                    {zoomLevel !== 1 && (
                        <div className="absolute top-[88px] right-6 z-30 print:hidden">
                            <Button
                                variant="secondary"
                                size="sm"
                                className="rounded-full shadow-md text-xs font-semibold px-3 border border-border bg-background/80 backdrop-blur-md"
                                onClick={() => setZoomLevel(1)}
                                title="Voltar ao tamanho original (100%)"
                            >
                                Zoom: {Math.round(zoomLevel * 100)}%
                            </Button>
                        </div>
                    )}

                    <div
                        ref={scrollAreaRef}
                        className="flex-1 w-full overflow-y-auto overflow-x-auto bg-muted/20 border-t rounded-tl-xl relative shadow-inner pb-24 print:pb-0 print:bg-transparent print:border-none print:shadow-none print:overflow-visible print:block print:h-auto"
                        onWheel={(e) => {
                            if (e.shiftKey || e.ctrlKey) {
                                // Evita scrollar a tela pra cima e pra baixo durante o zoom
                                // ctrlKey detecta o pinch físico dos trackpads
                                e.stopPropagation();

                                const zoomSpeed = e.ctrlKey ? 0.01 : 0.05
                                setZoomLevel(prev => {
                                    let newZoom = prev
                                    if (e.deltaY < 0) newZoom += zoomSpeed // Scrolled up / Pinched Out -> zoom IN
                                    if (e.deltaY > 0) newZoom -= zoomSpeed // Scrolled down / Pinched In -> zoom OUT
                                    return Math.min(Math.max(newZoom, 0.5), 3) // Constrain between 50% and 300%
                                })
                            }
                        }}
                        onTouchStart={(e) => {
                            if (e.touches.length === 2) {
                                setIsPinching(true)
                                const dx = e.touches[0].clientX - e.touches[1].clientX
                                const dy = e.touches[0].clientY - e.touches[1].clientY
                                pinchStartDistRef.current = Math.hypot(dx, dy)
                                pinchStartZoomRef.current = zoomLevel

                                if (scrollAreaRef.current) {
                                    const rect = scrollAreaRef.current.getBoundingClientRect()
                                    const cx = (e.touches[0].clientX + e.touches[1].clientX) / 2 - rect.left
                                    const cy = (e.touches[0].clientY + e.touches[1].clientY) / 2 - rect.top
                                    pinchStartCenterRef.current = { x: cx, y: cy }
                                    pinchStartScrollRef.current = {
                                        x: scrollAreaRef.current.scrollLeft,
                                        y: scrollAreaRef.current.scrollTop
                                    }
                                }
                            }
                        }}
                        onTouchMove={(e) => {
                            if (e.touches.length === 2 && pinchStartDistRef.current !== null && scrollAreaRef.current && pinchStartCenterRef.current && pinchStartScrollRef.current) {
                                const dx = e.touches[0].clientX - e.touches[1].clientX
                                const dy = e.touches[0].clientY - e.touches[1].clientY
                                const dist = Math.hypot(dx, dy)

                                const scale = dist / pinchStartDistRef.current
                                const newZoom = Math.min(Math.max(pinchStartZoomRef.current * scale, 0.5), 3)

                                const actualScale = newZoom / pinchStartZoomRef.current

                                const rect = scrollAreaRef.current.getBoundingClientRect()
                                const cx = (e.touches[0].clientX + e.touches[1].clientX) / 2 - rect.left
                                const cy = (e.touches[0].clientY + e.touches[1].clientY) / 2 - rect.top

                                const contentX = pinchStartScrollRef.current.x + pinchStartCenterRef.current.x
                                const contentY = pinchStartScrollRef.current.y + pinchStartCenterRef.current.y

                                const newScrollX = contentX * actualScale - cx
                                const newScrollY = contentY * actualScale - cy

                                setZoomLevel(newZoom)

                                // Sync scroll after the bounds grow using setTimeout
                                setTimeout(() => {
                                    if (scrollAreaRef.current) {
                                        scrollAreaRef.current.scrollLeft = newScrollX
                                        scrollAreaRef.current.scrollTop = newScrollY
                                    }
                                }, 0)
                            }
                        }}
                        onTouchEnd={(e) => {
                            if (e.touches.length < 2) {
                                setIsPinching(false)
                                pinchStartDistRef.current = null
                                pinchStartCenterRef.current = null
                                pinchStartScrollRef.current = null
                            }
                        }}
                        onPointerDownCapture={(e) => {
                            activePointersRef.current.add(e.pointerId)
                            if (activePointersRef.current.size >= 2) {
                                e.stopPropagation()
                            }
                        }}
                        onPointerMoveCapture={(e) => {
                            if (activePointersRef.current.size >= 2) {
                                e.stopPropagation()
                                e.preventDefault()
                            }
                        }}
                        onPointerUpCapture={(e) => {
                            activePointersRef.current.delete(e.pointerId)
                            if (activePointersRef.current.size > 0) {
                                e.stopPropagation()
                            }
                        }}
                        onPointerCancelCapture={(e) => {
                            activePointersRef.current.delete(e.pointerId)
                            if (activePointersRef.current.size > 0) {
                                e.stopPropagation()
                            }
                        }}
                    >
                        {/* Wrapper for scroll box sizing syncing with transform: scale */}
                        <div
                            style={{
                                width: `${Math.max(100, zoomLevel * 100)}%`,
                                minHeight: `${Math.max(100, zoomLevel * 100)}%`,
                                transition: "all 0.1s ease-out",
                            }}
                            className="flex justify-center"
                        >
                            <div
                                className="w-full max-w-[800px] flex-col gap-12 py-10 px-4 print:py-0 print:px-0 print:block print:w-full"
                                style={{
                                    transform: `scale(${zoomLevel})`,
                                    transformOrigin: "top center",
                                    transition: "transform 0.1s ease-out",
                                    pointerEvents: isPinching ? "none" : "auto"
                                }}
                            >
                                {firstPage && activeNotebook && (
                                    <DrawingCanvas
                                        ref={canvasRef}
                                        key={firstPage.id}
                                        notebookId={activeNotebook.id}
                                        pageId={firstPage.id}
                                        initialData={firstPage.canvasData}
                                        backgroundContentNode={activeNotebook.backgroundContentNode}
                                        onSaveSuccess={handleSaveSuccess}
                                        strokeColor={
                                            activeTool === "stroke-eraser" ? "rgba(255, 0, 0, 0.1)" :
                                                activeTool === "highlighter" ? `${highlighterColor}66` : strokeColor
                                        }
                                        strokeWidth={activeTool === "highlighter" ? getHighlighterStrokeWidth() : activeTool === "stroke-eraser" ? 12 : activeTool === "select" ? 0 : getPenStrokeWidth()}
                                        pageNumber={firstPage.pageNumber}
                                        activeTool={activeTool}
                                        zoomLevel={zoomLevel}
                                    />
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </>
    )
}
