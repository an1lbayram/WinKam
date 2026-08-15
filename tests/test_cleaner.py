from __future__ import annotations

from pathlib import Path
from unittest.mock import MagicMock

import pytest
from winkam import cleaner
from winkam.config import PathConfig, SettingsConfig, WinKamConfig
from winkam.log import Logger


def make_config(**overrides) -> WinKamConfig:
    defaults = dict(
        wintemp="", usertemp="", chromecache="", edgecache="",
        operacache="", bravecache="", wucache="", spooler="", memory_dump="",
    )
    defaults.update(overrides)
    return WinKamConfig(paths=PathConfig(**defaults), settings=SettingsConfig())


class TestEstimateSize:
    def test_sums_file_sizes_recursively(self, tmp_path: Path, tmp_logger: Logger):
        d = tmp_path / "cache"
        d.mkdir()
        (d / "a.txt").write_bytes(b"1234567890")  # 10 bytes
        sub = d / "sub"
        sub.mkdir()
        (sub / "b.txt").write_bytes(b"12345")  # 5 bytes

        summary = cleaner.estimate_size([str(d)], tmp_logger)
        assert summary.bytes_total == 15

    def test_ignores_nonexistent_paths(self, tmp_path: Path, tmp_logger: Logger):
        summary = cleaner.estimate_size([str(tmp_path / "missing")], tmp_logger)
        assert summary.bytes_total == 0

    def test_ignores_empty_strings(self, tmp_logger: Logger):
        summary = cleaner.estimate_size(["", None, ""], tmp_logger)  # type: ignore[list-item]
        assert summary.bytes_total == 0

    def test_multiple_paths_accumulate(self, tmp_path: Path, tmp_logger: Logger):
        d1 = tmp_path / "d1"
        d2 = tmp_path / "d2"
        d1.mkdir()
        d2.mkdir()
        (d1 / "a.txt").write_bytes(b"1" * 100)
        (d2 / "b.txt").write_bytes(b"1" * 50)

        summary = cleaner.estimate_size([str(d1), str(d2)], tmp_logger)
        assert summary.bytes_total == 150


class TestRefuseRootDrive:
    """Security: must never allow wiping an entire drive root (e.g. C:\\)."""

    def test_refuses_drive_root(self, tmp_logger: Logger):
        # Use the anchor of tmp_path's own drive to stay platform-portable.
        anchor = Path(Path.cwd().anchor)
        assert cleaner._refuse_root_drive(anchor, tmp_logger) is True

    def test_allows_subdirectory(self, tmp_path: Path, tmp_logger: Logger):
        sub = tmp_path / "Temp"
        sub.mkdir()
        assert cleaner._refuse_root_drive(sub, tmp_logger) is False

    def test_clean_dir_raises_systemexit_on_root_drive(self, tmp_logger: Logger, monkeypatch: pytest.MonkeyPatch):
        anchor = Path(Path.cwd().anchor)
        monkeypatch.setattr(Path, "is_dir", lambda self: True)
        monkeypatch.setattr(Path, "exists", lambda self: True)
        with pytest.raises(SystemExit) as exc_info:
            cleaner.clean_dir(str(anchor), tmp_logger)
        assert exc_info.value.code == 1


class TestCleanDir:
    def test_removes_children_but_keeps_directory(self, tmp_path: Path, tmp_logger: Logger):
        target = tmp_path / "cache"
        target.mkdir()
        (target / "file.txt").write_text("x")
        sub = target / "sub"
        sub.mkdir()
        (sub / "nested.txt").write_text("y")

        cleaner.clean_dir(str(target), tmp_logger)

        assert target.exists()
        assert list(target.iterdir()) == []

    def test_noop_on_missing_path(self, tmp_path: Path, tmp_logger: Logger):
        missing = tmp_path / "does_not_exist"
        cleaner.clean_dir(str(missing), tmp_logger)  # must not raise
        assert not missing.exists()

    def test_noop_on_empty_path(self, tmp_logger: Logger):
        cleaner.clean_dir("", tmp_logger)  # must not raise

    def test_noop_when_path_is_a_file(self, tmp_path: Path, tmp_logger: Logger):
        f = tmp_path / "notadir.txt"
        f.write_text("x")
        cleaner.clean_dir(str(f), tmp_logger)
        assert f.exists()  # untouched, since it's not a directory

    def test_continues_after_individual_delete_failure(
        self, tmp_path: Path, tmp_logger: Logger, monkeypatch: pytest.MonkeyPatch
    ):
        target = tmp_path / "cache"
        target.mkdir()
        (target / "a.txt").write_text("x")
        (target / "b.txt").write_text("y")

        real_unlink = Path.unlink

        def flaky_unlink(self, *args, **kwargs):
            if self.name == "a.txt":
                raise PermissionError("locked by another process")
            return real_unlink(self, *args, **kwargs)

        monkeypatch.setattr(Path, "unlink", flaky_unlink)

        cleaner.clean_dir(str(target), tmp_logger)  # must not raise

        remaining = {p.name for p in target.iterdir()}
        assert remaining == {"a.txt"}
        log_content = tmp_logger.log_file.read_text(encoding="utf-8")
        assert "WARN: Failed to delete" in log_content


