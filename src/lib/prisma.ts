import { PrismaClient } from "@/generated/prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";

// Neon serverless sürücüsü + Prisma 7 "driver adapter" yaklaşımı.
// Vercel gibi serverless ortamlarda ve IIS altındaki uzun ömürlü Node
// process'inde aynı şekilde çalışır (WebSocket üzerinden Neon'a bağlanır).
// Bkz. PROJECT.md Bölüm 8 (Teknoloji Yığını) ve Bölüm 9 (Deployment).

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "DATABASE_URL tanımlı değil. .env dosyasına Neon bağlantı dizesini ekleyin."
  );
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  const adapter = new PrismaNeon({ connectionString });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
