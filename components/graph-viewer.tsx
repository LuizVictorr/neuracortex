"use client"

import React, { useRef, useState, useEffect } from "react"
import { useTheme } from "next-themes"
import { useRouter } from "next/navigation"
import { getRenderedNodeContent } from "@/app/conexoes/actions"
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetFooter,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"

// ForceGraph3D precisa ser carregado dinamicamente para evitar erros de SSR no Next.js
import dynamic from "next/dynamic"
const ForceGraph3D = dynamic(() => import("react-force-graph-3d"), { ssr: false })

interface GraphData {
    nodes: any[]
    links: any[]
}

export function GraphViewer({ data }: { data: GraphData }) {
    const { resolvedTheme } = useTheme()
    const router = useRouter()
    const fgRef = useRef<any>(null)
    const [selectedNode, setSelectedNode] = useState<any>(null)
    const [previewContent, setPreviewContent] = useState<React.ReactNode>(null)
    const [isLoading, setIsLoading] = useState(false)

    // Configurações do Grafo
    const [nodeBaseSize, setNodeBaseSize] = useState([1.5])
    const [linkThickness, setLinkThickness] = useState([1])

    // Adaptação de cor dos nós e links pro Dark/Light Mode
    const isDark = resolvedTheme === "dark"
    const bgColor = isDark ? "#09090b" : "#ffffff" // zinc-950 | white
    const linkColor = isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.2)"
    const textColor = isDark ? "rgba(255, 255, 255, 0.8)" : "rgba(0, 0, 0, 0.8)"

    const [dimensions, setDimensions] = useState({ width: 800, height: 600 })

    useEffect(() => {
        // Ajusta as dimensões baseado na tela
        const updateDimensions = () => {
            setDimensions({
                width: window.innerWidth,
                height: window.innerHeight - 60 // subtrai a navbar
            })
        }
        updateDimensions()
        window.addEventListener("resize", updateDimensions)
        return () => window.removeEventListener("resize", updateDimensions)
    }, [])

    const handleNodeClick = async (node: any) => {
        // Abre o Shadcn Sheet com o nó selecionado para preview
        setSelectedNode(node)
        setPreviewContent(null)
        setIsLoading(true)
        try {
            const rendered = await getRenderedNodeContent(node.content)
            setPreviewContent(rendered)
        } catch (e) {
            console.error(e)
            setPreviewContent(<p className="text-red-500">Erro ao renderizar conteúdo.</p>)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="w-full h-full absolute inset-0 pt-14 -z-10">
            <ForceGraph3D
                ref={fgRef}
                width={dimensions.width}
                height={dimensions.height}
                graphData={data}
                nodeLabel="name"
                nodeColor={(node: any) => {
                    // Nós podem ter cores baseadas nos seus grupos/pastas
                    const colors = [
                        "#3b82f6", "#ef4444", "#10b981", "#f59e0b",
                        "#8b5cf6", "#ec4899", "#14b8a6", "#f97316"
                    ];
                    let hash = 0;
                    for (let i = 0; i < node.group.length; i++) {
                        hash = node.group.charCodeAt(i) + ((hash << 5) - hash);
                    }
                    return colors[Math.abs(hash) % colors.length];
                }}
                nodeVal={(node: any) => nodeBaseSize[0]}
                linkWidth={linkThickness[0]}
                linkColor={() => linkColor}
                backgroundColor={bgColor}
                onNodeClick={handleNodeClick}
                showNavInfo={true}
            />

            {/* Painel de Configurações Flutuante */}
            <Card className="absolute bottom-6 left-6 z-50 w-72 bg-background/80 backdrop-blur-md shadow-lg border-border">
                <CardHeader className="pb-4">
                    <CardTitle className="text-lg">Configurações do Grafo</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-3">
                        <div className="flex justify-between">
                            <Label>Tamanho dos Nós</Label>
                            <span className="text-xs text-muted-foreground">{nodeBaseSize[0]}x</span>
                        </div>
                        <Slider
                            value={nodeBaseSize}
                            onValueChange={setNodeBaseSize}
                            max={5}
                            min={0.5}
                            step={0.1}
                        />
                    </div>

                    <div className="space-y-3">
                        <div className="flex justify-between">
                            <Label>Espessura das Ligações</Label>
                            <span className="text-xs text-muted-foreground">{linkThickness[0]}x</span>
                        </div>
                        <Slider
                            value={linkThickness}
                            onValueChange={setLinkThickness}
                            max={5}
                            min={0.1}
                            step={0.1}
                        />
                    </div>
                </CardContent>
            </Card>

            <Sheet open={!!selectedNode} onOpenChange={(open) => !open && setSelectedNode(null)}>
                <SheetContent className="sm:max-w-md md:max-w-lg lg:max-w-xl flex flex-col h-full z-[100]">
                    <SheetHeader>
                        <SheetTitle className="text-2xl mt-4">{selectedNode?.name}</SheetTitle>
                        <SheetDescription>
                            {selectedNode?.description || "Visualizando nota..."}
                        </SheetDescription>
                    </SheetHeader>

                    <ScrollArea className="flex-1 min-h-0 mt-6 border rounded-md bg-muted/30">
                        <div className="p-4">
                            {isLoading ? (
                                <div className="flex w-full items-center justify-center text-muted-foreground text-sm py-10">
                                    Renderizando conteúdo...
                                </div>
                            ) : previewContent ? (
                                <div className="prose prose-sm dark:prose-invert max-w-none">
                                    {previewContent}
                                </div>
                            ) : (
                                <div className="prose prose-sm dark:prose-invert whitespace-pre-wrap text-sm font-mono opacity-80">
                                    {selectedNode?.content}
                                </div>
                            )}
                        </div>
                    </ScrollArea>

                    <SheetFooter className="mt-6 flex flex-row justify-between items-center w-full gap-4">
                        <Button variant="outline" className="flex-1" onClick={() => setSelectedNode(null)}>
                            Fechar
                        </Button>
                        <Button className="flex-1" onClick={() => router.push(`/conhecimento/${selectedNode?.id}`)}>
                            Abrir Página Completa
                        </Button>
                    </SheetFooter>
                </SheetContent>
            </Sheet>
        </div>
    )
}
