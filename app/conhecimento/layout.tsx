import { getSidebarTree } from "@/lib/content"
import { ConhecimentoSidebar } from "./_components/conhecimento-sidebar"

export default function ConhecimentoLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const sidebarItems = getSidebarTree()

    return (
        <div className="container mx-auto flex min-h-[calc(100vh-4rem)] px-8 gap-6 py-6 border-transparent">
            {/* Sidebar (Client Component) */}
            <ConhecimentoSidebar sidebarItems={sidebarItems} />

            {/* Main Content */}
            <main className="flex w-full flex-col min-w-0 leading-relaxed">
                {children}
            </main>
        </div>
    )
}
