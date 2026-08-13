import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Vercel'in edge/CDN katmanı, force-dynamic işaretli sayfalarda bile
  // GET yanıtlarını agresif biçimde önbelleğe alabiliyor (gözlemlendi:
  // /tickets/new dakikalarca eski/oturumsuz bir HTML kopyasını
  // sunmaya devam ediyordu). Kimlik doğrulama gerektiren tüm sayfalarda
  // açık no-store header'ı ile bunu kesin olarak engelliyoruz.
  async headers() {
    return [
      {
        source: "/((?!_next/static|_next/image|favicon.ico).*)",
        headers: [
          { key: "Cache-Control", value: "no-store, must-revalidate" },
        ],
      },
    ];
  },
};

export default nextConfig;
