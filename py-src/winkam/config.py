from __future__ import annotations

from configparser import ConfigParser
from dataclasses import dataclass
from pathlib import Path

from .paths import expand_env_vars


@dataclass(frozen=True)
class PathConfig:
    wintemp: str
    usertemp: str
    chromecache: str
    edgecache: str
    operacache: str
    bravecache: str
    wucache: str
    spooler: str
    memory_dump: str


@dataclass(frozen=True)
class SettingsConfig:
    logs_dir: str = "logs"


@dataclass(frozen=True)
class WinKamConfig:
    paths: PathConfig
    settings: SettingsConfig


def _get_required(cp: ConfigParser, section: str, key: str) -> str:
    if not cp.has_option(section, key):
        raise ValueError(f"config.ini missing [{section}] {key}")
    return expand_env_vars(cp.get(section, key))


def load_config(path: Path) -> WinKamConfig:
    cp = ConfigParser(interpolation=None)
    cp.optionxform = str  # keep case
    with path.open("r", encoding="utf-8", errors="replace") as f:
        cp.read_file(f)

    paths = PathConfig(
        wintemp=_get_required(cp, "PATHS", "WINTEMP"),
        usertemp=_get_required(cp, "PATHS", "USERTEMP"),
        chromecache=_get_required(cp, "PATHS", "CHROMECACHE"),
        edgecache=_get_required(cp, "PATHS", "EDGECACHE"),
        operacache=_get_required(cp, "PATHS", "OPERACACHE"),
        bravecache=_get_required(cp, "PATHS", "BRAVECACHE"),
        wucache=_get_required(cp, "PATHS", "WUCACHE"),
        spooler=_get_required(cp, "PATHS", "SPOOLER"),
        memory_dump=_get_required(cp, "PATHS", "MEMORY_DUMP"),
    )

    logs_dir = cp.get("SETTINGS", "LOGS_DIR", fallback="logs")
    settings = SettingsConfig(logs_dir=logs_dir)

    return WinKamConfig(paths=paths, settings=settings)