class TestDoCleanDryRun:
    def test_dry_run_does_not_delete_anything(self, tmp_path: Path, tmp_logger: Logger, capsys):
        cache = tmp_path / "cache"
        cache.mkdir()
        (cache / "keep_me.txt").write_bytes(b"1" * 1000)
        cfg = make_config(usertemp=str(cache))

        cleaner.do_clean("DRY_RUN", cfg, tmp_logger)

        assert (cache / "keep_me.txt").exists()
        out = capsys.readouterr().out
        assert "Temizlenebilecek toplam alan" in out

    def test_dry_run_is_case_insensitive(self, tmp_path: Path, tmp_logger: Logger, capsys):
        cfg = make_config()
        cleaner.do_clean("dry_run", cfg, tmp_logger)
        out = capsys.readouterr().out
        assert "Temizlenebilecek toplam alan" in out


class TestDoCleanSafe:
    def test_safe_cleans_expected_dirs_and_recycle_bin(
        self, tmp_path: Path, tmp_logger: Logger, monkeypatch: pytest.MonkeyPatch
    ):
        calls: list[str] = []
        monkeypatch.setattr(cleaner, "clean_dir", lambda p, logger: calls.append(p))
        monkeypatch.setattr(cleaner, "clear_recycle_bin", lambda logger: calls.append("RECYCLE_BIN"))

        cfg = make_config(
            usertemp="UT", chromecache="CC", edgecache="EC", operacache="OC", bravecache="BC",
            wintemp="WT", wucache="WU", spooler="SP",
        )
        cleaner.do_clean("SAFE", cfg, tmp_logger)

        assert calls == ["UT", "CC", "EC", "OC", "BC", "RECYCLE_BIN"]
        # Advanced-only targets must NOT be touched in safe mode.
        assert "WT" not in calls
        assert "WU" not in calls
        assert "SP" not in calls


class TestDoCleanAdvanced:
    def test_advanced_also_cleans_system_dirs(
        self, tmp_path: Path, tmp_logger: Logger, monkeypatch: pytest.MonkeyPatch
    ):
        calls: list[str] = []
        monkeypatch.setattr(cleaner, "clean_dir", lambda p, logger: calls.append(p))
        monkeypatch.setattr(cleaner, "clear_recycle_bin", lambda logger: calls.append("RECYCLE_BIN"))
        monkeypatch.setattr(cleaner, "run", MagicMock())

        cfg = make_config(
            usertemp="UT", chromecache="CC", edgecache="EC", operacache="OC", bravecache="BC",
            wintemp="WT", wucache="WU", spooler="SP", memory_dump=str(tmp_path / "MEMORY.DMP"),
        )
        cleaner.do_clean("ADVANCED", cfg, tmp_logger)

        assert set(["UT", "CC", "EC", "OC", "BC", "WT", "WU", "SP", "RECYCLE_BIN"]).issubset(set(calls))

    def test_advanced_deletes_memory_dump_when_present(
        self, tmp_path: Path, tmp_logger: Logger, monkeypatch: pytest.MonkeyPatch
    ):
        monkeypatch.setattr(cleaner, "clean_dir", lambda p, logger: None)
        monkeypatch.setattr(cleaner, "clear_recycle_bin", lambda logger: None)
        monkeypatch.setattr(cleaner, "run", MagicMock())

        dump = tmp_path / "MEMORY.DMP"
        dump.write_bytes(b"dummy")
        cfg = make_config(memory_dump=str(dump))

        cleaner.do_clean("ADVANCED", cfg, tmp_logger)

        assert not dump.exists()

    def test_advanced_handles_missing_memory_dump_gracefully(
        self, tmp_path: Path, tmp_logger: Logger, monkeypatch: pytest.MonkeyPatch
    ):
        monkeypatch.setattr(cleaner, "clean_dir", lambda p, logger: None)
        monkeypatch.setattr(cleaner, "clear_recycle_bin", lambda logger: None)
        monkeypatch.setattr(cleaner, "run", MagicMock())

        cfg = make_config(memory_dump=str(tmp_path / "MEMORY.DMP"))  # does not exist
        cleaner.do_clean("ADVANCED", cfg, tmp_logger)  # must not raise
