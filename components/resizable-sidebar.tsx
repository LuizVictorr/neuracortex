"use client"

import * as React from "react"
import { PanelLeftClose, PanelLeftOpen } from "lucide-react"

import { cn } from "@/lib/utils"

interface ResizableSidebarProps {
    children: React.ReactNode
    defaultWidth?: number
    minWidth?: number
    maxWidth?: number
}

export function ResizableSidebar({
    children,
    defaultWidth = 256,
    minWidth = 200,
    maxWidth = 400,
}: ResizableSidebarProps) {
    const [isCollapsed, setIsCollapsed] = React.useState(false)
    const [width, setWidth] = React.useState(defaultWidth)
    const [isResizing, setIsResizing] = React.useState(false)

    const sidebarRef = React.useRef<HTMLDivElement>(null)

    const startResizing = React.useCallback((e: React.MouseEvent) => {
        setIsResizing(true)
        e.preventDefault()
    }, [])

    const stopResizing = React.useCallback(() => {
        setIsResizing(false)
    }, [])

    const resize = React.useCallback(
        (e: MouseEvent) => {
            if (isResizing && sidebarRef.current) {
                const newWidth = e.clientX - sidebarRef.current.getBoundingClientRect().left
                if (newWidth >= minWidth && newWidth <= maxWidth) {
                    setWidth(newWidth)
                }
            }
        },
        [isResizing, minWidth, maxWidth]
    )

    React.useEffect(() => {
        if (isResizing) {
            window.addEventListener("mousemove", resize)
            window.addEventListener("mouseup", stopResizing)
        } else {
            window.removeEventListener("mousemove", resize)
            window.removeEventListener("mouseup", stopResizing)
        }
        return () => {
            window.removeEventListener("mousemove", resize)
            window.removeEventListener("mouseup", stopResizing)
        }
    }, [isResizing, resize, stopResizing])

    return (
        <div
            className={cn(
                "relative flex shrink-0 print:hidden",
                !isResizing && "transition-[width] ease-in-out duration-300"
            )}
            style={{ width: isCollapsed ? 48 : width }}
        >
            <aside
                ref={sidebarRef}
                className={cn(
                    "sticky top-20 z-30 flex h-[calc(100vh-5rem)] flex-col border-r bg-background",
                    !isResizing && "transition-all duration-300 ease-in-out",
                    isCollapsed ? "w-12 items-center px-0" : "w-full pr-4"
                )}
            >
                {isCollapsed ? (
                    <div className="flex w-full items-center justify-center pt-[22px] mb-4">
                        <button
                            onClick={() => setIsCollapsed(!isCollapsed)}
                            className="rounded-md p-1.5 hover:bg-accent hover:text-accent-foreground text-muted-foreground transition-colors"
                            title="Expandir barra lateral"
                        >
                            <PanelLeftOpen className="h-5 w-5" />
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        className="absolute right-4 top-[22px] z-10 rounded-md p-1.5 hover:bg-accent hover:text-accent-foreground text-muted-foreground transition-colors"
                        title="Recolher barra lateral"
                    >
                        <PanelLeftClose className="h-5 w-5" />
                    </button>
                )}

                <div
                    className={cn(
                        "flex flex-1 flex-col overflow-y-auto w-full transition-opacity duration-300 no-scrollbar",
                        isCollapsed ? "opacity-0 pointer-events-none hidden" : "opacity-100"
                    )}
                >
                    {children}
                </div>

                {!isCollapsed && (
                    <div
                        className="absolute right-0 top-0 z-40 h-full w-1 cursor-col-resize hover:bg-primary/50 active:bg-primary"
                        onMouseDown={startResizing}
                    />
                )}
            </aside>
        </div>
    )
}
