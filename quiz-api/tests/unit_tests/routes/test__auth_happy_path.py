from http import HTTPStatus

from flask.testing import FlaskClient

from quiz_api.models.models import User


def test_user_registration_success(client: FlaskClient) -> None:
    """Test successful user registration."""
    response = client.post(
        "/auth/register",
        json={
            "username": "newuser",
            "password": "password123",
            "full_name": "New User",
            "email": "newuser@test.com",
            "dob": "01/01/2000",  # Keep as string, UserSchema will parse it
            "role": "user",
        },
    )

    assert response.status_code == HTTPStatus.CREATED
    assert response.json["message"] == "User registered successfully"


def test_user_login_with_email_success(client: FlaskClient, regular_user: User) -> None:
    """Test successful user login using email."""
    response = client.post("/auth/login", json={"email": "test@test.com", "password": "test123"})

    assert response.status_code == HTTPStatus.OK
    assert "access_token" in response.json
    assert response.json["user"]["email"] == regular_user.email
    assert response.json["user"]["role"] == "user"


def test_user_login_with_username_success(client: FlaskClient, regular_user: User) -> None:
    """Test successful user login using username."""
    response = client.post("/auth/login", json={"username": "testuser", "password": "test123"})

    assert response.status_code == HTTPStatus.OK
    assert "access_token" in response.json
    assert response.json["user"]["username"] == regular_user.username


def test_password_is_hashed(client: FlaskClient) -> None:
    """Test that user password is properly hashed during registration."""
    user_data = {
        "username": "hashtest",
        "password": "password123",
        "full_name": "Hash Test",
        "email": "hash@test.com",
        "dob": "01/01/2000",
        "role": "user",
    }

    response = client.post("/auth/register", json=user_data)
    assert response.status_code == HTTPStatus.CREATED

    # Login to verify the password works
    login_response = client.post("/auth/login", json={"email": user_data["email"], "password": user_data["password"]})
    assert login_response.status_code == HTTPStatus.OK


def test_logout_success(client: FlaskClient, user_token: str) -> None:
    """Test successful logout."""
    response = client.get("/auth/logout", headers={"Authorization": f"Bearer {user_token}"})

    assert response.status_code == HTTPStatus.OK
    assert response.json["message"] == "Successfully logged out"

    # Verify token is blacklisted by trying to use it again
    response = client.get("/auth/me", headers={"Authorization": f"Bearer {user_token}"})
    assert response.status_code == HTTPStatus.UNAUTHORIZED


def test_get_current_user(client: FlaskClient, user_token: str, regular_user: User) -> None:
    """Test getting current user information successfully."""
    response = client.get("/auth/me", headers={"Authorization": f"Bearer {user_token}"})

    assert response.status_code == HTTPStatus.OK
    assert response.json["username"] == regular_user.username
    assert response.json["email"] == regular_user.email
    assert response.json["role"] == "user"
    assert "joined_at" in response.json
    assert response.json["joined_at"] is not None
    assert response.json["dob"] == "01/01/2000"
