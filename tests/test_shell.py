from __future__ import annotations

import subprocess
from unittest.mock import MagicMock

import pytest
from winkam.log import Logger
from winkam.shell import run


class TestRun:
    def test_logs_command_and_returns_success(self, tmp_logger: Logger, monkeypatch: pytest.MonkeyPatch):
        fake_cp = MagicMock(returncode=0)
        mock_run = MagicMock(return_value=fake_cp)
        monkeypatch.setattr(subprocess, "run", mock_run)

        result = run(["echo", "hi"], logger=tmp_logger)

        assert result.returncode == 0
        mock_run.assert_called_once()
        called_cmd = mock_run.call_args[0][0]
        assert called_cmd == ["echo", "hi"]
        log_content = tmp_logger.log_file.read_text(encoding="utf-8")
        assert "CMD: echo hi" in log_content

    def test_logs_warning_on_nonzero_exit(self, tmp_logger: Logger, monkeypatch: pytest.MonkeyPatch):
        fake_cp = MagicMock(returncode=5)
        monkeypatch.setattr(subprocess, "run", MagicMock(return_value=fake_cp))

        result = run(["false"], logger=tmp_logger, check=False)

        assert result.returncode == 5
        log_content = tmp_logger.log_file.read_text(encoding="utf-8")
        assert "WARN: command failed (code=5)" in log_content

    def test_check_true_raises_systemexit_on_failure(self, tmp_logger: Logger, monkeypatch: pytest.MonkeyPatch):
        fake_cp = MagicMock(returncode=1)
        monkeypatch.setattr(subprocess, "run", MagicMock(return_value=fake_cp))

        with pytest.raises(SystemExit) as exc_info:
            run(["false"], logger=tmp_logger, check=True)
        assert exc_info.value.code == 1

    def test_check_true_does_not_raise_on_success(self, tmp_logger: Logger, monkeypatch: pytest.MonkeyPatch):
        fake_cp = MagicMock(returncode=0)
        monkeypatch.setattr(subprocess, "run", MagicMock(return_value=fake_cp))

        result = run(["true"], logger=tmp_logger, check=True)
        assert result.returncode == 0

    def test_does_not_use_shell_true(self, tmp_logger: Logger, monkeypatch: pytest.MonkeyPatch):
        """Security: command must be passed as argv list, never shell=True (injection risk)."""
        mock_run = MagicMock(return_value=MagicMock(returncode=0))
        monkeypatch.setattr(subprocess, "run", mock_run)

        run(["dir"], logger=tmp_logger)

        kwargs = mock_run.call_args.kwargs
        assert kwargs.get("shell", False) is not True
