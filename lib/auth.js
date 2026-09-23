import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },

  pages: {
    signIn: "/auth/login",
    newUser: "/auth/register",
    error: "/auth/login",
  },

  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      allowDangerousEmailAccountLinking: true,
    }),

    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, request) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required.");
        }

        const emailKey = credentials.email.toLowerCase().trim();

        // Per-email rate limit: 5 attempts per 15 min
        const rl = checkRateLimit(`login:${emailKey}`, {
          windowMs: 15 * 60_000,
          maxRequests: 5,
        });
        if (!rl.allowed) {
          throw new Error("Too many login attempts. Please try again later.");
        }

        const user = await prisma.user.findUnique({
          where: { email: emailKey },
        });

        if (!user || !user.hashedPassword) {
          throw new Error("Invalid email or password.");
        }

        const isValid = await bcrypt.compare(
          credentials.password,
          user.hashedPassword
        );

        if (!isValid) {
          throw new Error("Invalid email or password.");
        }

        // Account status check — a blocked account must not be able to sign in.
        if (!user.isActive) {
          throw new Error("This account has been disabled. Please contact support.");
        }

        return {
          id: user.id,
          name: [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email,
          email: user.email,
          image: user.image,
        };
      },
    }),
  ],

  callbacks: {
    // Runs for every provider, so a blocked account cannot get in via OAuth either.
    async signIn({ user }) {
      if (!user?.id) return true; // first-time OAuth sign-up, no record yet
      const existing = await prisma.user.findUnique({
        where: { id: user.id },
        select: { isActive: true },
      });
      return existing ? existing.isActive : true;
    },

    async jwt({ token, user, trigger, session }) {
      // On initial sign-in
      if (user) {
        token.id = user.id;
        // Stamp last login (best-effort; do not fail auth if it errors)
        try {
          await prisma.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() },
          });
        } catch (e) {
          console.error("[AUTH_LAST_LOGIN_UPDATE_FAILED]", e);
        }
        // Check if user is an admin
        const adminUser = await prisma.adminUser.findUnique({
          where: { userId: user.id },
          select: { role: true, isActive: true },
        });
        if (adminUser?.isActive) {
          token.adminRole = adminUser.role;
        }
      }

      // Refresh B2B status on sign-in and every 5 minutes so existing
      // sessions pick up membership changes without a DB hit per request.
      const b2bStale = !token._b2bCheckedAt || Date.now() - token._b2bCheckedAt > 5 * 60 * 1000;
      if (token.id && (user || b2bStale)) {
        const b2bMember = await prisma.b2BOrganizationMember.findFirst({
          where: { userId: token.id, status: "ACTIVE" },
          select: { organizationId: true },
        });
        if (b2bMember) {
          token.isB2B = true;
          token.b2bOrgId = b2bMember.organizationId;
        } else {
          delete token.isB2B;
          delete token.b2bOrgId;
        }
        token._b2bCheckedAt = Date.now();
      }

      // On session update (e.g. after profile edit)
      if (trigger === "update" && session) {
        token.name = session.name ?? token.name;
      }

      return token;
    },

    async session({ session, token }) {
      if (token) {
        session.user.id = token.id;
        if (token.adminRole) {
          session.user.adminRole = token.adminRole;
        }
        if (token.isB2B) {
          session.user.isB2B = true;
          session.user.b2bOrgId = token.b2bOrgId;
        }
      }
      return session;
    },
  },
});
