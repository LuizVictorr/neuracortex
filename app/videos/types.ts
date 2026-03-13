export type Aula = {
    id: string;
    titulo: string;
    videoUrl: string | null;
    ordem: number;
    assuntoId: string;
    createdAt: Date;
    updatedAt: Date;
};

export type Assunto = {
    id: string;
    nome: string;
    disciplinaId: string;
    createdAt: Date;
    updatedAt: Date;
    aulas: Aula[];
};

export type Disciplina = {
    id: string;
    nome: string;
    areaConhecimentoId: string;
    createdAt: Date;
    updatedAt: Date;
    assuntos: Assunto[];
};

export type AreaConhecimento = {
    id: string;
    nome: string;
    createdAt: Date;
    updatedAt: Date;
    disciplinas: Disciplina[];
};
