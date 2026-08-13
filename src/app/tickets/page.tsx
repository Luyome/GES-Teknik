import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { MOCK_TICKETS } from "@/lib/mock-data";

// Kayıt Listesi — PROJECT.md Bölüm 6. Filtreleme (Bölüm 4) ileride
// query param + Prisma `where` sorgularıyla eklenecek.
export default function TicketsPage() {
  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-[28px] font-semibold tracking-tight">Kayıtlar</h1>
          <p className="text-label-secondary text-[15px] mt-1">
            {MOCK_TICKETS.length} servis kaydı
          </p>
        </div>
        <button className="shrink-0 rounded-[var(--radius-pill)] bg-blue text-white text-[15px] font-medium px-4 py-2.5">
          + Yeni Kayıt
        </button>
      </header>

      <Card className="p-0 divide-y divide-border">
        {MOCK_TICKETS.map((t) => (
          <Link
            key={t.id}
            href={`/tickets/${t.id}`}
            className="flex items-center justify-between gap-3 px-4 py-3.5 hover:bg-surface-2 transition-colors first:rounded-t-[var(--radius-card)] last:rounded-b-[var(--radius-card)]"
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium text-[15px]">{t.code}</span>
                <span className="text-label-tertiary text-[13px]">
                  {t.entryDate}
                </span>
              </div>
              <div className="text-label-secondary text-[13px] truncate">
                {t.customerName} · {t.productInfo}
              </div>
              <div className="text-label-tertiary text-[12px] mt-0.5">
                {t.currentStage}
              </div>
            </div>
            <StatusBadge status={t.status} />
          </Link>
        ))}
      </Card>
    </div>
  );
}
