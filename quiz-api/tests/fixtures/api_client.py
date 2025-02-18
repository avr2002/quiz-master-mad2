import pytest
from flask.testing import FlaskClient

from quiz_api.config import TestConfig
from quiz_api.main import create_app
from quiz_api.models.models import User


@pytest.fixture
def client() -> FlaskClient:
    """Create a test Flask application instance and return its test client."""
    app = create_app(test_config=TestConfig)
    return app.test_client()


@pytest.fixture
def admin_token(client: FlaskClient, admin_user: User) -> str | None:
    """Get JWT token for admin user."""
    response = client.post("/auth/login", json={"email": "admin@test.com", "password": "admin123"})
    return response.json["access_token"]


@pytest.fixture
def user_token(client: FlaskClient, regular_user: User) -> str | None:
    """Get JWT token for regular user."""
    response = client.post("/auth/login", json={"email": "test@test.com", "password": "test123"})
    return response.json["access_token"]
