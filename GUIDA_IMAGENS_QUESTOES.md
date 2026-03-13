# Guia: Adicionando Questões com Imagens no Banco de Dados

Este guia explica como inserir questões que contenham imagens diretamente no banco de dados do NeuraCortex, utilizando o formato **Base64**. Essa abordagem torna as questões autossuficientes, eliminando a necessidade de gerenciar arquivos na pasta `public`.

## 1. O Conceito: Data URIs (Base64)

Em vez de salvar um link para um arquivo (Ex: `/images/foto.png`), salvamos o conteúdo da imagem codificado em uma string de texto longa dentro do próprio HTML da questão.

**Formato:** `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...`

## 2. Passo a Passo para Inserção

### Passo A: Converter Imagem para Base64
Você pode converter qualquer imagem usando ferramentas online ou via código.

**No Node.js:**
```typescript
import fs from "fs";
const base64 = fs.readFileSync("caminho/da/imagem.png").toString("base64");
const dataUri = `data:image/png;base64,${base64}`;
```

### Passo B: Estruturar o HTML
No campo `textoBase` da sua questão, você deve inserir a tag `<img>` com o `src` sendo a string gerada no passo anterior. Recomendamos o uso de classes Tailwind para manter o design premium:

```html
<div class="flex flex-col items-center justify-center my-6">
  <img 
    src="VALOR_BASE64_AQUI" 
    class="rounded-xl shadow-lg border border-border/50 max-h-[400px] object-contain" 
  />
  <span class="text-[10px] mt-2 text-muted-foreground uppercase tracking-wider">
    Legenda da Imagem
  </span>
</div>
```

### Passo C: Salvar via Prisma
Ao criar a questão no banco, o campo `textoBase` receberá essa string HTML completa.

```typescript
await prisma.questao.create({
  data: {
    textoBase: "seu html com a imagem aqui...",
    comando: "Qual o assunto da imagem?",
    alternativas: JSON.stringify({
       options: [
         { text: "Opção A", isCorrect: true },
         { text: "Opção B", isCorrect: false }
       ]
    }),
    // ... outros campos (ano, instituicao, ids de disciplina/assunto)
  }
});
```

## 3. Exemplo Prático de Script de Seed

Você pode usar o arquivo [create-enem-question.ts](file:///c:/Users/luizv/Desktop/NeuraCortex/neuracortex/scripts/create-enem-question.ts) como referência. Ele:
1. Lê arquivos locais temporários.
2. Converte-os em strings Base64.
3. Monta o HTML com classes de layout (flexbox, rounding, etc).
4. Insere no Prisma.

## 4. Vantagens desta Abordagem
- **Portabilidade**: O banco de dados SQLite contém tudo. Ao mover o arquivo `.db`, você leva as imagens junto.
- **Simplicidade**: Não precisa configurar drivers de upload (como S3 ou Cloudinary) para uso local/estudo.
- **Performance**: O componente de visualização usa `dangerouslySetInnerHTML`, que renderiza essas strings instantaneamente sem requisições HTTP extras.

---
> [!TIP]
> Para imagens muito grandes (MBs), o banco de dados pode crescer rápido. Tente comprimir as imagens (usando ferramentas como TinyPNG) antes de converter para Base64 para manter o sistema leve.
