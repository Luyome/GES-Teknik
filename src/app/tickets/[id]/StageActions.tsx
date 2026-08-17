"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { useToast } from "@/components/ui/Toast";

type TicketStatus = "ASSIGNED" | "OPEN" | "ON_HOLD" | "COMPLETED" | "CANCELLED";

const fieldClass =
  "w-full rounded-[var(--radius-control)] border border-border bg-surface-2 px-3.5 py-2.5 text-[14px] outline-none focus:ring-2 focus:ring-blue";

// Ticket detay sayfasındaki aşama işlem kartı — onaylı akış sistemi:
// durum ASSIGNED → OPEN → (Onayla/Reddet/İptal veya Parça Eksik→ON_HOLD→
// Müşteri Onayladı→OPEN). Her adımda not zorunlu (tam audit trail). Sadece
// mevcut aşamanın sorumlu rolüne (veya ADMIN'e) sahip kullanıcıya gösterilir
// — bkz. src/app/tickets/[id]/page.tsx `canAct`.
export function StageActions({
  ticketId,
  stageName,
  status,
}: {
  ticketId: string;
  stageName: string;
  status: TicketStatus;
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [note, setNote] = useState("");
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | undefined>();

  async function call(key: string, path: string, successMessage: string, body: Record<string, unknown> = {}) {
    if (!note.trim()) {
      setError("Not girmek zorunludur.");
      return;
    }
    setError(undefined);
    setPending(key);
    try {
      const res = await fetch(`/api/tickets/${ticketId}${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note: note.trim(), ...body }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Bilinmeyen bir hata oluştu.");
        return;
      }
      setNote("");
      showToast(successMessage, "success");
      router.refresh();
    } catch {
      setError("Bağlantı hatası, lütfen tekrar deneyin.");
    } finally {
      setPending(null);
    }
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
          onClick={() => call("accept", "/accept", "Kayıt kabul edildi.")}
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
          onClick={() => call("customer-approved", "/customer-approved", "Müşteri onayı kaydedildi, işleme devam ediliyor.")}
          className="rounded-[var(--radius-pill)] bg-green text-white text-[14px] font-medium px-4 py-2.5 disabled:opacity-60"
        >
          {pending === "customer-approved" ? "İşleniyor…" : "Müşteri Onayladı"}
        </button>
      </Card>
    );
  }

  if (status !== "OPEN") return null; // COMPLETED / CANCELLED → aksiyon yok

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
          onClick={() => call("approve", "/transitions", "Aşama onaylandı.", { outcome: "APPROVED" })}
          className="rounded-[var(--radius-pill)] bg-green text-white text-[14px] font-medium px-4 py-2.5 disabled:opacity-60"
        >
          {pending === "approve" ? "İşleniyor…" : "Onayla"}
        </button>
        <button
          type="button"
          disabled={!!pending}
          onClick={() => call("parts-issue", "/parts-issue", "Kayıt müşteri onayı bekliyor durumuna alındı.")}
          className="rounded-[var(--radius-pill)] bg-orange text-white text-[14px] font-medium px-4 py-2.5 disabled:opacity-60"
        >
          {pending === "parts-issue" ? "İşleniyor…" : "Parça Eksik / Müşteri Onayı Gerekli"}
        </button>
        <button
          type="button"
          disabled={!!pending}
          onClick={() => call("reject", "/transitions", "Kayıt iade edildi.", { outcome: "REJECTED" })}
          className="rounded-[var(--radius-pill)] bg-surface-2 text-label text-[14px] font-medium px-4 py-2.5 border border-border disabled:opacity-60"
        >
          {pending === "reject" ? "İşleniyor…" : "Reddet / İade Et"}
        </button>
        <button
          type="button"
          disabled={!!pending}
          onClick={() => call("cancel", "/transitions", "Kayıt iptal edildi.", { outcome: "CANCELLED" })}
          className="rounded-[var(--radius-pill)] bg-surface-2 text-red text-[14px] font-medium px-4 py-2.5 border border-border disabled:opacity-60"
        >
          {pending === "cancel" ? "İşleniyor…" : "İptal Et"}
        </button>
      </div>
    </Card>
  );
}
