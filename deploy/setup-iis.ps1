#Requires -RunAsAdministrator
<#
  GES Teknik — IIS kurulum scripti (PROJECT.md Bölüm 9/10, Faz 5).

  BU SCRIPT SADECE HAZIRLIK AMAÇLIDIR VE OTOMATİK ÇALIŞTIRILMAMIŞTIR.
  Bu ortamda (geliştirme makinesi) admin yetkisi yok ve IIS kurulu değil;
  bu yüzden Claude bu scripti fiilen çalıştıramadı. Kullanıcı, hedef
  Windows sunucusunda PowerShell'i "Yönetici olarak çalıştır" ile açıp
  bu scripti elle çalıştırmalıdır:

      cd C:\GesTeknik\deploy
      .\setup-iis.ps1

  Script şunları yapar:
  1. IIS Web Sunucusu rolünü ve gerekli alt özellikleri etkinleştirir.
  2. URL Rewrite ve ARR (Application Request Routing) modüllerini kurar
     (web indirmesi gerektirir — internet erişimi olmalı).
  3. ARR'de proxy'yi etkinleştirir.
  4. IIS'te "GesTeknik" adında bir site oluşturur (80. port, fiziksel yol
     bu scriptin bulunduğu üst dizin — yani proje kökü).
  5. `deploy\web.config` dosyasını proje köküne kopyalar.
  6. NSSM (Non-Sucking Service Manager) ile `next start`'ı bir Windows
     servisi olarak kaydeder (proje kökünde `npm run build` çalıştırılmış
     olmalı, `.env.production` doldurulmuş olmalı — bkz. deploy/README.md).
#>

param(
  [string]$SiteName = "GesTeknik",
  [int]$Port = 80,
  [int]$NodePort = 3000,
  [string]$ProjectRoot = (Resolve-Path "$PSScriptRoot\.."),
  [string]$NssmPath = "C:\nssm\nssm.exe"
)

$ErrorActionPreference = "Stop"

Write-Host "== 1/6: IIS Web Sunucusu rolü kuruluyor ==" -ForegroundColor Cyan
Install-WindowsFeature -Name Web-Server, Web-Common-Http, Web-Static-Content, `
  Web-Http-Redirect, Web-Health, Web-Http-Logging, Web-Security, `
  Web-Filtering, Web-App-Dev, Web-Net-Ext45, Web-Mgmt-Console `
  -IncludeManagementTools

Write-Host "== 2/6: URL Rewrite modülü kontrol ediliyor ==" -ForegroundColor Cyan
$urlRewriteInstalled = Get-ItemProperty "HKLM:\SOFTWARE\Microsoft\IIS Extensions\URL Rewrite" -ErrorAction SilentlyContinue
if (-not $urlRewriteInstalled) {
  Write-Warning "URL Rewrite modülü kurulu değil. Elle indirip kurun: https://www.iis.net/downloads/microsoft/url-rewrite"
  Write-Warning "Kurulumdan sonra bu scripti tekrar çalıştırın."
  exit 1
}

Write-Host "== 3/6: ARR (Application Request Routing) kontrol ediliyor ==" -ForegroundColor Cyan
$arrInstalled = Test-Path "$env:ProgramFiles\IIS\Requestrouter\requestrouter.dll"
if (-not $arrInstalled) {
  Write-Warning "ARR kurulu değil. Elle indirip kurun: https://www.iis.net/downloads/microsoft/application-request-routing"
  Write-Warning "Kurulumdan sonra bu scripti tekrar çalıştırın."
  exit 1
}

Write-Host "== 4/6: ARR proxy etkinleştiriliyor ==" -ForegroundColor Cyan
Import-Module WebAdministration
Set-WebConfigurationProperty -pspath "MACHINE/WEBROOT/APPHOST" `
  -filter "system.webServer/proxy" -name "enabled" -value "True"

Write-Host "== 5/6: IIS sitesi oluşturuluyor ($SiteName, port $Port) ==" -ForegroundColor Cyan
if (-not (Test-Path "IIS:\Sites\$SiteName")) {
  New-Website -Name $SiteName -PhysicalPath $ProjectRoot -Port $Port
} else {
  Write-Host "Site zaten var, atlanıyor." -ForegroundColor Yellow
}
Copy-Item "$PSScriptRoot\web.config" "$ProjectRoot\web.config" -Force

Write-Host "== 6/6: 'next start' Windows servisi olarak kaydediliyor ==" -ForegroundColor Cyan
if (-not (Test-Path $NssmPath)) {
  Write-Warning "NSSM bulunamadı ($NssmPath). https://nssm.cc/download adresinden indirip yolu -NssmPath ile belirtin."
  Write-Warning "Servis kaydı atlandı — 'npm run start' işlemini elle/başka bir process manager ile çalışır durumda tutun."
} else {
  & $NssmPath install GesTeknikApp "$env:ProgramFiles\nodejs\npm.cmd" "run start"
  & $NssmPath set GesTeknikApp AppDirectory $ProjectRoot
  & $NssmPath set GesTeknikApp AppEnvironmentExtra "PORT=$NodePort"
  & $NssmPath start GesTeknikApp
}

Write-Host ""
Write-Host "Kurulum tamamlandı. Kontrol listesi:" -ForegroundColor Green
Write-Host " - $ProjectRoot\.env.production dosyasının DATABASE_URL ve AUTH_SECRET içerdiğinden emin olun."
Write-Host " - $ProjectRoot içinde 'npm run build' çalıştırılmış olmalı."
Write-Host " - http://localhost adresini tarayıcıda test edin."
