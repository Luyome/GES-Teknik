import { prisma } from "@/lib/prisma";

// Gerçek Prisma/Neon sorguları — src/lib/mock-data.ts'in yerini alır.
// Bkz. PROJECT.md Bölüm 5 (Veri Modeli) ve Bölüm 4 (İzleme/Raporlama).

export function getAllStages() {
  return prisma.stage.findMany({
    include: { responsibleRole: true },
    orderBy: { order: "asc" },
  });
}

export function getAllTickets() {
  return prisma.ticket.findMany({
    include: { customer: true, currentStage: true },
    orderBy: { entryDate: "desc" },
  });
}

export function getTicketById(id: string) {
  return prisma.ticket.findUnique({
    where: { id },
    include: {
      customer: true,
      currentStage: { include: { responsibleRole: true } },
      assignedTechnician: true,
      stageHistories: {
        include: { stage: true, user: true },
        orderBy: { enteredAt: "asc" },
      },
      // Ticket detay sayfasındaki zaman çizelgesinin tek kaynağı — her
      // zorunlu adımın (Atandı/Kabul/Parça Eksik/Müşteri Onayı/Onay/Red/
      // İptal) notuyla birlikte kronolojik kaydı.
      notes: {
        include: { stage: true, user: true, partRequests: true },
        orderBy: { createdAt: "asc" },
      },
      attachments: {
        include: { user: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });
}

// "Müşteri Onayladı" butonunu hangi rolün kapatabileceğini belirler —
// Stage.handlesCustomerApproval: true olarak işaretlenmiş aşamanın
// sorumlu rolü (bkz. /api/tickets/[id]/customer-approved). Ayarlar'dan
// hiç işaretlenmemişse null döner (o zaman currentStage'in sorumlusuna
// geri düşülür).
export async function getCustomerApprovalRoleName() {
  const stage = await prisma.stage.findFirst({
    where: { handlesCustomerApproval: true, isActive: true },
    include: { responsibleRole: true },
  });
  return stage?.responsibleRole.name ?? null;
}

export async function getDashboardData() {
  const [stages, tickets] = await Promise.all([getAllStages(), getAllTickets()]);

  const assignedCount = tickets.filter((t) => t.status === "ASSIGNED").length;
  const openCount = tickets.filter((t) => t.status === "OPEN").length;
  const onHoldCount = tickets.filter((t) => t.status === "ON_HOLD").length;
  const completedCount = tickets.filter((t) => t.status === "COMPLETED").length;

  const stageColumns = stages.map((stage) => ({
    stage,
    tickets: tickets.filter(
      (t) => t.currentStageId === stage.id && t.status !== "COMPLETED" && t.status !== "CANCELLED"
    ),
  }));

  return { tickets, stageColumns, assignedCount, openCount, onHoldCount, completedCount };
}
