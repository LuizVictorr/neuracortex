"use server"

import { PrismaClient } from "@prisma/client"
import { revalidatePath } from "next/cache"

const prisma = new PrismaClient()

export async function toggleAulaConcluida(aulaId: string, concluida: boolean) {
    try {
        await prisma.aula.update({
            where: { id: aulaId },
            data: { concluida }
        })
        revalidatePath(`/videos/${aulaId}`)
        return { success: true }
    } catch (error) {
        console.error("Erro ao atualizar conclusão da aula:", error)
        return { success: false }
    }
}

export async function avaliarAula(aulaId: string, avaliacao: number) {
    try {
        await prisma.aula.update({
            where: { id: aulaId },
            data: { avaliacao }
        })
        revalidatePath(`/videos/${aulaId}`)
        return { success: true }
    } catch (error) {
        console.error("Erro ao avaliar aula:", error)
        return { success: false }
    }
}

export async function adicionarComentario(aulaId: string, conteudo: string) {
    try {
        await prisma.comentario.create({
            data: {
                conteudo,
                aulaId
            }
        })
        revalidatePath(`/videos/${aulaId}`)
        return { success: true }
    } catch (error) {
        console.error("Erro ao adicionar comentário:", error)
        return { success: false }
    }
}
