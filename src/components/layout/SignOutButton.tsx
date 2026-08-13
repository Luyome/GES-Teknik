import { signOut } from "@/auth";

export function SignOutButton() {
  return (
    <form
      action={async () => {
        "use server";
        await signOut({ redirectTo: "/login" });
      }}
      className="px-3 pb-4"
    >
      <button
        type="submit"
        className="w-full text-left rounded-[var(--radius-control)] px-3 py-2.5 text-[14px] text-label-secondary hover:bg-surface-2 hover:text-label transition-colors"
      >
        Çıkış Yap
      </button>
    </form>
  );
}
