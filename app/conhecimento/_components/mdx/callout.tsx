import { AlertTriangle, Info, CheckCircle, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"

interface CalloutProps {
    icon?: string
    children?: React.ReactNode
    type?: "default" | "warning" | "error" | "info" | "success"
}

export function Callout({
    children,
    icon,
    type = "default",
    ...props
}: CalloutProps) {
    return (
        <div
            className={cn(
                "my-6 flex items-start rounded-md border border-l-4 p-4",
                {
                    "border-l-zinc-900 bg-zinc-50 dark:bg-zinc-800/50": type === "default",
                    "border-l-red-500 bg-red-50 dark:bg-red-900/20 text-red-900 dark:text-red-200": type === "error",
                    "border-l-amber-500 bg-amber-50 dark:bg-amber-900/20 text-amber-900 dark:text-amber-200": type === "warning",
                    "border-l-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-900 dark:text-blue-200": type === "info",
                    "border-l-green-500 bg-green-50 dark:bg-green-900/20 text-green-900 dark:text-green-200": type === "success",
                }
            )}
            {...props}
        >
            {icon && <span className="mr-4 text-2xl">{icon}</span>}
            {!icon && type === 'warning' && <AlertTriangle className="mr-4 mt-0.5 h-5 w-5" />}
            {!icon && type === 'error' && <AlertCircle className="mr-4 mt-0.5 h-5 w-5" />}
            {!icon && type === 'info' && <Info className="mr-4 mt-0.5 h-5 w-5" />}
            {!icon && type === 'success' && <CheckCircle className="mr-4 mt-0.5 h-5 w-5" />}
            <div className="flex-1 overflow-x-auto text-sm">{children}</div>
        </div>
    )
}
