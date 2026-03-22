import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";

/**
 * Middleware uses the lightweight auth.config (Edge-compatible).
 * No Prisma, no bcrypt, no Node.js crypto — only JWT token verification.
 * Full auth logic (credential validation, DB queries) runs server-side in auth.ts.
 */
export default NextAuth(authConfig).auth;

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|public/).*)",
  ],
};
