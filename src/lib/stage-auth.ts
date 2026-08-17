// Aşama işlemleri (accept/transitions/parts-issue/customer-approved) için
// ortak yetki kontrolü. Normalde bir aşamayı, o aşamanın sorumlu rolündeki
// HERKES işleyebilir — ama Teknisyen sorumluluğundaki bir aşamada havuzdan
// belirli biri atanmışsa (bkz. src/lib/data/technicians.ts, "Onayla"
// sırasında yapılan seçim), sadece o kişi (+ ADMIN) işlem yapabilir; rol
// eşleşmesi tek başına yetmez — aksi halde havuzdan atamanın anlamı kalmaz.
export function checkStageAuthorization({
  userRole,
  userId,
  stageResponsibleRole,
  assignedTechnicianId,
}: {
  userRole?: string;
  userId: string;
  stageResponsibleRole: string;
  assignedTechnicianId: string | null;
}): { ok: true } | { ok: false; error: string } {
  const isAdmin = userRole === "ADMIN";
  const isTechnicianStageWithAssignee = stageResponsibleRole === "TECHNICIAN" && !!assignedTechnicianId;

  if (isTechnicianStageWithAssignee) {
    if (isAdmin || assignedTechnicianId === userId) return { ok: true };
    return { ok: false, error: "Bu kayıt başka bir teknisyene atanmış." };
  }

  if (isAdmin || userRole === stageResponsibleRole) return { ok: true };
  return { ok: false, error: `Bu aşamayı yalnızca "${stageResponsibleRole}" rolü işleyebilir.` };
}
