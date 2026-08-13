// Başlangıç verisi: roller ve varsayılan iş akışı aşamaları.
// Bkz. PROJECT.md Bölüm 2 (İş Akışı Modeli) ve Bölüm 3 (Roller).
// Çalıştırma: npx prisma db seed

import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const ROLES = [
  "ADMIN",
  "SERVICE_MANAGER",
  "TECHNICIAN",
  "QUALITY_CONTROL",
  "CUSTOMER",
] as const;

// PROJECT.md Bölüm 2'deki örnek aşama zinciri (taslak — saha süreciyle netleştirilecek).
const STAGES: { name: string; order: number; role: (typeof ROLES)[number] }[] = [
  { name: "Kayıt / Giriş", order: 1, role: "SERVICE_MANAGER" },
  { name: "Ön İnceleme", order: 2, role: "SERVICE_MANAGER" },
  { name: "Teknik Değerlendirme", order: 3, role: "TECHNICIAN" },
  { name: "Onarım / İşlem", order: 4, role: "TECHNICIAN" },
  { name: "Kalite Kontrol", order: 5, role: "QUALITY_CONTROL" },
  { name: "Teslim / Çıkış", order: 6, role: "SERVICE_MANAGER" },
];

async function main() {
  const roleRecords = new Map<string, string>();

  for (const roleName of ROLES) {
    const role = await prisma.role.upsert({
      where: { name: roleName },
      update: {},
      create: { name: roleName },
    });
    roleRecords.set(roleName, role.id);
  }

  for (const stage of STAGES) {
    await prisma.stage.upsert({
      where: { name: stage.name },
      update: { order: stage.order, responsibleRoleId: roleRecords.get(stage.role)! },
      create: {
        name: stage.name,
        order: stage.order,
        responsibleRoleId: roleRecords.get(stage.role)!,
      },
    });
  }

  console.log("Seed tamamlandı: roller ve aşamalar oluşturuldu.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
