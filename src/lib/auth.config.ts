import type { NextAuthConfig } from "next-auth";

/**
 * Auth config that is Edge-compatible (no Prisma, no bcrypt, no Node.js crypto).
 * Used by the middleware for route protection.
 * The actual credential verification happens in auth.ts via the full config.
 */
export const authConfig = {
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: {
    strategy: "jwt",
  },
  providers: [],  // Providers are added in auth.ts (server-only)
  callbacks: {
    async authorized({ auth, request }) {
      const isLoggedIn = !!auth?.user;
      const pathname = request.nextUrl.pathname;

      // Public routes — no auth required
      if (
        pathname === "/" ||
        pathname === "/login" ||
        pathname === "/register" ||
        pathname.startsWith("/register/onboarding") ||
        pathname === "/calculadora" ||
        pathname === "/como-funciona" ||
        pathname === "/servicios" ||
        pathname === "/faq" ||
        pathname.startsWith("/legal") ||
        pathname.startsWith("/ref/") ||
        pathname.startsWith("/api/auth") ||
        pathname.startsWith("/api/chat")
      ) {
        return true;
      }

      // Protected routes — require login
      if (!isLoggedIn) {
        return Response.redirect(new URL("/login", request.nextUrl));
      }

      // Admin routes — require ADMIN or SUPER_ADMIN role
      if (pathname.startsWith("/admin")) {
        const role = (auth?.user as Record<string, unknown>)?.role;
        if (role !== "ADMIN" && role !== "SUPER_ADMIN") {
          return Response.redirect(new URL("/dashboard", request.nextUrl));
        }
      }

      return true;
    },
  },
} satisfies NextAuthConfig;
