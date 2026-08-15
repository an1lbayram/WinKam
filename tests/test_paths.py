from __future__ import annotations

import pytest
from winkam.paths import config_path, expand_env_vars, logs_dir, project_root


class TestProjectRoot:
    def test_resolves_to_repo_root(self):
        root = project_root()
        assert (root / "config" / "config.ini").exists()
        assert (root / "py-src" / "winkam").is_dir()


class TestConfigPath:
    def test_points_at_config_ini(self):
        p = config_path()
        assert p.name == "config.ini"
        assert p.parent.name == "config"


class TestLogsDir:
    def test_default_name(self):
        d = logs_dir()
        assert d.name == "logs"

    def test_custom_name(self):
        d = logs_dir("custom_logs")
        assert d.name == "custom_logs"


class TestExpandEnvVars:
    def test_expands_known_var(self, monkeypatch: pytest.MonkeyPatch):
        monkeypatch.setenv("WINKAM_TEST_VAR", "hello")
        assert expand_env_vars("%WINKAM_TEST_VAR%\\sub") == "hello\\sub"

    def test_leaves_unknown_var_untouched(self, monkeypatch: pytest.MonkeyPatch):
        monkeypatch.delenv("WINKAM_UNDEFINED_VAR", raising=False)
        assert expand_env_vars("%WINKAM_UNDEFINED_VAR%") == "%WINKAM_UNDEFINED_VAR%"

    def test_plain_string_passthrough(self):
        assert expand_env_vars("C:\\plain\\path") == "C:\\plain\\path"

    def test_empty_string(self):
        assert expand_env_vars("") == ""
