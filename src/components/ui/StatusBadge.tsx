// TicketStatus (bkz. prisma/schema.prisma) için Apple sistem renklerine
// dayalı, tutarlı durum rozeti. Banka uygulamalarındaki işlem durumu
// göstergelerine benzer netlikte tasarlandı (PROJECT.md Bölüm 7).

export type TicketStatus = "OPEN" | "ON_HOLD" | "COMPLETED" | "CANCELLED";

const STATUS_CONFIG: Record<
  TicketStatus,
  { label: string; colorVar: string }
> = {
  OPEN: { label: "İşlemde", colorVar: "var(--color-status-open)" },
  ON_HOLD: { label: "Beklemede", colorVar: "var(--color-status-onhold)" },
  COMPLETED: { label: "Tamamlandı", colorVar: "var(--color-status-completed)" },
  CANCELLED: { label: "İptal", colorVar: "var(--color-status-cancelled)" },
};

export function StatusBadge({ status }: { status: TicketStatus }) {
  const config = STATUS_CONFIG[status];
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-[var(--radius-pill)] px-2.5 py-1 text-[13px] font-medium"
      style={{
        color: config.colorVar,
        backgroundColor: `color-mix(in srgb, ${config.colorVar} 15%, transparent)`,
      }}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: config.colorVar }}
      />
      {config.label}
    </span>
  );
}
