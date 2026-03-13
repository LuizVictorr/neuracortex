/*
  Warnings:

  - You are about to drop the column `canvasData` on the `Notebook` table. All the data in the column will be lost.

*/
-- CreateTable
CREATE TABLE "NotebookPage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "pageNumber" INTEGER NOT NULL,
    "canvasData" TEXT NOT NULL,
    "notebookId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "NotebookPage_notebookId_fkey" FOREIGN KEY ("notebookId") REFERENCES "Notebook" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AreaConhecimento" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nome" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Disciplina" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nome" TEXT NOT NULL,
    "areaConhecimentoId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Disciplina_areaConhecimentoId_fkey" FOREIGN KEY ("areaConhecimentoId") REFERENCES "AreaConhecimento" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Assunto" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nome" TEXT NOT NULL,
    "disciplinaId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Assunto_disciplinaId_fkey" FOREIGN KEY ("disciplinaId") REFERENCES "Disciplina" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Aula" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "titulo" TEXT NOT NULL,
    "videoUrl" TEXT,
    "descricao" TEXT,
    "concluida" BOOLEAN NOT NULL DEFAULT false,
    "avaliacao" INTEGER,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "assuntoId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Aula_assuntoId_fkey" FOREIGN KEY ("assuntoId") REFERENCES "Assunto" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Material" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nome" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "aulaId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Material_aulaId_fkey" FOREIGN KEY ("aulaId") REFERENCES "Aula" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Comentario" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "conteudo" TEXT NOT NULL,
    "aulaId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Comentario_aulaId_fkey" FOREIGN KEY ("aulaId") REFERENCES "Aula" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Notebook" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "backgroundNoteSlug" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Notebook" ("createdAt", "id", "title", "updatedAt") SELECT "createdAt", "id", "title", "updatedAt" FROM "Notebook";
DROP TABLE "Notebook";
ALTER TABLE "new_Notebook" RENAME TO "Notebook";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "AreaConhecimento_nome_key" ON "AreaConhecimento"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "Disciplina_nome_key" ON "Disciplina"("nome");
