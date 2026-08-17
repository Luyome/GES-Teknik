"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { useToast } from "@/components/ui/Toast";
import { ROLE_LABEL, ROLE_OPTIONS } from "@/lib/role-labels";
import type { RoleName } from "@/generated/prisma/enums";

type Stage = {
  id: string;
  name: string;
  order: number;
  isActive: boolean;
  allowsPartsRequest: boolean;
  handlesCustomerApproval: boolean;
  responsibleRole: { name: RoleName };
};

const fieldClass =
  "w-full rounded-[var(--radius-control)] border border-border bg-surface-2 px-3.5 py-2.5 text-[14px] outline-none focus:ring-2 focus:ring-blue";

// Ayarlar sayfasındaki aşama yönetimi — PROJECT.md Bölüm 2: aşama zinciri
// veri odaklı/yapılandırılabilir olmalı. ADMIN, yeni aşama ekleyebilir,
// sırasını değiştirebilir, sorumlu rolünü/aktifliğini güncelleyebilir.
export function StageManager({ stages, isAdmin }: { stages: Stage[]; isAdmin: boolean }) {
  const router = useRouter();
  const { showToast } = useToast();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [newRole, setNewRole] = useState<RoleName>("SERVICE_MANAGER");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | undefined>();

  async function patchStage(id: string, body: Record<string, unknown>) {
    setBusyId(id);
    setError(undefined);
    try {
      const res = await fetch(`/api/stages/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "İşlem başarısız.");
        return;
      }
      router.refresh();
    } catch {
      setError("Bağlantı hatası.");
    } finally {
      setBusyId(null);
    }
  }

  async function createStage(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    setCreating(true);
    setError(undefined);
    try {
      const res = await fetch("/api/stages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim(), responsibleRoleName: newRole }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Aşama oluşturulamadı.");
        return;
      }
      setNewName("");
      showToast("Aşama eklendi.");
      router.refresh();
    } catch {
      setError("Bağlantı hatası.");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="space-y-4">
      <Card className="p-0 divide-y divide-border">
        {stages.map((stage, i) => (
          <div key={stage.id} className="flex items-center gap-3 px-4 py-3.5">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-surface-2 text-[12px] font-medium text-label-secondary">
              {stage.order}
            </span>
            <div className="min-w-0 flex-1">
              <div className={`text-[15px] ${!stage.isActive ? "text-label-tertiary line-through" : ""}`}>
                {stage.name}
              </div>
              <div className="text-label-tertiary text-[12px]">
                {ROLE_LABEL[stage.responsibleRole.name]}
              </div>
              <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1.5">
                <label className="flex items-center gap-1.5 text-[12px] text-label-secondary">
                  <input
                    type="checkbox"
                    checked={stage.allowsPartsRequest}
                    disabled={!isAdmin || busyId === stage.id}
                    onChange={(e) => patchStage(stage.id, { allowsPartsRequest: e.target.checked })}
                  />
                  Parça talebi
                </label>
                <label className="flex items-center gap-1.5 text-[12px] text-label-secondary">
                  <input
                    type="checkbox"
                    checked={stage.handlesCustomerApproval}
                    disabled={!isAdmin || busyId === stage.id}
                    onChange={(e) => patchStage(stage.id, { handlesCustomerApproval: e.target.checked })}
                  />
                  Müşteri onayı yetkisi
                </label>
              </div>
            </div>
            {isAdmin && (
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  disabled={busyId === stage.id || i === 0}
                  onClick={() => patchStage(stage.id, { move: "up" })}
                  className="h-7 w-7 rounded-full bg-surface-2 text-[13px] disabled:opacity-30"
                  aria-label="Yukarı taşı"
                >
                  ↑
                </button>
                <button
                  type="button"
                  disabled={busyId === stage.id || i === stages.length - 1}
                  onClick={() => patchStage(stage.id, { move: "down" })}
                  className="h-7 w-7 rounded-full bg-surface-2 text-[13px] disabled:opacity-30"
                  aria-label="Aşağı taşı"
                >
                  ↓
                </button>
                <button
                  type="button"
                  disabled={busyId === stage.id}
                  onClick={() => patchStage(stage.id, { isActive: !stage.isActive })}
                  className="rounded-[var(--radius-pill)] bg-surface-2 text-[12px] font-medium px-2.5 py-1.5 disabled:opacity-50"
                >
                  {stage.isActive ? "Pasifleştir" : "Aktifleştir"}
                </button>
              </div>
            )}
          </div>
        ))}
        {stages.length === 0 && (
          <p className="px-4 py-6 text-center text-label-secondary text-[14px]">
            Henüz aşama tanımlanmadı.
          </p>
        )}
      </Card>

      {error && <p className="text-[13px] text-red">{error}</p>}

      {isAdmin && (
        <Card>
          <form onSubmit={createStage} className="flex flex-col sm:flex-row gap-2">
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Yeni aşama adı"
              className={fieldClass}
            />
            <select
              value={newRole}
              onChange={(e) => setNewRole(e.target.value as RoleName)}
              className={fieldClass + " sm:w-56"}
            >
              {ROLE_OPTIONS.map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABEL[r]}
                </option>
              ))}
            </select>
            <button
              type="submit"
              disabled={creating}
              className="shrink-0 rounded-[var(--radius-pill)] bg-blue text-white text-[14px] font-medium px-4 py-2.5 disabled:opacity-60"
            >
              {creating ? "Ekleniyor…" : "+ Aşama Ekle"}
            </button>
          </form>
        </Card>
      )}
    </div>
  );
}
