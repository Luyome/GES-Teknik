# GES Teknik — Proje Şartnamesi

> Bu doküman, GES Teknik projesine dair tüm karar, gereksinim ve planların tutulduğu tek referans kaynağıdır. Proje ilerledikçe güncellenmeli, yeni kararlar buraya eklenmelidir.

**Son güncelleme:** 2026-08-13

---

## 0. Uygulama Durumu (Faz 1 — Temel İskelet)

**Kod konumu:** `C:\Users\Demir\Documents\ges-teknik\` (npm paket adı küçük harf zorunlu olduğu için klasör adı küçük harfle oluşturuldu; Windows dosya sistemi büyük/küçük harfe duyarsız olduğu için erişim aynıdır).

Tamamlananlar:
- [x] Next.js 16 (App Router, Turbopack) + TypeScript + Tailwind CSS 4 iskeleti
- [x] Prisma 7 şeması: `User, Role, Customer, Ticket, Stage, StageHistory, Attachment, Part, PartUsage` (bkz. `prisma/schema.prisma`)
- [x] Neon serverless driver adapter (`@prisma/adapter-neon`) entegrasyonu — `src/lib/prisma.ts`
- [x] Başlangıç seed script'i (roller + varsayılan 6 aşama) — `prisma/seed.ts`
- [x] Apple HIG referanslı tasarım token'ları (sistem renkleri, radius, tipografi) — `src/app/globals.css`
- [x] Masaüstü sidebar + mobil bottom tab bar (banka uygulaması UX'i) — `src/components/layout/`
- [x] Dashboard, Kayıtlar, Kayıt Detayı (zaman çizelgesi), Raporlar, Ayarlar sayfaları — şu an **mock veriyle** (`src/lib/mock-data.ts`)
- [x] Auth.js (next-auth v5) Credentials provider + rol bazlı proxy koruması (`src/auth.ts`, `src/proxy.ts`)
- [x] Yerel git deposu ve ilk commit

Ayrıca tamamlananlar:
- [x] **Neon veritabanı** — "GES Teknik" adında Neon projesi oluşturuldu (AWS Europe Central 1 / Frankfurt), şema migrate edildi, roller/aşamalar/ilk admin kullanıcısı seed edildi. Bağlantı dizesi `.env` içinde (repoya commit edilmez).
  - Admin girişi: `admin@gesteknik.com` / `GesTeknik2026!` — **ilk fırsatta değiştirilmeli.**
- [x] **GitHub reposu** — https://github.com/Luyome/GES-Teknik push edildi, `main` branch.

- [x] **Vercel projesi** — `Luyome/GES-Teknik` reposu Vercel'e (Laeroth takımı) bağlandı, `DATABASE_URL` ve `AUTH_SECRET` environment variable olarak tanımlandı, ilk deployment yapıldı ve gerçek Neon veritabanına karşı giriş test edildi.
  - Canlı URL: https://ges-teknik.vercel.app
  - `main` branch'e her push otomatik olarak yeni bir production deployment tetikler.

- [x] **Gerçek veri sorguları** — Dashboard, Kayıtlar, Kayıt Detayı, Ayarlar artık mock veri değil, `src/lib/data/tickets.ts` üzerinden gerçek Prisma/Neon sorguları kullanıyor.
- [x] **Yeni Kayıt akışı** — `/tickets/create` formu, `/api/tickets` Route Handler'ına POST atarak gerçek `Ticket` + ilk `StageHistory` kaydı oluşturuyor. Hem yerelde hem production'da (Vercel) uçtan uca test edildi.

Ayrıca tamamlananlar (Faz 2 — İş Akışı Motoru):
- [x] **Aşama geçiş motoru** — `/api/tickets/[id]/transitions` Route Handler'ı: Onay (sonraki aşamaya geçiş / son aşamaysa `COMPLETED`), Red-İade (önceki aşamaya dönüş, `ON_HOLD`), İptal (`CANCELLED`). Her geçişte açık `StageHistory` satırı kapatılır (`exitedAt`), yenisi açılır — audit trail tam işliyor. Yetki kontrolü: yalnızca `Stage.responsibleRole`'e sahip kullanıcı veya `ADMIN` işlem yapabilir (`src/app/tickets/[id]/StageActions.tsx`).
- [x] **Ayarlar → Aşama yönetimi** — ADMIN, `/api/stages` üzerinden yeni aşama ekleyebilir, sırasını (yukarı/aşağı) değiştirebilir, aktif/pasif yapabilir.
- [x] **Kullanıcı yönetimi** — `/settings/users` (ADMIN): kullanıcı oluşturma, rol atama, aktif/pasif.
- [x] **Şifre değiştirme** — `/settings/profile`: oturum sahibi kendi şifresini değiştirebilir. **İlk admin şifresi (`GesTeknik2026!`) ilk girişte buradan değiştirilmeli.**
- [x] Ticket kodu üretimindeki (`GES-YYYY-NNNN`) race condition, `prisma.$transaction` + unique-conflict retry ile giderildi (`src/app/api/tickets/route.ts`).

Ayrıca tamamlananlar (Faz 3 — Dashboard ve Raporlama):
- [x] **Raporlar sayfası** (`src/app/reports/`) — tarih aralığı/aşama/durum filtreleri, özet sayaçlar, aşama bazlı ortalama/maksimum süre analizi ve darboğaz (bottleneck) rozeti (`src/lib/data/reports.ts`).
- [x] **CSV dışa aktarma** — `/api/reports/export` (aynı filtrelerle, Excel'de doğrudan açılabilir UTF-8 BOM'lu CSV).

Ayrıca tamamlananlar (Faz 4 — Mobil UX Cilası):
- [x] Uygulama içi toast bildirimleri (`src/components/ui/Toast.tsx`) — aşama işlemleri ve şifre değişikliğinde "işlem başarılı" geri bildirimi.
- [x] Sayfa geçişlerinde iskelet (skeleton) yükleme durumları (`loading.tsx` — dashboard/tickets/reports).

Faz 5 — IIS'e Yerel Kurulum (hazırlık tamamlandı, fiili kurulum bekliyor):
- [x] `deploy/web.config` (ARR reverse-proxy config), `deploy/setup-iis.ps1` (IIS/ARR kurulum + servis kaydı scripti), `deploy/README.md` (adım adım talimat) repoya eklendi.
- [ ] **Fiili IIS kurulumu kullanıcı tarafından yapılmalı** — bu geliştirme makinesinde IIS kurulu değil (`W3SVC` servisi yok, `C:\inetpub\wwwroot` yok) ve kurulumu Yönetici yetkisi gerektiriyor; Claude'un çalıştığı shell admin değil. Bkz. `deploy/README.md`.

Yapılacaklar:
- [ ] Faz 5'in fiili IIS kurulumu (kullanıcı, admin PowerShell ile `deploy/setup-iis.ps1` çalıştıracak).
- [ ] PDF export (şu an sadece CSV var — talep gelirse eklenecek).
- [ ] Attachment (fotoğraf/dosya) yükleme UI'ı — şema hazır (`Attachment` modeli), UI bağlanmadı.
- [ ] Part/PartUsage (parça-stok) UI'ı — şema hazır, kapsam dışı bırakıldı (PROJECT.md Bölüm 11'de açık soru).

### Kurulum sırasında öğrenilen önemli teknik notlar
- **Next.js 16**: `middleware.js` kaldırıldı, yerine **`proxy.js`** geldi (davranış aynı, sadece isim değişti). Proje `src/proxy.ts` kullanıyor.
- **Prisma 7**: Yeni nesil `"prisma-client"` generator (ESM, çıktı `src/generated/prisma`) ve **driver adapter zorunluluğu** var (artık gömülü query engine yerine `@prisma/adapter-neon` gibi bir adapter ile bağlanılıyor). Ayrıca `prisma.config.ts` dosyası `package.json`'daki eski `prisma` alanının yerini aldı.
- **Auth.js (next-auth v5)**: Edge Runtime'da çalışan `proxy.ts`, Prisma/Node API'si içeremediği için config ikiye bölündü: `src/auth.config.ts` (edge-uyumlu, sağlayıcısız) ve `src/auth.ts` (Node runtime, Credentials + Prisma).
- **Kayıt oluşturma neden bir Route Handler (`/api/tickets`), Server Action değil**: `/tickets/create` formu bilinçli olarak `fetch("/api/tickets")` kullanıyor, `"use server"` action değil. Sebep bir framework kısıtı değildi — uzun bir hata ayıklama sürecinde asıl neden şu çıktı: `AppShell`'deki "Çıkış Yap" butonu da bir `<form><button type="submit">` içeriyor ve sayfada DOM sırasına göre kayıt formundan ÖNCE geliyor; tarayıcıda `document.querySelector('button[type="submit"]')` ile yapılan otomasyon testleri yanlışlıkla hep çıkış butonuna tıklıyordu, bu da "her form gönderiminde /login'e düşme" yanılsaması yarattı. Route Handler'a geçiş gereksizdi ama zararsız ve sağlam bir mimari, olduğu gibi bırakıldı. **Ders:** birden fazla `<form>`/submit butonu olan sayfalarda otomasyon testlerinde her zaman en yakın forma scope'lanmış seçici kullanın (`el.closest('form').querySelector(...)`), sayfa genelinde `querySelector('button[type="submit"]')` kullanmayın.

---

## 1. Proje Özeti

- **Proje adı:** GES Teknik
- **Sektör referansı:** [gesteknik.com](https://gesteknik.com/) — güneş enerjisi sistemleri (GES) teknik servis/bakım sektörü.
- **Amaç:** Bir teknik servis yönetim uygulaması. Servise giren bir ürün/parça/varlığın, tanımlı iş akışı aşamalarından geçerek sonuçlandırılmasını yönetir.
- **Kritik iş değeri:** Yönetimin, sisteme giren her kaydın **o anda hangi aşamada olduğunu canlı izleyebilmesi** ve giriş-çıkış arasındaki tüm süreci **raporlayabilmesi**. Bu, projenin en önemli gereksinimidir — dashboard ve raporlama modülleri buna göre tasarlanacak.

---

## 2. İş Akışı (Workflow) Modeli

Sistemin kalbi, bir kaydın (ürün/parça/cihaz) girişten çıkışa kadar geçtiği **aşama (stage) zinciridir**. Her aşamayı belirli bir rol/kullanıcı kontrol eder ve bir sonraki aşamaya onay/red/iade ile geçiş sağlar.

### Örnek aşama zinciri (başlangıç taslağı — netleştirilecek)
1. **Kayıt / Giriş** — Ürün sisteme kaydedilir (müşteri bilgisi, ürün bilgisi, giriş nedeni/arıza tanımı, giriş tarihi, opsiyonel fotoğraf).
2. **Ön İnceleme** — İlk teknik değerlendirme, önceliklendirme, ilgili teknisyene/departmana atama.
3. **Teknik Değerlendirme / Arıza Tespiti** — Detaylı analiz, gereken parça/işlem belirlenir.
4. **Onarım / İşlem** — Fiili müdahale, kullanılan parçalar ve yapılan işlemler kaydedilir.
5. **Kalite Kontrol** — Yapılan işin doğrulanması, testten geçirilmesi.
6. **Teslim / Çıkış** — Müşteriye teslim, çıkış kaydı, kapanış.

### Aşama kuralları
- Her aşamanın bir **sorumlu rolü** ve opsiyonel olarak bir **sorumlu kişisi** vardır.
- Bir aşama şu sonuçlardan biriyle kapanır: **Onay (sonraki aşamaya geçiş)**, **Red/İade (önceki aşamaya geri dönüş)**, **İptal**.
- Her aşama geçişinde **zaman damgası, kullanıcı, not** otomatik loglanır (audit trail).
- Aşama süreleri ölçülür (SLA/darboğaz tespiti için).
- Aşama zinciri **parametrik/yapılandırılabilir** olmalı (ileride yeni aşama eklenebilmeli — sabit kod değil, veri odaklı tasarım).

> **Not:** Yukarıdaki aşama isimleri başlangıç varsayımıdır, gerçek saha süreciyle birlikte netleştirilecektir (bkz. Bölüm 11).

---

## 3. Roller ve Yetkilendirme

| Rol | Yetki Özeti |
|---|---|
| **Admin / Yönetici** | Tüm kayıtları görür, tüm raporlara erişir, kullanıcı/rol yönetimi yapar, iş akışı tanımlarını düzenler. |
| **Servis Sorumlusu** | Kayıt oluşturur, aşama atamalarını yapar, genel süreci yönetir. |
| **Teknisyen** | Kendisine atanan kayıtlarda işlem yapar, aşama günceller, not/parça girer. |
| **Kalite Kontrol** | Tamamlanan işleri denetler, onay/red verir. |
| **Müşteri / Görüntüleyici (opsiyonel)** | Sadece kendi kaydının durumunu görüntüleyebilir (salt okunur, ileride eklenebilir). |

> Rol isimleri ve yetki matrisi saha süreciyle birlikte kesinleştirilecek.

---

## 4. İzleme ve Raporlama Gereksinimleri

Bu bölüm projenin en kritik gereksinimidir.

- **Canlı Durum Panosu (Dashboard):** Tüm aktif kayıtların hangi aşamada olduğunu gösteren gerçek zamanlıya yakın görünüm (kanban tarzı aşama sütunları önerilir).
- **Kayıt Zaman Çizelgesi (Timeline):** Her kayıt için giriş anından itibaren tüm aşama geçişlerinin, kim tarafından, ne zaman yapıldığının kronolojik görünümü.
- **Aşama Bazlı Süre Metrikleri:** Her aşamada ortalama/maksimum bekleme süresi, darboğaz (bottleneck) tespiti.
- **Filtreleme / Arama:** Tarih aralığı, müşteri, ürün tipi, aşama, sorumlu kişi, durum bazlı filtreleme.
- **Raporlama:** Belirli dönem için tamamlanan/bekleyen/geciken kayıt raporları; dışa aktarma (PDF/Excel).
- **Bildirimler (ileride):** Aşama geçişlerinde ilgili kullanıcıya bildirim (e-posta/uygulama içi).

---

## 5. Veri Modeli Taslağı

Ana varlıklar (Prisma şeması bu taslağa göre detaylandırılacak):

- **User** — id, ad, email, rol, şifre (hash), durum.
- **Role** — id, ad, yetki listesi.
- **Customer** — id, ad, iletişim bilgileri.
- **Item / Ticket (Servis Kaydı)** — id, müşteri, ürün bilgisi, giriş tarihi, çıkış tarihi, mevcut aşama, durum, öncelik.
- **Stage (Aşama Tanımı)** — id, ad, sıra no, sorumlu rol, yapılandırılabilir.
- **StageHistory / Log** — id, ticketId, stageId, kullanıcı, giriş zamanı, çıkış zamanı, sonuç (onay/red/iptal), not.
- **Attachment / Note** — id, ticketId, dosya/metin, oluşturan kullanıcı, zaman.
- **Part (kullanılan parça, opsiyonel)** — id, ad, stok bilgisi, kullanılan ticket.

### İlişkiler (özet)
- Bir `Ticket`, bir `Customer`'a aittir, çok sayıda `StageHistory` kaydına sahiptir.
- Bir `StageHistory`, bir `Stage`'e ve bir `User`'a referans verir.
- Bir `User`, bir `Role`'e sahiptir.

---

## 6. Ekran / Sayfa Listesi

- **Giriş (Login)**
- **Dashboard** — canlı aşama durumu, özet metrikler
- **Kayıt Listesi** — tüm servis kayıtları, filtrelenebilir tablo/kart görünümü
- **Kayıt Detayı** — zaman çizelgesi, mevcut aşama, işlem geçmişi, notlar/ekler
- **Yeni Kayıt Oluşturma**
- **Aşama İşlem Ekranı** — teknisyenin kendine atanan kaydı işlediği ekran
- **Raporlar** — süre analizleri, darboğaz raporları, dışa aktarma
- **Kullanıcı / Rol Yönetimi** (Admin)
- **Ayarlar** — iş akışı aşama tanımları, genel sistem ayarları

### Mobil öncelikli ekranlar
- Dashboard (özet kartlar)
- Kayıt Listesi (kart görünümü, hızlı filtre)
- Kayıt Detayı (zaman çizelgesi)
- Aşama İşlem Ekranı (teknisyen sahada hızlı güncelleme yapabilmeli)

---

## 7. Tasarım Dili

### Apple Human Interface Guidelines (HIG) prensipleri
- **Netlik (Clarity):** Sade tipografi (SF Pro benzeri sistem fontu — web'de `-apple-system` / Inter), yeterli boşluk, gereksiz süslemeden kaçınma.
- **Derinlik (Depth):** Katmanlı arayüz, ince gölgeler, blur/vibrancy efektleri (modallar, alt menüler için).
- **Hiyerarşi:** Net başlık/alt başlık ayrımı, boyut ve renk kontrastıyla önem sırası.
- **Sistem Renkleri:** Apple'ın semantik renk yaklaşımı (başarı=yeşil, uyarı=turuncu, hata=kırmızı, bilgi=mavi) — durum rozetlerinde tutarlı kullanım.
- **Karanlık Mod:** Baştan itibaren light/dark tema desteği.
- **Native-hissi bileşenler:** Yuvarlatılmış köşeler, büyük dokunma alanları, minimal ama anlamlı animasyon/geçişler (ör. aşama değişiminde yumuşak transition).

### Mobil UX (banka uygulaması referansı)
- **Alt tab navigasyon** (Dashboard / Kayıtlar / Raporlar / Profil gibi).
- **Büyük, net dokunma hedefleri** (özellikle saha teknisyeni eldiven/hızlı kullanım senaryosu düşünülerek).
- **Net durum rozetleri ve renk kodlaması** (banka uygulamalarındaki işlem durumu göstergeleri gibi: "Beklemede", "İşlemde", "Tamamlandı", "Reddedildi").
- **Kaydırılabilir kartlar / hızlı aksiyonlar** (swipe-to-action).
- **Anlık geri bildirim** — işlem sonrası net onay/hata mesajları, banka uygulamalarındaki "işlem başarılı" ekranlarına benzer netlikte.
- **Biyometrik/hızlı giriş hissi** (ileride Face ID/Touch ID benzeri WebAuthn desteği değerlendirilebilir).

---

## 8. Teknoloji Yığını

| Katman | Teknoloji |
|---|---|
| Framework | **Next.js (App Router)** + TypeScript |
| ORM | **Prisma** |
| Veritabanı | **PostgreSQL (Neon — bulut)** |
| UI/Styling | **Tailwind CSS** (Apple-vari tasarım sistemi component kütüphanesi ile) |
| Kimlik Doğrulama | Auth.js (NextAuth) veya benzeri — rol bazlı yetkilendirme (RBAC) |
| Barındırma (ara ortam) | **Vercel** |
| Kaynak kod | **GitHub** |
| Nihai barındırma | **Yerel sunucu + IIS** |

---

## 9. Geliştirme ve Yayınlama Süreci (Environment Pipeline)

Proje şu akışla ilerleyecek:

1. **GitHub (asıl kaynak):** Tüm kod GitHub reposunda tutulur, tüm geliştirme buradan yönetilir.
2. **Vercel (ara/test ortamı):** GitHub'a yapılan push'lar otomatik olarak Vercel'e deploy edilir. Geliştirme ve test süreci boyunca canlı önizleme/staging ortamı olarak kullanılır.
3. **Neon (veritabanı):** Bulut PostgreSQL veritabanı olarak Neon kullanılır. Hem Vercel ortamı hem de ileride IIS ortamı bu veritabanına bağlanır (aynı veritabanı, farklı barındırma).
4. **IIS (nihai hedef — proje SONUNDA yapılacak):** Proje geliştirme ve test süreci tamamlandıktan sonra, kullanıcının yerel Windows sunucusuna kurulacak ve **IIS** üzerinden yayınlanacaktır.
   - Next.js uygulamasının IIS altında çalıştırılması için seçenekler: `iisnode` ile Node process'i IIS'e bağlamak veya IIS'i **reverse proxy (ARR - Application Request Routing)** olarak kullanıp arka planda `next start` ile çalışan Node process'e yönlendirmek.
   - Bu aşamada bir `web.config` dosyası ve IIS modül kurulumları (URL Rewrite, ARR, iisnode) gerekecek.
   - **Bu adım, proje geliştirmesinin SON fazında ele alınacaktır** — geliştirme sürecinde bu detaylara takılınmayacak, ama kod IIS'e taşınabilir şekilde (ör. ortam değişkenleri ile yapılandırılabilir, dosya sistemi bağımlılığı olmayan) yazılacaktır.

---

## 10. Yol Haritası (Faz Planı)

- **Faz 1 — Temel İskelet:** ✅ Tamamlandı. Next.js + Prisma + Neon bağlantısı, temel veri modeli, kimlik doğrulama, rol yapısı.
- **Faz 2 — İş Akışı Motoru:** ✅ Tamamlandı. Aşama tanımları, aşama geçiş mantığı, StageHistory loglama, kullanıcı yönetimi.
- **Faz 3 — Dashboard ve Raporlama:** ✅ Tamamlandı. Canlı durum panosu, zaman çizelgesi, süre metrikleri, raporlar, CSV export.
- **Faz 4 — Mobil UX Cilası:** ✅ Tamamlandı (temel kapsam). Toast bildirimleri, skeleton yükleme durumları; HIG token'ları Faz 1'den beri mevcuttu.
- **Faz 5 — IIS'e Yerel Kurulum:** 🟡 Hazırlık tamamlandı (`deploy/`), fiili kurulum kullanıcıyı bekliyor — admin yetkisi gerektiriyor, bkz. `deploy/README.md`.

---

## 11. Açık Sorular / Netleştirilecek Noktalar

Bu bölüm, ilerledikçe cevaplanacak ve güncellenecek açık maddeleri takip eder:

- [ ] Gerçek aşama isimleri ve sayısı saha sürecine göre netleştirilecek (Bölüm 2'deki taslak varsayımdır).
- [ ] Rol isimleri ve tam yetki matrisi kesinleştirilecek (Bölüm 3).
- [ ] Bildirim ihtiyacı var mı (e-posta/SMS/push)?
- [ ] Çoklu şube/lokasyon desteği gerekiyor mu?
- [ ] Müşteri portalı (dış kullanıcıların kendi kaydını görebilmesi) kapsamda mı?
- [ ] Parça/stok takibi ne kadar detaylı olacak?
- [ ] IIS sunucusunun işletim sistemi/versiyonu ve mevcut Node.js kurulumu var mı?

---

## Notlar
- Bu doküman, proje ilerledikçe güncellenecek canlı bir referanstır.
- Geliştirme bu dosyaya göre yönlendirilecek; yeni kararlar burada ilgili bölüme eklenmelidir.
