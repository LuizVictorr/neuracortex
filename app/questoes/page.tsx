"use client"

import { useState } from "react"
import { QuestionFilter } from "./_components/QuestionFilter"
import { QuestionList } from "./_components/QuestionList"
import { getQuestions, QuestionFilterParams } from "./actions"
import { HelpCircle } from "lucide-react"
import { toast } from "sonner"
import { useSearchParams } from "next/navigation"
import { useEffect, Suspense } from "react"

function QuestoesContent() {
    const [questions, setQuestions] = useState<any[]>([])
    const [hasAppliedFilter, setHasAppliedFilter] = useState(false)
    const [loading, setLoading] = useState(false)
    const searchParams = useSearchParams()

    const handleApplyFilters = async (filters: QuestionFilterParams) => {
        setLoading(true)
        const res = await getQuestions(filters)
        if (res.success) {
            setQuestions(res.data || [])
            setHasAppliedFilter(true)
        } else {
            toast.error(res.error || "Erro ao filtrar questões")
        }
        setLoading(false)
    }

    // Effect to apply filters from URL params (e.g., from global search)
    useEffect(() => {
        const searchText = searchParams.get('searchText')
        if (searchText) {
            handleApplyFilters({ take: 10, searchText })
        }
    }, [searchParams])

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Sidebar - Filter Area (Left) */}
            <div className="lg:col-span-1 flex-shrink-0">
                <QuestionFilter onApply={handleApplyFilters} />
            </div>

            {/* Main Content - Question List Area (Right) */}
            <div className="lg:col-span-2 min-w-0">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-32 space-y-4">
                        <div className="size-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                        <p className="text-muted-foreground animate-pulse">Buscando questões no banco...</p>
                    </div>
                ) : (
                    <QuestionList
                        questions={questions}
                        hasAppliedFilter={hasAppliedFilter}
                    />
                )}
            </div>
        </div>
    )
}

export default function QuestoesPage() {
    return (
        <div className="min-h-[calc(100vh-64px)] bg-background">
            <div className="container mx-auto p-4 md:p-8">
                {/* Header */}
                <div className="mb-8 flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
                            <HelpCircle className="size-8 text-primary" />
                            Banco de Questões
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            Explore, filtre e pratique com milhares de questões.
                        </p>
                    </div>
                </div>

                <Suspense fallback={
                    <div className="flex items-center justify-center py-32">
                        <div className="size-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                    </div>
                }>
                    <QuestoesContent />
                </Suspense>
            </div>
        </div>
    )
}
