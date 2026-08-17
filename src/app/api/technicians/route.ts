import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getTechnicianPool } from "@/lib/data/technicians";

// Teknisyen havuzu — StageActions'taki seçici bunu kullanır (bir aşamaya
// "Onayla" ile geçerken hangi teknisyene atanacağını seçmek için).
// Oturum açık her rol görebilir (sadece görüntüleme, mutasyon yok).
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Oturum bulunamadı." }, { status: 401 });
  }
  const technicians = await getTechnicianPool();
  return NextResponse.json({ technicians });
}
