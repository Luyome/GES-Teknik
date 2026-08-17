import type { Prisma } from "@/generated/prisma/client";

// SMS bildirim SİMÜLASYONU — her aşama geçişinde müşteriyi bilgilendirme
// gereksinimi (kullanıcı talebi: "şu an sadece görünürde çalışsın").
// GERÇEK BİR SMS SAĞLAYICISINA (Netgsm/Twilio/İleti Merkezi vb.) HENÜZ
// BAĞLI DEĞİL — burada sadece bir SmsLog satırı yazılır ve konsola loglanır.
// İleride gerçek gönderim eklenecekse SADECE bu fonksiyonun içi
// değiştirilecek; çağıran kod (transitions/accept/parts-issue/
// customer-approved route'ları) hiç değişmeyecek.
export async function sendSimulatedSms(
  tx: Prisma.TransactionClient,
  { ticketId, toPhone, message }: { ticketId: string; toPhone: string | null; message: string }
) {
  await tx.smsLog.create({
    data: { ticketId, toPhone, message },
  });
  console.log(`[SMS SİMÜLASYON] → ${toPhone ?? "(telefon yok)"}: ${message}`);
}
