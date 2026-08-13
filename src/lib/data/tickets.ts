import { prisma } from "@/lib/prisma";

// Gerçek Prisma/Neon sorguları — src/lib/mock-data.ts'in yerini alır.
// Bkz. PROJECT.md Bölüm 5 (Veri Modeli) ve Bölüm 4 (İzleme/Raporlama).

export function getAllStages() {
  return prisma.stage.findMany({ orderBy: { order: "asc" } });
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
      currentStage: true,
      assignedTechnician: true,
      stageHistories: {
        include: { stage: true, user: true },
        orderBy: { enteredAt: "asc" },
      },
    },
  });
}

export async function getDashboardData() {
  const [stages, tickets] = await Promise.all([getAllStages(), getAllTickets()]);

  const openCount = tickets.filter((t) => t.status === "OPEN").length;
  const onHoldCount = tickets.filter((t) => t.status === "ON_HOLD").length;
  const completedCount = tickets.filter((t) => t.status === "COMPLETED").length;

  const stageColumns = stages.map((stage) => ({
    stage,
    tickets: tickets.filter(
      (t) => t.currentStageId === stage.id && t.status !== "COMPLETED" && t.status !== "CANCELLED"
    ),
  }));

  return { tickets, stageColumns, openCount, onHoldCount, completedCount };
}
