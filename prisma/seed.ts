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
// allowsPartsRequest: "Parça Eksik" butonu bu aşamada gösterilsin mi —
// Teknik Değerlendirme'den önce arıza henüz değerlendirilmediği için kapalı.
// handlesCustomerApproval: "Müşteri Onayladı" butonunu bu aşamanın sorumlusu
// kapatabilir — müşteri iletişimini/garanti doğrulamasını Ön İnceleme yürütür.
const STAGES: {
  name: string;
  order: number;
  role: (typeof ROLES)[number];
  allowsPartsRequest?: boolean;
  handlesCustomerApproval?: boolean;
}[] = [
  { name: "Kayıt / Giriş", order: 1, role: "SERVICE_MANAGER" },
  { name: "Ön İnceleme", order: 2, role: "SERVICE_MANAGER", handlesCustomerApproval: true },
  { name: "Teknik Değerlendirme", order: 3, role: "TECHNICIAN", allowsPartsRequest: true },
  { name: "Onarım / İşlem", order: 4, role: "TECHNICIAN", allowsPartsRequest: true },
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
      update: {
        order: stage.order,
        responsibleRoleId: roleRecords.get(stage.role)!,
        allowsPartsRequest: stage.allowsPartsRequest ?? false,
        handlesCustomerApproval: stage.handlesCustomerApproval ?? false,
      },
      create: {
        name: stage.name,
        order: stage.order,
        responsibleRoleId: roleRecords.get(stage.role)!,
        allowsPartsRequest: stage.allowsPartsRequest ?? false,
        handlesCustomerApproval: stage.handlesCustomerApproval ?? false,
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
  // upsert edilir — idempotent, tekrar çalıştırmak güvenli. Teknisyen
  // havuzunu (uzmanlık/müsaitlik/iş yükü) anlamlı test edebilmek için
  // birden fazla teknisyen — biri bilerek "Çalışmıyor" (isAvailable: false).
  const DEMO_USERS: {
    role: (typeof ROLES)[number];
    name: string;
    email: string;
    specialty?: string;
    isAvailable?: boolean;
  }[] = [
    { role: "SERVICE_MANAGER", name: "Servis Sorumlusu", email: "servis@gesteknik.com" },
    { role: "TECHNICIAN", name: "Ahmet Yılmaz", email: "ahmet.yilmaz@gesteknik.com", specialty: "İnvertör Uzmanı" },
    { role: "TECHNICIAN", name: "Mehmet Kaya", email: "mehmet.kaya@gesteknik.com", specialty: "Panel Uzmanı" },
    {
      role: "TECHNICIAN",
      name: "Ayşe Demir",
      email: "ayse.demir@gesteknik.com",
      specialty: "Elektrik Tesisatı",
    },
    {
      role: "TECHNICIAN",
      name: "Fatma Şahin",
      email: "fatma.sahin@gesteknik.com",
      specialty: "Genel Bakım",
      isAvailable: false, // izinli/müsait değil senaryosunu test etmek için
    },
    { role: "QUALITY_CONTROL", name: "Kalite Kontrol", email: "kalitekontrol@gesteknik.com" },
  ];
  const demoPassword = process.env.SEED_DEMO_PASSWORD ?? "GesTeknik2026!";
  const demoHashed = await bcrypt.hash(demoPassword, 10);
  for (const demo of DEMO_USERS) {
    await prisma.user.upsert({
      where: { email: demo.email },
      update: { specialty: demo.specialty ?? null, isAvailable: demo.isAvailable ?? true },
      create: {
        name: demo.name,
        email: demo.email,
        password: demoHashed,
        roleId: roleRecords.get(demo.role)!,
        specialty: demo.specialty ?? null,
        isAvailable: demo.isAvailable ?? true,
      },
    });
  }
  console.log(`Örnek kullanıcılar hazır (şifre: ${demoPassword}):`);
  for (const demo of DEMO_USERS) {
    console.log(`  - ${demo.name} <${demo.email}>${demo.specialty ? ` — ${demo.specialty}` : ""}`);
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
