from app.core.config import Settings


def test_settings_defaults():
    s = Settings(_env_file=None)
    assert s.app_env == "development"
    assert s.frontend_url == "http://localhost:5173"