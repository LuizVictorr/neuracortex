import type { NextAuthConfig } from 'next-auth';

export const authConfig = {
    pages: {
        signIn: '/login',
    },
    callbacks: {
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user;
            const isPublicPath = nextUrl.pathname === '/' || nextUrl.pathname.startsWith('/login') || nextUrl.pathname.startsWith('/register');

            // Permitir assets estáticos e API
            if (nextUrl.pathname.startsWith('/_next') || nextUrl.pathname.startsWith('/api/') || nextUrl.pathname.startsWith('/images/')) {
                return true;
            }

            if (isLoggedIn) {
                if (nextUrl.pathname.startsWith('/login')) {
                    return Response.redirect(new URL('/conhecimento', nextUrl));
                }
                return true;
            }

            // Usuário não logado tentando acessar página protegida
            if (!isPublicPath) {
                return false; // Resultará em redirecionamento para signIn page
            }

            return true;
        },
    },
    providers: [], // Configured in auth.ts
} satisfies NextAuthConfig;
