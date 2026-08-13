"use server";

import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import type { TicketPriority } from "@/generated/prisma/enums";

export type CreateTicketState = { error?: string };

export async function createTicketAction(
  _prevState: CreateTicketState | undefined,
  formData: FormData
): Promise<CreateTicketState> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Oturum bulunamadı, lütfen tekrar giriş yapın." };
  }

  const customerName = (formData.get("customerName") as string | null)?.trim();
  const customerPhone = (formData.get("customerPhone") as string | null)?.trim();
  const productInfo = (formData.get("productInfo") as string | null)?.trim();
  const issueDescription = (formData.get("issueDescription") as string | null)?.trim();
  const priority = (formData.get("priority") as TicketPriority | null) ?? "NORMAL";

  if (!customerName || !productInfo || !issueDescription) {
    return { error: "Müşteri adı, ürün bilgisi ve arıza tanımı zorunludur." };
  }

  const firstStage = await prisma.stage.findFirst({ orderBy: { order: "asc" } });
  if (!firstStage) {
    return { error: "Tanımlı bir iş akışı aşaması bulunamadı. Önce Ayarlar'dan aşama tanımlayın." };
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

  redirect(`/tickets/${ticket.id}`);
}
