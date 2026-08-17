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

// Kullanıcı aktif/pasif durumu ve rolünü günceller. Bir ADMIN kendi
// hesabını pasifleştiremez (sistemi kilitlememek için).
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const check = await requireAdmin();
  if ("error" in check) return NextResponse.json({ error: check.error }, { status: check.status });

  const { id } = await params;
  const body = await request.json().catch(() => null);

  if (body?.isActive === false && id === check.session.user.id) {
    return NextResponse.json({ error: "Kendi hesabınızı pasifleştiremezsiniz." }, { status: 400 });
  }

  const data: { isActive?: boolean; roleId?: string; specialty?: string | null; isAvailable?: boolean } = {};
  if (typeof body?.isActive === "boolean") data.isActive = body.isActive;
  if (typeof body?.isAvailable === "boolean") data.isAvailable = body.isAvailable;
  if (typeof body?.specialty === "string") data.specialty = body.specialty.trim() || null;
  if (typeof body?.roleName === "string") {
    const role = await prisma.role.findUnique({ where: { name: body.roleName as RoleName } });
    if (!role) return NextResponse.json({ error: "Geçersiz rol." }, { status: 400 });
    data.roleId = role.id;
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Güncellenecek alan yok." }, { status: 400 });
  }

  try {
    const user = await prisma.user.update({ where: { id }, data });
    return NextResponse.json({ id: user.id });
  } catch (err) {
    return NextResponse.json(
      { error: `Kullanıcı güncellenemedi: ${err instanceof Error ? err.message : String(err)}` },
      { status: 500 }
    );
  }
}
