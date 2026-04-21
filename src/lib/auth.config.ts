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
    async jwt({ token, user }) {
      // Persist role and stratum from initial sign-in into the JWT
      if (user) {
        const u = user as unknown as Record<string, unknown>;
        token.role = u.role;
        token.stratum = u.stratum;
      }
      return token;
    },
    async session({ session, token }) {
      // Map JWT fields to session.user so middleware/layouts can access them
      if (token) {
        const u = session.user as unknown as Record<string, unknown>;
        u.id = token.sub;
        u.role = token.role;
        u.stratum = token.stratum;
      }
      return session;
    },
    async authorized({ auth, request }) {
      const isLoggedIn = !!auth?.user;
      const pathname = request.nextUrl.pathname;
      const role = (auth?.user as Record<string, unknown>)?.role;
      const isApi = pathname.startsWith("/api/");

      // Public routes — no auth required
      // NOTE: /api/admin y /api/discord NO son públicos. Cada endpoint
      // se guarda con requireAdmin() desde src/lib/auth/guards.ts.
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
        pathname.startsWith("/api/chat") ||
        pathname.startsWith("/api/health")
      ) {
        return true;
      }

      // Admin API routes — require ADMIN or SUPER_ADMIN, JSON 401/403 otherwise
      if (pathname.startsWith("/api/admin")) {
        if (!isLoggedIn) {
          return Response.json({ error: "Unauthorized" }, { status: 401 });
        }
        if (role !== "ADMIN" && role !== "SUPER_ADMIN") {
          return Response.json({ error: "Forbidden" }, { status: 403 });
        }
        return true;
      }

      // Discord API routes — require ADMIN or SUPER_ADMIN, JSON 401/403 otherwise
      if (pathname.startsWith("/api/discord")) {
        if (!isLoggedIn) {
          return Response.json({ error: "Unauthorized" }, { status: 401 });
        }
        if (role !== "ADMIN" && role !== "SUPER_ADMIN") {
          return Response.json({ error: "Forbidden" }, { status: 403 });
        }
        return true;
      }

      // Protected routes — require login
      if (!isLoggedIn) {
        if (isApi) {
          return Response.json({ error: "Unauthorized" }, { status: 401 });
        }
        return Response.redirect(new URL("/login", request.nextUrl));
      }

      // Admin UI routes — require ADMIN or SUPER_ADMIN role
      if (pathname.startsWith("/admin")) {
        if (role !== "ADMIN" && role !== "SUPER_ADMIN") {
          return Response.redirect(new URL("/dashboard", request.nextUrl));
        }
      }

      return true;
    },
  },
} satisfies NextAuthConfig;
