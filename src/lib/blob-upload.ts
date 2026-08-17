import { put } from "@vercel/blob";
import { prisma } from "@/lib/prisma";
import type { AttachmentType } from "@/generated/prisma/enums";

// Fotoğraf/dosya eki yükleme ortak mantığı — hem
// /api/tickets/[id]/attachments (ticket detayından yükleme) hem
// /api/tickets (yeni kayıt oluştururken, garanti kapsamındaysa fatura)
// tarafından kullanılır. Vercel Blob kullanır. ÖN KOŞUL: Vercel projesinde
// bir Blob Store bağlanmış olmalı (Vercel Dashboard → Storage → Create →
// Blob → Connect to Project) — bu, `BLOB_READ_WRITE_TOKEN` ortam
// değişkenini otomatik sağlar. Bağlı değilse net bir hata döner.
export const MAX_ATTACHMENT_SIZE = 10 * 1024 * 1024; // 10 MB

export class AttachmentUploadError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export async function uploadAttachment({
  ticketId,
  userId,
  file,
  type,
  note,
}: {
  ticketId: string;
  userId: string;
  file: File;
  type: AttachmentType;
  note?: string | null;
}) {
  if (file.size === 0) {
    throw new AttachmentUploadError("Dosya seçilmedi.", 400);
  }
  if (file.size > MAX_ATTACHMENT_SIZE) {
    throw new AttachmentUploadError("Dosya en fazla 10 MB olabilir.", 400);
  }
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    throw new AttachmentUploadError(
      "Dosya yükleme henüz yapılandırılmadı: Vercel projesinde bir Blob Store bağlanmalı (Storage → Create → Blob → Connect to Project). Bkz. PROJECT.md.",
      503
    );
  }

  const blob = await put(`tickets/${ticketId}/${Date.now()}-${file.name}`, file, {
    access: "public",
  });

  return prisma.attachment.create({
    data: {
      ticketId,
      userId,
      fileUrl: blob.url,
      type,
      note: note || null,
    },
  });
}
