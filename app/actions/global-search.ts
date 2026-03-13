"use server"

import { PrismaClient } from "@prisma/client"
import { getAllMdxFiles } from "@/lib/content"
import fs from "fs"
import matter from "gray-matter"

const prisma = new PrismaClient()

export interface SearchResult {
    id: string
    title: string
    description?: string
    url: string
    category: "Conhecimento" | "Anotações" | "Disciplinas" | "Questões"
}

export async function globalSearch(query: string): Promise<SearchResult[]> {
    if (!query || query.length < 2) return []

    const q = query.toLowerCase()
    const results: SearchResult[] = []

    // 1. Search Conhecimento (MDX)
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

    // 2. Search Anotações (Prisma)
    try {
        const qp = prisma as any
        const notebooks = await qp.notebook.findMany({
            where: {
                OR: [
                    { title: { contains: q } },
                    { pages: { some: { canvasData: { contains: q } } } }
                ]
            },
            include: { pages: true }
        })

        notebooks.forEach((nb: any) => {
            results.push({
                id: `nb-${nb.id}`,
                title: nb.title,
                description: `Caderno com ${nb.pages.length} página(s)`,
                url: `/anotacoes`, // Usually opens the last active notebook
                category: "Anotações"
            })
        })
    } catch (e) {
        console.error("Error searching Notebooks:", e)
    }

    // 3. Search Disciplinas (Prisma)
    try {
        const qp = prisma as any

        // Search Disciplinas
        const disciplinas = await qp.disciplina.findMany({
            where: { nome: { contains: q } }
        })
        disciplinas.forEach((d: any) => {
            results.push({
                id: `disc-${d.id}`,
                title: d.nome,
                description: "Disciplina Acadêmica",
                url: `/videos`, // Need to handle selection logic if needed
                category: "Disciplinas"
            })
        })

        // Search Assuntos
        const assuntos = await qp.assunto.findMany({
            where: { nome: { contains: q } },
            include: { disciplina: true }
        })
        assuntos.forEach((a: any) => {
            results.push({
                id: `assu-${a.id}`,
                title: a.nome,
                description: `Assunto de ${a.disciplina.nome}`,
                url: `/videos`,
                category: "Disciplinas"
            })
        })

        // Search Aulas
        const aulas = await qp.aula.findMany({
            where: { titulo: { contains: q } },
            include: { assunto: { include: { disciplina: true } } }
        })
        aulas.forEach((aula: any) => {
            results.push({
                id: `aula-${aula.id}`,
                title: aula.titulo,
                description: `Aula em ${aula.assunto.disciplina.nome} > ${aula.assunto.nome}`,
                url: `/videos/${aula.id}`,
                category: "Disciplinas"
            })
        })

    } catch (e) {
        console.error("Error searching Disciplinas:", e)
    }

    // 4. Search Questões (Prisma)
    try {
        const qp = prisma as any
        const questoes = await qp.questao.findMany({
            where: {
                OR: [
                    { textoBase: { contains: q } },
                    { comando: { contains: q } },
                    { instituicao: { contains: q } }
                ]
            },
            take: 5
        })

        questoes.forEach((q: any) => {
            // Strip HTML from title/description if needed for a cleaner look
            const cleanText = q.textoBase.replace(/<[^>]*>?/gm, '').substring(0, 100)

            results.push({
                id: `quest-${q.id}`,
                title: q.instituicao ? `${q.instituicao} - ${q.ano || ''}` : "Questão de Estudo",
                description: cleanText + (cleanText.length === 100 ? "..." : ""),
                url: `/questoes?searchText=${encodeURIComponent(query)}`,
                category: "Questões"
            })
        })
    } catch (e) {
        console.error("Error searching Questões:", e)
    }

    return results.slice(0, 20) // Limit results
}
