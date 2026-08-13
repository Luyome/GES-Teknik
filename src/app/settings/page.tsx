import { Card } from "@/components/ui/Card";
import { getAllStages } from "@/lib/data/tickets";

export const dynamic = "force-dynamic";

// Ayarlar — iş akışı aşama tanımlarının yönetimi (PROJECT.md Bölüm 2:
// "aşama zinciri parametrik/yapılandırılabilir olmalı"). Şu an salt okunur
// önizleme; düzenleme Faz 2'de eklenecek.
export default async function SettingsPage() {
  const stages = await getAllStages();

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-[28px] font-semibold tracking-tight">Ayarlar</h1>
        <p className="text-label-secondary text-[15px] mt-1">
          İş akışı aşama tanımları
        </p>
      </header>

      <Card className="p-0 divide-y divide-border">
        {stages.map((stage) => (
          <div key={stage.id} className="flex items-center gap-3 px-4 py-3.5">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-surface-2 text-[12px] font-medium text-label-secondary">
              {stage.order}
            </span>
            <span className="text-[15px]">{stage.name}</span>
          </div>
        ))}
      </Card>
    </div>
  );
}
