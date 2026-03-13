"use client"

import * as React from "react"
import { MoreHorizontal, FileText, Printer, PenTool } from "lucide-react"
import { useRouter } from "next/navigation"
import { createNotebook } from "@/app/anotacoes/actions"

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
    const router = useRouter()

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
                {noteSlug && noteTitle && (
                    <DropdownMenuItem
                        onClick={async () => {
                            const res = await createNotebook(`Anotações sobre: ${noteTitle}`, noteSlug)
                            if (res.success) {
                                router.push('/anotacoes')
                            }
                        }}
                        className="text-blue-600 dark:text-blue-400 focus:text-blue-600 dark:focus:text-blue-400 cursor-pointer"
                    >
                        <PenTool className="mr-2 h-4 w-4" />
                        <span>Fazer Anotações</span>
                    </DropdownMenuItem>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
