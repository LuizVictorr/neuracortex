"use server"

import { PrismaClient, Prisma } from "@prisma/client"
import { revalidatePath } from "next/cache"

const prisma = new PrismaClient()

export interface QuestionFilterParams {
    disciplinaId?: string
    areaConhecimentoId?: string
    assuntoId?: string
    instituicao?: string
    dificuldade?: string
    ano?: number
    take?: number
    jaAcertei?: boolean
    jaErrei?: boolean
    searchText?: string
}

export async function getQuestions(filters: QuestionFilterParams) {
    try {
        console.log("Filtros recebidos:", JSON.stringify(filters, null, 2))
        // Casting to any because Prisma generation is blocked on Windows
        const qp = prisma as any
        const where: any = {}

        if (filters.disciplinaId) where.disciplinaId = filters.disciplinaId
        if (filters.areaConhecimentoId) where.areaConhecimentoId = filters.areaConhecimentoId
        if (filters.assuntoId) where.assuntoId = filters.assuntoId
        if (filters.instituicao) where.instituicao = filters.instituicao
        if (filters.dificuldade) where.dificuldade = filters.dificuldade
        if (filters.ano) where.ano = filters.ano

        // Logical filters for Acertei/Errei
        if (filters.jaAcertei !== undefined) where.jaAcertei = filters.jaAcertei
        if (filters.jaErrei !== undefined) where.jaErrei = filters.jaErrei
        if (filters.searchText) {
            where.textoBase = {
                contains: filters.searchText
            }
        }

        console.log("Prisma 'where' clause:", JSON.stringify(where, null, 2))

        const questions = await qp.questao.findMany({
            where,
            include: {
                disciplina: true,
                areaConhecimento: true,
                assunto: true
            },
            take: filters.take || 10,
            orderBy: {
                createdAt: 'desc'
            }
        })

        return { success: true, data: questions }
    } catch (error) {
        console.error("Erro ao buscar questões:", error)
        return { success: false, error: "Falha ao carregar questões" }
    }
}

export async function toggleQuestionStatus(questaoId: string, type: 'acertei' | 'errei', value: boolean) {
    try {
        const qp = prisma as any
        const data: any = {}
        if (type === 'acertei') data.jaAcertei = value
        if (type === 'errei') data.jaErrei = value

        await qp.questao.update({
            where: { id: questaoId },
            data
        })

        revalidatePath("/questoes")
        return { success: true }
    } catch (error) {
        console.error("Erro ao atualizar status da questão:", error)
        return { success: false }
    }
}

export async function getFilterOptions() {
    try {
        const [disciplinas, areas, assuntos] = await Promise.all([
            prisma.disciplina.findMany({ select: { id: true, nome: true, areaConhecimentoId: true } }),
            prisma.areaConhecimento.findMany({ select: { id: true, nome: true } }),
            prisma.assunto.findMany({ select: { id: true, nome: true, disciplinaId: true } })
        ])

        return { success: true, disciplinas, areas, assuntos }
    } catch (error) {
        console.error("Erro ao carregar opções de filtro:", error)
        return { success: false }
    }
}
