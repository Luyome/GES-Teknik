import { prisma } from "@/lib/prisma";
import type { TicketStatus } from "@/generated/prisma/enums";

// Raporlama sorguları — PROJECT.md Bölüm 4 (İzleme ve Raporlama
// Gereksinimleri): aşama bazlı süre metrikleri, darboğaz tespiti,
// filtrelenebilir kayıt raporu. Prisma'da native interval/duration
// aggregation olmadığından (ve veri hacmi düşük olduğundan) süre
// hesaplamaları StageHistory satırları çekilip JS'de yapılıyor.

export type ReportFilters = {
  dateFrom?: string; // ISO tarih (entryDate >=)
  dateTo?: string; // ISO tarih (entryDate <)
  stageId?: string;
  status?: TicketStatus;
};

function buildTicketWhere(filters: ReportFilters) {
  return {
    ...(filters.stageId ? { currentStageId: filters.stageId } : {}),
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.dateFrom || filters.dateTo
      ? {
          entryDate: {
            ...(filters.dateFrom ? { gte: new Date(filters.dateFrom) } : {}),
            ...(filters.dateTo ? { lt: new Date(filters.dateTo) } : {}),
          },
        }
      : {}),
  };
}

export async function getTicketsReport(filters: ReportFilters) {
  return prisma.ticket.findMany({
    where: buildTicketWhere(filters),
    include: { customer: true, currentStage: true },
    orderBy: { entryDate: "desc" },
  });
}

// Her aşama için: kaç kez ziyaret edildi, ortalama/maksimum süre (ms).
// Sadece kapanmış (exitedAt dolu) StageHistory satırları hesaba katılır.
export async function getStageDurationStats() {
  const [stages, histories] = await Promise.all([
    prisma.stage.findMany({ orderBy: { order: "asc" } }),
    prisma.stageHistory.findMany({
      where: { exitedAt: { not: null } },
      select: { stageId: true, enteredAt: true, exitedAt: true },
    }),
  ]);

  const byStage = new Map<string, number[]>();
  for (const h of histories) {
    if (!h.exitedAt) continue;
    const durationMs = h.exitedAt.getTime() - h.enteredAt.getTime();
    const list = byStage.get(h.stageId) ?? [];
    list.push(durationMs);
    byStage.set(h.stageId, list);
  }

  const stats = stages.map((stage) => {
    const durations = byStage.get(stage.id) ?? [];
    const count = durations.length;
    const avgMs = count > 0 ? durations.reduce((a, b) => a + b, 0) / count : 0;
    const maxMs = count > 0 ? Math.max(...durations) : 0;
    return { stage, count, avgMs, maxMs };
  });

  const bottleneck = stats
    .filter((s) => s.count > 0)
    .sort((a, b) => b.avgMs - a.avgMs)[0];

  return { stats, bottleneck };
}

export async function getReportSummary(filters: ReportFilters) {
  const where = buildTicketWhere(filters);
  const [total, assigned, open, onHold, completed, cancelled] = await Promise.all([
    prisma.ticket.count({ where }),
    prisma.ticket.count({ where: { ...where, status: "ASSIGNED" } }),
    prisma.ticket.count({ where: { ...where, status: "OPEN" } }),
    prisma.ticket.count({ where: { ...where, status: "ON_HOLD" } }),
    prisma.ticket.count({ where: { ...where, status: "COMPLETED" } }),
    prisma.ticket.count({ where: { ...where, status: "CANCELLED" } }),
  ]);
  return { total, assigned, open, onHold, completed, cancelled };
}

export function formatDuration(ms: number): string {
  if (ms <= 0) return "—";
  const hours = ms / (1000 * 60 * 60);
  if (hours < 24) return `${hours.toFixed(1)} sa`;
  return `${(hours / 24).toFixed(1)} gün`;
}
