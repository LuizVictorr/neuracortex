"use client"

import { useActionState } from "react"
import { registerAction, signInWithGithub, signInWithGoogle } from "@/app/actions/auth-actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { BrainCircuit, Loader2, Github } from "lucide-react"
import Link from "next/link"

export default function RegisterPage() {
    const [state, formAction, isPending] = useActionState(registerAction, undefined)

    return (
        <div className="min-h-screen grid lg:grid-cols-2">
            {/* Left side - Dynamic Background/Brand */}
            <div className="hidden lg:flex flex-col bg-zinc-950 p-10 text-white relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-tr from-primary/30 to-background opacity-50 z-0" />
                <div className="relative z-10 font-bold text-2xl flex items-center gap-2">
                    <BrainCircuit className="w-8 h-8 text-primary" />
                    NeuraCortex
                </div>
                <div className="relative z-10 mt-auto">
                    <h1 className="text-4xl font-bold tracking-tight mb-4">
                        Comece a aprender agora.
                    </h1>
                    <p className="text-lg text-zinc-400 max-w-md">
                        Crie uma conta para organizar seus estudos com o poder da inteligência artificial. Cadernos dinâmicos, banco de questões e muito mais.
                    </p>
                </div>
            </div>

            {/* Right side - Form */}
            <div className="flex items-center justify-center p-8">
                <Card className="w-full max-w-md border-0 shadow-none sm:border sm:shadow-sm">
                    <CardHeader className="space-y-1 items-center lg:items-start text-center lg:text-left">
                        <div className="lg:hidden flex justify-center mb-6">
                            <BrainCircuit className="w-12 h-12 text-primary" />
                        </div>
                        <CardTitle className="text-3xl font-bold">Criar Conta</CardTitle>
                        <CardDescription>
                            Preencha os campos abaixo para criar sua conta no NeuraCortex.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form action={formAction} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Nome Completo</Label>
                                <Input
                                    id="name"
                                    name="name"
                                    type="text"
                                    placeholder="João da Silva"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">E-mail</Label>
                                <Input
                                    id="email"
                                    name="email"
                                    type="email"
                                    placeholder="m@exemplo.com"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password">Senha</Label>
                                <Input
                                    id="password"
                                    name="password"
                                    type="password"
                                    required
                                />
                            </div>
                            {state?.error && (
                                <p className="text-sm text-red-500 font-medium">
                                    {state.error}
                                </p>
                            )}
                            <Button className="w-full" type="submit" disabled={isPending}>
                                {isPending ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Criando conta...
                                    </>
                                ) : (
                                    "Criar Conta"
                                )}
                            </Button>
                        </form>

                        <div className="relative my-6">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-card px-2 text-muted-foreground border border-transparent">
                                    Ou continue com
                                </span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <form action={signInWithGithub}>
                                <Button variant="outline" type="submit" className="w-full h-11">
                                    <Github className="mr-2 h-4 w-4" />
                                    GitHub
                                </Button>
                            </form>
                            <form action={signInWithGoogle}>
                                <Button variant="outline" type="submit" className="w-full h-11">
                                    <svg role="img" viewBox="0 0 24 24" className="mr-2 h-4 w-4 fill-current">
                                        <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z" />
                                    </svg>
                                    Google
                                </Button>
                            </form>
                        </div>
                    </CardContent>
                    <CardFooter className="flex flex-col space-y-4 text-center">
                        <div className="text-sm text-muted-foreground w-full text-center">
                            Já tem uma conta?{" "}
                            <Link href="/login" className="font-semibold text-primary hover:underline">
                                Fazer Login
                            </Link>
                        </div>
                    </CardFooter>
                </Card>
            </div>
        </div>
    )
}
