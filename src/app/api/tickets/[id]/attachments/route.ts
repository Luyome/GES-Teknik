import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { uploadAttachment, AttachmentUploadError } from "@/lib/blob-upload";
import type { AttachmentType } from "@/generated/prisma/enums";

const VALID_TYPES: AttachmentType[] = ["PHOTO", "INVOICE", "OTHER"];

// Fotoğraf/dosya eki yükleme — PROJECT.md Bölüm 4/5 (Attachment modeli).
// Ortak yükleme mantığı için bkz. src/lib/blob-upload.ts (yeni kayıt
// oluştururken garanti faturası yüklemek için de aynı fonksiyon kullanılır).
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
  const typeRaw = (formData.get("type") as string | null) ?? "PHOTO";
  const type: AttachmentType = VALID_TYPES.includes(typeRaw as AttachmentType)
    ? (typeRaw as AttachmentType)
    : "PHOTO";

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Dosya seçilmedi." }, { status: 400 });
  }

  try {
    const attachment = await uploadAttachment({ ticketId, userId: session.user.id, file, type, note });
    return NextResponse.json({ id: attachment.id, fileUrl: attachment.fileUrl, type: attachment.type });
  } catch (err) {
    if (err instanceof AttachmentUploadError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("[POST /api/tickets/[id]/attachments] error:", err);
    return NextResponse.json(
      { error: `Dosya yüklenemedi: ${err instanceof Error ? err.message : String(err)}` },
      { status: 500 }
    );
  }
}
