from __future__ import annotations

from unittest.mock import MagicMock

import pytest
from winkam import system
from winkam.log import Logger
from winkam.shell import RunResult


class TestRepair:
    def test_stops_at_sfc_when_it_succeeds(self, tmp_logger: Logger, monkeypatch: pytest.MonkeyPatch):
        mock_run = MagicMock(return_value=RunResult(returncode=0))
        monkeypatch.setattr(system, "run", mock_run)

        system.repair(tmp_logger)

        mock_run.assert_called_once()
        assert mock_run.call_args[0][0] == ["sfc", "/scannow"]

    def test_falls_back_to_dism_on_sfc_failure(self, tmp_logger: Logger, monkeypatch: pytest.MonkeyPatch):
        mock_run = MagicMock(side_effect=[RunResult(returncode=1), RunResult(returncode=0)])
        monkeypatch.setattr(system, "run", mock_run)

        system.repair(tmp_logger)

        assert mock_run.call_count == 2
        first_cmd = mock_run.call_args_list[0][0][0]
        second_cmd = mock_run.call_args_list[1][0][0]
        assert first_cmd == ["sfc", "/scannow"]
        assert second_cmd == ["DISM", "/Online", "/Cleanup-Image", "/RestoreHealth"]


class TestNetworkReset:
    def test_runs_all_network_reset_commands_in_order(
        self, tmp_logger: Logger, monkeypatch: pytest.MonkeyPatch
    ):
        mock_run = MagicMock(return_value=RunResult(returncode=0))
        monkeypatch.setattr(system, "run", mock_run)

        system.network_reset(tmp_logger)

        commands = [c[0][0] for c in mock_run.call_args_list]
        assert commands == [
            ["netsh", "winsock", "reset"],
            ["netsh", "int", "ip", "reset"],
            ["ipconfig", "/release"],
            ["ipconfig", "/renew"],
            ["ipconfig", "/flushdns"],
        ]

    def test_continues_even_if_a_step_fails(self, tmp_logger: Logger, monkeypatch: pytest.MonkeyPatch):
        mock_run = MagicMock(return_value=RunResult(returncode=1))
        monkeypatch.setattr(system, "run", mock_run)

        system.network_reset(tmp_logger)  # must not raise despite failures

        assert mock_run.call_count == 5
