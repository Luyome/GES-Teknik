"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { isValidEmail } from "@/lib/validation";

const PRIORITY_OPTIONS: { value: string; label: string }[] = [
  { value: "LOW", label: "Düşük" },
  { value: "NORMAL", label: "Normal" },
  { value: "HIGH", label: "Yüksek" },
  { value: "URGENT", label: "Acil" },
];

const fieldClass =
  "w-full rounded-[var(--radius-control)] border border-border bg-surface-2 px-3.5 py-3 text-[16px] outline-none focus:ring-2 focus:ring-blue";

// Not: Kayıt oluşturma bilinçli olarak bir Server Action değil, /api/tickets
// Route Handler'ına yapılan bir fetch çağrısı. Bkz. src/app/api/tickets/route.ts
// üstündeki not.
export function NewTicketForm() {
  const router = useRouter();
  const [error, setError] = useState<string | undefined>();
  const [isPending, setIsPending] = useState(false);
  const [isUnderWarranty, setIsUnderWarranty] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(undefined);
    const formData = new FormData(e.currentTarget);
    const email = (formData.get("customerEmail") as string | null)?.trim();
    if (email && !isValidEmail(email)) {
      setError("Geçersiz e-posta adresi (@ ve alan adı içermeli).");
      return;
    }
    setIsPending(true);
    try {
      const res = await fetch("/api/tickets", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Bilinmeyen bir hata oluştu.");
        return;
      }
      router.push(`/tickets/${data.id}`);
    } catch {
      setError("Bağlantı hatası, lütfen tekrar deneyin.");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">
      <div className="space-y-1.5">
        <label htmlFor="customerName" className="text-[13px] text-label-secondary">
          Müşteri Adı
        </label>
        <input
          id="customerName"
          name="customerName"
          required
          className={fieldClass}
          placeholder="ör. Aylin Yıldız"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label htmlFor="customerPhone" className="text-[13px] text-label-secondary">
            Telefon (opsiyonel)
          </label>
          <input
            id="customerPhone"
            name="customerPhone"
            className={fieldClass}
            placeholder="05xx xxx xx xx"
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="customerEmail" className="text-[13px] text-label-secondary">
            E-posta (opsiyonel)
          </label>
          <input
            id="customerEmail"
            name="customerEmail"
            type="email"
            className={fieldClass}
            placeholder="ornek@eposta.com"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="customerAddress" className="text-[13px] text-label-secondary">
          Adres (opsiyonel)
        </label>
        <input
          id="customerAddress"
          name="customerAddress"
          className={fieldClass}
          placeholder="Mahalle, sokak, no, ilçe/il"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label htmlFor="productInfo" className="text-[13px] text-label-secondary">
            Ürün / Parça Bilgisi
          </label>
          <input
            id="productInfo"
            name="productInfo"
            required
            className={fieldClass}
            placeholder="ör. İnvertör — Growatt 5kW"
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="serialNumber" className="text-[13px] text-label-secondary">
            Seri No (opsiyonel)
          </label>
          <input
            id="serialNumber"
            name="serialNumber"
            className={fieldClass}
            placeholder="ör. SN-2024-00123"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="issueDescription" className="text-[13px] text-label-secondary">
          Arıza Tanımı / Giriş Nedeni
        </label>
        <textarea
          id="issueDescription"
          name="issueDescription"
          required
          rows={4}
          className={fieldClass}
          placeholder="Müşterinin bildirdiği sorun..."
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="priority" className="text-[13px] text-label-secondary">
          Öncelik
        </label>
        <select id="priority" name="priority" defaultValue="NORMAL" className={fieldClass}>
          {PRIORITY_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <fieldset className="space-y-3 rounded-[var(--radius-card)] border border-border p-4">
        <legend className="text-[13px] font-medium text-label-secondary px-1">Garanti</legend>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label htmlFor="isUnderWarranty" className="text-[13px] text-label-secondary">
              Garanti Kapsamında mı?
            </label>
            <select
              id="isUnderWarranty"
              name="isUnderWarranty"
              value={isUnderWarranty}
              onChange={(e) => setIsUnderWarranty(e.target.value)}
              className={fieldClass}
            >
              <option value="">Belirtilmedi (Ön İnceleme&apos;de teyit edilecek)</option>
              <option value="true">Evet, garanti kapsamında</option>
              <option value="false">Hayır, garanti dışı</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label htmlFor="purchaseDate" className="text-[13px] text-label-secondary">
              Satın Alındığı Tarih (opsiyonel)
            </label>
            <input id="purchaseDate" name="purchaseDate" type="date" className={fieldClass} />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="estimatedDeliveryDate" className="text-[13px] text-label-secondary">
              Tahmini Teslim Tarihi (opsiyonel)
            </label>
            <input
              id="estimatedDeliveryDate"
              name="estimatedDeliveryDate"
              type="date"
              className={fieldClass}
            />
          </div>
        </div>
        {isUnderWarranty === "true" ? (
          <div className="space-y-1.5">
            <label htmlFor="invoiceFile" className="text-[13px] text-label-secondary">
              Fatura Fotoğrafı / Belgesi (opsiyonel)
            </label>
            <input
              id="invoiceFile"
              name="invoiceFile"
              type="file"
              accept="image/*,application/pdf"
              className="w-full text-[13px] text-label-secondary file:mr-3 file:rounded-[var(--radius-pill)] file:border-0 file:bg-surface-2 file:px-3 file:py-1.5 file:text-[13px] file:font-medium"
            />
            <p className="text-label-tertiary text-[12px]">
              Garanti kapsamında olduğu belirtildi — Ön İnceleme aşamasında doğrulama için faturayı
              şimdi ekleyebilirsiniz (sonradan kayıt detayından da eklenebilir).
            </p>
          </div>
        ) : (
          <p className="text-label-tertiary text-[12px]">
            Fatura fotoğrafı, kayıt oluşturulduktan sonra kayıt detayındaki &quot;Fotoğraf / Dosya
            Ekleri&quot; bölümünden &quot;Fatura&quot; olarak da yüklenebilir.
          </p>
        )}
      </fieldset>

      {error && <p className="text-[13px] text-red">{error}</p>}

      <button
        type="submit"
        disabled={isPending}
        className="rounded-[var(--radius-pill)] bg-blue text-white text-[15px] font-medium px-5 py-3 disabled:opacity-60"
      >
        {isPending ? "Kaydediliyor…" : "Kaydı Oluştur"}
      </button>
    </form>
  );
}
