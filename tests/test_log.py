from __future__ import annotations

import re
from datetime import datetime
from pathlib import Path

from winkam.log import Logger, make_logger, make_run_id


class TestLogger:
    def test_creates_parent_dir_and_writes_message(self, tmp_path: Path):
        logger = Logger(log_file=tmp_path / "nested" / "run.log")
        logger.log("hello world")
        assert logger.log_file.exists()
        content = logger.log_file.read_text(encoding="utf-8")
        assert "hello world" in content

    def test_timestamp_format(self, tmp_path: Path):
        logger = Logger(log_file=tmp_path / "run.log")
        logger.log("msg")
        content = logger.log_file.read_text(encoding="utf-8")
        assert re.match(r"^\[\d{2}:\d{2}:\d{2}\] msg\n$", content)

    def test_appends_multiple_messages(self, tmp_path: Path):
        logger = Logger(log_file=tmp_path / "run.log")
        logger.log("first")
        logger.log("second")
        lines = logger.log_file.read_text(encoding="utf-8").splitlines()
        assert len(lines) == 2
        assert lines[0].endswith("first")
        assert lines[1].endswith("second")

    def test_utf8_content_roundtrip(self, tmp_path: Path):
        logger = Logger(log_file=tmp_path / "run.log")
        logger.log("Türkçe karakterler: çşğüöı")
        content = logger.log_file.read_text(encoding="utf-8")
        assert "Türkçe karakterler: çşğüöı" in content


class TestMakeRunId:
    def test_format(self):
        run_id = make_run_id(datetime(2026, 8, 14, 9, 5))
        assert run_id == "20260814_0905"

    def test_defaults_to_now(self):
        run_id = make_run_id()
        assert re.match(r"^\d{8}_\d{4}$", run_id)


class TestMakeLogger:
    def test_builds_expected_filename(self, tmp_path: Path):
        logger = make_logger(tmp_path, "20260814_0905")
        assert logger.log_file == tmp_path / "WinKam_Log_20260814_0905.txt"
