// Geçici mock veri — Faz 1 arayüz iskeletini Neon veritabanı bağlanmadan
// önce görselleştirmek için. Gerçek veri bağlandığında (Task: Prisma sorguları)
// bu dosyanın yerini `src/lib/prisma.ts` üzerinden yapılan sorgular alacak.
// Şekiller prisma/schema.prisma ile birebir uyumludur.

import type { TicketStatus } from "@/components/ui/StatusBadge";

export const STAGES = [
  "Kayıt / Giriş",
  "Ön İnceleme",
  "Teknik Değerlendirme",
  "Onarım / İşlem",
  "Kalite Kontrol",
  "Teslim / Çıkış",
] as const;

export type MockTicket = {
  id: string;
  code: string;
  customerName: string;
  productInfo: string;
  status: TicketStatus;
  currentStage: (typeof STAGES)[number];
  technician: string;
  entryDate: string;
  history: {
    stage: string;
    user: string;
    enteredAt: string;
    outcome: "IN_PROGRESS" | "APPROVED" | "REJECTED";
    note?: string;
  }[];
};

export const MOCK_TICKETS: MockTicket[] = [
  {
    id: "1",
    code: "GES-2026-0001",
    customerName: "Aylin Yıldız",
    productInfo: "İnvertör — Growatt 5kW",
    status: "OPEN",
    currentStage: "Teknik Değerlendirme",
    technician: "Emre K.",
    entryDate: "2026-08-10",
    history: [
      { stage: "Kayıt / Giriş", user: "Servis Sorumlusu", enteredAt: "2026-08-10 09:12", outcome: "APPROVED" },
      { stage: "Ön İnceleme", user: "Servis Sorumlusu", enteredAt: "2026-08-10 10:30", outcome: "APPROVED" },
      { stage: "Teknik Değerlendirme", user: "Emre K.", enteredAt: "2026-08-11 08:45", outcome: "IN_PROGRESS" },
    ],
  },
  {
    id: "2",
    code: "GES-2026-0002",
    customerName: "Deniz Kaya",
    productInfo: "Panel Optimizer",
    status: "ON_HOLD",
    currentStage: "Ön İnceleme",
    technician: "—",
    entryDate: "2026-08-11",
    history: [
      { stage: "Kayıt / Giriş", user: "Servis Sorumlusu", enteredAt: "2026-08-11 13:05", outcome: "APPROVED" },
      { stage: "Ön İnceleme", user: "Servis Sorumlusu", enteredAt: "2026-08-11 14:00", outcome: "REJECTED", note: "Eksik belge, müşteriden bekleniyor" },
    ],
  },
  {
    id: "3",
    code: "GES-2026-0003",
    customerName: "Barış Er",
    productInfo: "Şarj Kontrol Cihazı",
    status: "COMPLETED",
    currentStage: "Teslim / Çıkış",
    technician: "Selin T.",
    entryDate: "2026-08-05",
    history: [
      { stage: "Kayıt / Giriş", user: "Servis Sorumlusu", enteredAt: "2026-08-05 09:00", outcome: "APPROVED" },
      { stage: "Ön İnceleme", user: "Servis Sorumlusu", enteredAt: "2026-08-05 09:40", outcome: "APPROVED" },
      { stage: "Teknik Değerlendirme", user: "Selin T.", enteredAt: "2026-08-05 11:00", outcome: "APPROVED" },
      { stage: "Onarım / İşlem", user: "Selin T.", enteredAt: "2026-08-06 09:00", outcome: "APPROVED" },
      { stage: "Kalite Kontrol", user: "Kalite Kontrol", enteredAt: "2026-08-07 10:00", outcome: "APPROVED" },
      { stage: "Teslim / Çıkış", user: "Servis Sorumlusu", enteredAt: "2026-08-07 15:30", outcome: "APPROVED" },
    ],
  },
  {
    id: "4",
    code: "GES-2026-0004",
    customerName: "Merve Aksoy",
    productInfo: "İnvertör — Huawei 10kW",
    status: "OPEN",
    currentStage: "Onarım / İşlem",
    technician: "Emre K.",
    entryDate: "2026-08-09",
    history: [
      { stage: "Kayıt / Giriş", user: "Servis Sorumlusu", enteredAt: "2026-08-09 08:20", outcome: "APPROVED" },
      { stage: "Ön İnceleme", user: "Servis Sorumlusu", enteredAt: "2026-08-09 09:00", outcome: "APPROVED" },
      { stage: "Teknik Değerlendirme", user: "Emre K.", enteredAt: "2026-08-09 11:10", outcome: "APPROVED" },
      { stage: "Onarım / İşlem", user: "Emre K.", enteredAt: "2026-08-10 09:00", outcome: "IN_PROGRESS" },
    ],
  },
];

export function getTicketById(id: string) {
  return MOCK_TICKETS.find((t) => t.id === id);
}

export function getStageCounts() {
  return STAGES.map((stage) => ({
    stage,
    count: MOCK_TICKETS.filter((t) => t.currentStage === stage && t.status !== "COMPLETED").length,
  }));
}
