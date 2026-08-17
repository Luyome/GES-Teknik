import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { ChangePasswordForm } from "./ChangePasswordForm";

export default function ProfilePage() {
  return (
    <div className="space-y-6 max-w-lg">
      <div>
        <Link href="/settings" className="text-blue text-[15px]">
          ← Ayarlar
        </Link>
      </div>

      <header>
        <h1 className="text-[28px] font-semibold tracking-tight">Şifremi Değiştir</h1>
        <p className="text-label-secondary text-[15px] mt-1">
          Hesap güvenliğiniz için düzenli olarak şifrenizi güncelleyin.
        </p>
      </header>

      <Card>
        <ChangePasswordForm />
      </Card>
    </div>
  );
}
