# WinKam

_🌍 [Türkçe Oku](README.md)_

> **"Purify your Windows system with a single click. Safe, transparent, effective."**

WinKam is an open-source tool that cleans unnecessary files on your Windows operating system, optimizes the system, and helps you repair potential network/system errors.

## 🌟 Features

- **🛡️ Safe Operation:** Unlike old and dangerous cleaning scripts, WinKam does not delete files or registry entries critical to your system.
- **⚡ Fast and Deep Cleaning Menu:** Interactive menu interface allowing you to perform only the cleanup you need.
- **📝 Detailed Logging:** Every action taken is saved in the `/logs` folder with a timestamp. You can transparently see which files were deleted.
- **🌐 Network Repair and System Scan:** Supports DNS flush/Winsock reset for internet connection issues, and SFC scannow repair for corrupted core files.
- **💾 System Backup:** If an external drive is attached, you can take a secure image backup of Windows with a single click.

## 💻 System Requirements

- **Operating System:** Windows 10 or Windows 11
- **Python:** Minimum Python 3.8 and above (Only for developer / CLI installation)
- **Permissions:** `safe`/`advanced` cleaning, repair, and backup operations require "Administrator" privileges.

## 🚀 Installation & Usage

### Python CLI (Recommended)

## ⚡ Quick Start (3 commands)

```bash
python -m pip install -e .
winkam clean --mode dry-run
winkam clean --mode safe
```

## 🔒 Security Note

- **This tool deletes files and runs certain commands as an administrator.** Misuse can lead to irreversible consequences.
- **Run `dry-run` first**: See what is targeted before moving on to `safe/advanced` modes.
- **`safe` vs `advanced`**:
  - **safe**: Targets lower-risk areas like user temp + browser cache + recycle bin.
  - **advanced**: Also touches more "system" areas like Windows Temp / Windows Update cache / print spooler (higher risk).
- **Administrator Privilege**: Required for operations other than `dry-run`.
- **Whitelist Principle**: Cleaning targets are determined via `config/config.ini`; check this file before sharing.

1. **Download the project**
2. **Installation (Recommended)**:

```bash
python -m pip install -e .
```

> Note: If `pip` warns that the `...Python\\...\\Scripts` folder is not in PATH, the `winkam` command might not be found. In this case, you can run it via `python -m winkam.cli ...` or add it to your PATH.

3. **Open command prompt as Administrator** (PowerShell/Terminal -> "Run as Administrator")
4. **Dry-run (No admin required)**:

```bash
winkam clean --mode dry-run
```

5. **Safe clean (Admin required)**:

```bash
winkam clean --mode safe
```

6. **Other commands**:

```bash
winkam repair
winkam network
winkam backup --target D
```

If you want to run it without installation (dev mode):

```bash
python -c "import sys; sys.path.insert(0,'py-src'); from winkam.cli import main; main(['clean','--mode','dry-run'])"
```

> Note: This repo is now focused on Python CLI + Electron UI. The legacy batch script has been removed.

## 🖥️ UI (JavaScript) - Professional Interface

The UI project is located in the `ui/` folder (Vite + React).

### UI Modes (Very Important)

- **Web (Simulation)**: `npm run dev`
  - Runs in the browser.
  - **Does not run actual clean/repair commands**, merely generates mock outputs to showcase the UI flow.
- **Electron (Actual Execution)**: `npm run electron:dev` or `npm run electron:only`
  - Opens the Electron application.
  - Buttons **actually** execute `python -m winkam.cli ...` commands and stream the output live.

```bash
cd ui
npm install
npm run dev
```

Electron (Actual `winkam` execution + live log):

```bash
cd ui
npm install
npm run electron:dev
```

Only Electron (With built UI):

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

> Note: In Electron, you should see `UA: Electron • Bridge: OK • Ping: OK` on the "Status" card. If you see `UA: Web`, you are in the browser and it is a simulation.

### UI Features

- **Live Output**: Command outputs stream instantly in the UI (stdout/stderr).
- **Administrator Status**: The status card shows "Privilege: Administrator/Standard".
- **Log Viewer**: You can list and read the contents of `logs/` from the **Logs** page in the UI.

### 📦 Deployment and Executable (.exe) Creation

The most practical way to create a single file exe for the Python version is using **PyInstaller**:

```bash
pip install pyinstaller
pyinstaller --onefile --name WinKam --paths py-src -m winkam.cli
```

### 🧱 Windows Installer (UI)

NSIS installer generation for the UI (Electron):

```bash
cd ui
npm install
npm run dist:win
```

The output will be placed under `ui/release/`.

> Note: The installer now comes with **embeddable Python**; it works even if Python is not installed on the system. (Python is downloaded into `vendor/` during the build.)

## 🛠️ Troubleshooting

- **`winkam` command not found:** Python's `Scripts` directory might not be added to your PATH environment variable. Alternatively, you can start with `python -m winkam.cli ...`.
- **"Access Denied" Errors:** This error occurs if you don't start the application or command prompt with administrator privileges.
- **Electron always opens in "Web" mode:** For actual commands to work, you must open it with the Electron bridge (`npm run electron:dev`), not in the browser (`npm run dev`).
- **Backup Error:** Ensure the target drive letter you specified points to a valid and attached drive (other than C:).

## 📂 Directory Structure

```text
/WinKam
│── /py-src
│   └── /winkam              # Python source code (CLI)
│── /config
│   └── config.ini           # Cleaning targets and settings
│── /logs                    # Operation logs (gitignore)
│── /assets                  # Logos and screenshots
│── /ui                      # Electron + React UI
│── README.md
│── README_en.md             # English documentation
│── LICENSE
```

## 📜 License

This project is licensed under the **MIT License**. For more information, please check the LICENSE file.
You are free to copy, modify, and use it in your own projects as you wish.
