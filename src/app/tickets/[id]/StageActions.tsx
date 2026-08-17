"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { useToast } from "@/components/ui/Toast";

type TicketStatus = "ASSIGNED" | "OPEN" | "ON_HOLD" | "COMPLETED" | "CANCELLED";
type Outcome = "APPROVED" | "REJECTED" | "CANCELLED";
type PartRow = { name: string; price: string };

const fieldClass =
  "w-full rounded-[var(--radius-control)] border border-border bg-surface-2 px-3.5 py-2.5 text-[14px] outline-none focus:ring-2 focus:ring-blue";

// Ticket detay sayfasındaki aşama işlem kartı — onaylı akış sistemi:
// durum ASSIGNED → OPEN → (Onayla/Reddet/İptal veya Parça Eksik→ON_HOLD→
// Müşteri Onayladı→OPEN). Her adımda not zorunlu (tam audit trail). Sadece
// yetkili kullanıcıya gösterilir — bkz. src/app/tickets/[id]/page.tsx `canAct`
// (ON_HOLD'da Ön İnceleme/handlesCustomerApproval rolü, diğerlerinde
// currentStage'in sorumlusu).
export function StageActions({
  ticketId,
  stageName,
  status,
  allowsPartsRequest,
  isUnderWarranty,
}: {
  ticketId: string;
  stageName: string;
  status: TicketStatus;
  allowsPartsRequest: boolean;
  isUnderWarranty: boolean | null;
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [note, setNote] = useState("");
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | undefined>();

  async function callJson(key: string, path: string, successMessage: string, payload: Record<string, unknown>) {
    setError(undefined);
    setPending(key);
    try {
      const res = await fetch(`/api/tickets/${ticketId}${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Bilinmeyen bir hata oluştu.");
        return false;
      }
      showToast(successMessage, "success");
      router.refresh();
      return true;
    } catch {
      setError("Bağlantı hatası, lütfen tekrar deneyin.");
      return false;
    } finally {
      setPending(null);
    }
  }

  async function callWithNote(key: string, path: string, successMessage: string, extra: Record<string, unknown> = {}) {
    if (!note.trim()) {
      setError("Not girmek zorunludur.");
      return;
    }
    const ok = await callJson(key, path, successMessage, { note: note.trim(), ...extra });
    if (ok) setNote("");
  }

  const noteField = (
    <textarea
      value={note}
      onChange={(e) => setNote(e.target.value)}
      placeholder="Not (zorunlu)"
      rows={2}
      className={fieldClass}
    />
  );

  if (status === "ASSIGNED") {
    return (
      <Card className="space-y-3">
        <p className="text-[13px] text-label-secondary">
          Aşama: <span className="font-medium text-label">{stageName}</span> —
          bu kayıt size atandı, işleme başlamak için kabul edin.
        </p>
        {noteField}
        {error && <p className="text-[13px] text-red">{error}</p>}
        <button
          type="button"
          disabled={!!pending}
          onClick={() => callWithNote("accept", "/accept", "Kayıt kabul edildi.")}
          className="rounded-[var(--radius-pill)] bg-blue text-white text-[14px] font-medium px-4 py-2.5 disabled:opacity-60"
        >
          {pending === "accept" ? "İşleniyor…" : "Kabul Et"}
        </button>
      </Card>
    );
  }

  if (status === "ON_HOLD") {
    return (
      <Card className="space-y-3">
        <p className="text-[13px] text-label-secondary">
          Aşama: <span className="font-medium text-label">{stageName}</span> —
          müşteri onayı bekleniyor. Onay alındıysa devam edin.
        </p>
        {noteField}
        {error && <p className="text-[13px] text-red">{error}</p>}
        <button
          type="button"
          disabled={!!pending}
          onClick={() =>
            callWithNote("customer-approved", "/customer-approved", "Müşteri onayı kaydedildi, işleme devam ediliyor.")
          }
          className="rounded-[var(--radius-pill)] bg-green text-white text-[14px] font-medium px-4 py-2.5 disabled:opacity-60"
        >
          {pending === "customer-approved" ? "İşleniyor…" : "Müşteri Onayladı"}
        </button>
      </Card>
    );
  }

  if (status !== "OPEN") return null; // COMPLETED / CANCELLED → aksiyon yok

  async function submitOutcome(key: string, outcome: Outcome, successMessage: string) {
    await callWithNote(key, "/transitions", successMessage, { outcome });
  }

  return (
    <Card className="space-y-3">
      <p className="text-[13px] text-label-secondary">
        Mevcut aşama: <span className="font-medium text-label">{stageName}</span>
      </p>
      {noteField}
      {error && <p className="text-[13px] text-red">{error}</p>}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={!!pending}
          onClick={() => submitOutcome("approve", "APPROVED", "Aşama onaylandı.")}
          className="rounded-[var(--radius-pill)] bg-green text-white text-[14px] font-medium px-4 py-2.5 disabled:opacity-60"
        >
          {pending === "approve" ? "İşleniyor…" : "Onayla"}
        </button>
        <button
          type="button"
          disabled={!!pending}
          onClick={() => submitOutcome("reject", "REJECTED", "Kayıt iade edildi.")}
          className="rounded-[var(--radius-pill)] bg-surface-2 text-label text-[14px] font-medium px-4 py-2.5 border border-border disabled:opacity-60"
        >
          {pending === "reject" ? "İşleniyor…" : "Reddet / İade Et"}
        </button>
        <button
          type="button"
          disabled={!!pending}
          onClick={() => submitOutcome("cancel", "CANCELLED", "Kayıt iptal edildi.")}
          className="rounded-[var(--radius-pill)] bg-surface-2 text-red text-[14px] font-medium px-4 py-2.5 border border-border disabled:opacity-60"
        >
          {pending === "cancel" ? "İşleniyor…" : "İptal Et"}
        </button>
      </div>

      {allowsPartsRequest && (
        <PartsIssueForm isUnderWarranty={isUnderWarranty} onSubmit={callJson} pending={pending} />
      )}
    </Card>
  );
}

// "Parça Eksik / Müşteri Onayı Gerekli" — hangi parça(lar) eksik, garanti
// dışıysa fiyatı; müşteriye sunulacak toplam otomatik hesaplanır.
function PartsIssueForm({
  isUnderWarranty,
  onSubmit,
  pending,
}: {
  isUnderWarranty: boolean | null;
  onSubmit: (key: string, path: string, successMessage: string, payload: Record<string, unknown>) => Promise<boolean>;
  pending: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<PartRow[]>([{ name: "", price: "" }]);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | undefined>();
  const needsPrice = isUnderWarranty !== true;
  const total = rows.reduce((sum, r) => sum + (Number(r.price) || 0), 0);

  function updateRow(i: number, patch: Partial<PartRow>) {
    setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  }

  async function handleSubmit() {
    setError(undefined);
    const parts = rows.filter((r) => r.name.trim());
    if (parts.length === 0) {
      setError("En az bir parça adı girmelisiniz.");
      return;
    }
    if (needsPrice && parts.some((r) => !r.price || Number(r.price) <= 0)) {
      setError("Garanti kapsamında olmadığı için her parça için geçerli bir fiyat girmelisiniz.");
      return;
    }
    const payload = {
      note: note.trim() || undefined,
      parts: parts.map((r) => ({ name: r.name.trim(), price: needsPrice ? Number(r.price) : undefined })),
    };
    const ok = await onSubmit(
      "parts-issue",
      "/parts-issue",
      "Kayıt müşteri onayı bekliyor durumuna alındı.",
      payload
    );
    if (ok) {
      setRows([{ name: "", price: "" }]);
      setNote("");
      setOpen(false);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-[var(--radius-pill)] bg-orange text-white text-[14px] font-medium px-4 py-2.5"
      >
        Parça Eksik / Müşteri Onayı Gerekli
      </button>
    );
  }

  return (
    <div className="space-y-2.5 rounded-[var(--radius-card)] border border-border p-3">
      <p className="text-[13px] font-medium">
        Eksik / değiştirilecek parçalar
        {isUnderWarranty === true && (
          <span className="text-label-tertiary font-normal"> — garanti kapsamında, ücretsiz</span>
        )}
      </p>
      {rows.map((row, i) => (
        <div key={i} className="flex gap-2">
          <input
            value={row.name}
            onChange={(e) => updateRow(i, { name: e.target.value })}
            placeholder="Parça adı (ör. Anakart)"
            className={fieldClass}
          />
          {needsPrice && (
            <input
              value={row.price}
              onChange={(e) => updateRow(i, { price: e.target.value })}
              type="number"
              min="0"
              step="0.01"
              placeholder="Fiyat (₺)"
              className={fieldClass + " w-32"}
            />
          )}
          {rows.length > 1 && (
            <button
              type="button"
              onClick={() => setRows((prev) => prev.filter((_, idx) => idx !== i))}
              className="shrink-0 text-red text-[13px] px-1"
              aria-label="Satırı kaldır"
            >
              ✕
            </button>
          )}
        </div>
      ))}
      <button
        type="button"
        onClick={() => setRows((prev) => [...prev, { name: "", price: "" }])}
        className="text-blue text-[13px]"
      >
        + Parça ekle
      </button>

      {needsPrice && (
        <p className="text-[13px] font-medium">Toplam: ₺{total.toFixed(2)}</p>
      )}

      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Ek not (opsiyonel)"
        rows={2}
        className={fieldClass}
      />

      {error && <p className="text-[13px] text-red">{error}</p>}

      <div className="flex gap-2">
        <button
          type="button"
          disabled={pending === "parts-issue"}
          onClick={handleSubmit}
          className="rounded-[var(--radius-pill)] bg-orange text-white text-[14px] font-medium px-4 py-2.5 disabled:opacity-60"
        >
          {pending === "parts-issue" ? "Gönderiliyor…" : "Müşteri Onayına Gönder"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-[var(--radius-pill)] bg-surface-2 text-[14px] font-medium px-4 py-2.5 border border-border"
        >
          Vazgeç
        </button>
      </div>
    </div>
  );
}
