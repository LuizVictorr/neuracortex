"use client"

import * as React from "react"
import { MoreHorizontal, Printer } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function DocumentMenu({ noteSlug, noteTitle }: { noteSlug?: string, noteTitle?: string }) {
    const handlePrint = () => {
        window.print()
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-muted print:hidden">
                    <MoreHorizontal className="h-4 w-4" />
                    <span className="sr-only">Abrir menu do documento</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 print:hidden">
                <DropdownMenuLabel>Ações do Documento</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handlePrint}>
                    <Printer className="mr-2 h-4 w-4" />
                    <span>Exportar para PDF / Imprimir</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}

