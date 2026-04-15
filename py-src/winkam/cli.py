from __future__ import annotations

import argparse
import sys

from . import __version__
from .admin import require_admin
from .backup import backup
from .cleaner import do_clean
from .config import load_config
from .log import make_logger, make_run_id
from .paths import config_path, logs_dir
from .system import network_reset, repair


def build_parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(prog="winkam", description="WinKam (Python CLI)")
    p.add_argument("--version", action="version", version=f"%(prog)s {__version__}")

    sub = p.add_subparsers(dest="cmd", required=True)

    clean = sub.add_parser("clean", help="Temizlik")
    clean.add_argument("--mode", choices=["safe", "advanced", "dry-run"], default="safe")

    sub.add_parser("repair", help="SFC + DISM onarim")
    sub.add_parser("network", help="Ag sifirlama")

    b = sub.add_parser("backup", help="Sistem imaj yedegi (wbadmin)")
    b.add_argument("--target", help="Hedef surucu harfi (orn: D)", default=None)

    return p


def main(argv: list[str] | None = None) -> None:
    if sys.platform == "win32":
        import ctypes
        ctypes.windll.kernel32.SetConsoleOutputCP(65001)

    args = build_parser().parse_args(argv)
    if not (args.cmd == "clean" and args.mode == "dry-run"):
        require_admin()

    cfg = load_config(config_path())
    run_id = make_run_id()
    logger = make_logger(logs_dir(cfg.settings.logs_dir), run_id)
    logger.log(f"WinKam {__version__} started.")

    if args.cmd == "clean":
        mode = args.mode
        if mode == "dry-run":
            do_clean("DRY_RUN", cfg, logger)
        elif mode == "advanced":
            do_clean("ADVANCED", cfg, logger)
        else:
            do_clean("SAFE", cfg, logger)
    elif args.cmd == "repair":
        repair(logger)
    elif args.cmd == "network":
        network_reset(logger)
    elif args.cmd == "backup":
        backup(args.target, logger)

    logger.log("WinKam completed.")


if __name__ == "__main__":
    main()
