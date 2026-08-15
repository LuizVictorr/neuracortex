import React from "react"

export function Timeline({ children }: { children?: React.ReactNode }) {
    return (
        <div className="my-6 border-l-2 border-zinc-200 dark:border-zinc-800 ml-4 py-2">
            {children}
        </div>
    )
}

export function TimelineItem({ year, label }: { year: string; label: string }) {
    return (
        <div className="relative mb-6 pl-6 last:mb-0">
            <div className="absolute left-[-5px] top-1 h-2 w-2 rounded-full bg-zinc-400 dark:bg-zinc-600 ring-4 ring-white dark:ring-zinc-950" />
            <div className="font-bold text-zinc-900 dark:text-zinc-100">{year}</div>
            <div className="text-zinc-600 dark:text-zinc-400">{label}</div>
        </div>
    )
}
