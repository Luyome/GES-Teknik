import type { DefaultSession } from "next-auth";

// Auth.js session/JWT tiplerine `role` alanını ekler
// (prisma/schema.prisma → RoleName ile eşleşir).
declare module "next-auth" {
  interface Session {
    user: {
      role?: string;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: string;
  }
}
