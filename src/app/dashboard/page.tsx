import { Card } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { MOCK_TICKETS, STAGES, getStageCounts } from "@/lib/mock-data";
import Link from "next/link";

// Canlı durum panosu — PROJECT.md Bölüm 4: her kaydın hangi aşamada
// olduğunun anlık görünümü (kanban tarzı aşama sütunları).
export default function DashboardPage() {
  const stageCounts = getStageCounts();
  const openCount = MOCK_TICKETS.filter((t) => t.status === "OPEN").length;
  const onHoldCount = MOCK_TICKETS.filter((t) => t.status === "ON_HOLD").length;
  const completedCount = MOCK_TICKETS.filter((t) => t.status === "COMPLETED").length;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-[28px] font-semibold tracking-tight">Dashboard</h1>
        <p className="text-label-secondary text-[15px] mt-1">
          Tüm servis kayıtlarının anlık aşama durumu
        </p>
      </header>

      {/* Özet metrik kartları */}
      <div className="grid grid-cols-3 gap-3">
        <StatTile label="İşlemde" value={openCount} colorVar="var(--color-status-open)" />
        <StatTile label="Beklemede" value={onHoldCount} colorVar="var(--color-status-onhold)" />
        <StatTile label="Tamamlanan" value={completedCount} colorVar="var(--color-status-completed)" />
      </div>

      {/* Aşama bazlı kanban görünümü */}
      <div>
        <h2 className="text-[13px] font-medium text-label-secondary uppercase tracking-wide mb-2">
          Aşama Durumu
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
          {STAGES.map((stage) => {
            const count = stageCounts.find((s) => s.stage === stage)?.count ?? 0;
            const tickets = MOCK_TICKETS.filter(
              (t) => t.currentStage === stage && t.status !== "COMPLETED"
            );
            return (
              <Card key={stage} className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-[13px] font-medium text-label-secondary">
                    {stage}
                  </span>
                  <span className="text-[13px] font-semibold text-label-tertiary">
                    {count}
                  </span>
                </div>
                <div className="space-y-1.5">
                  {tickets.length === 0 && (
                    <p className="text-[13px] text-label-tertiary">Kayıt yok</p>
                  )}
                  {tickets.map((t) => (
                    <Link
                      key={t.id}
                      href={`/tickets/${t.id}`}
                      className="block rounded-[var(--radius-control)] bg-surface-2 px-2.5 py-2 text-[13px] hover:opacity-80 transition-opacity"
                    >
                      <div className="font-medium">{t.code}</div>
                      <div className="text-label-secondary truncate">{t.customerName}</div>
                    </Link>
                  ))}
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Son kayıtlar */}
      <div>
        <h2 className="text-[13px] font-medium text-label-secondary uppercase tracking-wide mb-2">
          Son Kayıtlar
        </h2>
        <Card className="p-0 divide-y divide-border">
          {MOCK_TICKETS.map((t) => (
            <Link
              key={t.id}
              href={`/tickets/${t.id}`}
              className="flex items-center justify-between gap-3 px-4 py-3.5 hover:bg-surface-2 transition-colors first:rounded-t-[var(--radius-card)] last:rounded-b-[var(--radius-card)]"
            >
              <div className="min-w-0">
                <div className="font-medium text-[15px]">{t.code} · {t.customerName}</div>
                <div className="text-label-secondary text-[13px] truncate">{t.productInfo}</div>
              </div>
              <StatusBadge status={t.status} />
            </Link>
          ))}
        </Card>
      </div>
    </div>
  );
}

function StatTile({
  label,
  value,
  colorVar,
}: {
  label: string;
  value: number;
  colorVar: string;
}) {
  return (
    <Card>
      <div className="text-[13px] text-label-secondary">{label}</div>
      <div className="text-[28px] font-semibold mt-1" style={{ color: colorVar }}>
        {value}
      </div>
    </Card>
  );
}
