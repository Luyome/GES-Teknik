import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// Fotoğraf/dosya eki yükleme — PROJECT.md Bölüm 4/5 (Attachment modeli).
// Vercel Blob kullanır. ÖN KOŞUL: Vercel projesinde bir Blob Store
// bağlanmış olmalı (Vercel Dashboard → Storage → Create → Blob → Connect
// to Project) — bu, `BLOB_READ_WRITE_TOKEN` ortam değişkenini otomatik
// sağlar. Bağlı değilse aşağıdaki `put()` çağrısı net bir hata döner ve
// kullanıcıya bildirilir; uygulamanın geri kalanı etkilenmez.
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Oturum bulunamadı, lütfen tekrar giriş yapın." }, { status: 401 });
  }

  const { id: ticketId } = await params;

  const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
  if (!ticket) {
    return NextResponse.json({ error: "Kayıt bulunamadı." }, { status: 404 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  const note = (formData.get("note") as string | null)?.trim() || null;

  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "Dosya seçilmedi." }, { status: 400 });
  }
  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: "Dosya en fazla 10 MB olabilir." }, { status: 400 });
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json(
      {
        error:
          "Dosya yükleme henüz yapılandırılmadı: Vercel projesinde bir Blob Store bağlanmalı (Storage → Create → Blob → Connect to Project). Bkz. PROJECT.md.",
      },
      { status: 503 }
    );
  }

  try {
    const blob = await put(`tickets/${ticketId}/${Date.now()}-${file.name}`, file, {
      access: "public",
    });

    const attachment = await prisma.attachment.create({
      data: {
        ticketId,
        userId: session.user.id,
        fileUrl: blob.url,
        note,
      },
    });

    return NextResponse.json({ id: attachment.id, fileUrl: attachment.fileUrl });
  } catch (err) {
    console.error("[POST /api/tickets/[id]/attachments] error:", err);
    return NextResponse.json(
      { error: `Dosya yüklenemedi: ${err instanceof Error ? err.message : String(err)}` },
      { status: 500 }
    );
  }
}
