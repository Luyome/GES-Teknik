import { Card } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { getAllStages } from "@/lib/data/tickets";
import {
  getStageDurationStats,
  getTicketsReport,
  getReportSummary,
  formatDuration,
  type ReportFilters,
} from "@/lib/data/reports";
import type { TicketStatus } from "@/generated/prisma/enums";
import { ReportFilterForm } from "./ReportFilterForm";

export const dynamic = "force-dynamic";

const STATUS_OPTIONS: { value: TicketStatus; label: string }[] = [
  { value: "OPEN", label: "İşlemde" },
  { value: "ON_HOLD", label: "Beklemede" },
  { value: "COMPLETED", label: "Tamamlandı" },
  { value: "CANCELLED", label: "İptal" },
];

// Raporlar — PROJECT.md Bölüm 4: aşama süre analizleri, darboğaz raporu,
// filtreleme ve dışa aktarma.
export default async function ReportsPage({
  searchParams,
}: PageProps<"/reports">) {
  const sp = await searchParams;
  const filters: ReportFilters = {
    dateFrom: typeof sp.dateFrom === "string" ? sp.dateFrom : undefined,
    dateTo: typeof sp.dateTo === "string" ? sp.dateTo : undefined,
    stageId: typeof sp.stageId === "string" ? sp.stageId : undefined,
    status: typeof sp.status === "string" ? (sp.status as TicketStatus) : undefined,
  };

  const [stages, { stats, bottleneck }, tickets, summary] = await Promise.all([
    getAllStages(),
    getStageDurationStats(),
    getTicketsReport(filters),
    getReportSummary(filters),
  ]);

  const exportUrl = `/api/reports/export?${new URLSearchParams(
    Object.entries(filters).filter(([, v]) => !!v) as [string, string][]
  ).toString()}`;

  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-[28px] font-semibold tracking-tight">Raporlar</h1>
          <p className="text-label-secondary text-[15px] mt-1">
            Aşama süre analizleri ve darboğaz raporları
          </p>
        </div>
        <a
          href={exportUrl}
          className="shrink-0 rounded-[var(--radius-pill)] bg-blue text-white text-[14px] font-medium px-4 py-2.5"
        >
          CSV İndir
        </a>
      </header>

      <ReportFilterForm stages={stages} statusOptions={STATUS_OPTIONS} filters={filters} />

      {/* Özet kartlar */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <SummaryTile label="Toplam" value={summary.total} />
        <SummaryTile label="İşlemde" value={summary.open} colorVar="var(--color-status-open)" />
        <SummaryTile label="Beklemede" value={summary.onHold} colorVar="var(--color-status-onhold)" />
        <SummaryTile label="Tamamlanan" value={summary.completed} colorVar="var(--color-status-completed)" />
        <SummaryTile label="İptal" value={summary.cancelled} colorVar="var(--color-status-cancelled)" />
      </div>

      {/* Aşama süre analizi / darboğaz */}
      <div>
        <h2 className="text-[13px] font-medium text-label-secondary uppercase tracking-wide mb-2">
          Aşama Bazlı Süre Analizi
        </h2>
        <Card className="p-0 divide-y divide-border">
          {stats.map(({ stage, count, avgMs, maxMs }) => (
            <div key={stage.id} className="flex items-center justify-between gap-3 px-4 py-3.5">
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-[14px] font-medium">
                  {stage.name}
                  {bottleneck?.stage.id === stage.id && count > 0 && (
                    <span className="rounded-[var(--radius-pill)] bg-red/15 text-red text-[11px] font-medium px-2 py-0.5">
                      Darboğaz
                    </span>
                  )}
                </div>
                <div className="text-label-tertiary text-[12px]">{count} tamamlanmış geçiş</div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-[14px] font-medium">Ort. {formatDuration(avgMs)}</div>
                <div className="text-label-tertiary text-[12px]">Maks. {formatDuration(maxMs)}</div>
              </div>
            </div>
          ))}
        </Card>
      </div>

      {/* Filtrelenmiş kayıt listesi */}
      <div>
        <h2 className="text-[13px] font-medium text-label-secondary uppercase tracking-wide mb-2">
          Kayıtlar ({tickets.length})
        </h2>
        {tickets.length === 0 ? (
          <Card className="text-center py-12">
            <p className="text-label-secondary text-[15px]">Filtreye uyan kayıt yok.</p>
          </Card>
        ) : (
          <Card className="p-0 divide-y divide-border">
            {tickets.map((t) => (
              <div key={t.id} className="flex items-center justify-between gap-3 px-4 py-3.5">
                <div className="min-w-0">
                  <div className="font-medium text-[15px]">
                    {t.code} · {t.customer.name}
                  </div>
                  <div className="text-label-secondary text-[13px] truncate">
                    {t.currentStage?.name ?? "—"} · {t.entryDate.toLocaleDateString("tr-TR")}
                  </div>
                </div>
                <StatusBadge status={t.status} />
              </div>
            ))}
          </Card>
        )}
      </div>
    </div>
  );
}

function SummaryTile({
  label,
  value,
  colorVar,
}: {
  label: string;
  value: number;
  colorVar?: string;
}) {
  return (
    <Card>
      <div className="text-[12px] text-label-secondary">{label}</div>
      <div className="text-[22px] font-semibold mt-1" style={{ color: colorVar }}>
        {value}
      </div>
    </Card>
  );
}
