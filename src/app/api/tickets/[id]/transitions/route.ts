import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { sendSimulatedSms } from "@/lib/sms";
import { checkStageAuthorization } from "@/lib/stage-auth";
import type { StageOutcome } from "@/generated/prisma/enums";

// Aşama geçiş endpoint'i — PROJECT.md Bölüm 2 (Aşama kuralları) ve onaylı
// akış sistemi güncellemesi. Bilinçli olarak bir Route Handler, Server
// Action değil: bkz. src/app/api/tickets/route.ts üstündeki not.
//
// Bir aşama şu sonuçlardan biriyle kapanır: Onay (sonraki aşamaya geçiş),
// Red/İade (önceki aşamaya geri dönüş), İptal. Bu endpoint yalnızca kayıt
// "Çalışıyor" (OPEN) durumundayken çağrılabilir — yani sorumlu kişi önce
// "Kabul Et" (/api/tickets/[id]/accept) demiş olmalı. Her geçişte zaman
// damgası, kullanıcı ve not otomatik loglanır (StageHistory + TicketNote),
// ve müşteriye bir SMS simülasyonu gönderilir (bkz. src/lib/sms.ts).
// Not artık TÜM sonuçlarda zorunludur (tam audit trail).
//
// Teknisyen havuzu: sonraki aşamanın sorumlusu Teknisyen ise, `technicianId`
// zorunludur (havuzdan seçilen belirli bir teknisyene atama) — bkz.
// src/lib/data/technicians.ts ve /api/technicians.
const VALID_OUTCOMES: StageOutcome[] = ["APPROVED", "REJECTED", "CANCELLED"];

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
  const outcome = body?.outcome as StageOutcome | undefined;
  const note = (body?.note as string | undefined)?.trim();
  const technicianId = body?.technicianId as string | undefined;

  if (!outcome || !VALID_OUTCOMES.includes(outcome)) {
    return NextResponse.json({ error: "Geçersiz işlem sonucu." }, { status: 400 });
  }
  if (!note) {
    return NextResponse.json({ error: "Not girmek zorunludur." }, { status: 400 });
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const ticket = await tx.ticket.findUnique({
        where: { id: ticketId },
        include: { currentStage: { include: { responsibleRole: true } }, customer: true },
      });

      if (!ticket) {
        return { error: "Kayıt bulunamadı.", status: 404 } as const;
      }
      if (ticket.status === "COMPLETED" || ticket.status === "CANCELLED") {
        return { error: "Bu kayıt zaten sonuçlandırılmış.", status: 400 } as const;
      }
      if (ticket.status === "ASSIGNED") {
        return { error: "Önce kaydı 'Kabul Et' ile üstlenmelisiniz.", status: 400 } as const;
      }
      if (ticket.status === "ON_HOLD") {
        return { error: "Kayıt müşteri onayı bekliyor, önce 'Müşteri Onayladı' ile devam ettirin.", status: 400 } as const;
      }
      if (!ticket.currentStage || !ticket.currentStageId) {
        return { error: "Kaydın mevcut bir aşaması yok.", status: 400 } as const;
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

      // APPROVED'da sonraki aşama Teknisyen sorumluluğundaysa havuzdan seçim zorunlu.
      const nextStageWithRole =
        outcome === "APPROVED"
          ? await tx.stage.findFirst({
              where: { isActive: true, order: { gt: ticket.currentStage.order } },
              orderBy: { order: "asc" },
              include: { responsibleRole: true },
            })
          : null;
      const nextStage = nextStageWithRole;
      let selectedTechnicianId: string | null = null;
      if (outcome === "APPROVED") {
        if (nextStage && nextStage.responsibleRole.name === "TECHNICIAN") {
          if (!technicianId) {
            return { error: "Sonraki aşama için havuzdan bir teknisyen seçmelisiniz.", status: 400 } as const;
          }
          const technician = await tx.user.findUnique({ where: { id: technicianId }, include: { role: true } });
          if (
            !technician ||
            technician.role.name !== "TECHNICIAN" ||
            !technician.isActive ||
            !technician.isAvailable
          ) {
            return { error: "Seçilen teknisyen uygun değil (aktif/müsait olmalı).", status: 400 } as const;
          }
          selectedTechnicianId = technician.id;
        }
      }

      // Açık StageHistory satırını kapat.
      const openHistory = await tx.stageHistory.findFirst({
        where: { ticketId, stageId: ticket.currentStageId, exitedAt: null },
        orderBy: { enteredAt: "desc" },
      });
      const now = new Date();
      if (openHistory) {
        await tx.stageHistory.update({
          where: { id: openHistory.id },
          data: { exitedAt: now, outcome, note },
        });
      } else {
        // Beklenmedik durum (açık kayıt yoksa) — yine de kapalı bir satır ekle, audit trail'i koru.
        await tx.stageHistory.create({
          data: {
            ticketId,
            stageId: ticket.currentStageId,
            userId: session.user.id!,
            enteredAt: now,
            exitedAt: now,
            outcome,
            note,
          },
        });
      }

      if (outcome === "CANCELLED") {
        const updated = await tx.ticket.update({
          where: { id: ticketId },
          data: { status: "CANCELLED" },
        });
        await tx.ticketNote.create({
          data: { ticketId, stageId: ticket.currentStageId, userId: session.user.id!, type: "CANCELLED", note },
        });
        await sendSimulatedSms(tx, {
          ticketId,
          toPhone: ticket.customer.phone,
          message: `Sayın ${ticket.customer.name}, ${ticket.code} kodlu kaydınız iptal edilmiştir.`,
        });
        return { ticket: updated } as const;
      }

      if (outcome === "APPROVED") {
        await tx.ticketNote.create({
          data: { ticketId, stageId: ticket.currentStageId, userId: session.user.id!, type: "APPROVED", note },
        });

        if (!nextStage) {
          // Son aşama onaylandı — kayıt tamamlandı.
          const updated = await tx.ticket.update({
            where: { id: ticketId },
            data: { status: "COMPLETED", currentStageId: null, exitDate: now },
          });
          await sendSimulatedSms(tx, {
            ticketId,
            toPhone: ticket.customer.phone,
            message: `Sayın ${ticket.customer.name}, ${ticket.code} kodlu kaydınız tamamlanmıştır, teslime hazırdır.`,
          });
          return { ticket: updated } as const;
        }

        const updated = await tx.ticket.update({
          where: { id: ticketId },
          data: {
            status: "ASSIGNED",
            currentStageId: nextStage.id,
            ...(selectedTechnicianId ? { assignedTechnicianId: selectedTechnicianId } : {}),
          },
        });
        await tx.stageHistory.create({
          data: {
            ticketId,
            stageId: nextStage.id,
            userId: session.user.id!,
            outcome: "IN_PROGRESS",
          },
        });
        await tx.ticketNote.create({
          data: {
            ticketId,
            stageId: nextStage.id,
            userId: session.user.id!,
            type: "ASSIGNED",
            note: `"${nextStage.name}" aşamasına atandı.`,
          },
        });
        await sendSimulatedSms(tx, {
          ticketId,
          toPhone: ticket.customer.phone,
          message: `Sayın ${ticket.customer.name}, ${ticket.code} kodlu kaydınız "${nextStage.name}" aşamasına geçmiştir.`,
        });
        return { ticket: updated } as const;
      }

      // REJECTED — bir önceki aktif aşamaya dön (yoksa aynı aşamada kal), yeniden kabul beklensin.
      await tx.ticketNote.create({
        data: { ticketId, stageId: ticket.currentStageId, userId: session.user.id!, type: "REJECTED", note },
      });

      const prevStage = await tx.stage.findFirst({
        where: { isActive: true, order: { lt: ticket.currentStage.order } },
        orderBy: { order: "desc" },
      });
      const targetStage = prevStage ?? ticket.currentStage;

      const updated = await tx.ticket.update({
        where: { id: ticketId },
        data: { status: "ASSIGNED", currentStageId: targetStage.id },
      });
      await tx.stageHistory.create({
        data: {
          ticketId,
          stageId: targetStage.id,
          userId: session.user.id!,
          outcome: "IN_PROGRESS",
        },
      });
      await tx.ticketNote.create({
        data: {
          ticketId,
          stageId: targetStage.id,
          userId: session.user.id!,
          type: "ASSIGNED",
          note: `İade edildi, "${targetStage.name}" aşamasına yeniden atandı.`,
        },
      });
      await sendSimulatedSms(tx, {
        ticketId,
        toPhone: ticket.customer.phone,
        message: `Sayın ${ticket.customer.name}, ${ticket.code} kodlu kaydınız "${targetStage.name}" aşamasına iade edilmiştir.`,
      });
      return { ticket: updated } as const;
    });

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    return NextResponse.json({ ok: true, ticket: result.ticket });
  } catch (err) {
    console.error("[POST /api/tickets/[id]/transitions] error:", err);
    return NextResponse.json(
      { error: `İşlem gerçekleştirilemedi: ${err instanceof Error ? err.message : String(err)}` },
      { status: 500 }
    );
  }
}
