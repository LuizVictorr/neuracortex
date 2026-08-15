import React from "react"

interface InfoCardProps {
    title: string
    description: string
}

export function InfoCard({ title, description }: InfoCardProps) {
    return (
        <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/50">
            <h3 className="!mt-0 mb-2 text-lg font-semibold text-zinc-900 dark:text-zinc-100">{title}</h3>
            <p className="!mb-0 text-sm text-zinc-600 dark:text-zinc-400">{description}</p>
        </div>
    )
}
