import { Card } from "@/components/ui/Card";
import { STAGES } from "@/lib/mock-data";

// Ayarlar — iş akışı aşama tanımlarının yönetimi (PROJECT.md Bölüm 2:
// "aşama zinciri parametrik/yapılandırılabilir olmalı"). Şu an salt okunur
// önizleme; düzenleme Faz 2'de Prisma `Stage` modeli üzerinden eklenecek.
export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-[28px] font-semibold tracking-tight">Ayarlar</h1>
        <p className="text-label-secondary text-[15px] mt-1">
          İş akışı aşama tanımları
        </p>
      </header>

      <Card className="p-0 divide-y divide-border">
        {STAGES.map((stage, i) => (
          <div key={stage} className="flex items-center gap-3 px-4 py-3.5">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-surface-2 text-[12px] font-medium text-label-secondary">
              {i + 1}
            </span>
            <span className="text-[15px]">{stage}</span>
          </div>
        ))}
      </Card>
    </div>
  );
}
