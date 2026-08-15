import { getGraphData } from "@/lib/content"
import { GraphViewer } from "./_components/graph-viewer"

export const metadata = {
    title: "Conexões - NeuraCortex",
    description: "Visualize a rede de conexões do conhecimento interligado no NeuraCortex.",
}

export default async function Conexoes() {
    // Busca todos os dados de nós e links do lado do servidor
    const graphData = getGraphData()

    return (
        <div className="flex flex-col h-[calc(100vh-4rem)] w-full overflow-hidden relative">
            <div className="container p-8 z-10 pointer-events-none">
                <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl">Mapa de Conexões</h1>
                <p className="text-xl text-muted-foreground mt-4 max-w-2xl bg-background/50 backdrop-blur pb-2 rounded-lg inline-block">
                    Explore a rede neural de conhecimento. Clique nos nós para navegar diretamente até as anotações e descobrir como os temas estão interligados.
                </p>
            </div>

            {/* O visualizador em 3D ocupa a tela como mapa de fundo */}
            <div className="absolute inset-0 z-0">
                <GraphViewer data={graphData} />
            </div>
        </div>
    )
}
