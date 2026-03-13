import fs from "fs"
import path from "path"
import matter from "gray-matter"

export interface ContentItem {
    name: string
    title: string
    url: string
    isDirectory: boolean
    children?: ContentItem[]
    order?: number
    icon?: string
}

const contentDirectory = path.join(process.cwd(), "content")

export function getSidebarTree(dir = contentDirectory, basePath = "/conhecimento"): ContentItem[] {
    // Return empty array if content directory doesn't exist yet
    if (!fs.existsSync(dir)) {
        return []
    }

    const fileNames = fs.readdirSync(dir)

    const items = fileNames.map((fileName) => {
        const fullPath = path.join(dir, fileName)
        const isDirectory = fs.statSync(fullPath).isDirectory()

        if (isDirectory) {
            const slug = fileName
            const url = `${basePath}/${slug}`
            const children = getSidebarTree(fullPath, url)

            return {
                name: fileName,
                title: fileName.charAt(0).toUpperCase() + fileName.slice(1).replace(/-/g, " "),
                url,
                isDirectory,
                children,
                order: 99, // default
            } as ContentItem
        } else {
            // It's a file
            if (!fileName.endsWith(".mdx")) return null

            const slug = fileName.replace(/\.mdx$/, "")
            const url = `${basePath}/${slug}`
            const fileContents = fs.readFileSync(fullPath, "utf8")
            const { data } = matter(fileContents)

            return {
                name: slug,
                title: data.title || slug,
                url,
                isDirectory,
                order: data.order || 99,
                icon: data.icon,
            } as ContentItem
        }
    }).filter(Boolean) as ContentItem[]

    // Sort by order, then by title
    return items.sort((a, b) => {
        if (a.order !== b.order) {
            return (a.order || 99) - (b.order || 99)
        }
        return a.title.localeCompare(b.title)
    })
}

export function getAllMdxFiles(dir = contentDirectory): string[] {
    let results: string[] = []

    if (!fs.existsSync(dir)) return results

    const list = fs.readdirSync(dir)

    list.forEach((file) => {
        const fullPath = path.join(dir, file)
        const stat = fs.statSync(fullPath)

        if (stat && stat.isDirectory()) {
            results = results.concat(getAllMdxFiles(fullPath))
        } else if (file.endsWith(".mdx")) {
            results.push(fullPath)
        }
    })

    return results
}

export function getMdxContent(slugs: string[]) {
    const filePath = path.join(contentDirectory, ...slugs) + ".mdx"

    if (!fs.existsSync(filePath)) {
        return null
    }

    const fileContents = fs.readFileSync(filePath, "utf8")
    const { data, content } = matter(fileContents)

    // Resolve connections titles
    const connections: { title: string; url: string }[] = []
    if (data.connections) {
        const rawConnections = Array.isArray(data.connections) ? data.connections : [data.connections]
        rawConnections.forEach(slug => {
            const connPath = path.join(contentDirectory, ...slug.split("/")) + ".mdx"
            if (fs.existsSync(connPath)) {
                const connContents = fs.readFileSync(connPath, "utf8")
                const connData = matter(connContents).data
                connections.push({
                    title: connData.title || slug.split("/").pop() || slug,
                    url: `/conhecimento/${slug}`
                })
            }
        })
    }

    return {
        frontmatter: data,
        content,
        connections,
    }
}

export interface GraphData {
    nodes: { id: string; name: string; group: string; val: number; description: string; content: string }[]
    links: { source: string; target: string }[]
}

export function getGraphData(): GraphData {
    const files = getAllMdxFiles()
    const nodes: GraphData["nodes"] = []
    const links: GraphData["links"] = []

    // Auxiliary map to easily find valid targets and title
    const slugMap = new Map<string, { title: string, group: string }>()

    // First pass: collect all valid nodes
    files.forEach((file) => {
        const relativePath = file.replace(contentDirectory, "").replace(/^\/|^\\/, "")
        const rawSlugStr = relativePath.replace(/\.mdx$/, "").replace(/\\/g, "/")

        const fileContents = fs.readFileSync(file, "utf8")
        const { data, content } = matter(fileContents)

        const title = data.title || rawSlugStr.split("/").pop() || "Sem título"
        const group = rawSlugStr.includes("/") ? rawSlugStr.split("/")[0] : "Raiz"

        slugMap.set(rawSlugStr, { title, group })

        nodes.push({
            id: rawSlugStr,
            name: title,
            group,
            val: 1.5, // Base node size
            description: data.description || "",
            content: content
        })
    })

    // Second pass: setup connections
    files.forEach((file) => {
        const relativePath = file.replace(contentDirectory, "").replace(/^\/|^\\/, "")
        const sourceSlug = relativePath.replace(/\.mdx$/, "").replace(/\\/g, "/")

        const fileContents = fs.readFileSync(file, "utf8")
        const { data } = matter(fileContents)

        const connections: string[] = Array.isArray(data.connections)
            ? data.connections
            : typeof data.connections === 'string'
                ? [data.connections]
                : []

        connections.forEach((targetSlug) => {
            // Only add link if the target exists in our content
            if (slugMap.has(targetSlug)) {
                links.push({
                    source: sourceSlug,
                    target: targetSlug
                })
            }
        })
    })

    return { nodes, links }
}
