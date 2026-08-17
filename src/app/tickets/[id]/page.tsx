import { notFound } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { outcomeLabel, outcomeColorVar, type StageOutcome } from "@/components/ui/OutcomeBadge";
import { getTicketById } from "@/lib/data/tickets";
import { auth } from "@/auth";
import { StageActions } from "./StageActions";

// Kayıt Detayı — zaman çizelgesi (timeline) görünümü.
// Bu ekran PROJECT.md Bölüm 4'teki "kayıt bazlı zaman çizelgesi/geçmiş
// (audit trail)" gereksinimini karşılar.
export default async function TicketDetailPage({
  params,
}: PageProps<"/tickets/[id]">) {
  const { id } = await params;
  const [ticket, session] = await Promise.all([getTicketById(id), auth()]);
  if (!ticket) notFound();

  const currentStage = ticket.currentStage;
  const canAct =
    !!currentStage &&
    ticket.status !== "COMPLETED" &&
    ticket.status !== "CANCELLED" &&
    !!session?.user?.role &&
    (session.user.role === "ADMIN" ||
      session.user.role === currentStage.responsibleRole.name);

  return (
    <div className="space-y-6">
      <div>
        <Link href="/tickets" className="text-blue text-[15px]">
          ← Kayıtlar
        </Link>
      </div>

      <header className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-[24px] font-semibold tracking-tight">
            {ticket.code}
          </h1>
          <p className="text-label-secondary text-[15px] mt-1">
            {ticket.customer.name} · {ticket.productInfo}
          </p>
        </div>
        <StatusBadge status={ticket.status} />
      </header>

      <Card>
        <dl className="grid grid-cols-2 gap-y-3 text-[14px]">
          <dt className="text-label-secondary">Mevcut Aşama</dt>
          <dd className="text-right font-medium">{ticket.currentStage?.name ?? "—"}</dd>
          <dt className="text-label-secondary">Sorumlu Teknisyen</dt>
          <dd className="text-right font-medium">
            {ticket.assignedTechnician?.name ?? "—"}
          </dd>
          <dt className="text-label-secondary">Giriş Tarihi</dt>
          <dd className="text-right font-medium">
            {ticket.entryDate.toLocaleDateString("tr-TR")}
          </dd>
          <dt className="text-label-secondary">Arıza Tanımı</dt>
          <dd className="text-right font-medium">{ticket.issueDescription}</dd>
        </dl>
      </Card>

      {canAct && currentStage && (
        <div>
          <h2 className="text-[13px] font-medium text-label-secondary uppercase tracking-wide mb-2">
            Aşama İşlem
          </h2>
          <StageActions ticketId={ticket.id} stageName={currentStage.name} />
        </div>
      )}

      <div>
        <h2 className="text-[13px] font-medium text-label-secondary uppercase tracking-wide mb-2">
          Zaman Çizelgesi
        </h2>
        <Card>
          <ol className="relative border-l border-border ml-2 space-y-5">
            {ticket.stageHistories.map((h) => (
              <li key={h.id} className="ml-4">
                <span
                  className="absolute -ml-[9px] mt-1.5 h-3 w-3 rounded-full border-2 border-surface"
                  style={{ backgroundColor: outcomeColorVar(h.outcome as StageOutcome) }}
                />
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium text-[14px]">{h.stage.name}</span>
                  <span
                    className="text-[12px] font-medium"
                    style={{ color: outcomeColorVar(h.outcome as StageOutcome) }}
                  >
                    {outcomeLabel(h.outcome as StageOutcome)}
                  </span>
                </div>
                <div className="text-label-secondary text-[13px]">
                  {h.user.name} ·{" "}
                  {h.enteredAt.toLocaleString("tr-TR", {
                    dateStyle: "short",
                    timeStyle: "short",
                  })}
                </div>
                {h.note && (
                  <div className="text-label-tertiary text-[13px] mt-0.5">
                    “{h.note}”
                  </div>
                )}
              </li>
            ))}
          </ol>
        </Card>
      </div>
    </div>
  );
}
