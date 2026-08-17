"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { useToast } from "@/components/ui/Toast";
import { ROLE_LABEL, ROLE_OPTIONS } from "@/lib/role-labels";
import type { RoleName } from "@/generated/prisma/enums";

type User = {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
  role: RoleName;
};

const fieldClass =
  "w-full rounded-[var(--radius-control)] border border-border bg-surface-2 px-3.5 py-2.5 text-[14px] outline-none focus:ring-2 focus:ring-blue";

export function UserManager({ users, currentUserId }: { users: User[]; currentUserId: string }) {
  const router = useRouter();
  const { showToast } = useToast();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | undefined>();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [roleName, setRoleName] = useState<RoleName>("TECHNICIAN");
  const [creating, setCreating] = useState(false);

  async function patchUser(id: string, body: Record<string, unknown>) {
    setBusyId(id);
    setError(undefined);
    try {
      const res = await fetch(`/api/users/${id}`, {
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

  async function createUser(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setError(undefined);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, roleName }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Kullanıcı oluşturulamadı.");
        return;
      }
      setName("");
      setEmail("");
      setPassword("");
      showToast("Kullanıcı oluşturuldu.");
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
        {users.map((u) => (
          <div key={u.id} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 px-4 py-3.5">
            <div className="min-w-0 flex-1">
              <div className={`text-[15px] font-medium ${!u.isActive ? "text-label-tertiary" : ""}`}>
                {u.name} {u.id === currentUserId && <span className="text-label-tertiary text-[12px]">(siz)</span>}
              </div>
              <div className="text-label-secondary text-[13px] truncate">{u.email}</div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <select
                defaultValue={u.role}
                disabled={busyId === u.id}
                onChange={(e) => patchUser(u.id, { roleName: e.target.value })}
                className="rounded-[var(--radius-control)] border border-border bg-surface-2 px-2.5 py-1.5 text-[13px]"
              >
                {ROLE_OPTIONS.map((r) => (
                  <option key={r} value={r}>
                    {ROLE_LABEL[r]}
                  </option>
                ))}
              </select>
              <button
                type="button"
                disabled={busyId === u.id || u.id === currentUserId}
                onClick={() => patchUser(u.id, { isActive: !u.isActive })}
                className="rounded-[var(--radius-pill)] bg-surface-2 text-[12px] font-medium px-2.5 py-1.5 disabled:opacity-40"
              >
                {u.isActive ? "Pasifleştir" : "Aktifleştir"}
              </button>
            </div>
          </div>
        ))}
      </Card>

      {error && <p className="text-[13px] text-red">{error}</p>}

      <Card className="space-y-3">
        <h2 className="text-[14px] font-medium">Yeni Kullanıcı Ekle</h2>
        <form onSubmit={createUser} className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <input
            required
            placeholder="Ad Soyad"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={fieldClass}
          />
          <input
            required
            type="email"
            placeholder="E-posta"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={fieldClass}
          />
          <input
            required
            type="password"
            minLength={8}
            placeholder="Şifre (en az 8 karakter)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={fieldClass}
          />
          <select
            value={roleName}
            onChange={(e) => setRoleName(e.target.value as RoleName)}
            className={fieldClass}
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
            className="sm:col-span-2 rounded-[var(--radius-pill)] bg-blue text-white text-[14px] font-medium px-4 py-2.5 disabled:opacity-60"
          >
            {creating ? "Oluşturuluyor…" : "+ Kullanıcı Oluştur"}
          </button>
        </form>
      </Card>
    </div>
  );
}
