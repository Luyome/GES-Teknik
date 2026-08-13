"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "./nav-items";
import { ICONS } from "@/components/icons";

// Masaüstü kenar çubuğu (md ve üzeri ekranlarda görünür).
export function Sidebar({ signOutSlot }: { signOutSlot?: ReactNode }) {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex md:w-64 md:flex-col md:shrink-0 border-r border-border bg-surface">
      <div className="px-5 pt-6 pb-4">
        <span className="text-[17px] font-semibold tracking-tight">
          GES Teknik
        </span>
      </div>
      <nav className="flex-1 px-3 space-y-0.5">
        {NAV_ITEMS.map((item) => {
          const Icon = ICONS[item.icon];
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-[var(--radius-control)] px-3 py-2.5 text-[15px] transition-colors ${
                active
                  ? "bg-blue/10 text-blue font-medium"
                  : "text-label-secondary hover:bg-surface-2 hover:text-label"
              }`}
            >
              <Icon width={20} height={20} />
              {item.label}
            </Link>
          );
        })}
      </nav>
      {signOutSlot}
    </aside>
  );
}
