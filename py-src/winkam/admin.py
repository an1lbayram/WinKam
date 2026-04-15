from __future__ import annotations

import os
import sys


def is_windows() -> bool:
    return os.name == "nt"


def is_admin() -> bool:
    if not is_windows():
        return os.geteuid() == 0  # type: ignore[attr-defined]
    try:
        import ctypes

        return bool(ctypes.windll.shell32.IsUserAnAdmin())
    except Exception:
        return False


def require_admin() -> None:
    if not is_admin():
        print(
            "\n=======================================================\n"
            "[HATA] YONETICI YETKISI GEREKLI!\n"
            "=======================================================\n"
            "Bu araci calistirmak icin yonetici yetkisi gereklidir.\n"
            "Lutfen terminali/uygulamayi 'Yonetici olarak calistir' ile acin.\n"
        )
        raise SystemExit(1)

