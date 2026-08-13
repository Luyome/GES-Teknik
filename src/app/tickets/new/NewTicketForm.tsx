"use client";

import { useActionState } from "react";
import { createTicketAction } from "./actions";

const PRIORITY_OPTIONS: { value: string; label: string }[] = [
  { value: "LOW", label: "Düşük" },
  { value: "NORMAL", label: "Normal" },
  { value: "HIGH", label: "Yüksek" },
  { value: "URGENT", label: "Acil" },
];

const fieldClass =
  "w-full rounded-[var(--radius-control)] border border-border bg-surface-2 px-3.5 py-3 text-[16px] outline-none focus:ring-2 focus:ring-blue";

export function NewTicketForm() {
  const [state, formAction, isPending] = useActionState(createTicketAction, undefined);

  return (
    <form action={formAction} className="space-y-4 max-w-lg">
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

      {state?.error && <p className="text-[13px] text-red">{state.error}</p>}

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
