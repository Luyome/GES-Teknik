// Başlangıç verisi: roller ve varsayılan iş akışı aşamaları.
// Bkz. PROJECT.md Bölüm 2 (İş Akışı Modeli) ve Bölüm 3 (Roller).
// Çalıştırma: npx prisma db seed

import "dotenv/config";
import bcrypt from "bcryptjs";
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

  // İlk admin kullanıcısı — sadece daha önce hiç kullanıcı yoksa oluşturulur.
  const userCount = await prisma.user.count();
  if (userCount === 0) {
    const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "admin@gesteknik.com";
    const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "GesTeknik2026!";
    const hashed = await bcrypt.hash(adminPassword, 10);

    await prisma.user.create({
      data: {
        name: "Admin",
        email: adminEmail,
        password: hashed,
        roleId: roleRecords.get("ADMIN")!,
      },
    });
    console.log(`İlk admin kullanıcısı oluşturuldu: ${adminEmail}`);
  }

  // Onaylı akış sistemini farklı personel rolleriyle test edebilmek için,
  // aşamaların sorumlu olduğu her role (ADMIN hariç) birer örnek kullanıcı
  // upsert edilir — idempotent, tekrar çalıştırmak güvenli.
  const DEMO_USERS: { role: (typeof ROLES)[number]; name: string; email: string }[] = [
    { role: "SERVICE_MANAGER", name: "Servis Sorumlusu", email: "servis@gesteknik.com" },
    { role: "TECHNICIAN", name: "Teknisyen", email: "teknisyen@gesteknik.com" },
    { role: "QUALITY_CONTROL", name: "Kalite Kontrol", email: "kalitekontrol@gesteknik.com" },
  ];
  const demoPassword = process.env.SEED_DEMO_PASSWORD ?? "GesTeknik2026!";
  const demoHashed = await bcrypt.hash(demoPassword, 10);
  for (const demo of DEMO_USERS) {
    await prisma.user.upsert({
      where: { email: demo.email },
      update: {},
      create: {
        name: demo.name,
        email: demo.email,
        password: demoHashed,
        roleId: roleRecords.get(demo.role)!,
      },
    });
  }
  console.log(
    `Örnek kullanıcılar hazır (şifre: ${demoPassword}): ${DEMO_USERS.map((d) => d.email).join(", ")}`
  );

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
