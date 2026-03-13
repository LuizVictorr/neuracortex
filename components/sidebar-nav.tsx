"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronDown, ChevronRight, FileText, Folder } from "lucide-react"
import { useState } from "react"
import { cn } from "@/lib/utils"

interface SidebarItem {
    name: string
    title: string
    url: string
    isDirectory: boolean
    children?: SidebarItem[]
    icon?: string
}

interface SidebarNavProps {
    items: SidebarItem[]
}

export function SidebarNav({ items }: SidebarNavProps) {
    return (
        <div className="w-full flex-col gap-2 pb-12">
            <Tree nodes={items} level={0} />
        </div>
    )
}

function Tree({ nodes, level }: { nodes: SidebarItem[]; level: number }) {
    const pathname = usePathname()

    return (
        <ul className={cn("flex flex-col gap-1", level > 0 && "ml-4 border-l pl-2")}>
            {nodes.map((node) => {
                const isActive = pathname === node.url
                return (
                    <li key={node.url}>
                        {node.isDirectory ? (
                            <FolderNode node={node} level={level} />
                        ) : (
                            <Link
                                href={node.url}
                                className={cn(
                                    "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
                                    isActive ? "bg-accent text-accent-foreground font-semibold" : "text-muted-foreground"
                                )}
                            >
                                <FileText className="h-4 w-4 shrink-0" />
                                <span className="truncate">{node.title}</span>
                            </Link>
                        )}
                    </li>
                )
            })}
        </ul>
    )
}

function FolderNode({ node, level }: { node: SidebarItem; level: number }) {
    const [isOpen, setIsOpen] = useState(false)

    return (
        <div className="flex flex-col gap-1">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
                    "text-foreground"
                )}
            >
                {isOpen ? (
                    <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                ) : (
                    <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                )}
                <Folder className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="truncate">{node.title}</span>
            </button>

            {isOpen && node.children && <Tree nodes={node.children} level={level + 1} />}
        </div>
    )
}
