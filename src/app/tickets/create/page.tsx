import Link from "next/link";
import { NewTicketForm } from "./NewTicketForm";

// Statik prerender edilirse, sayfadaki server action referansı build anındaki
// deployment'a kilitlenir; yeni bir deploy sonrası tarayıcı önbelleğinde eski
// bir kopya kalırsa form gönderimi tutarsız davranabilir. Bu yüzden dinamik.
export const dynamic = "force-dynamic";

export default function NewTicketPage() {
  return (
    <div className="space-y-6">
      <div>
        <Link href="/tickets" className="text-blue text-[15px]">
          ← Kayıtlar
        </Link>
      </div>
      <header>
        <h1 className="text-[28px] font-semibold tracking-tight">Yeni Kayıt</h1>
        <p className="text-label-secondary text-[15px] mt-1">
          Yeni bir servis kaydı oluşturun — &quot;Kayıt / Giriş&quot; aşamasından başlar.
        </p>
      </header>
      <NewTicketForm />
    </div>
  );
}
