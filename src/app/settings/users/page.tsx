import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { UserManager } from "./UserManager";

export const dynamic = "force-dynamic";

// Kullanıcı yönetimi — sadece ADMIN. PROJECT.md Faz 1 açık maddesi.
// Teknisyen havuzu bilgisi (uzmanlık/müsaitlik/iş yükü) burada da
// gösterilir — bkz. src/lib/data/technicians.ts (StageActions'taki
// seçicinin kullandığı aynı iş yükü hesabı).
export default async function UsersPage() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    redirect("/settings");
  }

  const users = await prisma.user.findMany({
    include: { role: true },
    orderBy: { createdAt: "asc" },
  });
  const workloads = await prisma.ticket.groupBy({
    by: ["assignedTechnicianId"],
    where: { assignedTechnicianId: { not: null }, status: { notIn: ["COMPLETED", "CANCELLED"] } },
    _count: { _all: true },
  });
  const workloadMap = new Map(workloads.map((w) => [w.assignedTechnicianId, w._count._all]));

  return (
    <div className="space-y-6">
      <div>
        <Link href="/settings" className="text-blue text-[15px]">
          ← Ayarlar
        </Link>
      </div>

      <header>
        <h1 className="text-[28px] font-semibold tracking-tight">Kullanıcı Yönetimi</h1>
        <p className="text-label-secondary text-[15px] mt-1">
          {users.length} kullanıcı
        </p>
      </header>

      <UserManager
        currentUserId={session.user.id!}
        users={users.map((u) => ({
          id: u.id,
          name: u.name,
          email: u.email,
          isActive: u.isActive,
          role: u.role.name,
          specialty: u.specialty,
          isAvailable: u.isAvailable,
          workload: workloadMap.get(u.id) ?? 0,
        }))}
      />
    </div>
  );
}
