from __future__ import annotations

import os
from pathlib import Path


def project_root() -> Path:
    # py-src/winkam/paths.py -> py-src/winkam -> py-src -> repo root
    return Path(__file__).resolve().parents[2]


def config_path() -> Path:
    return project_root() / "config" / "config.ini"


def logs_dir(default_name: str = "logs") -> Path:
    # Keep existing layout: repo_root/logs
    return project_root() / default_name


def expand_env_vars(value: str) -> str:
    # Expand %TEMP% style vars on Windows
    return os.path.expandvars(value)

