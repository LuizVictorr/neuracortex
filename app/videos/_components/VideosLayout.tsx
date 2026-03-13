"use client";

import { useState, useMemo } from "react";
import { AreaConhecimento } from "../types";
import LeftSidebar from "./LeftSidebar";
import RightPanel from "./RightPanel";
import { ResizableSidebar } from "@/components/resizable-sidebar";

interface VideosLayoutProps {
    data: AreaConhecimento[];
}

export default function VideosLayout({ data }: VideosLayoutProps) {
    // Pega a primeira disciplina da primeira área como padrão se existir
    const defaultDisciplinaId = useMemo(() => {
        for (const area of data) {
            if (area.disciplinas.length > 0) {
                return area.disciplinas[0].id;
            }
        }
        return null;
    }, [data]);

    const [selectedDisciplinaId, setSelectedDisciplinaId] = useState<string | null>(
        defaultDisciplinaId
    );

    return (
        <>
            {/* Painel Esquerdo: Lista de Áreas e Disciplinas - Agora Redimensionável */}
            <ResizableSidebar>
                <LeftSidebar
                    data={data}
                    selectedDisciplinaId={selectedDisciplinaId}
                    onSelectDisciplina={setSelectedDisciplinaId}
                />
            </ResizableSidebar>

            {/* Painel Direito: Assuntos e Aulas */}
            <RightPanel
                data={data}
                selectedDisciplinaId={selectedDisciplinaId}
            />
        </>
    );
}
