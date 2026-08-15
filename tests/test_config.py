from __future__ import annotations

from pathlib import Path

import pytest
from winkam.config import load_config


class TestLoadConfig:
    """Unit tests: config.ini parsing."""

    def test_loads_all_path_fields(self, sample_config_path: Path):
        cfg = load_config(sample_config_path)
        assert cfg.paths.wintemp == "C:\\Windows\\Temp"
        assert cfg.paths.spooler.endswith("spool\\PRINTERS")
        assert cfg.paths.memory_dump == "C:\\Windows\\MEMORY.DMP"

    def test_expands_env_vars(self, sample_config_path: Path, monkeypatch: pytest.MonkeyPatch):
        monkeypatch.setenv("TEMP", "C:\\Users\\tester\\AppData\\Local\\Temp")
        cfg = load_config(sample_config_path)
        assert cfg.paths.usertemp == "C:\\Users\\tester\\AppData\\Local\\Temp"
        assert "%TEMP%" not in cfg.paths.usertemp

    def test_settings_logs_dir_default(self, tmp_path: Path):
        text = (
            "[PATHS]\n"
            "WINTEMP=C:\\Windows\\Temp\n"
            "USERTEMP=%TEMP%\n"
            "CHROMECACHE=x\nEDGECACHE=x\nOPERACACHE=x\nBRAVECACHE=x\n"
            "WUCACHE=x\nSPOOLER=x\nMEMORY_DUMP=x\n"
        )
        p = tmp_path / "no_settings.ini"
        p.write_text(text, encoding="utf-8")
        cfg = load_config(p)
        assert cfg.settings.logs_dir == "logs"

    def test_settings_logs_dir_custom(self, tmp_path: Path):
        text = (
            "[PATHS]\n"
            "WINTEMP=x\nUSERTEMP=x\nCHROMECACHE=x\nEDGECACHE=x\nOPERACACHE=x\n"
            "BRAVECACHE=x\nWUCACHE=x\nSPOOLER=x\nMEMORY_DUMP=x\n"
            "\n[SETTINGS]\nLOGS_DIR=custom_logs\n"
        )
        p = tmp_path / "custom.ini"
        p.write_text(text, encoding="utf-8")
        cfg = load_config(p)
        assert cfg.settings.logs_dir == "custom_logs"

    def test_missing_required_key_raises(self, tmp_path: Path):
        p = tmp_path / "broken.ini"
        p.write_text("[PATHS]\nWINTEMP=C:\\Windows\\Temp\n", encoding="utf-8")
        with pytest.raises(ValueError, match="config.ini missing"):
            load_config(p)

    def test_missing_section_raises(self, tmp_path: Path):
        p = tmp_path / "no_paths.ini"
        p.write_text("[SETTINGS]\nLOGS_DIR=logs\n", encoding="utf-8")
        with pytest.raises(ValueError):
            load_config(p)

    def test_missing_file_raises(self, tmp_path: Path):
        with pytest.raises(FileNotFoundError):
            load_config(tmp_path / "does_not_exist.ini")

    def test_config_objects_are_frozen(self, sample_config_path: Path):
        cfg = load_config(sample_config_path)
        with pytest.raises(Exception):
            cfg.paths.wintemp = "changed"  # type: ignore[misc]

    def test_real_repo_config_loads(self):
        """Integration: the actual config/config.ini shipped in the repo must be valid."""
        repo_root = Path(__file__).resolve().parents[1]
        cfg = load_config(repo_root / "config" / "config.ini")
        assert cfg.paths.wintemp
        assert cfg.paths.memory_dump
