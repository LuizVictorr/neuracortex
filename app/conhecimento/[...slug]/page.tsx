import { notFound } from "next/navigation"
import Link from "next/link"
import { MDXRemote } from "next-mdx-remote/rsc"
import { getAllMdxFiles, getMdxContent } from "@/lib/content"
import path from "path"
import rehypePrettyCode from "rehype-pretty-code"
import remarkGfm from "remark-gfm"
import { mdxComponents } from "@/components/mdx-components"
import { DocumentMenu } from "@/components/document-menu"

interface DocPageProps {
    params: Promise<{
        slug: string[]
    }>
}

export async function generateStaticParams() {
    const contentDir = path.join(process.cwd(), "content")
    const files = getAllMdxFiles(contentDir)

    return files.map((file) => {
        // Return array of path segments relative to content dir
        // e.g., ["guias", "iniciando"]
        const relativePath = file.replace(contentDir, "").replace(/^\/|^\\/, "")
        const slug = relativePath.replace(/\.mdx$/, "").split(path.sep)
        return { slug }
    })
}

export default async function DocPage({ params }: DocPageProps) {
    const resolvedParams = await params
    const { slug } = resolvedParams

    // Decodificar a URL (ex: "Gr%C3%A9cia" -> "Grécia")
    const decodedSlug = slug.map((segment) => decodeURIComponent(segment))
    const doc = getMdxContent(decodedSlug)

    if (!doc) {
        notFound()
    }

    return (
        <article className="prose prose-zinc dark:prose-invert max-w-none w-full pb-24 relative">
            <div className="absolute right-0 top-0 mt-2">
                <DocumentMenu
                    noteSlug={decodedSlug.join('/')}
                    noteTitle={doc.frontmatter.title || decodedSlug[decodedSlug.length - 1]}
                />
            </div>

            <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl mb-8 pr-12">
                {doc.frontmatter.title || decodedSlug[decodedSlug.length - 1]}
            </h1>

            {doc.frontmatter.description && (
                <p className="text-xl text-muted-foreground mb-8">
                    {doc.frontmatter.description}
                </p>
            )}

            {/* Rendeizer do Tailwind Typography e MDX Remote */}
            <div className="mdx-content">
                <MDXRemote
                    source={doc.content}
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
            </div>

            {doc.connections && doc.connections.length > 0 && (
                <div className="mt-16 border-t pt-8">
                    <h2 className="mb-4 text-2xl font-semibold tracking-tight">🔗 Conexões Relacionadas</h2>
                    <ul className="flex flex-col gap-2">
                        {doc.connections.map((conn, idx) => (
                            <li key={idx}>
                                <Link
                                    href={conn.url}
                                    className="text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1"
                                >
                                    {conn.title}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </article>
    )
}
