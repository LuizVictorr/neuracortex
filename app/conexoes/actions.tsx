"use server"

import React from "react"
import { MDXRemote } from "next-mdx-remote/rsc"
import remarkGfm from "remark-gfm"
import rehypePrettyCode from "rehype-pretty-code"
import { mdxComponents } from "@/components/mdx-components"

export async function getRenderedNodeContent(content: string) {
    if (!content) return null;

    return (
        <div className="mdx-content">
            <MDXRemote
                source={content}
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
    )
}
