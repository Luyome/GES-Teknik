"use client";

import { useState } from "react";
import { useToast } from "@/components/ui/Toast";

const fieldClass =
  "w-full rounded-[var(--radius-control)] border border-border bg-surface-2 px-3.5 py-3 text-[16px] outline-none focus:ring-2 focus:ring-blue";

export function ChangePasswordForm() {
  const { showToast } = useToast();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [isPending, setIsPending] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(undefined);
    if (newPassword !== confirmPassword) {
      setError("Yeni şifreler eşleşmiyor.");
      return;
    }
    setIsPending(true);
    try {
      const res = await fetch("/api/auth/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Bilinmeyen bir hata oluştu.");
        return;
      }
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      showToast("Şifreniz güncellendi.");
    } catch {
      setError("Bağlantı hatası, lütfen tekrar deneyin.");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <label htmlFor="currentPassword" className="text-[13px] text-label-secondary">
          Mevcut Şifre
        </label>
        <input
          id="currentPassword"
          type="password"
          required
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          className={fieldClass}
        />
      </div>
      <div className="space-y-1.5">
        <label htmlFor="newPassword" className="text-[13px] text-label-secondary">
          Yeni Şifre
        </label>
        <input
          id="newPassword"
          type="password"
          required
          minLength={8}
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          className={fieldClass}
        />
      </div>
      <div className="space-y-1.5">
        <label htmlFor="confirmPassword" className="text-[13px] text-label-secondary">
          Yeni Şifre (Tekrar)
        </label>
        <input
          id="confirmPassword"
          type="password"
          required
          minLength={8}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className={fieldClass}
        />
      </div>

      {error && <p className="text-[13px] text-red">{error}</p>}

      <button
        type="submit"
        disabled={isPending}
        className="rounded-[var(--radius-pill)] bg-blue text-white text-[15px] font-medium px-5 py-3 disabled:opacity-60"
      >
        {isPending ? "Güncelleniyor…" : "Şifreyi Güncelle"}
      </button>
    </form>
  );
}
