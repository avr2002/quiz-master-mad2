from http import HTTPStatus

from flask.testing import FlaskClient
from werkzeug.test import TestResponse

from quiz_api.models.database import db
from quiz_api.models.models import User


def test_register_with_existing_email(client: FlaskClient, regular_user: User):
    """Test registration with an email that already exists."""
    response: TestResponse = client.post(
        "/auth/register",
        json={
            "username": "newuser",
            "password": "password123",
            "full_name": "New User",
            "email": "test@test.com",  # Same email as regular_user
            "role": "user",
            "dob": "01/01/2000",
        },
    )

    assert response.status_code == HTTPStatus.BAD_REQUEST
    assert response.json["message"] == "Email already registered"


def test_register_with_existing_username(client: FlaskClient, regular_user: User):
    """Test registration with a username that already exists."""
    response: TestResponse = client.post(
        "/auth/register",
        json={
            "username": "testuser",  # Same username as regular_user
            "password": "password123",
            "full_name": "New User",
            "email": "new@test.com",
            "role": "user",
            "dob": "01/01/2000",
        },
    )

    assert response.status_code == HTTPStatus.BAD_REQUEST
    assert response.json["message"] == "Username already taken"


def test_register_as_admin(client: FlaskClient):
    """Test that users cannot register as admin."""
    response: TestResponse = client.post(
        "/auth/register",
        json={
            "username": "newadmin",
            "password": "password123",
            "full_name": "New Admin",
            "email": "newadmin@test.com",
            "role": "admin",
        },
    )

    assert response.status_code == HTTPStatus.FORBIDDEN
    assert response.json["message"] == "Admin registration not allowed"


def test_login_with_invalid_credentials(client: FlaskClient):
    """Test login with wrong password."""
    response: TestResponse = client.post("/auth/login", json={"email": "test@test.com", "password": "wrongpassword"})

    assert response.status_code == HTTPStatus.UNAUTHORIZED
    assert response.json["message"] == "Invalid credentials"


def test_login_with_nonexistent_user(client: FlaskClient):
    """Test login with email that doesn't exist."""
    response: TestResponse = client.post(
        "/auth/login", json={"email": "nonexistent@test.com", "password": "password123"}
    )

    assert response.status_code == HTTPStatus.UNAUTHORIZED
    assert response.json["message"] == "Invalid credentials"


def test_login_without_credentials(client: FlaskClient):
    """Test login without providing credentials."""
    response: TestResponse = client.post("/auth/login", json={})

    assert response.status_code == HTTPStatus.BAD_REQUEST
    assert response.json["message"] == "Email/username and password are required"


def test_register_with_invalid_email_format(client: FlaskClient):
    """Test registration with invalid email format."""
    response: TestResponse = client.post(
        "/auth/register",
        json={
            "username": "newuser",
            "password": "password123",
            "full_name": "New User",
            "email": "invalid-email",
            "role": "user",
            "dob": "01/01/2000",
        },
    )

    assert response.status_code == HTTPStatus.BAD_REQUEST
    assert "details" in response.json  # Pydantic validation error


def test_logout_without_token(client: FlaskClient) -> None:
    """Test logout without authentication token."""
    response = client.get("/auth/logout")

    assert response.status_code == HTTPStatus.UNAUTHORIZED


def test_logout_with_invalid_token(client: FlaskClient) -> None:
    """Test logout with invalid token."""
    response = client.get("/auth/logout", headers={"Authorization": "Bearer invalid-token"})

    assert response.status_code == HTTPStatus.UNPROCESSABLE_ENTITY


def test_get_current_user_without_token(client: FlaskClient) -> None:
    """Test getting current user without authentication token."""
    response = client.get("/auth/me")

    assert response.status_code == HTTPStatus.UNAUTHORIZED


def test_get_current_user_with_invalid_token(client: FlaskClient) -> None:
    """Test getting current user with invalid token."""
    response = client.get("/auth/me", headers={"Authorization": "Bearer invalid-token"})

    assert response.status_code == HTTPStatus.UNPROCESSABLE_ENTITY


def test_get_current_user_nonexistent(client: FlaskClient, user_token: str, regular_user: User) -> None:
    """Test getting current user when user has been deleted."""
    # First delete the regular user
    db.session.delete(regular_user)
    db.session.commit()

    # Try to get user info with the old token
    response = client.get("/auth/me", headers={"Authorization": f"Bearer {user_token}"})

    assert response.status_code == HTTPStatus.NOT_FOUND
    assert response.json["message"] == "User not found"


def test_register_with_invalid_data_format(client: FlaskClient) -> None:
    """Test registration with invalid data format."""
    response = client.post(
        "/auth/register",
        json={
            "username": "",  # empty username
            "password": "short",  # too short password
            "full_name": "",  # empty full name
            "email": "invalid-email",  # invalid email format
            "dob": "2024-01/01",  # wrong date format, should be DD/MM/YYYY OR DD-MM-YYYY
            "role": "invalid_role",  # invalid role
        },
    )

    assert response.status_code == HTTPStatus.BAD_REQUEST
    assert "details" in response.json

    errors = {error["msg"] for error in response.json["details"]}
    assert "String should have at least 3 characters" in errors  # username
    assert "String should have at least 6 characters" in errors  # password
    assert "String should have at least 1 character" in errors  # full_name
    assert "value is not a valid email address: An email address must have an @-sign." in errors
    assert "Value error, Invalid date format. Use DD/MM/YYYY or DD-MM-YYYY or YYYY-MM-DD or YYYY/MM/DD" in errors
    assert "String should match pattern '^(admin|user)$'" in errors  # role


def test_register_with_missing_required_fields(client: FlaskClient) -> None:
    """Test registration with missing required fields."""
    response = client.post("/auth/register", json={"username": "testuser"})  # Missing other required fields

    assert response.status_code == HTTPStatus.BAD_REQUEST
    assert "details" in response.json

    # Check that validation caught all missing required fields
    missing_fields = {error["msg"] for error in response.json["details"]}
    assert "Field required" in missing_fields
