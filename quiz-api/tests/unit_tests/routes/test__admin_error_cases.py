from http import HTTPStatus

from flask.testing import FlaskClient

from quiz_api.models.models import User


def test_get_all_users_as_regular_user(client: FlaskClient, user_token: str) -> None:
    """Test that regular users cannot access all users list."""
    response = client.get("/admin/users", headers={"Authorization": f"Bearer {user_token}"})

    assert response.status_code == HTTPStatus.FORBIDDEN
    assert response.json["message"] == "Unauthorized"


def test_delete_user_as_regular_user(client: FlaskClient, user_token: str, admin_user: User) -> None:
    """Test that regular users cannot delete users."""
    response = client.delete(f"/admin/users/{admin_user.id}", headers={"Authorization": f"Bearer {user_token}"})

    assert response.status_code == HTTPStatus.FORBIDDEN
    assert response.json["message"] == "Unauthorized"


def test_delete_nonexistent_user(client: FlaskClient, admin_token: str) -> None:
    """Test deleting a user that doesn't exist."""
    response = client.delete("/admin/users/99999", headers={"Authorization": f"Bearer {admin_token}"})

    assert response.status_code == HTTPStatus.NOT_FOUND
    assert response.json["message"] == "User not found"


def test_update_user_with_invalid_data(client: FlaskClient, admin_token: str, regular_user: User) -> None:
    """Test updating a user with invalid data."""
    response = client.patch(
        f"/admin/users/{regular_user.id}",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={"username": "a"},  # Too short username
    )

    assert response.status_code == HTTPStatus.BAD_REQUEST


def test_get_user_details_as_regular_user(client: FlaskClient, user_token: str, admin_user: User) -> None:
    """Test that regular users cannot access user details."""
    response = client.get(f"/admin/users/{admin_user.id}", headers={"Authorization": f"Bearer {user_token}"})

    assert response.status_code == HTTPStatus.FORBIDDEN
    assert response.json["message"] == "Unauthorized"


def test_get_nonexistent_user_details(client: FlaskClient, admin_token: str) -> None:
    """Test getting details of a user that doesn't exist."""
    response = client.get("/admin/users/99999", headers={"Authorization": f"Bearer {admin_token}"})

    assert response.status_code == HTTPStatus.NOT_FOUND
    assert response.json["message"] == "User not found"


def test_get_user_details_as_admin(client: FlaskClient, admin_token: str, regular_user: User) -> None:
    """Test getting specific user details as admin."""
    response = client.get(f"/admin/users/{regular_user.id}", headers={"Authorization": f"Bearer {admin_token}"})

    assert response.status_code == HTTPStatus.OK
    assert response.json["username"] == regular_user.username
    assert response.json["email"] == regular_user.email
    assert response.json["role"] == "user"
