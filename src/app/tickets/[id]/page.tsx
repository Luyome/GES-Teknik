import { notFound } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { getTicketById, getCustomerApprovalRoleName, getNextStageRequiresTechnician } from "@/lib/data/tickets";
import { NOTE_TYPE_LABEL, NOTE_TYPE_COLOR } from "@/lib/ticket-note-labels";
import { auth } from "@/auth";
import { StageActions } from "./StageActions";
import { AttachmentUpload } from "./AttachmentUpload";

// Kayıt Detayı — zaman çizelgesi (timeline) görünümü.
// Bu ekran PROJECT.md Bölüm 4'teki "kayıt bazlı zaman çizelgesi/geçmiş
// (audit trail)" gereksinimini karşılar. Onaylı akış sistemi güncellemesi:
// zaman çizelgesi artık TicketNote'a dayanır (Atandı/Kabul/Parça Eksik/
// Müşteri Onayı/Onay/Red/İptal — her adımda zorunlu not).
export default async function TicketDetailPage({
  params,
}: PageProps<"/tickets/[id]">) {
  const { id } = await params;
  const [ticket, session, customerApprovalRoleName] = await Promise.all([
    getTicketById(id),
    auth(),
    getCustomerApprovalRoleName(),
  ]);
  if (!ticket) notFound();

  const currentStage = ticket.currentStage;
  const nextStageRequiresTechnician = currentStage
    ? await getNextStageRequiresTechnician(currentStage.order)
    : false;
  const isAdmin = session?.user?.role === "ADMIN";
  const isStageResponsible = !!currentStage && session?.user?.role === currentStage.responsibleRole.name;
  // "Müşteri Onayladı" yetkisi currentStage'in sorumlusuna değil, Ayarlar'da
  // `handlesCustomerApproval` işaretlenmiş aşamanın (ör. Ön İnceleme)
  // sorumlusuna aittir — parça eksik durumu hangi aşamada tetiklenirse
  // tetiklensin. Böyle bir aşama tanımlı değilse currentStage'in sorumlusuna
  // geri düşülür (dead-end önlemek için) — bkz. /api/tickets/[id]/customer-approved.
  const canResolveCustomerApproval =
    isAdmin ||
    (customerApprovalRoleName ? session?.user?.role === customerApprovalRoleName : isStageResponsible);
  const canAct =
    !!currentStage &&
    ticket.status !== "COMPLETED" &&
    ticket.status !== "CANCELLED" &&
    (ticket.status === "ON_HOLD" ? canResolveCustomerApproval : isAdmin || isStageResponsible);

  // ON_HOLD durumundayken müşteriye sunulan en son "Parça Eksik" talebinin
  // kalem/fiyat detayları — ticket.notes zaten createdAt asc sıralı.
  const latestPartsIssueNote = [...ticket.notes].reverse().find((n) => n.type === "PARTS_ISSUE");
  const latestPartsRequest = latestPartsIssueNote?.partRequests ?? [];

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
          {ticket.serialNumber && (
            <>
              <dt className="text-label-secondary">Seri No</dt>
              <dd className="text-right font-medium">{ticket.serialNumber}</dd>
            </>
          )}
          <dt className="text-label-secondary">Garanti Kapsamı</dt>
          <dd className="text-right font-medium">
            {ticket.isUnderWarranty === true
              ? "Garanti kapsamında"
              : ticket.isUnderWarranty === false
                ? "Garanti dışı"
                : "Belirtilmedi"}
          </dd>
          {ticket.purchaseDate && (
            <>
              <dt className="text-label-secondary">Satın Alındığı Tarih</dt>
              <dd className="text-right font-medium">
                {ticket.purchaseDate.toLocaleDateString("tr-TR")}
              </dd>
            </>
          )}
          {ticket.estimatedDeliveryDate && (
            <>
              <dt className="text-label-secondary">Tahmini Teslim</dt>
              <dd className="text-right font-medium">
                {ticket.estimatedDeliveryDate.toLocaleDateString("tr-TR")}
              </dd>
            </>
          )}
          <dt className="text-label-secondary">Arıza Tanımı</dt>
          <dd className="text-right font-medium">{ticket.issueDescription}</dd>
        </dl>
      </Card>

      {canAct && currentStage && (
        <div>
          <h2 className="text-[13px] font-medium text-label-secondary uppercase tracking-wide mb-2">
            Aşama İşlem
          </h2>
          <StageActions
            ticketId={ticket.id}
            stageName={currentStage.name}
            status={ticket.status}
            allowsPartsRequest={currentStage.allowsPartsRequest}
            isUnderWarranty={ticket.isUnderWarranty}
            nextStageRequiresTechnician={nextStageRequiresTechnician}
          />
        </div>
      )}

      {ticket.status === "ON_HOLD" && latestPartsRequest.length > 0 && (
        <div>
          <h2 className="text-[13px] font-medium text-label-secondary uppercase tracking-wide mb-2">
            Bekleyen Parça Talebi
          </h2>
          <Card className="space-y-1">
            {latestPartsRequest.map((p) => (
              <div key={p.id} className="flex items-center justify-between text-[14px]">
                <span>{p.name}</span>
                <span className="font-medium">
                  {p.price !== null ? `₺${Number(p.price).toFixed(2)}` : "Ücretsiz (garanti)"}
                </span>
              </div>
            ))}
            {latestPartsRequest.some((p) => p.price !== null) && (
              <div className="flex items-center justify-between text-[14px] font-semibold pt-2 border-t border-border mt-2">
                <span>Toplam</span>
                <span>
                  ₺
                  {latestPartsRequest
                    .reduce((sum, p) => sum + (p.price !== null ? Number(p.price) : 0), 0)
                    .toFixed(2)}
                </span>
              </div>
            )}
          </Card>
        </div>
      )}

      <div>
        <h2 className="text-[13px] font-medium text-label-secondary uppercase tracking-wide mb-2">
          Zaman Çizelgesi
        </h2>
        <Card>
          {ticket.notes.length === 0 ? (
            <p className="text-label-secondary text-[14px]">Henüz kayıt yok.</p>
          ) : (
            <ol className="relative border-l border-border ml-2 space-y-5">
              {ticket.notes.map((n) => (
                <li key={n.id} className="ml-4">
                  <span
                    className="absolute -ml-[9px] mt-1.5 h-3 w-3 rounded-full border-2 border-surface"
                    style={{ backgroundColor: NOTE_TYPE_COLOR[n.type] }}
                  />
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-[14px]">
                      {n.stage?.name ?? "—"}
                    </span>
                    <span
                      className="text-[12px] font-medium"
                      style={{ color: NOTE_TYPE_COLOR[n.type] }}
                    >
                      {NOTE_TYPE_LABEL[n.type]}
                    </span>
                  </div>
                  <div className="text-label-secondary text-[13px]">
                    {n.user.name} ·{" "}
                    {n.createdAt.toLocaleString("tr-TR", {
                      dateStyle: "short",
                      timeStyle: "short",
                    })}
                  </div>
                  <div className="text-label-tertiary text-[13px] mt-0.5">
                    “{n.note}”
                  </div>
                </li>
              ))}
            </ol>
          )}
        </Card>
      </div>

      <div>
        <h2 className="text-[13px] font-medium text-label-secondary uppercase tracking-wide mb-2">
          SMS Bildirimleri
        </h2>
        <Card className="space-y-2">
          <p className="text-label-tertiary text-[12px]">
            Bu bir simülasyondur, gerçek SMS gönderilmez — bkz. src/lib/sms.ts.
          </p>
          {ticket.smsLogs.length === 0 ? (
            <p className="text-label-secondary text-[14px]">Henüz bildirim yok.</p>
          ) : (
            <ul className="space-y-2">
              {ticket.smsLogs.map((s) => (
                <li key={s.id} className="text-[13px] border-t border-border pt-2 first:border-0 first:pt-0">
                  <div className="text-label-tertiary text-[12px]">
                    📱 {s.toPhone ?? "(telefon yok)"} ·{" "}
                    {s.createdAt.toLocaleString("tr-TR", { dateStyle: "short", timeStyle: "short" })}
                  </div>
                  <div>{s.message}</div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <div>
        <h2 className="text-[13px] font-medium text-label-secondary uppercase tracking-wide mb-2">
          Fotoğraf / Dosya Ekleri
        </h2>
        <Card className="space-y-4">
          <AttachmentUpload ticketId={ticket.id} />
          {ticket.attachments.length === 0 ? (
            <p className="text-label-tertiary text-[13px]">Henüz ek yok.</p>
          ) : (
            <ul className="space-y-2">
              {ticket.attachments.map((a) => (
                <li key={a.id} className="flex items-center justify-between gap-2 text-[13px]">
                  <span className="flex items-center gap-1.5 min-w-0">
                    {a.type === "INVOICE" && (
                      <span className="shrink-0 rounded-[var(--radius-pill)] bg-orange/15 text-orange text-[11px] font-medium px-2 py-0.5">
                        📄 Fatura
                      </span>
                    )}
                    <a
                      href={a.fileUrl ?? "#"}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue truncate"
                    >
                      {a.note || a.fileUrl}
                    </a>
                  </span>
                  <span className="text-label-tertiary shrink-0">
                    {a.user.name} · {a.createdAt.toLocaleDateString("tr-TR")}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
