from __future__ import annotations

import subprocess
from dataclasses import dataclass
from typing import Sequence

from .log import Logger


@dataclass(frozen=True)
class RunResult:
    returncode: int


def run(cmd: Sequence[str], logger: Logger, check: bool = False) -> RunResult:
    logger.log(f"CMD: {' '.join(cmd)}")
    cp = subprocess.run(cmd, text=True)
    if cp.returncode != 0:
        logger.log(f"WARN: command failed (code={cp.returncode})")
    if check and cp.returncode != 0:
        raise SystemExit(cp.returncode)
    return RunResult(returncode=cp.returncode)

