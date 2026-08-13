import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import type { TicketPriority } from "@/generated/prisma/enums";

// Yeni kayıt oluşturma — bilinçli olarak bir Server Action DEĞİL, bir Route
// Handler. Next.js 16.3.0 + Vercel Fluid Compute üzerinde Server Actions'ın
// (POST + "use server") oturum çerezini bazı isteklerde güvenilir biçimde
// okuyamadığı gözlemlendi (auth() Server Action içinde tutarsız biçimde
// null dönüyordu), aynı auth() çağrısı bir Route Handler'da hem GET hem
// POST'ta sorunsuz çalıştı. Bkz. PROJECT.md.
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Oturum bulunamadı, lütfen tekrar giriş yapın." }, { status: 401 });
  }

  const formData = await request.formData();
  const customerName = (formData.get("customerName") as string | null)?.trim();
  const customerPhone = (formData.get("customerPhone") as string | null)?.trim();
  const productInfo = (formData.get("productInfo") as string | null)?.trim();
  const issueDescription = (formData.get("issueDescription") as string | null)?.trim();
  const priority = (formData.get("priority") as TicketPriority | null) ?? "NORMAL";

  if (!customerName || !productInfo || !issueDescription) {
    return NextResponse.json(
      { error: "Müşteri adı, ürün bilgisi ve arıza tanımı zorunludur." },
      { status: 400 }
    );
  }

  try {
    const firstStage = await prisma.stage.findFirst({ orderBy: { order: "asc" } });
    if (!firstStage) {
      return NextResponse.json(
        { error: "Tanımlı bir iş akışı aşaması bulunamadı. Önce Ayarlar'dan aşama tanımlayın." },
        { status: 400 }
      );
    }

    // Aynı isimli müşteri varsa onu kullan, yoksa yeni oluştur (basit eşleştirme).
    let customer = await prisma.customer.findFirst({
      where: { name: { equals: customerName, mode: "insensitive" } },
    });
    if (!customer) {
      customer = await prisma.customer.create({
        data: { name: customerName, phone: customerPhone || null },
      });
    }

    const year = new Date().getFullYear();
    const ticketCountThisYear = await prisma.ticket.count({
      where: { entryDate: { gte: new Date(`${year}-01-01`) } },
    });
    const code = `GES-${year}-${String(ticketCountThisYear + 1).padStart(4, "0")}`;

    const ticket = await prisma.ticket.create({
      data: {
        code,
        customerId: customer.id,
        productInfo,
        issueDescription,
        priority,
        status: "OPEN",
        currentStageId: firstStage.id,
        stageHistories: {
          create: {
            stageId: firstStage.id,
            userId: session.user.id,
            outcome: "IN_PROGRESS",
          },
        },
      },
    });

    return NextResponse.json({ id: ticket.id });
  } catch (err) {
    console.error("[POST /api/tickets] error:", err);
    return NextResponse.json(
      { error: `Kayıt oluşturulamadı: ${err instanceof Error ? err.message : String(err)}` },
      { status: 500 }
    );
  }
}
