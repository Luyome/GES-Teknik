import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import type { RoleName } from "@/generated/prisma/enums";

// Aşama tanımları (Stage) yönetimi — PROJECT.md Bölüm 2: "Aşama zinciri
// parametrik/yapılandırılabilir olmalı (ileride yeni aşama eklenebilmeli —
// sabit kod değil, veri odaklı tasarım)." Sadece ADMIN düzenleyebilir.
// Route Handler (Server Action değil) — bkz. src/app/api/tickets/route.ts.

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id) return { error: "Oturum bulunamadı.", status: 401 } as const;
  if (session.user.role !== "ADMIN") return { error: "Bu işlem için ADMIN yetkisi gerekir.", status: 403 } as const;
  return { session } as const;
}

export async function GET() {
  const stages = await prisma.stage.findMany({
    include: { responsibleRole: true },
    orderBy: { order: "asc" },
  });
  return NextResponse.json({ stages });
}

export async function POST(request: Request) {
  const check = await requireAdmin();
  if ("error" in check) return NextResponse.json({ error: check.error }, { status: check.status });

  const body = await request.json().catch(() => null);
  const name = (body?.name as string | undefined)?.trim();
  const responsibleRoleName = body?.responsibleRoleName as RoleName | undefined;

  if (!name || !responsibleRoleName) {
    return NextResponse.json({ error: "Aşama adı ve sorumlu rol zorunludur." }, { status: 400 });
  }

  const role = await prisma.role.findUnique({ where: { name: responsibleRoleName } });
  if (!role) {
    return NextResponse.json({ error: "Geçersiz rol." }, { status: 400 });
  }

  try {
    const maxOrder = await prisma.stage.aggregate({ _max: { order: true } });
    const stage = await prisma.stage.create({
      data: {
        name,
        order: (maxOrder._max.order ?? 0) + 1,
        responsibleRoleId: role.id,
      },
    });
    return NextResponse.json({ stage });
  } catch (err) {
    return NextResponse.json(
      { error: `Aşama oluşturulamadı: ${err instanceof Error ? err.message : String(err)}` },
      { status: 500 }
    );
  }
}
