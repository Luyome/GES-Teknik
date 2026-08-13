// Ana navigasyon tanımı — hem masaüstü kenar çubuğu hem de mobil alt tab bar
// buradan beslenir. Bkz. PROJECT.md Bölüm 6 (Ekran/Sayfa Listesi).

export type NavItem = {
  href: string;
  label: string;
  icon: "dashboard" | "tickets" | "reports" | "settings";
  mobilePrimary?: boolean; // alt tab bar'da gösterilecek 4 öncelikli ekran
};

export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: "dashboard", mobilePrimary: true },
  { href: "/tickets", label: "Kayıtlar", icon: "tickets", mobilePrimary: true },
  { href: "/reports", label: "Raporlar", icon: "reports", mobilePrimary: true },
  { href: "/settings", label: "Ayarlar", icon: "settings", mobilePrimary: true },
];
