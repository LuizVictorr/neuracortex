"use server"

import { getAllMdxFiles } from "@/lib/content"
import fs from "fs"
import matter from "gray-matter"

export interface SearchResult {
    id: string
    title: string
    description?: string
    url: string
    category: "Conhecimento"
}

export async function globalSearch(query: string): Promise<SearchResult[]> {
    if (!query || query.length < 2) return []

    const q = query.toLowerCase()
    const results: SearchResult[] = []

    // Search Conhecimento (MDX)
    try {
        const mdxFiles = getAllMdxFiles()
        mdxFiles.forEach(file => {
            const content = fs.readFileSync(file, "utf8")
            const { data, content: text } = matter(content)
            const title = data.title || ""
            const description = data.description || ""

            if (
                title.toLowerCase().includes(q) ||
                description.toLowerCase().includes(q) ||
                text.toLowerCase().includes(q)
            ) {
                const slug = file
                    .replace(/\\/g, "/")
                    .split("/content/")[1]
                    .replace(/\.mdx$/, "")

                results.push({
                    id: `mdx-${slug}`,
                    title: title || slug.split("/").pop() || "Sem título",
                    description: description || "Documentação de conhecimento",
                    url: `/conhecimento/${slug}`,
                    category: "Conhecimento"
                })
            }
        })
    } catch (e) {
        console.error("Error searching MDX:", e)
    }

    return results.slice(0, 20)
}
