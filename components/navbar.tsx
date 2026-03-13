import Link from "next/link";
import { ModeToggle } from "./mode-toggle";
import {
    NavigationMenu,
    NavigationMenuItem,
    NavigationMenuLink,
    NavigationMenuList,
    navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { auth } from "@/auth";
import { logoutAction } from "@/app/actions/auth-actions";
import { LogOut, User as UserIcon } from "lucide-react";

export async function Navbar() {
    const session = await auth();

    return (
        <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 print:hidden">
            <div className="container flex h-16 items-center mx-auto px-4 md:px-8">

                {/* Coluna 1: Home/Logo */}
                <div className="flex flex-1 items-center justify-start">
                    <Link href="/" className="flex items-center space-x-2">
                        <span className="font-bold text-lg md:text-2xl tracking-tight">
                            NeuraCortex
                        </span>
                    </Link>
                </div>

                {/* Coluna 2: Navegação Central */}
                <div className="flex flex-1 items-center justify-center">
                    <NavigationMenu>
                        <NavigationMenuList className="flex space-x-2">
                            <NavigationMenuItem>
                                <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
                                    <Link href="/conhecimento">
                                        Conhecimento
                                    </Link>
                                </NavigationMenuLink>
                            </NavigationMenuItem>
                            <NavigationMenuItem>
                                <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
                                    <Link href="/conexoes">
                                        Conexões
                                    </Link>
                                </NavigationMenuLink>
                            </NavigationMenuItem>
                            <NavigationMenuItem>
                                <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
                                    <Link href="/anotacoes">
                                        Anotações
                                    </Link>
                                </NavigationMenuLink>
                            </NavigationMenuItem>
                            <NavigationMenuItem>
                                <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
                                    <Link href="/videos">
                                        Disciplinas
                                    </Link>
                                </NavigationMenuLink>
                            </NavigationMenuItem>
                            <NavigationMenuItem>
                                <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
                                    <Link href="/questoes">
                                        Questões
                                    </Link>
                                </NavigationMenuLink>
                            </NavigationMenuItem>
                        </NavigationMenuList>
                    </NavigationMenu>
                </div>

                {/* Coluna 3: Avatar e Dark Mode */}
                <div className="flex flex-1 items-center justify-end space-x-4">
                    {session?.user ? (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Avatar className="h-9 w-9 cursor-pointer ring-1 ring-border hover:ring-primary transition-all">
                                    <AvatarImage src={session.user.image || ""} alt={session.user.name || "User"} />
                                    <AvatarFallback className="bg-primary/10 text-primary font-medium">
                                        {session.user.name ? session.user.name.charAt(0).toUpperCase() : <UserIcon className="w-4 h-4" />}
                                    </AvatarFallback>
                                </Avatar>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56">
                                <DropdownMenuLabel className="font-normal">
                                    <div className="flex flex-col space-y-1">
                                        <p className="text-sm font-medium leading-none">{session.user.name}</p>
                                        <p className="text-xs leading-none text-muted-foreground">{session.user.email}</p>
                                    </div>
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <form action={logoutAction}>
                                    <DropdownMenuItem asChild className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-100 dark:focus:bg-red-900/20">
                                        <button type="submit" className="w-full flex items-center">
                                            <LogOut className="mr-2 h-4 w-4" />
                                            <span>Sair da conta</span>
                                        </button>
                                    </DropdownMenuItem>
                                </form>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    ) : (
                        <div className="h-9 w-9" /> // Placeholder se não logado para manter alinhamento
                    )}
                    <ModeToggle />
                </div>
            </div>
        </header>
    );
}
