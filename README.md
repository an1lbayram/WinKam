# WinKam

_🌍 [Read in English](README_en.md)_

> **"Windows sisteminizi tek tıkla arındırın. Güvenli, şeffaf, etkili."**
> _(Purify your Windows system with a single click. Safe, transparent, effective.)_

WinKam, Windows işletim sisteminizdeki gereksiz dosyaları temizleyen, sistemi optimize eden ve olası ağ/sistem hatalarını onarmanıza yardımcı olan açık kaynaklı bir araçtır.

## 🌟 Özellikler / Features

- **🛡️ Güvenli İşlem:** Eski ve tehlikeli temizlik scriptlerinin aksine, WinKam sisteminiz için kritik olan dosyaları veya kayıt defteri girdilerini silmez.
- **⚡ Hızlı ve Derin Temizlik Menüsü:** Sadece ihtiyacınız olan temizliği yapmanızı sağlayan interaktif menü arayüzü.
- **📝 Detaylı Loglama:** Yapılan her işlem `/logs` klasörüne zaman damgasıyla (timestamp) kaydedilir. Hangi dosyaların silindiğini şeffafça görebilirsiniz.
- **🌐 Ağ Onarımı ve Sistem Taraması:** İnternet bağlantı sorunları için DNS temizleme /Winsock sıfırlama, bozulan çekirdek dosyalar için SFC scannow onarımı destekler.
- **💾 Sistem Yedekleme (Backup):** Harici bir disk takılıysa tek tıkla Windows'un güvenli imaj yedeğini alabilirsiniz.

## 💻 Sistem Gereksinimleri

- **İşletim Sistemi:** Windows 10 veya Windows 11
- **Python:** Minimum Python 3.8 ve üzeri (Sadece geliştirici / CLI kurulumu için)
- **Yetki:** `safe`/`advanced` temizlik, onarım ve yedekleme işlemleri "Yönetici (Administrator)" yetkisi gerektirir.

## 🚀 Kurulum & Kullanım / Installation & Usage

### Python CLI (önerilen)

## ⚡ Hızlı başlangıç (3 komut)

```bash
python -m pip install -e .
winkam clean --mode dry-run
winkam clean --mode safe
```

## 🔒 Güvenlik notu

- **Bu araç dosya siler ve bazı komutları yönetici olarak çalıştırır.** Yanlış kullanım geri alınamaz sonuçlar doğurabilir.
- **Önce `dry-run` çalıştırın**: Neyi hedeflediğini görüp ondan sonra `safe/advanced` moduna geçin.
- **`safe` vs `advanced`**:
  - **safe**: kullanıcı temp + tarayıcı cache + geri dönüşüm kutusu gibi daha düşük riskli alanları hedefler.
  - **advanced**: Windows Temp / Windows Update cache / yazıcı spooler gibi daha “sistem” alanlarına da dokunur (risk daha yüksek).
- **Yönetici yetkisi**: `dry-run` hariç işlemler için yönetici yetkisi gerekir.
- **Whitelist prensibi**: Temizlik hedefleri `config/config.ini` üzerinden belirlenir; paylaşmadan önce bu dosyayı kontrol edin.

1. **Projeyi indirin**
2. **Kurulum (önerilen)**:

```bash
python -m pip install -e .
```

> Not: `pip` çıktıdaki uyarıda belirttiği `...Python\\...\\Scripts` klasörü PATH’te değilse `winkam` komutu bulunamayabilir. Bu durumda `python -m winkam.cli ...` ile çalıştırabilir veya PATH’e ekleyebilirsiniz.

3. **Komut satırını yönetici olarak açın** (PowerShell/Terminal -> “Yönetici olarak çalıştır”)
4. **Dry-run (admin gerekmez)**:

```bash
winkam clean --mode dry-run
```

5. **Safe temizlik (admin gerekir)**:

```bash
winkam clean --mode safe
```

6. **Diğer komutlar**:

```bash
winkam repair
winkam network
winkam backup --target D
```

Kurulum yapmadan çalıştırmak isterseniz (dev modu):

