// Basit e-posta format doğrulaması — hem client (NewTicketForm) hem server
// (/api/tickets) tarafında aynı kural kullanılsın diye paylaşılan yardımcı.
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(value: string): boolean {
  return EMAIL_REGEX.test(value);
}
