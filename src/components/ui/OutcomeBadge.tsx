// StageOutcome (bkz. prisma/schema.prisma) için StatusBadge ile aynı
// kalıba dayanan rozet. Daha önce src/app/tickets/[id]/page.tsx içine
// gömülü olan OUTCOME_LABEL/OUTCOME_COLOR map'i buraya taşındı ki
// aşama işlem UI'ı (StageActions) da aynı gösterimi kullanabilsin.

export type StageOutcome = "IN_PROGRESS" | "APPROVED" | "REJECTED" | "CANCELLED";

const OUTCOME_CONFIG: Record<StageOutcome, { label: string; colorVar: string }> = {
  IN_PROGRESS: { label: "Devam ediyor", colorVar: "var(--color-status-open)" },
  APPROVED: { label: "Onaylandı", colorVar: "var(--color-status-completed)" },
  REJECTED: { label: "Reddedildi / İade", colorVar: "var(--color-status-cancelled)" },
  CANCELLED: { label: "İptal", colorVar: "var(--color-status-cancelled)" },
};

export function outcomeLabel(outcome: StageOutcome) {
  return OUTCOME_CONFIG[outcome].label;
}

export function outcomeColorVar(outcome: StageOutcome) {
  return OUTCOME_CONFIG[outcome].colorVar;
}

export function OutcomeBadge({ outcome }: { outcome: StageOutcome }) {
  const config = OUTCOME_CONFIG[outcome];
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-[var(--radius-pill)] px-2.5 py-1 text-[13px] font-medium"
      style={{
        color: config.colorVar,
        backgroundColor: `color-mix(in srgb, ${config.colorVar} 15%, transparent)`,
      }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: config.colorVar }} />
      {config.label}
    </span>
  );
}
