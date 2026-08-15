from __future__ import annotations

from unittest.mock import MagicMock

import pytest
from winkam import cli
from winkam.log import Logger


class TestBuildParser:
    """API/contract tests for the CLI argument surface."""

    def test_version_flag(self, capsys):
        parser = cli.build_parser()
        with pytest.raises(SystemExit) as exc_info:
            parser.parse_args(["--version"])
        assert exc_info.value.code == 0
        assert "winkam" in capsys.readouterr().out

    def test_requires_a_subcommand(self):
        parser = cli.build_parser()
        with pytest.raises(SystemExit):
            parser.parse_args([])

    def test_clean_defaults_to_safe_mode(self):
        args = cli.build_parser().parse_args(["clean"])
        assert args.cmd == "clean"
        assert args.mode == "safe"

    @pytest.mark.parametrize("mode", ["safe", "advanced", "dry-run"])
    def test_clean_accepts_valid_modes(self, mode):
        args = cli.build_parser().parse_args(["clean", "--mode", mode])
        assert args.mode == mode

    def test_clean_rejects_invalid_mode(self):
        with pytest.raises(SystemExit):
            cli.build_parser().parse_args(["clean", "--mode", "nuke-everything"])

    def test_repair_subcommand(self):
        args = cli.build_parser().parse_args(["repair"])
        assert args.cmd == "repair"

    def test_network_subcommand(self):
        args = cli.build_parser().parse_args(["network"])
        assert args.cmd == "network"

    def test_backup_subcommand_with_target(self):
        args = cli.build_parser().parse_args(["backup", "--target", "D"])
        assert args.cmd == "backup"
        assert args.target == "D"

    def test_backup_target_defaults_to_none(self):
        args = cli.build_parser().parse_args(["backup"])
        assert args.target is None

    def test_unknown_subcommand_rejected(self):
        with pytest.raises(SystemExit):
            cli.build_parser().parse_args(["format-c-drive"])


class TestMain:
    """Functional QA: end-to-end main() dispatch with all side effects mocked."""

    @pytest.fixture(autouse=True)
    def _mock_environment(self, monkeypatch: pytest.MonkeyPatch, tmp_logger: Logger, sample_config_path):
        monkeypatch.setattr(cli, "load_config", lambda path: _load_stub_config(sample_config_path))
        monkeypatch.setattr(cli, "make_logger", lambda logs_dir, run_id: tmp_logger)
        monkeypatch.setattr(cli, "config_path", lambda: sample_config_path)
        monkeypatch.setattr(cli, "logs_dir", lambda default: tmp_logger.log_file.parent)

    def test_dry_run_does_not_require_admin(self, monkeypatch: pytest.MonkeyPatch):
        require_admin_mock = MagicMock()
        monkeypatch.setattr(cli, "require_admin", require_admin_mock)
        monkeypatch.setattr(cli, "do_clean", MagicMock())

        cli.main(["clean", "--mode", "dry-run"])

        require_admin_mock.assert_not_called()

    def test_safe_mode_requires_admin(self, monkeypatch: pytest.MonkeyPatch):
        require_admin_mock = MagicMock()
        monkeypatch.setattr(cli, "require_admin", require_admin_mock)
        monkeypatch.setattr(cli, "do_clean", MagicMock())

        cli.main(["clean", "--mode", "safe"])

        require_admin_mock.assert_called_once()

    def test_advanced_mode_requires_admin(self, monkeypatch: pytest.MonkeyPatch):
        require_admin_mock = MagicMock()
        monkeypatch.setattr(cli, "require_admin", require_admin_mock)
        monkeypatch.setattr(cli, "do_clean", MagicMock())

        cli.main(["clean", "--mode", "advanced"])

        require_admin_mock.assert_called_once()

    def test_repair_dispatches_to_repair_module(self, monkeypatch: pytest.MonkeyPatch):
        monkeypatch.setattr(cli, "require_admin", MagicMock())
        repair_mock = MagicMock()
        monkeypatch.setattr(cli, "repair", repair_mock)

        cli.main(["repair"])

        repair_mock.assert_called_once()

    def test_network_dispatches_to_network_reset(self, monkeypatch: pytest.MonkeyPatch):
        monkeypatch.setattr(cli, "require_admin", MagicMock())
        network_mock = MagicMock()
        monkeypatch.setattr(cli, "network_reset", network_mock)

        cli.main(["network"])

        network_mock.assert_called_once()

    def test_backup_dispatches_with_target(self, monkeypatch: pytest.MonkeyPatch):
        monkeypatch.setattr(cli, "require_admin", MagicMock())
        backup_mock = MagicMock()
        monkeypatch.setattr(cli, "backup", backup_mock)

        cli.main(["backup", "--target", "D"])

        backup_mock.assert_called_once()
        assert backup_mock.call_args[0][0] == "D"


def _load_stub_config(sample_config_path):
    from winkam.config import load_config

    return load_config(sample_config_path)
