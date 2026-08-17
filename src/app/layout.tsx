import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AppShell } from "@/components/layout/AppShell";
import { SignOutButton } from "@/components/layout/SignOutButton";
import { ToastProvider } from "@/components/ui/Toast";

export const metadata: Metadata = {
  title: "GES Teknik",
  description: "GES Teknik — teknik servis iş akışı ve izleme sistemi",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f2f2f7" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="tr" className="h-full antialiased">
      <body className="min-h-full bg-canvas text-label">
        <ToastProvider>
          <AppShell signOutSlot={<SignOutButton />}>{children}</AppShell>
        </ToastProvider>
      </body>
    </html>
  );
}
