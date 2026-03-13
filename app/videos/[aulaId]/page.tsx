import { PrismaClient } from "@prisma/client";
import { Video, ArrowLeft, Download, MessageSquare, Info, FileText, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { LessonPlayer } from "../_components/LessonPlayer";
import { LessonSidebarList } from "../_components/LessonSidebarList";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";

const prisma = new PrismaClient();

export default async function AulaPage({
    params,
}: {
    params: Promise<{ aulaId: string }>;
}) {
    const resolvedParams = await params;

    const aula = await prisma.aula.findUnique({
        where: { id: resolvedParams.aulaId },
        include: {
            assunto: {
                include: {
                    disciplina: {
                        include: {
                            areaConhecimento: true,
                        }
                    },
                    aulas: {
                        orderBy: {
                            ordem: 'asc'
                        }
                    }
                }
            },
            materiais: true,
            comentarios: {
                orderBy: {
                    createdAt: 'desc'
                }
            }
        }
    });

    if (!aula) {
        notFound();
    }

    return (
        <div className="min-h-[calc(100vh-64px)] bg-background">
            <div className="container mx-auto p-4 md:p-8">
                {/* Header / Breadcrumbs */}
                <div className="mb-6">
                    <Link
                        href="/videos"
                        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Voltar para Vídeos
                    </Link>

                    <div className="flex items-center gap-2 text-xs md:text-sm text-muted-foreground mb-2">
                        <span className="truncate">{aula.assunto.disciplina.areaConhecimento.nome}</span>
                        <span>/</span>
                        <span className="truncate">{aula.assunto.disciplina.nome}</span>
                        <span>/</span>
                        <span className="truncate">{aula.assunto.nome}</span>
                    </div>

                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{aula.titulo}</h1>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content (Video & Navigation) */}
                    <div className="lg:col-span-2 space-y-8">
                        <LessonPlayer
                            aulaId={aula.id}
                            videoUrl={aula.videoUrl}
                            concluida={aula.concluida}
                            avaliacao={aula.avaliacao}
                        />

                        {/* Tabs Navigation */}
                        <Tabs defaultValue="descricao" className="w-full">
                            <TabsList className="grid w-full grid-cols-3">
                                <TabsTrigger value="descricao" className="gap-2">
                                    <Info className="w-4 h-4" />
                                    <span className="hidden sm:inline">Descrição</span>
                                    <span className="sm:hidden text-xs">Desc.</span>
                                </TabsTrigger>
                                <TabsTrigger value="comentarios" className="gap-2">
                                    <MessageSquare className="w-4 h-4" />
                                    <span className="hidden sm:inline">Comentários</span>
                                    <span className="sm:hidden text-xs">Coment.</span>
                                </TabsTrigger>
                                <TabsTrigger value="materiais" className="gap-2">
                                    <FileText className="w-4 h-4" />
                                    <span className="hidden sm:inline">Materiais</span>
                                    <span className="sm:hidden text-xs">Mater.</span>
                                </TabsTrigger>
                            </TabsList>

                            {/* Description Content */}
                            <TabsContent value="descricao" className="p-4 border rounded-xl mt-4 bg-card shadow-sm min-h-[200px]">
                                <h3 className="text-lg font-semibold mb-3">Sobre esta aula</h3>
                                <div className="text-muted-foreground whitespace-pre-wrap">
                                    {aula.descricao || (
                                        <p className="italic opacity-50">Nenhuma descrição disponível para esta aula.</p>
                                    )}
                                </div>
                            </TabsContent>

                            {/* Comments Content */}
                            <TabsContent value="comentarios" className="p-4 border rounded-xl mt-4 bg-card shadow-sm min-h-[200px]">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-semibold">Mensagens ({aula.comentarios.length})</h3>
                                    {/* Placeholder for "New Comment" button if needed */}
                                </div>
                                <ScrollArea className="h-[300px] pr-4">
                                    {aula.comentarios.length > 0 ? (
                                        <div className="space-y-4">
                                            {aula.comentarios.map((c) => (
                                                <div key={c.id} className="p-3 bg-muted/30 rounded-lg border border-white/5">
                                                    <p className="text-sm">{c.conteudo}</p>
                                                    <span className="text-[10px] text-muted-foreground mt-2 block">
                                                        {new Date(c.createdAt).toLocaleDateString()}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                                            <MessageSquare className="w-12 h-12 opacity-20 mb-2" />
                                            <p className="text-sm italic">Nenhum comentário ainda.</p>
                                        </div>
                                    )}
                                </ScrollArea>
                            </TabsContent>

                            {/* Materials Content */}
                            <TabsContent value="materiais" className="p-4 border rounded-xl mt-4 bg-card shadow-sm min-h-[200px]">
                                <h3 className="text-lg font-semibold mb-4">Arquivos e Links</h3>
                                {aula.materiais.length > 0 ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {aula.materiais.map((m) => (
                                            <a
                                                key={m.id}
                                                href={m.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-3 p-3 rounded-lg border bg-muted/20 hover:bg-muted/40 transition-colors group"
                                            >
                                                <div className="p-2 bg-primary/10 rounded-md text-primary group-hover:scale-110 transition-transform">
                                                    <Download className="w-4 h-4" />
                                                </div>
                                                <div className="overflow-hidden">
                                                    <p className="text-sm font-medium truncate">{m.nome}</p>
                                                    <p className="text-[10px] text-muted-foreground truncate italic">Clique para baixar</p>
                                                </div>
                                            </a>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground opacity-50">
                                        <FileText className="w-12 h-12 mb-2 opacity-20" />
                                        <p className="text-sm italic">Nenhum material de apoio anexado.</p>
                                    </div>
                                )}
                            </TabsContent>
                        </Tabs>
                    </div>

                    {/* Sidebar / Progress and Navigation */}
                    <div className="lg:sticky lg:top-20 space-y-6 h-fit">
                        {/* Subject Progress */}
                        <div className="p-5 border rounded-2xl bg-gradient-to-br from-primary/5 to-transparent border-primary/10 shadow-sm">
                            <h4 className="font-bold text-sm uppercase tracking-wider text-primary mb-4">Progresso do Assunto</h4>
                            <div className="space-y-4">
                                {(() => {
                                    const totalAulas = aula.assunto.aulas.length;
                                    const aulasConcluidas = aula.assunto.aulas.filter(a => a.concluida).length;
                                    const porcentagem = Math.round((aulasConcluidas / totalAulas) * 100);

                                    return (
                                        <>
                                            <div className="flex items-center justify-between text-xs font-semibold">
                                                <span>Conclusão</span>
                                                <span>{porcentagem}%</span>
                                            </div>
                                            <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-primary transition-all duration-500"
                                                    style={{ width: `${porcentagem}%` }}
                                                />
                                            </div>
                                            <p className="text-[11px] text-muted-foreground leading-relaxed">
                                                {porcentagem === 100
                                                    ? "Parabéns! Você completou este assunto. 🎉"
                                                    : `Você concluiu ${aulasConcluidas} de ${totalAulas} aulas.`}
                                            </p>
                                        </>
                                    );
                                })()}
                            </div>
                        </div>

                        {/* Lesson Navigation List */}
                        <LessonSidebarList
                            lessons={aula.assunto.aulas}
                            currentLessonId={aula.id}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
