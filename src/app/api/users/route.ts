import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import type { RoleName } from "@/generated/prisma/enums";

// Kullanıcı yönetimi — PROJECT.md Faz 1 açık maddesi ("kullanıcı yönetimi
// ekranı"). Sadece ADMIN. Route Handler (Server Action değil) — bkz.
// src/app/api/tickets/route.ts üstündeki not.

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id) return { error: "Oturum bulunamadı.", status: 401 } as const;
  if (session.user.role !== "ADMIN") return { error: "Bu işlem için ADMIN yetkisi gerekir.", status: 403 } as const;
  return { session } as const;
}

export async function GET() {
  const check = await requireAdmin();
  if ("error" in check) return NextResponse.json({ error: check.error }, { status: check.status });

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

  return NextResponse.json({
    users: users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      isActive: u.isActive,
      role: u.role.name,
      specialty: u.specialty,
      isAvailable: u.isAvailable,
      workload: workloadMap.get(u.id) ?? 0,
      createdAt: u.createdAt,
    })),
  });
}

export async function POST(request: Request) {
  const check = await requireAdmin();
  if ("error" in check) return NextResponse.json({ error: check.error }, { status: check.status });

  const body = await request.json().catch(() => null);
  const name = (body?.name as string | undefined)?.trim();
  const email = (body?.email as string | undefined)?.trim().toLowerCase();
  const password = body?.password as string | undefined;
  const roleName = body?.roleName as RoleName | undefined;
  const specialty = (body?.specialty as string | undefined)?.trim() || null;

  if (!name || !email || !password || !roleName) {
    return NextResponse.json({ error: "Ad, e-posta, şifre ve rol zorunludur." }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "Şifre en az 8 karakter olmalıdır." }, { status: 400 });
  }

  const role = await prisma.role.findUnique({ where: { name: roleName } });
  if (!role) {
    return NextResponse.json({ error: "Geçersiz rol." }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "Bu e-posta ile zaten bir kullanıcı var." }, { status: 409 });
  }

  try {
    const hashed = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { name, email, password: hashed, roleId: role.id, specialty: roleName === "TECHNICIAN" ? specialty : null },
    });
    return NextResponse.json({ id: user.id });
  } catch (err) {
    return NextResponse.json(
      { error: `Kullanıcı oluşturulamadı: ${err instanceof Error ? err.message : String(err)}` },
      { status: 500 }
    );
  }
}
