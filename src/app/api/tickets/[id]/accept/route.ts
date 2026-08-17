import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { sendSimulatedSms } from "@/lib/sms";
import { checkStageAuthorization } from "@/lib/stage-auth";

// "Kabul Et" — bir aşamaya atanan (ASSIGNED) kaydı, o aşamanın sorumlusu
// (veya ADMIN, ya da havuzdan atanmış belirli teknisyen) üstlenir. Not
// zorunlu (tam audit trail). Route Handler (Server Action değil) — bkz.
// src/app/api/tickets/route.ts üstündeki not.
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
        include: { currentStage: { include: { responsibleRole: true } }, customer: true },
      });
      if (!ticket) return { error: "Kayıt bulunamadı.", status: 404 } as const;
      if (ticket.status !== "ASSIGNED") {
        return { error: "Bu kayıt kabul edilebilir durumda değil.", status: 400 } as const;
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

      const updated = await tx.ticket.update({
        where: { id: ticketId },
        data: { status: "OPEN" },
      });
      await tx.ticketNote.create({
        data: {
          ticketId,
          stageId: ticket.currentStageId,
          userId: session.user.id!,
          type: "ACCEPTED",
          note,
        },
      });
      await sendSimulatedSms(tx, {
        ticketId,
        toPhone: ticket.customer.phone,
        message: `Sayın ${ticket.customer.name}, ${ticket.code} kodlu kaydınız "${ticket.currentStage.name}" aşamasında işleme alındı.`,
      });
      return { ticket: updated } as const;
    });

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    return NextResponse.json({ ok: true, ticket: result.ticket });
  } catch (err) {
    console.error("[POST /api/tickets/[id]/accept] error:", err);
    return NextResponse.json(
      { error: `İşlem gerçekleştirilemedi: ${err instanceof Error ? err.message : String(err)}` },
      { status: 500 }
    );
  }
}
