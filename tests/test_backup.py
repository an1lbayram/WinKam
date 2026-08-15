from __future__ import annotations

import subprocess
from unittest.mock import MagicMock

import pytest
from winkam import backup
from winkam.log import Logger


class TestNormalizeDriveInput:
    @pytest.mark.parametrize(
        "raw,expected",
        [
            ("D", "D:"),
            ("d", "D:"),
            ("D:", "D:"),
            (" d ", "D:"),
            ("d:\\", "D:"),
        ],
    )
    def test_valid_inputs_normalize(self, raw, expected):
        assert backup.normalize_drive_input(raw) == expected

    @pytest.mark.parametrize(
        "raw", ["", None, "1", "!", "$(rm -rf /)", "DD", "D1", "D:extra", "D:\\extra"]
    )
    def test_invalid_inputs_return_none(self, raw):
        assert backup.normalize_drive_input(raw) is None


class TestListBackupDrives:
    def test_parses_powershell_output(self, monkeypatch: pytest.MonkeyPatch):
        fake_cp = MagicMock(stdout="D:|3\nE:|2\n", returncode=0)
        monkeypatch.setattr(subprocess, "run", MagicMock(return_value=fake_cp))

        drives = backup.list_backup_drives()

        assert drives == [
            backup.Drive(device_id="D:", drive_type=3),
            backup.Drive(device_id="E:", drive_type=2),
        ]

    def test_empty_output_returns_empty_list(self, monkeypatch: pytest.MonkeyPatch):
        fake_cp = MagicMock(stdout="", returncode=0)
        monkeypatch.setattr(subprocess, "run", MagicMock(return_value=fake_cp))
        assert backup.list_backup_drives() == []

    def test_malformed_lines_are_skipped(self, monkeypatch: pytest.MonkeyPatch):
        fake_cp = MagicMock(stdout="garbage\nD:|notanumber\nE:|3\n", returncode=0)
        monkeypatch.setattr(subprocess, "run", MagicMock(return_value=fake_cp))
        assert backup.list_backup_drives() == [backup.Drive(device_id="E:", drive_type=3)]


class TestBackup:
    """Security-relevant: backup must never target the system drive C:."""

    def test_exits_when_no_drives_available(self, tmp_logger: Logger, monkeypatch: pytest.MonkeyPatch, capsys):
        monkeypatch.setattr(backup, "list_backup_drives", lambda: [])
        with pytest.raises(SystemExit) as exc_info:
            backup.backup("D", tmp_logger)
        assert exc_info.value.code == 1
        assert "surucu bulunamadi" in capsys.readouterr().out

    def test_refuses_c_drive_as_target(self, tmp_logger: Logger, monkeypatch: pytest.MonkeyPatch, capsys):
        monkeypatch.setattr(
            backup, "list_backup_drives", lambda: [backup.Drive(device_id="D:", drive_type=3)]
        )
        with pytest.raises(SystemExit) as exc_info:
            backup.backup("C", tmp_logger)
        assert exc_info.value.code == 1
        assert "olamaz" in capsys.readouterr().out

    def test_rejects_invalid_target_format(self, tmp_logger: Logger, monkeypatch: pytest.MonkeyPatch, capsys):
        monkeypatch.setattr(
            backup, "list_backup_drives", lambda: [backup.Drive(device_id="D:", drive_type=3)]
        )
        with pytest.raises(SystemExit):
            backup.backup("../../etc/passwd", tmp_logger)

    def test_valid_target_invokes_wbadmin_with_argv_list(
        self, tmp_logger: Logger, monkeypatch: pytest.MonkeyPatch
    ):
        monkeypatch.setattr(
            backup, "list_backup_drives", lambda: [backup.Drive(device_id="D:", drive_type=3)]
        )
        mock_run = MagicMock(return_value=MagicMock(returncode=0))
        monkeypatch.setattr(subprocess, "run", mock_run)

        backup.backup("D", tmp_logger)

        called_cmd = mock_run.call_args[0][0]
        assert called_cmd[0] == "wbadmin"
        assert "-backupTarget:D:" in called_cmd
        assert mock_run.call_args.kwargs.get("shell", False) is not True

    def test_raises_systemexit_on_wbadmin_failure(
        self, tmp_logger: Logger, monkeypatch: pytest.MonkeyPatch
    ):
        monkeypatch.setattr(
            backup, "list_backup_drives", lambda: [backup.Drive(device_id="D:", drive_type=3)]
        )
        monkeypatch.setattr(subprocess, "run", MagicMock(return_value=MagicMock(returncode=3)))

        with pytest.raises(SystemExit) as exc_info:
            backup.backup("D", tmp_logger)
        assert exc_info.value.code == 3

    def test_prompts_for_input_when_target_is_none(
        self, tmp_logger: Logger, monkeypatch: pytest.MonkeyPatch
    ):
        monkeypatch.setattr(
            backup, "list_backup_drives", lambda: [backup.Drive(device_id="D:", drive_type=3)]
        )
        monkeypatch.setattr(subprocess, "run", MagicMock(return_value=MagicMock(returncode=0)))
        monkeypatch.setattr("builtins.input", lambda _: "D")

        backup.backup(None, tmp_logger)  # must not raise
