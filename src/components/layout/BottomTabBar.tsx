"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "./nav-items";
import { ICONS } from "@/components/icons";

// Mobil alt tab bar — banka uygulamalarındaki gibi büyük dokunma hedefleri,
// net aktif durum göstergesi. safe-area-inset ile home indicator'a taşmaz.
export function BottomTabBar() {
  const pathname = usePathname();
  const items = NAV_ITEMS.filter((i) => i.mobilePrimary);

  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t border-border bg-surface/90 backdrop-blur-xl"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="flex items-stretch justify-around">
        {items.map((item) => {
          const Icon = ICONS[item.icon];
          const active = pathname.startsWith(item.href);
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                className="flex flex-col items-center justify-center gap-1 py-2 min-h-[52px] text-[11px]"
              >
                <Icon
                  width={24}
                  height={24}
                  className={active ? "text-blue" : "text-label-tertiary"}
                />
                <span
                  className={
                    active ? "text-blue font-medium" : "text-label-tertiary"
                  }
                >
                  {item.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
