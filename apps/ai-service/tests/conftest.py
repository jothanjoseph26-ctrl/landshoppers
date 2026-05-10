import os

import pytest

os.environ.setdefault("AI_FIXTURE_MODE", "true")


@pytest.fixture()
def client():
    from fastapi.testclient import TestClient

    from app.main import app

    with TestClient(app) as test_client:
        yield test_client
