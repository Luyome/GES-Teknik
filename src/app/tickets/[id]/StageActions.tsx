"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { useToast } from "@/components/ui/Toast";

type Outcome = "APPROVED" | "REJECTED" | "CANCELLED";

// Ticket detay sayfasındaki aşama işlem kartı — sadece mevcut aşamanın
// sorumlu rolüne (veya ADMIN'e) sahip kullanıcıya gösterilir (bkz.
// src/app/tickets/[id]/page.tsx `canAct`). PROJECT.md Bölüm 2: bir aşama
// Onay / Red-İade / İptal ile kapanır.
export function StageActions({
  ticketId,
  stageName,
}: {
  ticketId: string;
  stageName: string;
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [note, setNote] = useState("");
  const [pending, setPending] = useState<Outcome | null>(null);
  const [error, setError] = useState<string | undefined>();

  async function act(outcome: Outcome) {
    if (outcome === "REJECTED" && !note.trim()) {
      setError("Red/iade işleminde not zorunludur.");
      return;
    }
    setError(undefined);
    setPending(outcome);
    try {
      const res = await fetch(`/api/tickets/${ticketId}/transitions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ outcome, note: note.trim() || undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Bilinmeyen bir hata oluştu.");
        return;
      }
      setNote("");
      showToast(
        outcome === "APPROVED"
          ? "Aşama onaylandı."
          : outcome === "REJECTED"
            ? "Kayıt iade edildi."
            : "Kayıt iptal edildi.",
        "success"
      );
      router.refresh();
    } catch {
      setError("Bağlantı hatası, lütfen tekrar deneyin.");
    } finally {
      setPending(null);
    }
  }

  return (
    <Card className="space-y-3">
      <p className="text-[13px] text-label-secondary">
        Mevcut aşama: <span className="font-medium text-label">{stageName}</span>
      </p>

      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Not (red/iade işleminde zorunlu)"
        rows={2}
        className="w-full rounded-[var(--radius-control)] border border-border bg-surface-2 px-3.5 py-2.5 text-[14px] outline-none focus:ring-2 focus:ring-blue"
      />

      {error && <p className="text-[13px] text-red">{error}</p>}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={!!pending}
          onClick={() => act("APPROVED")}
          className="rounded-[var(--radius-pill)] bg-green text-white text-[14px] font-medium px-4 py-2.5 disabled:opacity-60"
        >
          {pending === "APPROVED" ? "İşleniyor…" : "Onayla"}
        </button>
        <button
          type="button"
          disabled={!!pending}
          onClick={() => act("REJECTED")}
          className="rounded-[var(--radius-pill)] bg-orange text-white text-[14px] font-medium px-4 py-2.5 disabled:opacity-60"
        >
          {pending === "REJECTED" ? "İşleniyor…" : "Reddet / İade Et"}
        </button>
        <button
          type="button"
          disabled={!!pending}
          onClick={() => act("CANCELLED")}
          className="rounded-[var(--radius-pill)] bg-surface-2 text-red text-[14px] font-medium px-4 py-2.5 border border-border disabled:opacity-60"
        >
          {pending === "CANCELLED" ? "İşleniyor…" : "İptal Et"}
        </button>
      </div>
    </Card>
  );
}
