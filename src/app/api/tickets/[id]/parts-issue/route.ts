import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// "Parça Eksik / Müşteri Onayı Gerekli" — kayıt aynı aşamada kalır, sadece
// müşteri onayı beklenirken durur (ON_HOLD). Aşama/StageHistory değişmez;
// sadece TicketNote ile loglanır. Not zorunlu.
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
  const note = (body?.note as string | undefined)?.trim();
  if (!note) {
    return NextResponse.json({ error: "Not girmek zorunludur." }, { status: 400 });
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const ticket = await tx.ticket.findUnique({
        where: { id: ticketId },
        include: { currentStage: { include: { responsibleRole: true } } },
      });
      if (!ticket) return { error: "Kayıt bulunamadı.", status: 404 } as const;
      if (ticket.status !== "OPEN") {
        return { error: "Bu işlem sadece kayıt çalışıyor durumundayken yapılabilir.", status: 400 } as const;
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

      const updated = await tx.ticket.update({
        where: { id: ticketId },
        data: { status: "ON_HOLD" },
      });
      await tx.ticketNote.create({
        data: {
          ticketId,
          stageId: ticket.currentStageId,
          userId: session.user.id!,
          type: "PARTS_ISSUE",
          note,
        },
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
