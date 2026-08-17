import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import type { RoleName } from "@/generated/prisma/enums";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id) return { error: "Oturum bulunamadı.", status: 401 } as const;
  if (session.user.role !== "ADMIN") return { error: "Bu işlem için ADMIN yetkisi gerekir.", status: 403 } as const;
  return { session } as const;
}

// PATCH: ad/sorumlu rol/aktiflik günceller, ya da { move: "up" | "down" } ile
// bir komşu aşamayla `order` değerini takas ederek sırayı değiştirir
// (drag-and-drop kapsam dışı bırakıldı — basit yukarı/aşağı butonu yeterli).
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const check = await requireAdmin();
  if ("error" in check) return NextResponse.json({ error: check.error }, { status: check.status });

  const { id } = await params;
  const body = await request.json().catch(() => null);

  try {
    if (body?.move === "up" || body?.move === "down") {
      const result = await prisma.$transaction(async (tx) => {
        const stage = await tx.stage.findUnique({ where: { id } });
        if (!stage) return { error: "Aşama bulunamadı.", status: 404 } as const;

        const neighbor = await tx.stage.findFirst({
          where:
            body.move === "up"
              ? { order: { lt: stage.order } }
              : { order: { gt: stage.order } },
          orderBy: { order: body.move === "up" ? "desc" : "asc" },
        });
        if (!neighbor) return { error: "Sıra zaten uçta.", status: 400 } as const;

        // Unique(order) çakışmasını önlemek için geçici bir değere taşı.
        await tx.stage.update({ where: { id: stage.id }, data: { order: -1 } });
        await tx.stage.update({ where: { id: neighbor.id }, data: { order: stage.order } });
        await tx.stage.update({ where: { id: stage.id }, data: { order: neighbor.order } });
        return { ok: true } as const;
      });
      if ("error" in result) return NextResponse.json({ error: result.error }, { status: result.status });
      return NextResponse.json({ ok: true });
    }

    const data: { name?: string; isActive?: boolean; responsibleRoleId?: string } = {};
    if (typeof body?.name === "string" && body.name.trim()) data.name = body.name.trim();
    if (typeof body?.isActive === "boolean") data.isActive = body.isActive;
    if (typeof body?.responsibleRoleName === "string") {
      const role = await prisma.role.findUnique({ where: { name: body.responsibleRoleName as RoleName } });
      if (!role) return NextResponse.json({ error: "Geçersiz rol." }, { status: 400 });
      data.responsibleRoleId = role.id;
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "Güncellenecek alan yok." }, { status: 400 });
    }

    const stage = await prisma.stage.update({ where: { id }, data });
    return NextResponse.json({ stage });
  } catch (err) {
    return NextResponse.json(
      { error: `Aşama güncellenemedi: ${err instanceof Error ? err.message : String(err)}` },
      { status: 500 }
    );
  }
}
