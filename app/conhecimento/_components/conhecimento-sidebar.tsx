"use client"

import * as React from "react"
import { Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ResizableSidebar } from "@/components/resizable-sidebar"
import { SidebarNav } from "./sidebar-nav"
import { CommandSearch } from "@/components/command-search"

interface ConhecimentoSidebarProps {
    sidebarItems: any[]
}

export function ConhecimentoSidebar({ sidebarItems }: ConhecimentoSidebarProps) {
    const [open, setOpen] = React.useState(false)

    return (
        <>
            {/* Command Search Dialog */}
            <CommandSearch open={open} setOpen={setOpen} />

            {/* Sidebar */}
            <ResizableSidebar>
                <div className="flex flex-col h-full">
                    <div className="pt-6 mb-4 px-1 flex items-center justify-between">
                        <h2 className="text-xl font-bold tracking-tight">Conhecimentos</h2>
                    </div>

                    <div className="mb-6">
                        <Button
                            variant="outline"
                            onClick={() => setOpen(true)}
                            className="w-full justify-start text-muted-foreground font-normal bg-muted/20 border-border/40 hover:bg-muted/30 hover:border-primary/30 group transition-all duration-300 rounded-lg px-3 h-9"
                        >
                            <Search className="mr-2 h-4 w-4 group-hover:text-primary transition-colors" />
                            <span className="flex-1 text-left">Pesquisar...</span>
                            <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100 uppercase">
                                <span className="text-xs">Ctrl+</span>K
                            </kbd>
                        </Button>
                    </div>

                    <SidebarNav items={sidebarItems} />
                </div>
            </ResizableSidebar>
        </>
    )
}
