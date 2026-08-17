import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import type { StageOutcome } from "@/generated/prisma/enums";

// Aşama geçiş endpoint'i — PROJECT.md Bölüm 2 (Aşama kuralları).
// Bilinçli olarak bir Route Handler, Server Action değil: bkz.
// src/app/api/tickets/route.ts üstündeki not (auth() güvenilirliği).
//
// Bir aşama şu sonuçlardan biriyle kapanır: Onay (sonraki aşamaya geçiş),
// Red/İade (önceki aşamaya geri dönüş), İptal. Her geçişte zaman damgası,
// kullanıcı ve not otomatik loglanır (StageHistory).
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
  const note = (body?.note as string | undefined)?.trim() || null;

  if (!outcome || !VALID_OUTCOMES.includes(outcome)) {
    return NextResponse.json({ error: "Geçersiz işlem sonucu." }, { status: 400 });
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const ticket = await tx.ticket.findUnique({
        where: { id: ticketId },
        include: { currentStage: { include: { responsibleRole: true } } },
      });

      if (!ticket) {
        return { error: "Kayıt bulunamadı.", status: 404 } as const;
      }
      if (ticket.status === "COMPLETED" || ticket.status === "CANCELLED") {
        return { error: "Bu kayıt zaten sonuçlandırılmış.", status: 400 } as const;
      }
      if (!ticket.currentStage || !ticket.currentStageId) {
        return { error: "Kaydın mevcut bir aşaması yok.", status: 400 } as const;
      }

      const isAdmin = session.user.role === "ADMIN";
      const isResponsible = session.user.role === ticket.currentStage.responsibleRole.name;
      if (!isAdmin && !isResponsible) {
        return {
          error: `Bu aşamayı yalnızca "${ticket.currentStage.responsibleRole.name}" rolü işleyebilir.`,
          status: 403,
        } as const;
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
        return { ticket: updated } as const;
      }

      if (outcome === "APPROVED") {
        const nextStage = await tx.stage.findFirst({
          where: { isActive: true, order: { gt: ticket.currentStage.order } },
          orderBy: { order: "asc" },
        });

        if (!nextStage) {
          // Son aşama onaylandı — kayıt tamamlandı.
          const updated = await tx.ticket.update({
            where: { id: ticketId },
            data: { status: "COMPLETED", currentStageId: null, exitDate: now },
          });
          return { ticket: updated } as const;
        }

        const updated = await tx.ticket.update({
          where: { id: ticketId },
          data: { status: "OPEN", currentStageId: nextStage.id },
        });
        await tx.stageHistory.create({
          data: {
            ticketId,
            stageId: nextStage.id,
            userId: session.user.id!,
            outcome: "IN_PROGRESS",
          },
        });
        return { ticket: updated } as const;
      }

      // REJECTED — bir önceki aktif aşamaya dön (yoksa aynı aşamada kal), kaydı beklemeye al.
      const prevStage = await tx.stage.findFirst({
        where: { isActive: true, order: { lt: ticket.currentStage.order } },
        orderBy: { order: "desc" },
      });
      const targetStage = prevStage ?? ticket.currentStage;

      const updated = await tx.ticket.update({
        where: { id: ticketId },
        data: { status: "ON_HOLD", currentStageId: targetStage.id },
      });
      await tx.stageHistory.create({
        data: {
          ticketId,
          stageId: targetStage.id,
          userId: session.user.id!,
          outcome: "IN_PROGRESS",
        },
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
