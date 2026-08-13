import type { NextAuthConfig } from "next-auth";

// Edge-uyumlu (proxy.ts / Edge Runtime) parçası: Prisma/Node API'lerine
// dokunmaz. Sağlayıcılar (Credentials + Prisma) sadece `src/auth.ts`'te,
// Node runtime'da çalışan tarafta tanımlıdır.
// Bkz. Auth.js "Split config" deseni — proxy'de DB'ye bağlanmadan
// sadece JWT session'ı okuyabilmek için gereklidir.
export const authConfig = {
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as { role?: string }).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role as string | undefined;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
