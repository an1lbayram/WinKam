from __future__ import annotations

import shutil
from dataclasses import dataclass
from pathlib import Path

from .config import WinKamConfig
from .log import Logger
from .shell import run


@dataclass(frozen=True)
class CleanSummary:
    bytes_total: int


def _iter_files(root: Path):
    # Best-effort walk; ignore permission errors
    for p in root.rglob("*"):
        yield p


def estimate_size(paths: list[str], logger: Logger) -> CleanSummary:
    total = 0
    for raw in paths:
        if not raw:
            continue
        p = Path(raw)
        if not p.exists():
            continue
        try:
            for item in _iter_files(p):
                try:
                    if item.is_file():
                        total += item.stat().st_size
                except Exception:
                    continue
        except Exception as e:
            logger.log(f"WARN: size walk failed for {p}: {e}")
    return CleanSummary(bytes_total=total)


def _refuse_root_drive(target: Path, logger: Logger) -> bool:
    try:
        anchor = Path(target.anchor)
        if target.resolve() == anchor.resolve():
            logger.log(f"ERROR: Refusing to clean root drive: {target}")
            return True
    except Exception:
        return False
    return False


def clean_dir(path: str, logger: Logger) -> None:
    if not path:
        return
    p = Path(path)
    if not p.exists() or not p.is_dir():
        return
    if _refuse_root_drive(p, logger):
        raise SystemExit(1)

    # Remove children only, keep the directory.
    for child in p.iterdir():
        try:
            if child.is_dir():
                shutil.rmtree(child, ignore_errors=False)
            else:
                child.unlink(missing_ok=True)
        except Exception as e:
            logger.log(f"WARN: Failed to delete {child}: {e}")
    logger.log(f"Cleaned: {p}")


def clear_recycle_bin(logger: Logger) -> None:
    run(
        ["powershell.exe", "-NoProfile", "-Command", "Clear-RecycleBin -Force -ErrorAction SilentlyContinue"],
        logger=logger,
        check=False,
    )


def do_clean(mode: str, cfg: WinKamConfig, logger: Logger) -> None:
    mode = mode.upper()
    logger.log(f"Cleaner started - Mode: {mode}")

    if mode == "DRY_RUN":
        paths = [
            cfg.paths.usertemp,
            cfg.paths.chromecache,
            cfg.paths.edgecache,
            cfg.paths.operacache,
            cfg.paths.bravecache,
            cfg.paths.wintemp,
            cfg.paths.wucache,
            cfg.paths.spooler,
        ]
        summary = estimate_size(paths, logger)
        mb = round(summary.bytes_total / (1024 * 1024), 2)
        print(f"\nTemizlenebilecek toplam alan: {mb} MB\n")
        logger.log("Dry-Run completed.")
        return

    # Safe always
    clean_dir(cfg.paths.usertemp, logger)
    clean_dir(cfg.paths.chromecache, logger)
    clean_dir(cfg.paths.edgecache, logger)
    clean_dir(cfg.paths.operacache, logger)
    clean_dir(cfg.paths.bravecache, logger)
    clear_recycle_bin(logger)

    if mode == "ADVANCED":
        # Windows temp
        clean_dir(cfg.paths.wintemp, logger)

        # Update cache + spooler: mirror batch behavior
        logger.log("Windows Update hizmeti durduruluyor...")
        run(["powershell.exe", "-NoProfile", "-Command", "Stop-Service -Name wuauserv -Force -ErrorAction SilentlyContinue"], logger=logger, check=False)
        clean_dir(cfg.paths.wucache, logger)
        logger.log("Windows Update hizmeti başlatılıyor...")
        run(["powershell.exe", "-NoProfile", "-Command", "Start-Service -Name wuauserv -ErrorAction SilentlyContinue"], logger=logger, check=False)

        logger.log("Yazdırma Biriktiricisi hizmeti durduruluyor...")
        run(["powershell.exe", "-NoProfile", "-Command", "Stop-Service -Name spooler -Force -ErrorAction SilentlyContinue"], logger=logger, check=False)
        clean_dir(cfg.paths.spooler, logger)
        logger.log("Yazdırma Biriktiricisi hizmeti başlatılıyor...")
        run(["powershell.exe", "-NoProfile", "-Command", "Start-Service -Name spooler -ErrorAction SilentlyContinue"], logger=logger, check=False)

        # MEMORY.DMP
        md = Path(cfg.paths.memory_dump)
        if md.exists() and md.is_file():
            try:
                md.unlink()
                logger.log("Deleted MEMORY.DMP")
            except Exception as e:
                logger.log(f"WARN: Failed to delete MEMORY.DMP: {e}")

    logger.log(f"Cleaner completed - Mode: {mode}")
