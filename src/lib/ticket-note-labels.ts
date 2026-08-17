import type { TicketNoteType } from "@/generated/prisma/enums";

// TicketNote.type için Türkçe etiket/renk — ticket detay sayfasındaki
// zaman çizelgesinde kullanılır (bkz. src/app/tickets/[id]/page.tsx).
export const NOTE_TYPE_LABEL: Record<TicketNoteType, string> = {
  ASSIGNED: "Atandı",
  ACCEPTED: "Kabul Edildi",
  PARTS_ISSUE: "Parça Eksik / Müşteri Onayı Gerekli",
  CUSTOMER_APPROVED: "Müşteri Onayladı",
  APPROVED: "Onaylandı",
  REJECTED: "Reddedildi / İade",
  CANCELLED: "İptal Edildi",
};

export const NOTE_TYPE_COLOR: Record<TicketNoteType, string> = {
  ASSIGNED: "var(--color-system-gray)",
  ACCEPTED: "var(--color-status-open)",
  PARTS_ISSUE: "var(--color-status-onhold)",
  CUSTOMER_APPROVED: "var(--color-status-open)",
  APPROVED: "var(--color-status-completed)",
  REJECTED: "var(--color-status-cancelled)",
  CANCELLED: "var(--color-status-cancelled)",
};
