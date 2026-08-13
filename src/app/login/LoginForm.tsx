"use client";

import { useActionState } from "react";
import { useSearchParams } from "next/navigation";
import { loginAction } from "./actions";

// Apple HIG hissi: tek sütun, büyük net alanlar, minimal süsleme.
// Banka uygulaması UX'i: büyük dokunma hedefli tek "Giriş Yap" CTA'sı.
export function LoginForm() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";
  const [state, formAction, isPending] = useActionState(loginAction, undefined);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="callbackUrl" value={callbackUrl} />

      <div className="space-y-1.5">
        <label htmlFor="email" className="text-[13px] text-label-secondary">
          E-posta
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className="w-full rounded-[var(--radius-control)] border border-border bg-surface-2 px-3.5 py-3 text-[16px] outline-none focus:ring-2 focus:ring-blue"
          placeholder="ornek@gesteknik.com"
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="password" className="text-[13px] text-label-secondary">
          Şifre
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className="w-full rounded-[var(--radius-control)] border border-border bg-surface-2 px-3.5 py-3 text-[16px] outline-none focus:ring-2 focus:ring-blue"
          placeholder="••••••••"
        />
      </div>

      {state?.error && (
        <p className="text-[13px] text-red">{state.error}</p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-[var(--radius-pill)] bg-blue text-white text-[16px] font-medium py-3.5 disabled:opacity-60"
      >
        {isPending ? "Giriş yapılıyor…" : "Giriş Yap"}
      </button>
    </form>
  );
}
