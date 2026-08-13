import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/auth.config";

// Next.js 16'da `middleware.js` yerine `proxy.js` kullanılır (davranış aynı).
// Edge Runtime'da çalıştığı için Prisma/Node API'si içermeyen `authConfig`
// kullanılır — burada sadece mevcut JWT session okunur, DB'ye gidilmez.
const { auth } = NextAuth(authConfig);

const PUBLIC_PATHS = ["/login"];

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));
  const isLoggedIn = !!req.auth;

  // Server Action / form POST istekleri burada kontrol edilmiyor: Edge'de
  // çalışan bu proxy, POST isteklerinde (Next.js Server Actions) req.auth'u
  // güvenilir biçimde okuyamıyor (Next.js 16 + Auth.js v5 beta ile
  // gözlemlenen bir uyumsuzluk). Yetkilendirme, ilgili server action içinde
  // Node runtime'da çalışan `auth()` çağrısıyla zaten ayrıca yapılıyor.
  // Proxy sadece sayfa GET isteklerinde login'e yönlendirme uygular.
  if (req.method !== "GET") {
    return NextResponse.next();
  }

  if (!isLoggedIn && !isPublic) {
    const loginUrl = new URL("/login", req.nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isLoggedIn && isPublic) {
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl.origin));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
