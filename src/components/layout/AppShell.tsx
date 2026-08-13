"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "./Sidebar";
import { BottomTabBar } from "./BottomTabBar";

// Genel sayfa iskeleti: masaüstünde sol kenar çubuğu, mobilde alt tab bar.
// /login gibi tam ekran sayfalarda navigasyon çerçevesi gösterilmez.
const CHROME_LESS_PREFIXES = ["/login"];

export function AppShell({
  children,
  signOutSlot,
}: {
  children: ReactNode;
  /** Server component (imzalı `signOut` server action) — client AppShell'e prop olarak geçirilir. */
  signOutSlot?: ReactNode;
}) {
  const pathname = usePathname();
  const isChromeLess = CHROME_LESS_PREFIXES.some((p) => pathname.startsWith(p));

  if (isChromeLess) {
    return <main className="min-h-screen">{children}</main>;
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar signOutSlot={signOutSlot} />
      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1 px-4 md:px-8 py-6 pb-24 md:pb-6">
          {children}
        </main>
      </div>
      <BottomTabBar />
    </div>
  );
}
