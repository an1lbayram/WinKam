# 🧹 WinKam - Windows System Optimizer & Cleaner

![Python](https://img.shields.io/badge/Python-3.8%2B-blue?logo=python)
![Electron](https://img.shields.io/badge/Electron-Latest-47848F?logo=electron)
![React](https://img.shields.io/badge/React-18-blue?logo=react)
![License](https://img.shields.io/badge/License-MIT-green)

> **"Purify your Windows system with a single click. Safe, transparent, effective."**

WinKam is an open-source tool designed to clean junk files on your Windows operating system, optimize system performance, repair network (Winsock/DNS) and core system files (SFC scannow), and create safe system image backups. It features a robust **Python CLI** core and a modern **Electron + React** graphical interface.

🌐 *Türkçe dökümantasyon için [tıklayın](README.md).*

---

## ✨ Features

- 🛡️ **Safe Cleaning:** Operates on strict whitelist principles; never touches critical registry or system files.
- ⚡ **Interactive Modes:**
  - **dry-run:** Lists target files without deleting anything (no admin required).
  - **safe:** Cleans user Temp, browser cache, and Recycle Bin (low risk).
  - **advanced:** Cleans Windows Temp, Windows Update cache, and Printer Spooler (system level).
- 📝 **Transparent Logging:** Every action is recorded with timestamps in `/logs`.
- 🌐 **Network & System Repair:** DNS flushing, Winsock reset, and SFC system repair.
- 💾 **System Backup:** Creates secure Windows system image backups to external drives.
- 🖥️ **Live GUI (Electron + React):** Monitor operation status, admin permissions, and live terminal logs.

---

## 💻 System Requirements

1. **Windows 10 or Windows 11**
2. **Python** (v3.8 or higher): [Download Python](https://www.python.org/) *(For CLI)*
3. **Node.js** (v18.0.0 or higher): [Download Node.js](https://nodejs.org/) *(For GUI)*
4. **Git**: [Download Git](https://git-scm.com/)
5. **Administrator Rights:** PowerShell/CMD must be run as Administrator for `safe`/`advanced` modes.

---

## 🚀 Installation & Getting Started

### ⚡ One-Liner Quick Start

#### 🐍 Python CLI Mode (One-Liner):
Open PowerShell **as Administrator** and run:
```powershell
git clone https://github.com/an1lbayram/WinKam.git; cd WinKam; python -m pip install -e .; winkam clean --mode dry-run
```

#### 🖥️ Electron GUI Mode (One-Liner):
```bash
git clone https://github.com/an1lbayram/WinKam.git && cd WinKam/ui && npm install && npm run electron:dev
```

---

### 📋 Step-by-Step Installation (For Beginners)

#### 1️⃣ Open Terminal as Administrator
- Press the Windows Key, type `PowerShell`.
- Right-click and choose **"Run as Administrator"**.

#### 2️⃣ Clone the Repository
```bash
git clone https://github.com/an1lbayram/WinKam.git
```

#### 3️⃣ Navigate to Project Directory
```bash
cd WinKam
```

#### 4️⃣ A) Running via Python CLI
1. **Install Module:**
   ```bash
   python -m pip install -e .
   ```
2. **Run Dry-Run (Preview only):**
   ```bash
   winkam clean --mode dry-run
   ```
3. **Run Safe Clean:**
   ```bash
   winkam clean --mode safe
   ```

#### 4️⃣ B) Running via Desktop GUI (Electron)
1. **Navigate to `ui` directory:**
   ```bash
   cd ui
   ```
2. **Install Dependencies:**
   ```bash
   npm install
   ```
3. **Start Desktop Application:**
   ```bash
   npm run electron:dev
   ```

---

## 🛠️ CLI Reference

| Command | Description |
|---|---|
| `winkam clean --mode dry-run` | Safely simulates cleaning targets without deleting. |
| `winkam clean --mode safe` | Runs standard safe cleaning mode. |
| `winkam clean --mode advanced` | Runs deep system cleaning mode. |
| `winkam repair` | Repairs corrupt system files (SFC scannow). |
| `winkam network` | Flushes DNS and resets Winsock settings. |
| `winkam backup --target D` | Backs up system image to target drive (D). |

---

## 🔒 Security Note

- **File Deletion:** `safe` and `advanced` modes delete files. Always run `dry-run` first to inspect targets.
- **Whitelist Control:** Targets are governed by `config/config.ini`.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

**Developer:** [Anıl Bayram](https://github.com/an1lbayram)
