from __future__ import annotations

from .log import Logger
from .shell import run


def repair(logger: Logger) -> None:
    logger.log("Repair module started.")
    r = run(["sfc", "/scannow"], logger=logger, check=False)
    if r.returncode != 0:
        logger.log(f"WARN: SFC failed (code={r.returncode}); trying DISM.")
        run(["DISM", "/Online", "/Cleanup-Image", "/RestoreHealth"], logger=logger, check=False)
    logger.log("Repair module completed.")


def network_reset(logger: Logger) -> None:
    logger.log("Network module started.")
    run(["netsh", "winsock", "reset"], logger=logger, check=False)
    run(["netsh", "int", "ip", "reset"], logger=logger, check=False)
    run(["ipconfig", "/release"], logger=logger, check=False)
    run(["ipconfig", "/renew"], logger=logger, check=False)
    run(["ipconfig", "/flushdns"], logger=logger, check=False)
    logger.log("Network module completed.")

