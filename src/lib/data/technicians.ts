import { prisma } from "@/lib/prisma";

// Teknisyen havuzu — aşama sorumlusu Teknisyen olan bir aşamaya "Onayla"
// ile geçilirken (bkz. /api/tickets/[id]/transitions) hangi teknisyene
// atanacağını seçmek için kullanılır. Meşguliyet (workload), saklanmaz,
// her seferinde hesaplanır: COMPLETED/CANCELLED olmayan, bu teknisyene
// atanmış kayıt sayısı.
export async function getTechnicianPool() {
  const technicians = await prisma.user.findMany({
    where: { role: { name: "TECHNICIAN" }, isActive: true },
    orderBy: { name: "asc" },
  });

  const workloads = await prisma.ticket.groupBy({
    by: ["assignedTechnicianId"],
    where: {
      assignedTechnicianId: { in: technicians.map((t) => t.id) },
      status: { notIn: ["COMPLETED", "CANCELLED"] },
    },
    _count: { _all: true },
  });
  const workloadMap = new Map(workloads.map((w) => [w.assignedTechnicianId, w._count._all]));

  return technicians
    .map((t) => ({
      id: t.id,
      name: t.name,
      specialty: t.specialty,
      isAvailable: t.isAvailable,
      workload: workloadMap.get(t.id) ?? 0,
    }))
    .sort((a, b) => a.workload - b.workload);
}
