import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Discord from "next-auth/providers/discord";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";
import type { UserRole, PlayerStratum } from "@prisma/client";
import { authConfig } from "./auth.config";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      nickname: string | null;
      avatar: string | null;
      role: UserRole;
      stratum: PlayerStratum;
      discordId: string | null;
      discordConnected: boolean;
      onboardingStep: number;
    };
  }

  interface User {
    role: UserRole;
    stratum: PlayerStratum;
    nickname: string | null;
    discordId: string | null;
    discordConnected: boolean;
    onboardingStep: number;
  }
}

declare module "next-auth" {
  interface JWT {
    id: string;
    role: UserRole;
    stratum: PlayerStratum;
    nickname: string | null;
    discordId: string | null;
    discordConnected: boolean;
    onboardingStep: number;
  }
}

// Discord provider is optional: only wire it up if both env vars exist.
// Auth.js v5 throws "Configuration" for ALL logins (incl. credentials) when a
// registered OAuth provider has undefined clientId/clientSecret.
const discordProvider =
  process.env.DISCORD_CLIENT_ID && process.env.DISCORD_CLIENT_SECRET
    ? [
        Discord({
          clientId: process.env.DISCORD_CLIENT_ID,
          clientSecret: process.env.DISCORD_CLIENT_SECRET,
        }),
      ]
    : [];

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Contraseña", type: "password" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email },
        });

        if (!user || user.deletedAt) return null;
        if (user.status === "BANNED") return null;

        const isValid = await bcrypt.compare(parsed.data.password, user.password);
        if (!isValid) return null;

        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date(), lastActiveAt: new Date() },
        });

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.avatar,
          role: user.role,
          stratum: user.stratum,
          nickname: user.nickname,
          discordId: user.discordId,
          discordConnected: user.discordConnected,
          onboardingStep: user.onboardingStep,
        };
      },
    }),
    ...discordProvider,
  ],
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id as string;
        token.role = user.role;
        token.stratum = user.stratum;
        token.nickname = user.nickname;
        token.discordId = user.discordId;
        token.discordConnected = user.discordConnected;
        token.onboardingStep = user.onboardingStep;
      }

      // Handle Discord OAuth sign-in
      if (account?.provider === "discord") {
        const discordId = account.providerAccountId;
        let dbUser = await prisma.user.findUnique({
          where: { discordId },
        });

        if (!dbUser) {
          dbUser = await prisma.user.findUnique({
            where: { email: token.email as string },
          });

          if (dbUser) {
            dbUser = await prisma.user.update({
              where: { id: dbUser.id },
              data: {
                discordId,
                discordUsername: token.name,
                discordConnected: true,
                lastLoginAt: new Date(),
              },
            });
          } else {
            dbUser = await prisma.user.create({
              data: {
                email: token.email as string,
                password: "",
                name: token.name as string,
                discordId,
                discordUsername: token.name,
                discordConnected: true,
                status: "PENDING",
                lastLoginAt: new Date(),
              },
            });
          }
        } else {
          await prisma.user.update({
            where: { id: dbUser.id },
            data: { lastLoginAt: new Date(), lastActiveAt: new Date() },
          });
        }

        token.id = dbUser.id;
        token.role = dbUser.role;
        token.stratum = dbUser.stratum;
        token.nickname = dbUser.nickname;
        token.discordId = dbUser.discordId;
        token.discordConnected = dbUser.discordConnected;
        token.onboardingStep = dbUser.onboardingStep;
      }

      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id as string;
      session.user.role = token.role as UserRole;
      session.user.stratum = token.stratum as PlayerStratum;
      session.user.nickname = token.nickname as string | null;
      session.user.discordId = token.discordId as string | null;
      session.user.discordConnected = token.discordConnected as boolean;
      session.user.onboardingStep = token.onboardingStep as number;
      return session;
    },
  },
});
