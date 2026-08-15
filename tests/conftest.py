from __future__ import annotations

import sys
from pathlib import Path

import pytest
from winkam.log import Logger


@pytest.fixture
def tmp_logger(tmp_path: Path) -> Logger:
    return Logger(log_file=tmp_path / "logs" / "test.log")


@pytest.fixture
def sample_config_text() -> str:
    return (
        "[PATHS]\n"
        "WINTEMP=C:\\Windows\\Temp\n"
        "USERTEMP=%TEMP%\n"
        "CHROMECACHE=%LOCALAPPDATA%\\Google\\Chrome\\User Data\\Default\\Cache\n"
        "EDGECACHE=%LOCALAPPDATA%\\Microsoft\\Edge\\User Data\\Default\\Cache\n"
        "OPERACACHE=%APPDATA%\\Opera Software\\Opera Stable\\Cache\n"
        "BRAVECACHE=%LOCALAPPDATA%\\BraveSoftware\\Brave-Browser\\User Data\\Default\\Cache\n"
        "WUCACHE=%SystemRoot%\\SoftwareDistribution\\Download\n"
        "SPOOLER=%SystemRoot%\\System32\\spool\\PRINTERS\n"
        "MEMORY_DUMP=C:\\Windows\\MEMORY.DMP\n"
        "\n"
        "[SETTINGS]\n"
        "LOGS_DIR=logs\n"
    )


@pytest.fixture
def sample_config_path(tmp_path: Path, sample_config_text: str) -> Path:
    p = tmp_path / "config.ini"
    p.write_text(sample_config_text, encoding="utf-8")
    return p


@pytest.fixture(autouse=True)
def _isolate_sys_path():
    # Guard against test pollution of sys.path across test modules.
    before = list(sys.path)
    yield
    sys.path[:] = before