```bash
python -c "import sys; sys.path.insert(0,'py-src'); from winkam.cli import main; main(['clean','--mode','dry-run'])"
```

> Not: Bu repo artık Python CLI + Electron UI odaklıdır. Batch (legacy) kaldırılmıştır.

## 🖥️ UI (JavaScript) - Profesyonel Arayüz

UI projesi `ui/` klasöründedir (Vite + React).

### UI modları (çok önemli)

- **Web (simülasyon)**: `npm run dev`
  - Tarayıcıda çalışır.
  - **Gerçek temizlik/onarım komutlarını çalıştırmaz**, sadece UI akışını göstermek için mock üretir.
- **Electron (gerçek çalıştırma)**: `npm run electron:dev` veya `npm run electron:only`
  - Electron uygulaması açılır.
  - Butonlar **gerçekten** `python -m winkam.cli ...` komutlarını çalıştırır ve çıktıyı canlı akıtır.

```bash
cd ui
npm install
npm run dev
```

Electron (gerçek `winkam` çalıştırma + canlı log):

```bash
cd ui
npm install
npm run electron:dev
```

Sadece Electron (build edilmiş UI ile):

```bash
cd ui
npm install
npm run build
npm run electron:only
```

Prod build:

```bash
cd ui
npm run build
```

> Not: Electron’da “Durum” kartında `UA: Electron • Bridge: OK • Ping: OK` görmelisiniz. `UA: Web` görüyorsanız tarayıcıdasınız ve simülasyondur.

### UI özellikleri

- **Canlı çıktı**: Komut çıktıları UI’da anlık akar (stdout/stderr).
- **Yönetici durumu**: Durum kartında “Yetki: Yönetici/Standart” görünür.
- **Log görüntüleme**: UI’daki **Loglar** sayfasından `logs/` içeriği listelenip okunabilir.

### 📦 Dağıtım ve Executable (.exe) Yapımı

Python sürümünü tek dosya exe yapmak için en pratik yöntem **PyInstaller**’dır:

```bash
pip install pyinstaller
pyinstaller --onefile --name WinKam --paths py-src -m winkam.cli
```

### 🧱 Windows installer (UI)

UI için NSIS installer üretimi (Electron):

```bash
cd ui
npm install
npm run dist:win
```

Çıktı `ui/release/` altına gelir.

> Not: Installer artık **embeddable Python** ile birlikte gelir; sistemde Python kurulu olmasa da çalışır. (Build sırasında Python `vendor/` altına indirilir.)

## 🛠️ Sık Karşılaşılan Hatalar (Troubleshooting)

- **`winkam` komutu bulunamadı:** Python'un `Scripts` dizini PATH değişkenine eklenmemiş olabilir. Alternatif olarak `python -m winkam.cli ...` ile başlatabilirsiniz.
- **"Erişim Engellendi (Access Denied)" Hataları:** Uygulamayı veya komut satırını yönetici yetkileriyle başlatmadığınız durumlarda bu hata oluşur.
- **Electron hep "Web" modunda açılıyor:** Gerçek komutların çalışması için tarayıcıda (`npm run dev`) değil, Electron köprüsüyle (`npm run electron:dev`) açmalısınız.
- **Yedekleme Hatası:** Belirttiğiniz hedef sürücü harfinin geçerli ve takılı bir diske (C dışında) işaret ettiğinden emin olun.

## 📂 Klasör Yapısı / Directory Structure

```text
/WinKam
│── /py-src
│   └── /winkam              # Python kaynak kodu (CLI)
│── /config
│   └── config.ini           # Temizlik hedefleri ve ayarlar
│── /logs                    # Çalışma logları (gitignore)
│── /assets                  # Logo ve ekran görüntüleri
│── /ui                      # Electron + React UI
│── README.md
│── LICENSE
```

## 📜 Lisans / License

Bu proje **MIT License** altında lisanslanmıştır. Daha fazla bilgi için [LICENSE](LICENSE) dosyasına göz atabilirsiniz.
İstediğiniz gibi kopyalayabilir, değiştirebilir ve kendi projelerinizde kullanabilirsiniz.
