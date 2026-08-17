"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/Toast";

type AttachmentType = "PHOTO" | "INVOICE" | "OTHER";

// Fotoğraf/dosya eki yükleme formu — bkz. src/app/api/tickets/[id]/attachments/route.ts.
// Vercel Blob yapılandırılmamışsa (BLOB_READ_WRITE_TOKEN yok) sunucu net bir
// hata döner, burada gösterilir. "Fatura" tipi, Ön İnceleme'nin garanti
// doğrulaması için kullanılır (bkz. ticket detay sayfası).
export function AttachmentUpload({ ticketId }: { ticketId: string }) {
  const router = useRouter();
  const { showToast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [type, setType] = useState<AttachmentType>("PHOTO");
  const [note, setNote] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | undefined>();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const file = fileRef.current?.files?.[0];
    if (!file) {
      setError("Bir dosya seçin.");
      return;
    }
    setError(undefined);
    setIsPending(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", type);
      if (note.trim()) formData.append("note", note.trim());
      const res = await fetch(`/api/tickets/${ticketId}/attachments`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Dosya yüklenemedi.");
        return;
      }
      setNote("");
      if (fileRef.current) fileRef.current.value = "";
      showToast(type === "INVOICE" ? "Fatura eklendi." : "Dosya eklendi.");
      router.refresh();
    } catch {
      setError("Bağlantı hatası, lütfen tekrar deneyin.");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2">
      <select
        value={type}
        onChange={(e) => setType(e.target.value as AttachmentType)}
        className="rounded-[var(--radius-control)] border border-border bg-surface-2 px-2.5 py-1.5 text-[13px]"
      >
        <option value="PHOTO">Fotoğraf</option>
        <option value="INVOICE">Fatura</option>
        <option value="OTHER">Diğer</option>
      </select>
      <input
        ref={fileRef}
        type="file"
        accept="image/*,application/pdf"
        className="flex-1 text-[13px] text-label-secondary file:mr-3 file:rounded-[var(--radius-pill)] file:border-0 file:bg-surface-2 file:px-3 file:py-1.5 file:text-[13px] file:font-medium"
      />
      <input
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Not (opsiyonel)"
        className="rounded-[var(--radius-control)] border border-border bg-surface-2 px-3 py-1.5 text-[13px] outline-none focus:ring-2 focus:ring-blue"
      />
      <button
        type="submit"
        disabled={isPending}
        className="shrink-0 rounded-[var(--radius-pill)] bg-blue text-white text-[13px] font-medium px-3.5 py-1.5 disabled:opacity-60"
      >
        {isPending ? "Yükleniyor…" : "+ Ekle"}
      </button>
      {error && <p className="text-[12px] text-red sm:self-center">{error}</p>}
    </form>
  );
}
