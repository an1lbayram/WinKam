from __future__ import annotations

from unittest.mock import MagicMock

import pytest
from winkam import admin


class TestIsWindows:
    def test_true_when_os_name_nt(self, monkeypatch: pytest.MonkeyPatch):
        monkeypatch.setattr(admin.os, "name", "nt")
        assert admin.is_windows() is True

    def test_false_when_os_name_posix(self, monkeypatch: pytest.MonkeyPatch):
        monkeypatch.setattr(admin.os, "name", "posix")
        assert admin.is_windows() is False


class TestIsAdmin:
    def test_uses_ctypes_shell32_on_windows(self, monkeypatch: pytest.MonkeyPatch):
        monkeypatch.setattr(admin, "is_windows", lambda: True)
        fake_ctypes = MagicMock()
        fake_ctypes.windll.shell32.IsUserAnAdmin.return_value = 1
        monkeypatch.setitem(__import__("sys").modules, "ctypes", fake_ctypes)

        assert admin.is_admin() is True
        fake_ctypes.windll.shell32.IsUserAnAdmin.assert_called_once()

    def test_returns_false_on_ctypes_error(self, monkeypatch: pytest.MonkeyPatch):
        monkeypatch.setattr(admin, "is_windows", lambda: True)
        fake_ctypes = MagicMock()
        fake_ctypes.windll.shell32.IsUserAnAdmin.side_effect = OSError("boom")
        monkeypatch.setitem(__import__("sys").modules, "ctypes", fake_ctypes)

        assert admin.is_admin() is False

    def test_uses_geteuid_on_non_windows(self, monkeypatch: pytest.MonkeyPatch):
        monkeypatch.setattr(admin, "is_windows", lambda: False)
        monkeypatch.setattr(admin.os, "geteuid", lambda: 0, raising=False)
        assert admin.is_admin() is True

        monkeypatch.setattr(admin.os, "geteuid", lambda: 1000, raising=False)
        assert admin.is_admin() is False


class TestRequireAdmin:
    def test_passes_silently_when_admin(self, monkeypatch: pytest.MonkeyPatch):
        monkeypatch.setattr(admin, "is_admin", lambda: True)
        admin.require_admin()  # must not raise

    def test_exits_with_code_1_when_not_admin(self, monkeypatch: pytest.MonkeyPatch, capsys):
        monkeypatch.setattr(admin, "is_admin", lambda: False)
        with pytest.raises(SystemExit) as exc_info:
            admin.require_admin()
        assert exc_info.value.code == 1
        out = capsys.readouterr().out
        assert "YONETICI YETKISI GEREKLI" in out
