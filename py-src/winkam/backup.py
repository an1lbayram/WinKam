from __future__ import annotations

import re
import subprocess
from dataclasses import dataclass

from .log import Logger


@dataclass(frozen=True)
class Drive:
    device_id: str  # e.g. "D:"
    drive_type: int  # 2 removable, 3 local


def list_backup_drives() -> list[Drive]:
    # Mirror our batch fix: CIM query for logical disks, excluding C:
    ps = (
        "$ErrorActionPreference='SilentlyContinue';"
        "$disks = Get-CimInstance Win32_LogicalDisk | "
        "Where-Object { $_.DriveType -in 2,3 -and $_.DeviceID -ne 'C:' };"
        "foreach($d in $disks){ '{0}|{1}' -f $d.DeviceID,$d.DriveType }"
    )
    cp = subprocess.run(
        ["powershell.exe", "-NoProfile", "-Command", ps],
        capture_output=True,
        text=True,
    )
    drives: list[Drive] = []
    for line in (cp.stdout or "").splitlines():
        line = line.strip()
        if not line or "|" not in line:
            continue
        dev, dtype = line.split("|", 1)
        dev = dev.strip()
        try:
            drives.append(Drive(device_id=dev, drive_type=int(dtype.strip())))
        except ValueError:
            continue
    return drives


def normalize_drive_input(s: str) -> str | None:
    s = (s or "").strip().replace(" ", "")
    if not s:
        return None
    letter = s[0:1]
    if not re.fullmatch(r"[A-Za-z]", letter):
        return None
    return f"{letter.upper()}:"


def backup(target: str | None, logger: Logger) -> None:
    logger.log("Backup module started.")
    drives = list_backup_drives()
    if not drives:
        print("[HATA] C: harici uygun surucu bulunamadi!")
        logger.log("ERROR: No suitable backup drive found.")
        raise SystemExit(1)

    print("\nKullanilabilir Suruculer:")
    for d in drives:
        label = "Yerel Disk" if d.drive_type == 3 else "Cikarilabilir Disk (USB vb.)"
        print(f"  {d.device_id} - {label}")

    if target is None:
        target = input("\nYedek hedef surucu harfini girin (orn: D): ")
    t = normalize_drive_input(target)
    if t is None:
        print("[HATA] Gecersiz giris.")
        raise SystemExit(1)
    if t.upper() == "C:":
        print("[HATA] C: sistem surucusu hedef olamaz!")
        raise SystemExit(1)

    logger.log(f"Backup target selected: {t}")
    cp = subprocess.run(
        ["wbadmin", "start", "backup", f"-backupTarget:{t}", "-include:C:", "-allCritical", "-quiet"],
        text=True,
    )
    if cp.returncode != 0:
        logger.log(f"ERROR: Backup failed - code {cp.returncode}")
        raise SystemExit(cp.returncode)
    logger.log(f"SUCCESS: Backup done on {t}")

