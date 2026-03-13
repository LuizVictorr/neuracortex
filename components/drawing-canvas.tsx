"use client"

import * as React from "react"
import { ReactSketchCanvas, ReactSketchCanvasRef, CanvasPath, Point } from "react-sketch-canvas"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"
import { updateNotebookPage } from "@/app/anotacoes/actions"

interface TextBox {
    id: string;
    x: number;
    y: number;
    content: string;
    color: string;
    fontSize: number;
    width: number;
    height: number;
}

interface CanvasData {
    version: number;
    paths: CanvasPath[];
    textBoxes: TextBox[];
}

export const DrawingCanvas = React.forwardRef(function DrawingCanvas({
    notebookId,
    pageId,
    initialData,
    backgroundContentNode,
    onSaveSuccess,
    // Global Tools Props
    strokeColor = "#000000",
    strokeWidth = 4,
    activeTool = "pen",
    pageNumber = 1,
    zoomLevel = 1,
    onCanvasInteraction
}: {
    notebookId: string,
    pageId: string,
    initialData?: string | null,
    onSaveSuccess?: (notebookId: string, pageId: string, data: string) => void,
    strokeColor?: string,
    strokeWidth?: number,
    activeTool?: "pen" | "highlighter" | "eraser" | "stroke-eraser" | "select" | "text",
    pageNumber?: number,
    zoomLevel?: number,
    backgroundContentNode?: React.ReactNode,
    onCanvasInteraction?: (pageId: string, getPathsFunc: () => Promise<any>) => void
}, ref: React.ForwardedRef<{ undo: () => void, redo: () => void }>) {
    const canvasRef = React.useRef<ReactSketchCanvasRef>(null)
    const [isSaving, setIsSaving] = React.useState(false)
    const [saveSuccess, setSaveSuccess] = React.useState(false)
    const saveTimeoutRef = React.useRef<NodeJS.Timeout | null>(null)
    const isProcessingEraserRef = React.useRef(false)
    const lastSavedDataRef = React.useRef<string | null>(null)

    // Custom 20-step undo/redo History
    const historyRef = React.useRef<CanvasPath[][]>([])
    const historyIndexRef = React.useRef<number>(-1)
    const isRestoringHistoryRef = React.useRef(false)
    const historyDebounceRef = React.useRef<NodeJS.Timeout | null>(null)

    // Ferramentas de Apagar e Selecionar Customizadas
    const [isErasing, setIsErasing] = React.useState(false)
    const [eraserPoints, setEraserPoints] = React.useState<Point[]>([])

    // Lasso Tool States
    const [isSelecting, setIsSelecting] = React.useState(false)
    const [selectionPoints, setSelectionPoints] = React.useState<Point[]>([])
    const [selectedPaths, setSelectedPaths] = React.useState<CanvasPath[]>([])
    const [isDraggingSelection, setIsDraggingSelection] = React.useState(false)
    const [selectionOffset, setSelectionOffset] = React.useState({ x: 0, y: 0 })
    const [startDragPos, setStartDragPos] = React.useState({ x: 0, y: 0 })

    const [textBoxes, setTextBoxes] = React.useState<TextBox[]>([])
    const [draggingTextBoxId, setDraggingTextBoxId] = React.useState<string | null>(null)
    const [editingTextBoxId, setEditingTextBoxId] = React.useState<string | null>(null)
    // Ref para o offset temporário para evitar re-renders durante o arrasto (Performance V2)
    const tempDragOffsetRef = React.useRef({ x: 0, y: 0 })

    const overlayRef = React.useRef<SVGSVGElement>(null)
    const proxyRef = React.useRef<HTMLDivElement>(null)
    const textBoxesRef = React.useRef<TextBox[]>([])
    const lastToolRef = React.useRef(activeTool)


    // Sincroniza a ref com o estado para evitar stale closures no handleSave
    React.useEffect(() => {
        textBoxesRef.current = textBoxes
    }, [textBoxes])

    const handleSave = React.useCallback(async () => {
        // Usa a ref para sempre ter os dados mais recentes sem recriar a função
        if (!notebookId || !pageId || !canvasRef.current || !hasLoadedPathsRef.current) return

        try {
            const paths = await canvasRef.current.exportPaths()
            const data: CanvasData = {
                version: 2,
                paths,
                textBoxes: textBoxesRef.current
            }
            const dataStr = JSON.stringify(data)

            // Change Detection: Evita salvar se nada mudou de fato
            if (dataStr === lastSavedDataRef.current) return;

            setIsSaving(true)
            setSaveSuccess(false)

            const result = await updateNotebookPage(pageId, dataStr)

            if (result.success) {
                lastSavedDataRef.current = dataStr;
                setSaveSuccess(true)
                if (onSaveSuccess) onSaveSuccess(notebookId, pageId, dataStr)
                setTimeout(() => setSaveSuccess(false), 3000)
            }
        } catch (e) {
            console.error("Erro ao salvar:", e)
        } finally {
            setIsSaving(false)
        }
    }, [notebookId, pageId, onSaveSuccess])

    // Gatilho unificado para salvamento (debounce ajustável)
    const triggerSave = React.useCallback((forcedDelay?: number) => {
        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

        // Se estivermos no modo texto, o auto-save é muito mais longo (10s) para não travar a digitação,
        // a menos que um delay específico (curto) seja forçado (ex: ao sair da caixa ou trocar ferramenta).
        const delay = forcedDelay ?? (activeTool === "text" ? 10000 : 1500);

        saveTimeoutRef.current = setTimeout(() => {
            handleSave();
        }, delay);
    }, [handleSave, activeTool]);

    React.useImperativeHandle(ref, () => ({
        undo: () => {
            if (historyIndexRef.current > 0) {
                isRestoringHistoryRef.current = true
                historyIndexRef.current -= 1
                const prevState = historyRef.current[historyIndexRef.current]

                if (canvasRef.current) {
                    canvasRef.current.clearCanvas()
                    if (prevState && prevState.length > 0) {
                        canvasRef.current.loadPaths(prevState)
                    }
                }

                setTimeout(() => {
                    triggerSave(500)
                    isRestoringHistoryRef.current = false
                }, 100)
            }
        },
        redo: () => {
            if (historyIndexRef.current < historyRef.current.length - 1) {
                isRestoringHistoryRef.current = true
                historyIndexRef.current += 1
                const nextState = historyRef.current[historyIndexRef.current]

                if (canvasRef.current) {
                    canvasRef.current.clearCanvas()
                    if (nextState && nextState.length > 0) {
                        canvasRef.current.loadPaths(nextState)
                    }
                }

                setTimeout(() => {
                    triggerSave(500)
                    isRestoringHistoryRef.current = false
                }, 100)
            }
        }
    }), [handleSave])

    // Event Interceptor for ReactSketchCanvas Zoom scaling fixes
    const interceptPointerEvent = (e: React.PointerEvent<HTMLDivElement>) => {
        // Only proxy scaled coords for the internal SketchCanvas tool. Stroke Eraser and lasso uses their own normalized math.
        if (zoomLevel === 1 || activeTool === "stroke-eraser" || activeTool === "select") return;
        if ((e.nativeEvent as any)._isZoomProxy) return;

        // Stop the synthetic event so the library sees only our dispatched fake event
        e.stopPropagation();

        if (proxyRef.current) {
            const canvasRect = proxyRef.current.getBoundingClientRect();

            // Inverse map screen coordinates to unscaled logical coordinates relative to canvas origin
            const fakeClientX = canvasRect.left + (e.clientX - canvasRect.left) / zoomLevel;
            const fakeClientY = canvasRect.top + (e.clientY - canvasRect.top) / zoomLevel;

            // Reconstruct a native event using the original properties but swapped out coordinates
            const fakeEvent = new PointerEvent(e.type, {
                bubbles: true,
                cancelable: true,
                clientX: fakeClientX,
                clientY: fakeClientY,
                pointerId: e.pointerId,
                pointerType: e.pointerType,
                pressure: e.pressure,
                isPrimary: e.isPrimary,
                button: e.button,
                buttons: e.buttons
            });

            // Mark fake to avoid infinite recursion
            (fakeEvent as any)._isZoomProxy = true;
            e.target.dispatchEvent(fakeEvent);
        }
    };

    const hasLoadedPathsRef = React.useRef(false)
    const [canvasHeight, setCanvasHeight] = React.useState(1131)
    const bottomRef = React.useRef<HTMLDivElement>(null)

    // Lógica para crescer o canvas infinitamente para baixo
    React.useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting) {
                // Quando encostar no fundo da folha atual, aumenta mais um "A4"
                setCanvasHeight(prev => prev + 1131)
            }
        }, {
            root: null,
            rootMargin: '100px', // Aciona antes de chegar exatamente no fim
            threshold: 0.1
        })

        if (bottomRef.current) {
            observer.observe(bottomRef.current)
        }

        return () => observer.disconnect()
    }, [])

    // Load existing data when component mounts
    React.useEffect(() => {
        if (hasLoadedPathsRef.current) return;

        let retryCount = 0;
        const maxRetries = 5;

        const tryLoadPaths = () => {
            if (canvasRef.current) {
                try {
                    const parsed = (initialData && initialData !== "[]") ? JSON.parse(initialData) : null;

                    let paths: CanvasPath[] = []
                    let loadedTextBoxes: TextBox[] = []

                    if (parsed) {
                        if (Array.isArray(parsed)) {
                            // Version 1: Legacy format (just an array of paths)
                            paths = parsed
                        } else if (parsed.version === 2) {
                            // Version 2: New format (object with paths and textBoxes)
                            paths = parsed.paths || []
                            loadedTextBoxes = parsed.textBoxes || []
                        }
                    }

                    if (paths.length > 0) {
                        console.log(`[Canvas] Carregando ${paths.length} traços para a página ${pageNumber}...`)
                        canvasRef.current.clearCanvas()
                        canvasRef.current.loadPaths(paths)

                        // Set base history
                        historyRef.current = [paths]
                        historyIndexRef.current = 0
                        setSelectedPaths([])
                        setSelectionOffset({ x: 0, y: 0 })
                    } else {
                        // Empty base history
                        historyRef.current = [[]]
                        historyIndexRef.current = 0
                        setSelectedPaths([])
                        setSelectionOffset({ x: 0, y: 0 })
                    }

                    setTextBoxes(loadedTextBoxes)
                    lastSavedDataRef.current = initialData || null
                } catch (e) {
                    console.error("[Canvas] Erro ao fazer parse dos caminhos antigos:", e)
                } finally {
                    hasLoadedPathsRef.current = true
                    // Garante que a página nova nasça com a ferramenta correta ativa
                    setTimeout(() => {
                        canvasRef.current?.eraseMode(activeTool === "eraser")
                    }, 50)
                }
            } else if (retryCount < maxRetries) {
                retryCount++;
                console.log(`[Canvas] Ref não pronta. Tentativa ${retryCount}...`)
                setTimeout(tryLoadPaths, 200)
            }
        }

        // Delay inicial para dar tempo do SVG inicializar
        setTimeout(tryLoadPaths, 100)
    }, [initialData, pageNumber, activeTool])

    // Sincroniza o eraser mode que vem do Toolbar Global
    React.useEffect(() => {
        canvasRef.current?.eraseMode(activeTool === "eraser")
    }, [activeTool])



    // --- Lógica Matemática do Falso-Borracha (Stroke Eraser) e Lasso (Select) ---
    // Checa intersecção baseada primeiramente num bounding-box folgado para otimizar, 
    // e depois em distância do ponto se bounding box colidir.
    const rectIntersect = (p1minX: number, p1maxX: number, p1minY: number, p1maxY: number,
        p2minX: number, p2maxX: number, p2minY: number, p2maxY: number) => {
        return !(p2minX > p1maxX || p2maxX < p1minX || p2minY > p1maxY || p2maxY < p1minY)
    }

    // Algoritmo Ray-Casting para detectar Point-in-Polygon (usado no Lasso tool)
    const pointInPolygon = (point: Point, polygon: Point[]) => {
        let isInside = false;
        let p1 = polygon[0], p2;
        for (let i = 1; i <= polygon.length; i++) {
            p2 = polygon[i % polygon.length];
            if (point.y > Math.min(p1.y, p2.y)) {
                if (point.y <= Math.max(p1.y, p2.y)) {
                    if (point.x <= Math.max(p1.x, p2.x)) {
                        if (p1.y !== p2.y) {
                            const xinters = (point.y - p1.y) * (p2.x - p1.x) / (p2.y - p1.y) + p1.x;
                            if (p1.x === p2.x || point.x <= xinters) {
                                isInside = !isInside;
                            }
                        }
                    }
                }
            }
            p1 = p2;
        }
        return isInside;
    }

    // Verifica se um path inteiro foi contornado pelo Lasso (exige > 50% dos pontos dentro do laço)
    const isPathSelected = (pathPoints: Point[], polygon: Point[]) => {
        if (polygon.length < 3 || pathPoints.length === 0) return false;

        let pointsInside = 0;
        const totalPointsToCheck = Math.max(1, Math.floor(pathPoints.length / 5)); // Sample 20% of points for speed

        for (let i = 0; i < pathPoints.length; i += 5) {
            if (pointInPolygon(pathPoints[i], polygon)) {
                pointsInside++;
            }
        }

        return (pointsInside / totalPointsToCheck) >= 0.5; // Se metade da amostra está dentro, tá selecionado
    }

    const checkPathCollision = (eraserPath: Point[], tgtPath: Point[], eraserThickness: number) => {
        if (eraserPath.length === 0 || tgtPath.length === 0) return false

        let epMinX = Infinity, epMaxX = -Infinity, epMinY = Infinity, epMaxY = -Infinity
        eraserPath.forEach(pt => {
            if (pt.x < epMinX) epMinX = pt.x
            if (pt.x > epMaxX) epMaxX = pt.x
            if (pt.y < epMinY) epMinY = pt.y
            if (pt.y > epMaxY) epMaxY = pt.y
        })
        const ePad = eraserThickness

        let tpMinX = Infinity, tpMaxX = -Infinity, tpMinY = Infinity, tpMaxY = -Infinity
        tgtPath.forEach(pt => {
            if (pt.x < tpMinX) tpMinX = pt.x
            if (pt.x > tpMaxX) tpMaxX = pt.x
            if (pt.y < tpMinY) tpMinY = pt.y
            if (pt.y > tpMaxY) tpMaxY = pt.y
        })

        // Fast bounding box check
        if (!rectIntersect(epMinX - ePad, epMaxX + ePad, epMinY - ePad, epMaxY + ePad, tpMinX, tpMaxX, tpMinY, tpMaxY)) {
            return false
        }

        // Detailed point-distance check
        const distSqThreshold = (eraserThickness * 1.5) ** 2
        for (let i = 0; i < eraserPath.length; i += 2) { // Skip some points for performance
            const ep = eraserPath[i]
            for (let j = 0; j < tgtPath.length; j += Math.max(1, Math.floor(tgtPath.length / 20))) {
                const tp = tgtPath[j]
                const distSq = (ep.x - tp.x) ** 2 + (ep.y - tp.y) ** 2
                if (distSq <= distSqThreshold) {
                    return true
                }
            }
        }
        return false
    }

    const handleCanvasChange = React.useCallback(async (updatedPaths: CanvasPath[]) => {
        if (isProcessingEraserRef.current || isRestoringHistoryRef.current) return

        // Debounce history recording to avoid chunking single strokes
        if (historyDebounceRef.current) {
            clearTimeout(historyDebounceRef.current)
        }

        historyDebounceRef.current = setTimeout(async () => {
            // Mantenha apenas os historicos validos apos um novo traço
            const currentPaths = await canvasRef.current?.exportPaths() || []

            // Se estamos no meio do historico e fazemos um novo traço, apaga o futuro
            if (historyIndexRef.current < historyRef.current.length - 1) {
                historyRef.current = historyRef.current.slice(0, historyIndexRef.current + 1)
            }

            // Sempre adiciona o novo traço
            historyRef.current.push(currentPaths)

            // Limita a 21 estados (o base + 20 traços de "undo")
            if (historyRef.current.length > 21) {
                historyRef.current.shift() // remove o mais antigo
            } else {
                historyIndexRef.current += 1 // so avança o indice se não shiftou o antigo
            }

            if (historyIndexRef.current >= historyRef.current.length) {
                historyIndexRef.current = historyRef.current.length - 1
            }
        }, 500) // Wait 500ms after drawing stops before committing to history

        // Notifica o pai quem é o Canvas ativo e como pegar os paths dele
        if (onCanvasInteraction && canvasRef.current) {
            onCanvasInteraction(pageId, () => canvasRef.current!.exportPaths())
        }

        // Gatilho unificado com debounce de 1.5s para desenho
        triggerSave(1500)
    }, [onCanvasInteraction, pageId, triggerSave])

    // --- Tratamento de Eventos do Overlay (Apenas usado quando activeTool === "stroke-eraser") ---
    const getCoordinates = (e: React.PointerEvent<SVGSVGElement>) => {
        if (!overlayRef.current) return { x: 0, y: 0 }
        const rect = overlayRef.current.getBoundingClientRect()
        return {
            x: (e.clientX - rect.left) / zoomLevel,
            y: (e.clientY - rect.top) / zoomLevel
        }
    }

    const onOverlayPointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
        if (activeTool === "stroke-eraser") {
            setIsErasing(true)
            setEraserPoints([getCoordinates(e)])
            e.currentTarget.setPointerCapture(e.pointerId)
        } else if (activeTool === "select") {
            const coords = getCoordinates(e)

            // Check if user clicked inside the current selection bounding box
            if (selectedPaths.length > 0) {
                // Determine bounding box of current selection
                let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity
                selectedPaths.forEach(path => {
                    path.paths.forEach(pt => {
                        if (pt.x < minX) minX = pt.x
                        if (pt.x > maxX) maxX = pt.x
                        if (pt.y < minY) minY = pt.y
                        if (pt.y > maxY) maxY = pt.y
                    })
                })

                // Add padding to bounding box
                const pad = 10
                minX -= pad; maxX += pad; minY -= pad; maxY += pad;
                minX += selectionOffset.x; maxX += selectionOffset.x;
                minY += selectionOffset.y; maxY += selectionOffset.y;

                if (coords.x >= minX && coords.x <= maxX && coords.y >= minY && coords.y <= maxY) {
                    // Start dragging the selection
                    setIsDraggingSelection(true)
                    setStartDragPos({ x: coords.x, y: coords.y })
                    e.currentTarget.setPointerCapture(e.pointerId)
                    return
                } else {
                    // Clicked outside selection, commit it
                    commitSelection()
                }
            }

            // Start a new Lasso Selection
            setIsSelecting(true)
            setSelectionPoints([coords])
            e.currentTarget.setPointerCapture(e.pointerId)
        }
    }

    const onOverlayPointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
        const coords = getCoordinates(e)
        if (activeTool === "stroke-eraser" && isErasing) {
            setEraserPoints(prev => [...prev, coords])
        } else if (activeTool === "select") {
            if (isSelecting) {
                setSelectionPoints(prev => [...prev, coords])
            } else if (isDraggingSelection) {
                const dx = coords.x - startDragPos.x
                const dy = coords.y - startDragPos.y
                setSelectionOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }))
                setStartDragPos(coords)
            }
        }
    }

    const commitSelection = React.useCallback(async () => {
        if (selectedPaths.length === 0) return

        // Apply offset to all points
        const translatedPaths = selectedPaths.map(path => ({
            ...path,
            paths: path.paths.map(pt => ({
                x: pt.x + selectionOffset.x,
                y: pt.y + selectionOffset.y
            }))
        }))

        try {
            if (canvasRef.current) {
                // Get current canvas state
                const currentPaths = await canvasRef.current.exportPaths()

                // Merge translated paths back
                const mergedPaths = [...currentPaths, ...translatedPaths]

                canvasRef.current.clearCanvas()
                setTimeout(() => {
                    if (canvasRef.current && mergedPaths.length > 0) {
                        canvasRef.current.loadPaths(mergedPaths)
                    }

                    // Push history manually
                    setTimeout(() => {
                        handleCanvasChange(mergedPaths)
                        triggerSave(100)
                    }, 100)
                }, 50)
            }
        } catch (e) {
            console.error("Erro ao commitar seleção:", e)
        }

        // Reset selection state
        setSelectedPaths([])
        setSelectionOffset({ x: 0, y: 0 })
    }, [selectedPaths, selectionOffset, handleSave, handleCanvasChange])

    // Auto-commit selection if user switches to a different tool while something is selected
    React.useEffect(() => {
        if (activeTool !== "select" && selectedPaths.length > 0) {
            commitSelection()
        }

        // Só fecha a edição se a ferramenta REALMENTE mudou
        if (lastToolRef.current !== activeTool) {
            setEditingTextBoxId(null)
            lastToolRef.current = activeTool
            // Ao trocar de ferramenta, salva rapidamente
            triggerSave(500)
        }
    }, [activeTool, selectedPaths, commitSelection, triggerSave])

    const onOverlayPointerUp = async (e: React.PointerEvent<SVGSVGElement>) => {
        if (activeTool === "select" && isDraggingSelection) {
            setIsDraggingSelection(false)
            e.currentTarget.releasePointerCapture(e.pointerId)
            return
        }

        if (activeTool === "text" && draggingTextBoxId) {
            setDraggingTextBoxId(null)
            e.currentTarget.releasePointerCapture(e.pointerId)
            triggerSave(500)
            return
        }

        if (activeTool === "select" && isSelecting) {
            setIsSelecting(false)
            e.currentTarget.releasePointerCapture(e.pointerId)

            if (selectionPoints.length < 3 || !canvasRef.current) {
                setSelectionPoints([])
                return
            }

            try {
                const currentPaths = await canvasRef.current.exportPaths()
                if (currentPaths.length > 0) {
                    const remainingPaths: CanvasPath[] = []
                    const newSelectedPaths: CanvasPath[] = []

                    for (let i = 0; i < currentPaths.length; i++) {
                        const path = currentPaths[i]
                        if (!path || !path.paths) continue

                        if (isPathSelected(path.paths, selectionPoints)) {
                            newSelectedPaths.push(path)
                        } else {
                            remainingPaths.push(path)
                        }
                    }

                    if (newSelectedPaths.length > 0) {
                        // Clear canvas and load only remaining paths
                        canvasRef.current.clearCanvas()
                        setTimeout(() => {
                            if (remainingPaths.length > 0 && canvasRef.current) {
                                canvasRef.current.loadPaths(remainingPaths)
                            }
                            // Store selected paths to render in SVG Overlay floating
                            setSelectedPaths(newSelectedPaths)
                            setSelectionOffset({ x: 0, y: 0 })
                        }, 50)
                    }
                }
            } catch (err) {
                console.error("Erro no Lasso Select:", err)
            }

            setSelectionPoints([])
            return
        }

        if (!isErasing || activeTool !== "stroke-eraser") return
        setIsErasing(false)
        e.currentTarget.releasePointerCapture(e.pointerId)

        if (eraserPoints.length < 2 || isProcessingEraserRef.current || !canvasRef.current) {
            setEraserPoints([])
            return
        }

        isProcessingEraserRef.current = true
        try {
            const currentPaths = await canvasRef.current.exportPaths()

            if (currentPaths.length > 0) {
                const remainingPaths: CanvasPath[] = []
                let removedAny = false

                for (let i = 0; i < currentPaths.length; i++) {
                    const path = currentPaths[i]
                    if (!path || !path.paths) continue

                    if (checkPathCollision(eraserPoints, path.paths, strokeWidth + (path.strokeWidth || 4))) {
                        removedAny = true
                    } else {
                        remainingPaths.push(path)
                    }
                }

                if (removedAny) {
                    canvasRef.current.clearCanvas()
                    setTimeout(() => {
                        if (remainingPaths.length > 0 && canvasRef.current) {
                            canvasRef.current.loadPaths(remainingPaths)
                        }
                        isProcessingEraserRef.current = false

                        // Push new state to custom history manually since we bypassed normal drawing
                        setTimeout(() => {
                            if (remainingPaths.length > 0) {
                                handleCanvasChange(remainingPaths)
                            } else {
                                handleCanvasChange([])
                            }
                        }, 100)

                        triggerSave(100) // Força um save imediato após exclusão bem-sucedida
                    }, 50)
                } else {
                    isProcessingEraserRef.current = false
                }
            } else {
                isProcessingEraserRef.current = false
            }
        } catch (error) {
            console.error("Erro ao processar apagador:", error)
            isProcessingEraserRef.current = false
        }

        setEraserPoints([])
    }

    return (
        <div
            className="relative flex flex-col w-full max-w-[800px] rounded-sm bg-white shadow-md overflow-hidden shrink-0 ring-1 ring-black/5 dark:ring-white/10 dark:bg-card transition-[height] print:overflow-visible print:shadow-none print:ring-0 print:border-none print:m-0 print:p-0"
            style={{ height: `${canvasHeight}px` }}
        >

            {/* Indicador Visual de Salvamento (Discreto) */}
            <div className="absolute top-2 right-2 z-20 fixed-indicator" style={{ position: 'sticky', top: '8px', right: '8px', alignSelf: 'flex-end', height: 0, zIndex: 10 }}>
                {isSaving && <div className="text-xs bg-black/50 text-white px-2 py-1 rounded-full backdrop-blur-sm -mb-[24px]">Salvando...</div>}
                {saveSuccess && <div className="text-xs bg-green-500/80 text-white px-2 py-1 rounded-full backdrop-blur-sm transition-opacity -mb-[24px]">Salvo</div>}
            </div>

            {/* Fundo Interativo: Contexto do MDX */}
            {backgroundContentNode && (
                <div className="absolute inset-0 z-0 p-12 pr-16 max-w-none prose prose-zinc dark:prose-invert pointer-events-none break-words select-none print:overflow-visible" style={{ height: `${canvasHeight}px` }}>
                    {backgroundContentNode}
                </div>
            )}

            {/* Elemento Ancora pro Botton Trigger */}
            <div ref={bottomRef} className="absolute bottom-0 w-full h-[50px] pointer-events-none" />

            {/* Canvas Area */}
            <div
                ref={proxyRef}
                className="flex-1 w-full h-full relative cursor-crosshair z-10"
                onPointerDownCapture={interceptPointerEvent}
                onPointerMoveCapture={(e) => {
                    interceptPointerEvent(e);
                    // Internal drag logic for text boxes if dragging
                    if (activeTool === "text" && draggingTextBoxId) {
                        const rect = proxyRef.current?.getBoundingClientRect();
                        if (rect) {
                            const coords = {
                                x: (e.clientX - rect.left) / zoomLevel,
                                y: (e.clientY - rect.top) / zoomLevel
                            };

                            // Atualiza apenas a Ref e o DOM diretamente para fluidez total (60fps)
                            const dx = coords.x - startDragPos.x;
                            const dy = coords.y - startDragPos.y;
                            tempDragOffsetRef.current = { x: dx, y: dy };

                            const el = document.getElementById(`box-${draggingTextBoxId}`);
                            if (el) {
                                el.style.transform = `translate(${dx}px, ${dy}px)`;
                            }
                        }
                    }
                }}
                onPointerUpCapture={(e) => {
                    interceptPointerEvent(e);
                    if (activeTool === "text" && draggingTextBoxId) {
                        // Ao soltar, aplica o deslocamento final às coordenadas reais e limpa a Ref/DOM
                        const finalOffset = tempDragOffsetRef.current;
                        setTextBoxes(prev => prev.map(box =>
                            box.id === draggingTextBoxId
                                ? { ...box, x: box.x + finalOffset.x, y: box.y + finalOffset.y }
                                : box
                        ));

                        const el = document.getElementById(`box-${draggingTextBoxId}`);
                        if (el) el.style.transform = 'none';

                        setDraggingTextBoxId(null);
                        tempDragOffsetRef.current = { x: 0, y: 0 };
                        triggerSave(500);
                    }
                }}
                onPointerCancelCapture={(e) => {
                    interceptPointerEvent(e);
                    setDraggingTextBoxId(null);
                    tempDragOffsetRef.current = { x: 0, y: 0 }; // Reset ref
                    const el = document.getElementById(`box-${draggingTextBoxId}`); // Reset DOM
                    if (el) el.style.transform = 'none';
                }}
                onPointerDown={(e) => {
                    if (activeTool === "text") {
                        // Clicked on background, blur or create
                        const rect = proxyRef.current?.getBoundingClientRect();
                        if (rect) {
                            const coords = {
                                x: (e.clientX - rect.left) / zoomLevel,
                                y: (e.clientY - rect.top) / zoomLevel
                            };

                            // Check if clicked the canvas itself (not a text box)
                            // Text boxes stop propagation, so if we are here, it's the canvas
                            if (editingTextBoxId) {
                                // Auto-delete if empty
                                const currentBox = textBoxes.find(b => b.id === editingTextBoxId);
                                if (currentBox && (!currentBox.content || currentBox.content.trim() === "")) {
                                    setTextBoxes(prev => prev.filter(b => b.id !== editingTextBoxId));
                                }
                                setEditingTextBoxId(null);
                                triggerSave(500);
                            } else {
                                const newBox: TextBox = {
                                    id: Math.random().toString(36).substr(2, 9),
                                    x: coords.x,
                                    y: coords.y,
                                    content: "",
                                    color: strokeColor,
                                    fontSize: 20,
                                    width: 220,
                                    height: 40
                                };
                                setTextBoxes(prev => [...prev, newBox]);
                                setEditingTextBoxId(newBox.id);
                                setTimeout(() => {
                                    const el = document.getElementById(`box-${newBox.id}`);
                                    if (el) el.focus();
                                }, 100);
                            }
                        }
                    } else {
                        canvasRef.current?.eraseMode(activeTool === "eraser")
                    }
                }}
                style={{ WebkitPrintColorAdjust: 'exact', colorAdjust: 'exact' } as any}
            >
                <ReactSketchCanvas
                    ref={canvasRef}
                    width="100%"
                    height="100%"
                    strokeWidth={strokeWidth}
                    strokeColor={strokeColor}
                    canvasColor="transparent"
                    className="absolute inset-0 w-full h-full"
                    style={{ width: "100%", height: "100%", pointerEvents: (activeTool === "stroke-eraser" || activeTool === "text") ? "none" : "auto" }}
                    onChange={handleCanvasChange}
                />

                {/* Camada de Caixas de Texto - ABOVE EVERYTHING ELSE */}
                <div
                    className="absolute inset-0 pointer-events-none z-[30]"
                    style={{ transform: `scale(${zoomLevel})`, transformOrigin: '0 0' }}
                >
                    {textBoxes.map((box) => (
                        <div
                            key={box.id}
                            id={`box-${box.id}`}
                            className={`absolute pointer-events-auto min-w-[220px] min-h-[20px] p-1 border rounded outline-none transition-all group ${editingTextBoxId === box.id
                                ? "border-primary bg-primary/5 shadow-sm ring-1 ring-primary/20"
                                : "border-transparent"
                                }`}
                            style={{
                                left: `${box.x}px`,
                                top: `${box.y}px`,
                                // Removed transform here as it's handled directly by DOM manipulation during drag
                                color: box.color,
                                fontSize: `${box.fontSize}px`,
                                minWidth: '220px', // Changed from '100px' to '220px'
                                userSelect: activeTool === "text" ? 'text' : 'none',
                                cursor: activeTool === "text" ? 'move' : 'default'
                            }}
                            onPointerDown={(e) => {
                                if (activeTool === "text") {
                                    e.stopPropagation();
                                    setEditingTextBoxId(box.id);
                                    setDraggingTextBoxId(box.id);
                                    const rect = proxyRef.current?.getBoundingClientRect();
                                    if (rect) {
                                        setStartDragPos({
                                            x: (e.clientX - rect.left) / zoomLevel,
                                            y: (e.clientY - rect.top) / zoomLevel
                                        });
                                    }
                                }
                            }}
                        >
                            {/* Controls UI - Only visible when editing */}
                            {editingTextBoxId === box.id && (
                                <div
                                    className="absolute -top-10 left-0 flex items-center gap-1 bg-white dark:bg-zinc-800 border shadow-md rounded-md p-1 z-[40]"
                                    onPointerDown={(e) => e.stopPropagation()} // Prevent drag when clicking controls
                                >
                                    {/* Drag Handle */}
                                    <div
                                        className="w-7 h-7 flex items-center justify-center hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded cursor-move text-zinc-500"
                                        onPointerDown={(e) => {
                                            e.stopPropagation();
                                            setEditingTextBoxId(box.id);
                                            setDraggingTextBoxId(box.id);
                                            const rect = proxyRef.current?.getBoundingClientRect();
                                            if (rect) {
                                                setStartDragPos({
                                                    x: (e.clientX - rect.left) / zoomLevel,
                                                    y: (e.clientY - rect.top) / zoomLevel
                                                });
                                            }
                                        }}
                                        title="Arrastar Nota"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="5" r="1" /><circle cx="9" cy="12" r="1" /><circle cx="9" cy="19" r="1" /><circle cx="15" cy="5" r="1" /><circle cx="15" cy="12" r="1" /><circle cx="15" cy="19" r="1" /></svg>
                                    </div>

                                    <div className="w-px h-4 bg-zinc-200 dark:bg-zinc-700 mx-0.5" />
                                    {/* Slider de Tamanho da Fonte */}
                                    <div className="flex items-center gap-1.5 px-1" onClick={e => e.stopPropagation()}>
                                        <span className="text-[10px] text-muted-foreground w-4 text-right font-medium">{box.fontSize}</span>
                                        <input
                                            type="range"
                                            min="8"
                                            max="100"
                                            step="2"
                                            value={box.fontSize}
                                            onChange={(e) => {
                                                const newSize = parseInt(e.target.value);
                                                setTextBoxes(prev => prev.map(b => b.id === box.id ? { ...b, fontSize: newSize } : b));
                                                // Debounce de 1s no slider para não salvar enquanto arrasta
                                                triggerSave(1000);
                                            }}
                                            className="w-24 accent-primary cursor-pointer h-1.5 rounded-full"
                                            title="Tamanho da Fonte"
                                        />
                                    </div>
                                    <div className="w-px h-4 bg-zinc-200 dark:bg-zinc-700 mx-1" />
                                    <button
                                        className="w-7 h-7 flex items-center justify-center hover:bg-red-50 dark:hover:bg-red-900/30 rounded text-red-500"
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            setTextBoxes(prev => prev.filter(b => b.id !== box.id))
                                            setEditingTextBoxId(null)
                                            triggerSave(100)
                                        }}
                                        title="Excluir Caixa"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                                    </button>
                                </div>
                            )}

                            {/* The editable area */}
                            <div
                                contentEditable={activeTool === "text" && editingTextBoxId === box.id}
                                suppressContentEditableWarning
                                className="w-full h-full outline-none"
                                onPointerDown={(e) => {
                                    if (activeTool === "text" && editingTextBoxId === box.id) {
                                        e.stopPropagation(); // Allow text cursor placement
                                    }
                                }}
                                onInput={(e) => {
                                    const newContent = e.currentTarget.innerText;
                                    setTextBoxes(prev => prev.map(b =>
                                        b.id === box.id ? { ...b, content: newContent } : b
                                    ));
                                    // Dispara o auto-save longo (10s) enquanto digita
                                    triggerSave();
                                }}
                                onBlur={(e) => {
                                    const newContent = e.currentTarget.innerText;
                                    setTextBoxes(prev => prev.map(b =>
                                        b.id === box.id ? { ...b, content: newContent } : b
                                    ));
                                    // Força um salvamento rápido (0.5s) ao sair da caixa
                                    triggerSave(500);
                                }}
                                onKeyDown={(e) => {
                                    e.stopPropagation();
                                    if (e.key === "Escape") {
                                        setEditingTextBoxId(null);
                                        triggerSave(100);
                                    }
                                }}
                                style={{ cursor: activeTool === "text" && editingTextBoxId === box.id ? 'text' : 'inherit' }}
                                ref={(el) => {
                                    // Previne o "texto invertido" (cursor pulando pro início) 
                                    // ao apenas injetar o texto inicial se o elemento não estiver em foco.
                                    if (el && document.activeElement !== el) {
                                        const expectedContent = box.content || (editingTextBoxId === box.id ? "" : "vazio");
                                        const isPlaceholder = !box.content && editingTextBoxId !== box.id;

                                        if (el.innerText !== expectedContent) {
                                            if (isPlaceholder) {
                                                el.innerHTML = '<span class="opacity-20 italic">vazio</span>';
                                            } else {
                                                el.innerText = box.content;
                                            }
                                        }
                                    }
                                }}
                            >
                                {/* No children here, handled by the ref logic above to avoid React re-render conflicts */}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Overlay Interceptador para Borracha de Traço e Seleção */}
                {(activeTool === "stroke-eraser" || activeTool === "select") && (
                    <svg
                        ref={overlayRef}
                        className={`absolute inset-0 w-full h-full z-20 touch-none cursor-crosshair`}
                        style={{ touchAction: 'none' }}
                        onPointerDown={onOverlayPointerDown}
                        onPointerMove={onOverlayPointerMove}
                        onPointerUp={onOverlayPointerUp}
                        onPointerCancel={onOverlayPointerUp}
                    >
                        {/* Render Stroke Eraser */}
                        {activeTool === "stroke-eraser" && eraserPoints.length > 0 && (
                            <polyline
                                points={eraserPoints.map(p => `${p.x},${p.y}`).join(" ")}
                                fill="none"
                                stroke="rgba(255, 0, 0, 0.4)"
                                strokeWidth={strokeWidth}
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        )}

                        {/* Render Lasso String */}
                        {activeTool === "select" && isSelecting && selectionPoints.length > 0 && (
                            <polygon
                                points={selectionPoints.map(p => `${p.x},${p.y}`).join(" ")}
                                fill="rgba(59, 130, 246, 0.1)"
                                stroke="rgba(59, 130, 246, 0.8)"
                                strokeWidth={2}
                                strokeDasharray="4 4"
                            />
                        )}

                        {/* Render Floating Selection Box */}
                        {activeTool === "select" && selectedPaths.length > 0 && (
                            <g transform={`translate(${selectionOffset.x}, ${selectionOffset.y})`}>
                                {/* Render the hijacked paths */}
                                {selectedPaths.map((path, idx) => {
                                    const d = path.paths.length > 0
                                        ? `M ${path.paths[0].x} ${path.paths[0].y} ` + path.paths.slice(1).map(p => `L ${p.x} ${p.y}`).join(" ")
                                        : "";
                                    return (
                                        <path
                                            key={`sel-path-${idx}`}
                                            d={d}
                                            stroke={path.strokeColor}
                                            strokeWidth={path.strokeWidth}
                                            fill="none"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />
                                    )
                                })}

                                {/* Render Bounding Box around selection */}
                                {(() => {
                                    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity
                                    selectedPaths.forEach(path => {
                                        path.paths.forEach(pt => {
                                            if (pt.x < minX) minX = pt.x
                                            if (pt.x > maxX) maxX = pt.x
                                            if (pt.y < minY) minY = pt.y
                                            if (pt.y > maxY) maxY = pt.y
                                        })
                                    })
                                    const pad = 10
                                    return (
                                        <rect
                                            x={minX - pad}
                                            y={minY - pad}
                                            width={maxX - minX + pad * 2}
                                            height={maxY - minY + pad * 2}
                                            fill="rgba(59, 130, 246, 0.05)"
                                            stroke="rgba(59, 130, 246, 0.8)"
                                            strokeWidth={1}
                                            strokeDasharray="4 4"
                                            cursor={isDraggingSelection ? "grabbing" : "grab"}
                                        />
                                    )
                                })()}
                            </g>
                        )}
                    </svg>
                )}
            </div>
        </div >
    )
})
