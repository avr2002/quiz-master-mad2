"""Tests for user search functionality."""

from http import HTTPStatus

from flask.testing import FlaskClient
from quiz_api.models.database import db
from quiz_api.models.models import User
from werkzeug.security import generate_password_hash


def test_search_users_unauthorized(client: FlaskClient, user_token: str) -> None:
    """Test that regular users cannot search users."""
    response = client.get("/admin/users/search", headers={"Authorization": f"Bearer {user_token}"})

    assert response.status_code == HTTPStatus.FORBIDDEN
    assert response.json["message"] == "Unauthorized"


def test_search_users_empty_query(client: FlaskClient, admin_token: str, regular_user: User) -> None:
    """Test searching users with empty query returns all users."""
    # Create additional users
    users = [
        User(
            username="john_doe",
            password=generate_password_hash("password"),
            full_name="John Doe",
            email="john@example.com",
            role="user",
        ),
        User(
            username="jane_smith",
            password=generate_password_hash("password"),
            full_name="Jane Smith",
            email="jane@example.com",
            role="user",
        ),
        User(
            username="bob_jones",
            password=generate_password_hash("password"),
            full_name="Bob Jones",
            email="bob@example.com",
            role="user",
        ),
    ]
    db.session.add_all(users)
    db.session.commit()

    response = client.get("/admin/users/search", headers={"Authorization": f"Bearer {admin_token}"})

    assert response.status_code == HTTPStatus.OK
    assert "items" in response.json
    assert len(response.json["items"]) >= 5  # Admin, regular_user fixture, and 3 new users
    assert response.json["total"] >= 5
    assert response.json["limit"] == 10  # Default limit
    assert response.json["offset"] == 0  # Default offset


def test_search_users_with_query(client: FlaskClient, admin_token: str) -> None:
    """Test searching users with a specific query."""
    # Create users with specific terms for searching
    users = [
        User(
            username="teacher1",
            password=generate_password_hash("password"),
            full_name="Math Teacher",
            email="math@school.com",
            role="user",
        ),
        User(
            username="teacher2",
            password=generate_password_hash("password"),
            full_name="Science Teacher",
            email="science@school.com",
            role="user",
        ),
        User(
            username="student1",
            password=generate_password_hash("password"),
            full_name="John Student",
            email="john@school.com",
            role="user",
        ),
    ]
    db.session.add_all(users)
    db.session.commit()

    response = client.get("/admin/users/search?q=teacher", headers={"Authorization": f"Bearer {admin_token}"})

    assert response.status_code == HTTPStatus.OK
    assert "items" in response.json
    assert len(response.json["items"]) >= 2  # Should find at least 2 users with "teacher"
    assert all(
        "teacher" in item["username"].lower() or "teacher" in item["full_name"].lower()
        for item in response.json["items"]
    )


def test_search_users_with_pagination(client: FlaskClient, admin_token: str) -> None:
    """Test searching users with pagination parameters."""
    # Create multiple users
    users = []
    for i in range(15):
        users.append(
            User(
                username=f"user{i}",
                password=generate_password_hash("password"),
                full_name=f"User {i}",
                email=f"user{i}@example.com",
                role="user",
            )
        )
    db.session.add_all(users)
    db.session.commit()

    # Test with limit and offset
    response = client.get("/admin/users/search?limit=5&offset=5", headers={"Authorization": f"Bearer {admin_token}"})

    assert response.status_code == HTTPStatus.OK
    assert "items" in response.json
    assert len(response.json["items"]) == 5  # Should return exactly 5 items
    assert response.json["limit"] == 5
    assert response.json["offset"] == 5


def test_search_users_with_invalid_params(client: FlaskClient, admin_token: str) -> None:
    """Test searching users with invalid parameters."""
    response = client.get(
        "/admin/users/search?limit=invalid&offset=invalid", headers={"Authorization": f"Bearer {admin_token}"}
    )

    assert response.status_code == HTTPStatus.BAD_REQUEST
    assert "details" in response.json  # Pydantic validation error


def test_search_users_no_results(client: FlaskClient, admin_token: str) -> None:
    """Test searching users with a query that returns no results."""
    response = client.get(
        "/admin/users/search?q=nonexistentterm123456789", headers={"Authorization": f"Bearer {admin_token}"}
    )

    assert response.status_code == HTTPStatus.OK
    assert "items" in response.json
    assert len(response.json["items"]) == 0
    assert response.json["total"] == 0


def test_search_users_password_not_exposed(client: FlaskClient, admin_token: str, regular_user: User) -> None:
    """Test that user passwords are not exposed in search results."""
    response = client.get(
        f"/admin/users/search?q={regular_user.username}", headers={"Authorization": f"Bearer {admin_token}"}
    )

    assert response.status_code == HTTPStatus.OK
    assert "items" in response.json
    assert len(response.json["items"]) >= 1

    # Check that password is masked or not included
    for user in response.json["items"]:
        if "password" in user:
            assert user["password"] == "********"  # Password should be masked
