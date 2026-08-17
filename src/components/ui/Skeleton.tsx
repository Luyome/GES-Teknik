// Basit iskelet (skeleton) bloğu — Faz 4 mobil UX cilası, sayfa geçişlerinde
// ani beyaz/boş ekran yerine yumuşak bir yükleniyor hissi verir.
export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-[var(--radius-control)] bg-surface-2 ${className}`}
    />
  );
}
