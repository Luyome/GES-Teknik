import { auth } from "@/auth";
import { getTicketsReport, type ReportFilters } from "@/lib/data/reports";
import type { TicketStatus } from "@/generated/prisma/enums";

// CSV dışa aktarma — PROJECT.md Bölüm 4: "Raporlama... dışa aktarma
// (PDF/Excel)". Ek bağımlılık gerektirmeyen, Excel'de doğrudan açılabilen
// CSV formatıyla başlanıyor. Aynı filtreleri /reports sayfasıyla paylaşır.
function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response("Oturum bulunamadı.", { status: 401 });
  }

  const url = new URL(request.url);
  const filters: ReportFilters = {
    dateFrom: url.searchParams.get("dateFrom") || undefined,
    dateTo: url.searchParams.get("dateTo") || undefined,
    stageId: url.searchParams.get("stageId") || undefined,
    status: (url.searchParams.get("status") as TicketStatus | null) || undefined,
  };

  const tickets = await getTicketsReport(filters);

  const header = [
    "Kod",
    "Müşteri",
    "Ürün/Parça",
    "Durum",
    "Mevcut Aşama",
    "Öncelik",
    "Giriş Tarihi",
    "Çıkış Tarihi",
  ];
  const rows = tickets.map((t) => [
    t.code,
    t.customer.name,
    t.productInfo,
    t.status,
    t.currentStage?.name ?? "",
    t.priority,
    t.entryDate.toISOString(),
    t.exitDate?.toISOString() ?? "",
  ]);

  const csv = [header, ...rows]
    .map((row) => row.map((v) => csvEscape(String(v))).join(","))
    .join("\r\n");

  // Excel'in UTF-8'i doğru tanıması için BOM ekleniyor (Türkçe karakterler).
  const bom = "﻿";

  return new Response(bom + csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="ges-teknik-rapor-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
