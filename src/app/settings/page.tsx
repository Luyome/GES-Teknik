import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { getAllStages } from "@/lib/data/tickets";
import { auth } from "@/auth";
import { StageManager } from "./StageManager";

export const dynamic = "force-dynamic";

// Ayarlar — iş akışı aşama tanımlarının yönetimi (PROJECT.md Bölüm 2:
// "aşama zinciri parametrik/yapılandırılabilir olmalı"). ADMIN için
// düzenlenebilir, diğer roller için salt okunur.
export default async function SettingsPage() {
  const [stages, session] = await Promise.all([getAllStages(), auth()]);
  const isAdmin = session?.user?.role === "ADMIN";

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-[28px] font-semibold tracking-tight">Ayarlar</h1>
        <p className="text-label-secondary text-[15px] mt-1">
          İş akışı aşama tanımları
        </p>
      </header>

      <div className="flex flex-wrap gap-2">
        <Link
          href="/settings/profile"
          className="rounded-[var(--radius-pill)] bg-surface-2 border border-border text-[13px] font-medium px-3.5 py-2"
        >
          Şifremi Değiştir
        </Link>
        {isAdmin && (
          <Link
            href="/settings/users"
            className="rounded-[var(--radius-pill)] bg-surface-2 border border-border text-[13px] font-medium px-3.5 py-2"
          >
            Kullanıcı Yönetimi
          </Link>
        )}
      </div>

      <StageManager stages={stages} isAdmin={isAdmin} />

      {!isAdmin && stages.length === 0 && (
        <Card className="text-center py-12">
          <p className="text-label-secondary text-[15px]">Henüz aşama tanımlanmadı.</p>
        </Card>
      )}
    </div>
  );
}
