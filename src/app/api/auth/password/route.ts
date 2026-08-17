import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// Oturum sahibinin kendi şifresini değiştirmesi — PROJECT.md Faz 1 açık
// maddesi ("ilk admin şifresinin değiştirilmesi"). Route Handler (Server
// Action değil) — bkz. src/app/api/tickets/route.ts üstündeki not.
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Oturum bulunamadı, lütfen tekrar giriş yapın." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const currentPassword = body?.currentPassword as string | undefined;
  const newPassword = body?.newPassword as string | undefined;

  if (!currentPassword || !newPassword) {
    return NextResponse.json({ error: "Mevcut ve yeni şifre zorunludur." }, { status: 400 });
  }
  if (newPassword.length < 8) {
    return NextResponse.json({ error: "Yeni şifre en az 8 karakter olmalıdır." }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) {
    return NextResponse.json({ error: "Kullanıcı bulunamadı." }, { status: 404 });
  }

  const valid = await bcrypt.compare(currentPassword, user.password);
  if (!valid) {
    return NextResponse.json({ error: "Mevcut şifre hatalı." }, { status: 400 });
  }

  const hashed = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({ where: { id: user.id }, data: { password: hashed } });

  return NextResponse.json({ ok: true });
}
