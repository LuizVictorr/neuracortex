import { PrismaClient } from "@prisma/client";
import VideosLayout from "./_components/VideosLayout";

const prisma = new PrismaClient();

// Desativa o cache de fetch para essa página para dev (opcional)
export const dynamic = "force-dynamic";

export default async function VideosPage() {
  // Busca toda a hierarquia de vídeos
  const areasConhecimento = await prisma.areaConhecimento.findMany({
    include: {
      disciplinas: {
        include: {
          assuntos: {
            include: {
              aulas: {
                orderBy: {
                  ordem: 'asc'
                }
              }
            }
          }
        }
      }
    }
  });

  return (
    <div className="flex justify-center min-h-[calc(100vh-64px)] bg-background">
      <div className="flex w-full container mx-auto px-4 md:px-8 py-6 gap-6">
        <VideosLayout data={areasConhecimento} />
      </div>
    </div>
  );
}
