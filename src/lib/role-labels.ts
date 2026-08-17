import type { RoleName } from "@/generated/prisma/enums";

// Rol adlarının Türkçe gösterimi — PROJECT.md Bölüm 3 (Roller ve Yetkilendirme).
export const ROLE_LABEL: Record<RoleName, string> = {
  ADMIN: "Admin / Yönetici",
  SERVICE_MANAGER: "Servis Sorumlusu",
  TECHNICIAN: "Teknisyen",
  QUALITY_CONTROL: "Kalite Kontrol",
  CUSTOMER: "Müşteri",
};

export const ROLE_OPTIONS: RoleName[] = [
  "ADMIN",
  "SERVICE_MANAGER",
  "TECHNICIAN",
  "QUALITY_CONTROL",
  "CUSTOMER",
];
