import { getNotebooks, getAvailableNotes } from "@/app/anotacoes/actions"
import { AnotacoesClient } from "@/components/anotacoes-client"
import { getMdxContent } from "@/lib/content"
import { MDXRemote } from "next-mdx-remote/rsc"
import rehypePrettyCode from "rehype-pretty-code"
import remarkGfm from "remark-gfm"
import { mdxComponents } from "@/components/mdx-components"

export default async function AnotacoesPage() {
    const notebooksRaw = await getNotebooks()
    const { notes: availableNotes } = await getAvailableNotes()

    // Para cada caderno, se houver um slug de fundo, buscamos o conteúdo MDX
    const notebooks = notebooksRaw.map(notebook => {
        let backgroundContentNode = null
        if (notebook.backgroundNoteSlug) {
            const slugSegments = notebook.backgroundNoteSlug.split('/')
            const doc = getMdxContent(slugSegments)
            if (doc) {
                const title = doc.frontmatter.title || slugSegments[slugSegments.length - 1]
                const description = doc.frontmatter.description || ''
                const rawMDX = `# ${title}\n\n${description ? `> ${description}\n\n` : ''}${doc.content}`

                backgroundContentNode = (
                    <MDXRemote
                        source={rawMDX}
                        components={mdxComponents}
                        options={{
                            mdxOptions: {
                                remarkPlugins: [remarkGfm],
                                rehypePlugins: [
                                    [
                                        rehypePrettyCode as any,
                                        {
                                            theme: 'github-dark-dimmed',
                                        },
                                    ],
                                ],
                            },
                        }}
                    />
                )
            }
        }
        return {
            ...notebook,
            backgroundContentNode // Node React completo gerado no servidor
        }
    })

    return (
        <div className="container mx-auto flex h-[calc(100vh-4rem)] items-start gap-4 py-6 px-4 md:px-8 print:block print:h-auto print:p-0 print:m-0">
            <AnotacoesClient initialNotebooks={notebooks} availableNotes={availableNotes} />
        </div>
    )
}

