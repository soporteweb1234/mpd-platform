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
        pathname.startsWith("/api/auth")
      ) {
        return true;
      }

      // Protected routes — require login
      if (!isLoggedIn) {
        if (isApi) {
          return Response.json({ error: "Unauthorized" }, { status: 401 });
        }
        return Response.redirect(new URL("/login", request.nextUrl));
      }

      // Admin routes — require ADMIN or SUPER_ADMIN role
      const u = auth?.user as Record<string, unknown> | undefined;
      const role = u?.role;
      const isAdminPath =
        pathname.startsWith("/admin") ||
        pathname.startsWith("/api/admin") ||
        pathname.startsWith("/api/discord");
      if (isAdminPath && role !== "ADMIN" && role !== "SUPER_ADMIN") {
        if (isApi) {
          return Response.json({ error: "Forbidden" }, { status: 403 });
        }
        return Response.redirect(new URL("/dashboard", request.nextUrl));
      }

      // 2FA gate para admins marcados como required.
      const twoFactorRequired = Boolean(u?.twoFactorRequired);
      const twoFactorEnabled = Boolean(u?.twoFactorEnabled);
      if (isAdminPath && twoFactorRequired && !twoFactorEnabled) {
        const isSetup = pathname.startsWith("/admin/2fa/setup");
        const isEnroll = pathname.startsWith("/api/admin/2fa/");
        if (!isSetup && !isEnroll) {
          if (isApi) {
            return Response.json({ error: "TwoFactorRequired" }, { status: 403 });
          }
          return Response.redirect(new URL("/admin/2fa/setup", request.nextUrl));
        }
      }

      return true;
    },
  },
} satisfies NextAuthConfig;
