import type { NextAuthConfig } from "next-auth";

/**
 * Edge-safe Auth.js config. Imported by middleware, so it must NOT pull in
 * Node-only deps (Prisma, bcrypt). Real providers + the Prisma adapter live in
 * auth.ts. Session is JWT (required for the Credentials provider).
 */
export const authConfig = {
  pages: { signIn: "/login" },
  session: { strategy: "jwt" },
  // Derive the OAuth redirect URL from AUTH_URL / the request host deterministically.
  trustHost: true,
  providers: [],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.platformRole = (
          user as { platformRole?: string }
        ).platformRole;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = (token.id as string) ?? session.user.id;
        session.user.platformRole = token.platformRole as string | undefined;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
