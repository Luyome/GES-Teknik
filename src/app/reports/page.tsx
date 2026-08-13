import { Card } from "@/components/ui/Card";

// Raporlar — PROJECT.md Bölüm 4. Faz 3'te gerçek Prisma agregasyon
// sorgularıyla (aşama süre ortalamaları, darboğaz tespiti) doldurulacak.
export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-[28px] font-semibold tracking-tight">Raporlar</h1>
        <p className="text-label-secondary text-[15px] mt-1">
          Aşama süre analizleri ve darboğaz raporları
        </p>
      </header>

      <Card className="text-center py-12">
        <p className="text-label-secondary text-[15px]">
          Raporlama modülü Faz 3&apos;te eklenecek.
        </p>
        <p className="text-label-tertiary text-[13px] mt-1">
          Bkz. PROJECT.md Bölüm 10 — Yol Haritası
        </p>
      </Card>
    </div>
  );
}
