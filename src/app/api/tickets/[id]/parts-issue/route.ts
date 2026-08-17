import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { sendSimulatedSms } from "@/lib/sms";
import { checkStageAuthorization } from "@/lib/stage-auth";

// "Parça Eksik / Müşteri Onayı Gerekli" — kayıt aynı aşamada kalır, sadece
// müşteri onayı beklenirken durur (ON_HOLD). Aşama/StageHistory değişmez;
// TicketNote + kalem/fiyat detayları (PartRequest) ile loglanır.
//
// Kurallar:
// - Sadece `Stage.allowsPartsRequest: true` olan aşamalarda çağrılabilir
//   (ör. Teknik Değerlendirme'den önce arıza henüz değerlendirilmediği
//   için parça talebi anlamsız).
// - En az bir parça girilmeli, her parçanın adı zorunlu.
// - `ticket.isUnderWarranty === true` ise parçalar ücretsizdir (fiyat
//   istenmez/yok sayılır); aksi halde (garanti dışı/belirtilmemiş) her
//   parça için pozitif bir fiyat zorunludur.
type PartInput = { name: string; price?: number };

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Oturum bulunamadı, lütfen tekrar giriş yapın." }, { status: 401 });
  }

  const { id: ticketId } = await params;
  const body = await request.json().catch(() => null);
  const note = (body?.note as string | undefined)?.trim() || null;
  const rawParts = Array.isArray(body?.parts) ? (body.parts as PartInput[]) : [];
  const parts = rawParts
    .map((p) => ({ name: (p?.name ?? "").toString().trim(), price: p?.price }))
    .filter((p) => p.name.length > 0);

  if (parts.length === 0) {
    return NextResponse.json({ error: "En az bir parça girmelisiniz." }, { status: 400 });
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const ticket = await tx.ticket.findUnique({
        where: { id: ticketId },
        include: { currentStage: { include: { responsibleRole: true } }, customer: true },
      });
      if (!ticket) return { error: "Kayıt bulunamadı.", status: 404 } as const;
      if (ticket.status !== "OPEN") {
        return { error: "Bu işlem sadece kayıt çalışıyor durumundayken yapılabilir.", status: 400 } as const;
      }
      if (!ticket.currentStage || !ticket.currentStageId) {
        return { error: "Kaydın mevcut bir aşaması yok.", status: 400 } as const;
      }
      if (!ticket.currentStage.allowsPartsRequest) {
        return {
          error: `"${ticket.currentStage.name}" aşamasında parça talebi oluşturulamaz.`,
          status: 400,
        } as const;
      }

      const authCheck = checkStageAuthorization({
        userRole: session.user.role,
        userId: session.user.id!,
        stageResponsibleRole: ticket.currentStage.responsibleRole.name,
        assignedTechnicianId: ticket.assignedTechnicianId,
      });
      if (!authCheck.ok) {
        return { error: authCheck.error, status: 403 } as const;
      }

      const underWarranty = ticket.isUnderWarranty === true;
      let total = 0;
      const partData: { name: string; price: number | null }[] = [];
      for (const p of parts) {
        if (underWarranty) {
          partData.push({ name: p.name, price: null });
          continue;
        }
        const price = Number(p.price);
        if (!Number.isFinite(price) || price <= 0) {
          return {
            error: `"${p.name}" için geçerli bir fiyat girmelisiniz (garanti kapsamında değil).`,
            status: 400,
          } as const;
        }
        total += price;
        partData.push({ name: p.name, price });
      }

      const summary = underWarranty
        ? `Parça eksik (garanti kapsamında, ücretsiz): ${partData.map((p) => p.name).join(", ")}.`
        : `Parça eksik: ${partData.map((p) => `${p.name} (₺${p.price!.toFixed(2)})`).join(", ")} — Toplam: ₺${total.toFixed(2)}.`;
      const fullNote = note ? `${summary} ${note}` : summary;

      const ticketNote = await tx.ticketNote.create({
        data: {
          ticketId,
          stageId: ticket.currentStageId,
          userId: session.user.id!,
          type: "PARTS_ISSUE",
          note: fullNote,
        },
      });

      await tx.partRequest.createMany({
        data: partData.map((p) => ({
          ticketId,
          ticketNoteId: ticketNote.id,
          name: p.name,
          price: p.price,
        })),
      });

      const updated = await tx.ticket.update({
        where: { id: ticketId },
        data: { status: "ON_HOLD" },
      });
      await sendSimulatedSms(tx, {
        ticketId,
        toPhone: ticket.customer.phone,
        message: underWarranty
          ? `Sayın ${ticket.customer.name}, ${ticket.code} kodlu kaydınızda parça değişimi gerekiyor (garanti kapsamında, ücretsiz). Onayınız bekleniyor.`
          : `Sayın ${ticket.customer.name}, ${ticket.code} kodlu kaydınız için ₺${total.toFixed(2)} tutarında parça değişimi öneriliyor. Onayınız bekleniyor.`,
      });
      return { ticket: updated } as const;
    });

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    return NextResponse.json({ ok: true, ticket: result.ticket });
  } catch (err) {
    console.error("[POST /api/tickets/[id]/parts-issue] error:", err);
    return NextResponse.json(
      { error: `İşlem gerçekleştirilemedi: ${err instanceof Error ? err.message : String(err)}` },
      { status: 500 }
    );
  }
}
