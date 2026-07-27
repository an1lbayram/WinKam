# 🧹 WinKam - Windows System Optimizer & Cleaner

![Python](https://img.shields.io/badge/Python-3.8%2B-blue?logo=python)
![Electron](https://img.shields.io/badge/Electron-Latest-47848F?logo=electron)
![React](https://img.shields.io/badge/React-18-blue?logo=react)
![License](https://img.shields.io/badge/License-MIT-green)

> **"Windows sisteminizi tek tıkla arındırın. Güvenli, şeffaf, etkili."**

WinKam, Windows işletim sisteminizdeki gereksiz geçici dosyaları temizleyen, sistemi optimize eden, ağ (Winsock/DNS) ve sistem dosyalarını (SFC scannow) onaran ve sistem imaj yedeği almanızı sağlayan açık kaynaklı bir araçtır. **Python CLI** çekirdeği ve **Electron + React** grafik arayüzü sunar.

🌐 *Read this in [English](README_en.md).*

---

## ✨ Özellikler

- 🛡️ **Güvenli Temizlik:** Sistem için kritik olan kayıt defteri veya sistem dosyalarını silmez; whitelist mantığıyla çalışır.
- ⚡ **İnteraktif Modlar:**
  - **dry-run:** Hiçbir dosya silmeden hedefleri listeler (admin gerekmez).
  - **safe:** Kullanıcı Temp, tarayıcı önbelleği ve Geri Dönüşüm Kutusu gibi düşük riskli alanları temizler.
  - **advanced:** Windows Temp, Windows Update önbelleği ve Yazıcı Spooler gibi derin sistem alanlarını temizler.
- 📝 **Şeffaf Loglama:** Yapılan tüm işlemler `/logs` klasörüne zaman damgasıyla kaydedilir.
- 🌐 **Ağ & Sistem Onarımı:** DNS temizleme, Winsock sıfırlama ve SFC çekirdek dosya onarımı.
- 💾 **Sistem Yedekleme:** Harici disklere Windows güvenli imaj yedeği alma.
- 🖥️ **Canlı Loglu GUI (Electron + React):** İşlem durumunu, yetki Seviyesini ve canlı terminal çıktılarını web/masaüstü ekranında izleme.

---

## 💻 Sistem Gereksinimleri

1. **Windows 10 veya Windows 11**
2. **Python** (v3.8 veya üzeri): [Python İndir](https://www.python.org/) *(CLI için)*
3. **Node.js** (v18.0.0 veya üzeri): [Node.js İndir](https://nodejs.org/) *(Arayüz için)*
4. **Git**: [Git İndir](https://git-scm.com/)
5. **Yönetici Yetkisi:** `safe`/`advanced` temizlik ve onarım için PowerShell/CMD yönetici olarak açılmalıdır.

---

## 🚀 Kurulum ve Çalıştırma

### ⚡ Tek Satırda Kurulum ve Çalıştırma (Hızlı Başlangıç)

#### 🐍 Python CLI Modu (Tek Satır):
PowerShell'i **Yönetici Olarak** açıp aşağıdaki komutu çalıştırın:
```powershell
git clone https://github.com/an1lbayram/WinKam.git; cd WinKam; python -m pip install -e .; winkam clean --mode dry-run
```

#### 🖥️ Electron Arayüz Modu (Tek Satır):
```bash
git clone https://github.com/an1lbayram/WinKam.git && cd WinKam/ui && npm install && npm run electron:dev
```

---

### 📋 Adım Adım Kurulum (Hiç Bilmeyenler İçin)

#### 1️⃣ Terminal / Komut Satırını Yönetici Olarak Açın
- Başlat menüsüne `PowerShell` yazın.
- Sağ tıklayıp **"Yönetici olarak çalıştır"** (Run as Administrator) deyin.

#### 2️⃣ Repoyu Klonlayın
```bash
git clone https://github.com/an1lbayram/WinKam.git
```

#### 3️⃣ Proje Klasörüne Geçin
```bash
cd WinKam
```

#### 4️⃣ A) Python CLI ile Çalıştırma
1. **Modülü Yükleyin:**
   ```bash
   python -m pip install -e .
   ```
2. **Önizleme Yapın (Dosya Silmez):**
   ```bash
   winkam clean --mode dry-run
   ```
3. **Güvenli Temizlik Yapın:**
   ```bash
   winkam clean --mode safe
   ```

#### 4️⃣ B) Görsel Masaüstü Arayüzü (Electron) ile Çalıştırma
1. **`ui` Klasörüne Geçin:**
   ```bash
   cd ui
   ```
2. **Paketleri Yükleyin:**
   ```bash
   npm install
   ```
3. **Masaüstü Uygulamasını Başlatın:**
   ```bash
   npm run electron:dev
   ```

---

## 🛠️ Diğer CLI Komutları

| Komut | Açıklama |
|---|---|
| `winkam clean --mode dry-run` | Silinecek alanları güvenle simüle eder. |
| `winkam clean --mode safe` | Güvenli temizlik modunu çalıştırır. |
| `winkam clean --mode advanced` | Derin sistem temizliği gerçekleştirir. |
| `winkam repair` | Sistem dosyalarını onarır (SFC scannow). |
| `winkam network` | DNS temizler ve Winsock sıfırlar. |
| `winkam backup --target D` | D sürücüsüne sistem yedeği alır. |

---

## 🔒 Güvenlik Notu

- **Silme İşlemleri:** `safe` ve `advanced` modları dosya siler. Gerçek işlem yapmadan önce daima `dry-run` modunda test edin.
- **Whitelist Kontrolü:** Temizlenecek klasör hedefleri `config/config.ini` dosyası üzerinden kontrol edilir.

---

## 📂 Proje Yapısı

```text
WinKam/
├── py-src/winkam/            # Python CLI kaynak kodları
├── config/config.ini         # Temizlik hedefleri ve kuralları
├── logs/                     # Zaman damgalı çalışma logları
├── ui/                       # Electron + React görsel arayüz
│   ├── src/                  # React bileşenleri
│   └── package.json          # Electron & UI bağımlılıkları
├── README.md
└── LICENSE
```

---

## 📄 Lisans

Bu proje [MIT Lisansı](LICENSE) ile lisanslanmıştır.

**Geliştirici:** [Anıl Bayram](https://github.com/an1lbayram)
