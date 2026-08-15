import React from "react"

interface QuoteProps {
    author: string
    children: React.ReactNode
}

export function Quote({ author, children }: QuoteProps) {
    return (
        <figure className="my-6 border-l-4 border-zinc-300 dark:border-zinc-700 pl-4 py-1 italic">
            <blockquote className="text-xl text-zinc-800 dark:text-zinc-200 mb-2">
                {children}
            </blockquote>
            <figcaption className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                — {author}
            </figcaption>
        </figure>
    )
}
