import { Card } from "@/components/ui/Card";
import type { TicketStatus } from "@/generated/prisma/enums";
import type { ReportFilters } from "@/lib/data/reports";

const fieldClass =
  "w-full rounded-[var(--radius-control)] border border-border bg-surface-2 px-3.5 py-2.5 text-[14px] outline-none focus:ring-2 focus:ring-blue";

// GET form ile query param filtreleme — client state gerektirmez, sayfa
// server component olarak searchParams'tan doğrudan okur.
export function ReportFilterForm({
  stages,
  statusOptions,
  filters,
}: {
  stages: { id: string; name: string }[];
  statusOptions: { value: TicketStatus; label: string }[];
  filters: ReportFilters;
}) {
  return (
    <Card>
      <form method="GET" className="grid grid-cols-2 sm:grid-cols-4 gap-2 items-end">
        <div className="space-y-1 col-span-1">
          <label className="text-[12px] text-label-secondary">Başlangıç</label>
          <input type="date" name="dateFrom" defaultValue={filters.dateFrom} className={fieldClass} />
        </div>
        <div className="space-y-1 col-span-1">
          <label className="text-[12px] text-label-secondary">Bitiş</label>
          <input type="date" name="dateTo" defaultValue={filters.dateTo} className={fieldClass} />
        </div>
        <div className="space-y-1 col-span-1">
          <label className="text-[12px] text-label-secondary">Aşama</label>
          <select name="stageId" defaultValue={filters.stageId ?? ""} className={fieldClass}>
            <option value="">Tümü</option>
            {stages.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1 col-span-1">
          <label className="text-[12px] text-label-secondary">Durum</label>
          <select name="status" defaultValue={filters.status ?? ""} className={fieldClass}>
            <option value="">Tümü</option>
            {statusOptions.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
        <div className="col-span-2 sm:col-span-4 flex gap-2">
          <button
            type="submit"
            className="rounded-[var(--radius-pill)] bg-blue text-white text-[14px] font-medium px-4 py-2.5"
          >
            Filtrele
          </button>
          <a
            href="/reports"
            className="rounded-[var(--radius-pill)] bg-surface-2 border border-border text-[14px] font-medium px-4 py-2.5"
          >
            Temizle
          </a>
        </div>
      </form>
    </Card>
  );
}
