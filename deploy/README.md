# GES Teknik — IIS'e Yerel Kurulum (Faz 5)

Bu klasördeki dosyalar, PROJECT.md Bölüm 9/10'da tanımlanan **Faz 5 (IIS'e
Yerel Kurulum)** için hazırlanmıştır. Geliştirme ortamında (bu makinede)
IIS kurulu değil ve kurulumu Yönetici (admin) yetkisi gerektirdiğinden,
bu adımlar **otomatik çalıştırılmamıştır** — aşağıdaki adımları hedef
Windows sunucusunda siz uygulayacaksınız.

## Ön koşullar

- Windows Server (veya IIS destekleyen Windows 10/11 Pro+) — Yönetici erişimi.
- Node.js kurulu (bu geliştirme makinesinde `node -v` → `v24.18.1`, hedef
  sunucuda en az Node 20+ önerilir, `package.json` motor kısıtı yok ama
  Next.js 16 + React 19 güncel bir Node sürümü ister).
- İnternet erişimi (URL Rewrite / ARR modül indirmeleri için).
- Neon veritabanına (`DATABASE_URL`) ağ erişimi.

## Adımlar

1. **Kodu sunucuya getirin:**
   ```powershell
   git clone https://github.com/Luyome/GES-Teknik.git C:\GesTeknik
   cd C:\GesTeknik
   npm install
   ```

2. **`.env.production` dosyasını oluşturun** (repoya commit edilmez):
   ```
   DATABASE_URL=<Neon bağlantı dizesi>
   AUTH_SECRET=<openssl rand -base64 32 ile üretilen değer>
   ```

3. **Uygulamayı derleyin:**
   ```powershell
   npm run build
   ```

4. **URL Rewrite ve ARR modüllerini kurun** (elle, GUI kurulumu):
   - URL Rewrite: https://www.iis.net/downloads/microsoft/url-rewrite
   - ARR: https://www.iis.net/downloads/microsoft/application-request-routing
   - (İsteğe bağlı ama önerilir) NSSM: https://nssm.cc/download — `next
     start` process'ini bir Windows servisi olarak arka planda çalışır
     tutmak için. `C:\nssm\nssm.exe` altına çıkarın veya `setup-iis.ps1`
     çağrısında `-NssmPath` ile farklı bir yol verin.

5. **Kurulum scriptini Yönetici olarak çalıştırın:**
   ```powershell
   cd C:\GesTeknik\deploy
   .\setup-iis.ps1
   ```
   Script: IIS Web Sunucusu rolünü açar, ARR proxy'yi etkinleştirir, bir
   IIS sitesi oluşturur, `web.config`'i proje köküne kopyalar ve (NSSM
   varsa) `next start`'ı bir Windows servisi olarak kaydeder.

6. **Doğrulama:** `http://localhost` (veya sunucunun adı/IP'si) adresini
   tarayıcıda açın, giriş yapıp bir kayıt oluşturup aşama ilerletin.

## Mimari notu

`web.config`, iisnode YERİNE ARR reverse-proxy kullanır: IIS, 80/443
isteklerini `next start`'ın dinlediği yerel porta (`127.0.0.1:3000`)
yönlendirir. Bu, Next.js App Router + WebSocket tabanlı Neon adapter'ının
iisnode ile yaşayabileceği uyumluluk sürtünmesini önler. `src/lib/prisma.ts`
zaten bu ortamda (uzun ömürlü tek Node process) sorunsuz çalışacak şekilde
tasarlandı (bkz. dosya içindeki yorum).
