"use server"

import { auth } from "@/auth"
import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { getAllMdxFiles, getMdxContent } from "@/lib/content"
import path from "path"

export async function getNotebooks() {
    const session = await auth();
    if (!session?.user?.id) return [];

    try {
        const notebooks = await db.notebook.findMany({
            where: {
                userId: session.user.id
            },
            orderBy: { updatedAt: "desc" },
            include: { pages: { orderBy: { pageNumber: "asc" } } }
        })
        return notebooks
    } catch (error) {
        console.error("Erro ao buscar cadernos:", error)
        return []
    }
}

export async function createNotebook(title: string, backgroundNoteSlug?: string) {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Não autenticado." };

    try {
        const notebook = await db.notebook.create({
            data: {
                title,
                backgroundNoteSlug: backgroundNoteSlug || null,
                userId: session.user.id,
                pages: {
                    create: {
                        pageNumber: 1,
                        canvasData: "[]"
                    }
                }
            },
            include: { pages: true }
        })
        revalidatePath("/anotacoes")
        return { success: true, notebook }
    } catch (error) {
        console.error("Erro ao criar caderno:", error)
        return { success: false, error: "Falha ao criar caderno." }
    }
}

export async function deleteNotebook(id: string) {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Não autenticado." };

    try {
        // Find first to ensure ownership
        const notebook = await db.notebook.findUnique({ where: { id } });
        if (!notebook || notebook.userId !== session.user.id) {
            return { success: false, error: "Caderno não encontrado ou sem permissão." };
        }

        await db.notebook.delete({
            where: { id },
        })
        revalidatePath("/anotacoes")
        return { success: true }
    } catch (error) {
        console.error("Erro ao deletar caderno:", error)
        return { success: false, error: "Falha ao deletar caderno." }
    }
}

export async function updateNotebookPage(pageId: string, canvasData: string) {
    try {
        const page = await db.notebookPage.update({
            where: { id: pageId },
            data: { canvasData },
        })
        revalidatePath("/anotacoes")
        return { success: true, page }
    } catch (error) {
        console.error("Erro ao salvar desenho da página:", error)
        return { success: false, error: "Falha ao salvar desenho." }
    }
}



export async function updateNotebookTitle(id: string, title: string) {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Não autenticado." };

    try {
        const notebook = await db.notebook.findUnique({ where: { id } });
        if (!notebook || notebook.userId !== session.user.id) {
            return { success: false, error: "Caderno não encontrado ou sem permissão." };
        }

        const updatedNotebook = await db.notebook.update({
            where: { id },
            data: { title },
        })
        revalidatePath("/anotacoes")
        return { success: true, notebook: updatedNotebook }
    } catch (error) {
        console.error("Erro ao renomear caderno:", error)
        return { success: false, error: "Falha ao renomear caderno." }
    }
}

export async function getNotebookById(id: string) {
    const session = await auth();
    if (!session?.user?.id) return null;

    try {
        const notebook = await db.notebook.findUnique({
            where: { id },
            include: { pages: { orderBy: { pageNumber: "asc" } } }
        })

        if (!notebook || notebook.userId !== session.user.id) return null;

        return notebook
    } catch (error) {
        console.error("Erro ao pegar caderno:", error)
        return null
    }
}

// --- Knowledge Management For Canvas ---

export async function getAvailableNotes() {
    try {
        const contentDir = path.join(process.cwd(), "content")
        const files = getAllMdxFiles(contentDir)

        const notes = files.map((file) => {
            const relativePath = file.replace(contentDir, "").replace(/^\/|^\\/, "")
            const slugSegments = relativePath.replace(/\.mdx$/, "").split(path.sep)

            // Decodifica e pega as infos da frontmatter
            const doc = getMdxContent(slugSegments)

            return {
                slug: slugSegments.join('/'), // Convert back to URL path format
                title: doc?.frontmatter?.title || slugSegments[slugSegments.length - 1], // fallback
                description: doc?.frontmatter?.description || ""
            }
        })

        return { success: true, notes }
    } catch (error) {
        console.error("Erro ao buscar notas disponíveis:", error)
        return { success: false, error: "Falha ao buscar notas.", notes: [] }
    }
}
