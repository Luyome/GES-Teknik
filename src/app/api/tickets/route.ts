import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { isValidEmail } from "@/lib/validation";
import type { TicketPriority } from "@/generated/prisma/enums";

// Yeni kayıt oluşturma — bilinçli olarak bir Server Action DEĞİL, bir Route
// Handler. Next.js 16.3.0 + Vercel Fluid Compute üzerinde Server Actions'ın
// (POST + "use server") oturum çerezini bazı isteklerde güvenilir biçimde
// okuyamadığı gözlemlendi (auth() Server Action içinde tutarsız biçimde
// null dönüyordu), aynı auth() çağrısı bir Route Handler'da hem GET hem
// POST'ta sorunsuz çalıştı. Bkz. PROJECT.md.
//
// Onaylı akış sistemi güncellemesi: yeni kayıt artık doğrudan "Çalışıyor"
// (OPEN) değil, "Atandı" (ASSIGNED) durumunda başlar — ilk aşamanın
// sorumlusu "Kabul Et" demeden işlem yapamaz. Bkz. TicketNote (audit log).
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Oturum bulunamadı, lütfen tekrar giriş yapın." }, { status: 401 });
  }

  const formData = await request.formData();
  const customerName = (formData.get("customerName") as string | null)?.trim();
  const customerPhone = (formData.get("customerPhone") as string | null)?.trim();
  const customerEmail = (formData.get("customerEmail") as string | null)?.trim();
  const customerAddress = (formData.get("customerAddress") as string | null)?.trim();
  const productInfo = (formData.get("productInfo") as string | null)?.trim();
  const serialNumber = (formData.get("serialNumber") as string | null)?.trim();
  const issueDescription = (formData.get("issueDescription") as string | null)?.trim();
  const priority = (formData.get("priority") as TicketPriority | null) ?? "NORMAL";
  const warrantyRaw = formData.get("isUnderWarranty") as string | null;
  const isUnderWarranty = warrantyRaw === "true" ? true : warrantyRaw === "false" ? false : null;
  const purchaseDateRaw = (formData.get("purchaseDate") as string | null)?.trim();
  const purchaseDate = purchaseDateRaw ? new Date(purchaseDateRaw) : null;
  const estimatedDeliveryDateRaw = (formData.get("estimatedDeliveryDate") as string | null)?.trim();
  const estimatedDeliveryDate = estimatedDeliveryDateRaw ? new Date(estimatedDeliveryDateRaw) : null;

  if (!customerName || !productInfo || !issueDescription) {
    return NextResponse.json(
      { error: "Müşteri adı, ürün bilgisi ve arıza tanımı zorunludur." },
      { status: 400 }
    );
  }
  if (customerEmail && !isValidEmail(customerEmail)) {
    return NextResponse.json({ error: "Geçersiz e-posta adresi." }, { status: 400 });
  }

  try {
    // Not: `code` üretimi (yıl bazlı sıra numarası) ve müşteri eşleştirmesi
    // eş zamanlı isteklerde çakışabileceğinden bir transaction içinde
    // yapılıyor; `code` çakışırsa (unique constraint) birkaç kez yeniden
    // dener. Bkz. PROJECT.md — bu race condition Faz 1'de not edilmişti.
    const ticket = await createTicketWithRetry({
      customerName,
      customerPhone,
      customerEmail,
      customerAddress,
      productInfo,
      serialNumber,
      issueDescription,
      priority,
      isUnderWarranty,
      purchaseDate,
      estimatedDeliveryDate,
      userId: session.user.id,
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

type CreateTicketInput = {
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  customerAddress?: string;
  productInfo: string;
  serialNumber?: string;
  issueDescription: string;
  priority: TicketPriority;
  isUnderWarranty: boolean | null;
  purchaseDate: Date | null;
  estimatedDeliveryDate: Date | null;
  userId: string;
};

const MAX_CODE_RETRIES = 3;

async function createTicketWithRetry(input: CreateTicketInput) {
  for (let attempt = 1; attempt <= MAX_CODE_RETRIES; attempt++) {
    try {
      return await prisma.$transaction(async (tx) => {
        const firstStage = await tx.stage.findFirst({
          where: { isActive: true },
          orderBy: { order: "asc" },
        });
        if (!firstStage) {
          throw new Error("Tanımlı bir iş akışı aşaması bulunamadı. Önce Ayarlar'dan aşama tanımlayın.");
        }

        // Aynı isimli müşteri varsa onu kullan, yoksa yeni oluştur (basit eşleştirme).
        let customer = await tx.customer.findFirst({
          where: { name: { equals: input.customerName, mode: "insensitive" } },
        });
        if (!customer) {
          customer = await tx.customer.create({
            data: {
              name: input.customerName,
              phone: input.customerPhone || null,
              email: input.customerEmail || null,
              address: input.customerAddress || null,
            },
          });
        } else if (input.customerEmail || input.customerAddress || input.customerPhone) {
          // Mevcut müşteri kaydı varsa yeni girilen iletişim bilgileriyle güncelle.
          customer = await tx.customer.update({
            where: { id: customer.id },
            data: {
              phone: input.customerPhone || customer.phone,
              email: input.customerEmail || customer.email,
              address: input.customerAddress || customer.address,
            },
          });
        }

        const year = new Date().getFullYear();
        const ticketCountThisYear = await tx.ticket.count({
          where: { entryDate: { gte: new Date(`${year}-01-01`) } },
        });
        const code = `GES-${year}-${String(ticketCountThisYear + 1).padStart(4, "0")}`;

        return tx.ticket.create({
          data: {
            code,
            customerId: customer.id,
            productInfo: input.productInfo,
            serialNumber: input.serialNumber || null,
            isUnderWarranty: input.isUnderWarranty,
            purchaseDate: input.purchaseDate,
            estimatedDeliveryDate: input.estimatedDeliveryDate,
            issueDescription: input.issueDescription,
            priority: input.priority,
            status: "ASSIGNED",
            currentStageId: firstStage.id,
            stageHistories: {
              create: {
                stageId: firstStage.id,
                userId: input.userId,
                outcome: "IN_PROGRESS",
              },
            },
            notes: {
              create: {
                stageId: firstStage.id,
                userId: input.userId,
                type: "ASSIGNED",
                note: `Kayıt oluşturuldu, "${firstStage.name}" aşamasına atandı.`,
              },
            },
          },
        });
      });
    } catch (err) {
      // Prisma unique constraint hatası (P2002) → code çakışması, yeniden dene.
      const isUniqueConflict =
        typeof err === "object" && err !== null && "code" in err && (err as { code?: string }).code === "P2002";
      if (isUniqueConflict && attempt < MAX_CODE_RETRIES) continue;
      throw err;
    }
  }
  throw new Error("Kayıt kodu üretilemedi, lütfen tekrar deneyin.");
}
