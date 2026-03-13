"use client"

import * as React from "react"
import { Star, CheckCircle2, Circle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toggleAulaConcluida, avaliarAula } from "../actions"
import { toast } from "sonner" // Assuming sonner is available or will be handled

interface LessonPlayerProps {
    aulaId: string
    videoUrl: string | null
    concluida: boolean
    avaliacao: number | null
}

export function LessonPlayer({ aulaId, videoUrl, concluida, avaliacao }: LessonPlayerProps) {
    const [isConcluida, setIsConcluida] = React.useState(concluida)
    const [rating, setRating] = React.useState(avaliacao || 0)
    const [hoverRating, setHoverRating] = React.useState(0)
    const [loading, setLoading] = React.useState(false)

    // Sync state with props when page revalidates
    React.useEffect(() => {
        setIsConcluida(concluida)
    }, [concluida])

    React.useEffect(() => {
        setRating(avaliacao || 0)
    }, [avaliacao])

    // Helper to extract YouTube ID and create private-friendly embed URL
    const getEmbedUrl = (url: string | null) => {
        if (!url) return null

        // Handle various YouTube URL formats
        let videoId = ""
        if (url.includes("v=")) {
            videoId = url.split("v=")[1].split("&")[0]
        } else if (url.includes("youtu.be/")) {
            videoId = url.split("youtu.be/")[1].split("?")[0]
        } else if (url.includes("embed/")) {
            videoId = url.split("embed/")[1].split("?")[0]
        } else {
            videoId = url // Assume it might be just the ID
        }

        return `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`
    }

    const embedUrl = getEmbedUrl(videoUrl)

    const handleToggleConcluida = async () => {
        setLoading(true)
        const nextState = !isConcluida
        const res = await toggleAulaConcluida(aulaId, nextState)
        if (res.success) {
            setIsConcluida(nextState)
            toast.success(nextState ? "Aula concluída!" : "Aula marcada como não concluída")
        } else {
            toast.error("Erro ao atualizar status da aula")
        }
        setLoading(false)
    }

    const handleRate = async (value: number) => {
        setRating(value)
        const res = await avaliarAula(aulaId, value)
        if (res.success) {
            toast.success("Avaliação enviada!")
        } else {
            toast.error("Erro ao enviar avaliação")
        }
    }

    return (
        <div className="space-y-6">
            {/* Video Player Section */}
            <div className="aspect-video bg-black rounded-xl overflow-hidden shadow-2xl border border-white/5 ring-1 ring-black/20">
                {embedUrl ? (
                    <iframe
                        width="100%"
                        height="100%"
                        src={embedUrl}
                        title="Lesson Video"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                        className="w-full h-full"
                    ></iframe>
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground italic">
                        Vídeo não disponível
                    </div>
                )}
            </div>

            {/* Actions Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-card border shadow-sm">
                {/* Mark as Completed */}
                <Button
                    variant={isConcluida ? "default" : "outline"}
                    className={`gap-2 transition-all ${isConcluida ? "bg-green-600 hover:bg-green-700" : ""}`}
                    onClick={handleToggleConcluida}
                    disabled={loading}
                >
                    {isConcluida ? (
                        <>
                            <CheckCircle2 className="w-5 h-5" />
                            Concluído
                        </>
                    ) : (
                        <>
                            <Circle className="w-5 h-5" />
                            Marcar como concluído
                        </>
                    )}
                </Button>

                {/* Rating Section */}
                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-0.5" onMouseLeave={() => setHoverRating(0)}>
                        {[1, 2, 3, 4, 5].map((star) => (
                            <button
                                key={star}
                                className="p-0.5 transition-transform active:scale-90"
                                onMouseEnter={() => setHoverRating(star)}
                                onClick={() => handleRate(star)}
                            >
                                <Star
                                    className={`w-6 h-6 ${(hoverRating || rating) >= star
                                        ? "fill-yellow-400 text-yellow-400"
                                        : "text-muted-foreground opacity-30"
                                        } transition-colors`}
                                />
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
