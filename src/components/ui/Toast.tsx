"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

// Basit uygulama-içi bildirim (toast) sistemi — Faz 4 mobil UX cilası.
// Banka uygulamalarındaki "işlem başarılı/başarısız" netliğinde anlık geri
// bildirim sağlar (PROJECT.md Bölüm 7). Ek bağımlılık gerektirmez.

type ToastKind = "success" | "error";
type ToastItem = { id: number; message: string; kind: ToastKind };

const ToastContext = createContext<{
  showToast: (message: string, kind?: ToastKind) => void;
} | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast, ToastProvider içinde kullanılmalı.");
  return ctx;
}

const KIND_COLOR: Record<ToastKind, string> = {
  success: "var(--color-status-completed)",
  error: "var(--color-status-cancelled)",
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = useCallback((message: string, kind: ToastKind = "success") => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, kind }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed inset-x-0 bottom-20 md:bottom-6 z-50 flex flex-col items-center gap-2 px-4 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="pointer-events-auto flex items-center gap-2 rounded-[var(--radius-pill)] bg-surface border border-border px-4 py-2.5 text-[14px] font-medium shadow-lg animate-toast-in"
            style={{ color: KIND_COLOR[t.kind] }}
          >
            <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: KIND_COLOR[t.kind] }} />
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
