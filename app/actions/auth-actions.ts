"use server"

import { signIn } from "@/auth"
import { AuthError } from "next-auth"
import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"
import { z } from "zod"

const prisma = new PrismaClient()

// Validation Schemas
const LoginSchema = z.object({
    email: z.string().email({ message: "Insira um e-mail válido." }),
    password: z.string().min(6, { message: "A senha precisa ter no mínimo 6 caracteres." }),
})

const RegisterSchema = z.object({
    name: z.string().min(2, { message: "O nome precisa ter no mínimo 2 caracteres." }),
    email: z.string().email({ message: "Insira um e-mail válido." }),
    password: z.string().min(6, { message: "A senha precisa ter no mínimo 6 caracteres." }),
})

export async function loginAction(prevState: any, formData: FormData) {
    const email = formData.get("email")
    const password = formData.get("password")
    const redirectTo = formData.get("redirectTo") || "/conhecimento"

    const validatedFields = LoginSchema.safeParse({ email, password })

    if (!validatedFields.success) {
        return {
            error: "Campos inválidos. Verifique as informações.",
        }
    }

    try {
        await signIn("credentials", {
            email,
            password,
            redirectTo: redirectTo as string,
        })
    } catch (error) {
        if (error instanceof AuthError) {
            switch (error.type) {
                case "CredentialsSignin":
                    return { error: "Credenciais inválidas." }
                default:
                    return { error: "Ocorreu um erro ao fazer login." }
            }
        }
        throw error // Rethrow so Next.js redirect works
    }
}

export async function registerAction(prevState: any, formData: FormData) {
    const name = formData.get("name") as string
    const email = formData.get("email") as string
    const password = formData.get("password") as string

    const validatedFields = RegisterSchema.safeParse({ name, email, password })

    if (!validatedFields.success) {
        return {
            error: validatedFields.error.issues[0].message,
        }
    }

    try {
        const existingUser = await (prisma as any).user.findUnique({
            where: { email },
        })

        if (existingUser) {
            return { error: "Este e-mail já está em uso." }
        }

        const hashedPassword = await bcrypt.hash(password, 10)

        await (prisma as any).user.create({
            data: {
                name,
                email,
                password: hashedPassword,
            },
        })

        // Auto-login after registration
        await signIn("credentials", {
            email,
            password,
            redirectTo: "/conhecimento",
        })

    } catch (error) {
        if (error instanceof AuthError) {
            return { error: "Erro ao autenticar após registro." }
        }
        throw error // Retorna throw para lidar o redirect internamente (Next.js/next-auth magic)
    }
}

import { signOut } from "@/auth"

export async function logoutAction() {
    await signOut({ redirectTo: "/login" })
}

export async function signInWithGithub() {
    await signIn("github", { redirectTo: "/conhecimento" })
}

export async function signInWithGoogle() {
    await signIn("google", { redirectTo: "/conhecimento" })
}
