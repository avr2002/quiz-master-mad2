from http import HTTPStatus

from flask.testing import FlaskClient

from quiz_api.models.models import User


def test_get_all_users_as_admin(client: FlaskClient, admin_token: str, regular_user: User) -> None:
    """Test getting all users as admin."""
    response = client.get("/admin/users", headers={"Authorization": f"Bearer {admin_token}"})

    assert response.status_code == HTTPStatus.OK
    assert isinstance(response.json, list)
    assert len(response.json) == 2  # admin and regular user

    # Verify user data structure
    for user in response.json:
        assert all(key in user for key in ["id", "username", "email", "full_name", "role"])


def test_get_current_user(client: FlaskClient, user_token: str, regular_user: User) -> None:
    """Test getting current user information."""
    response = client.get("/auth/me", headers={"Authorization": f"Bearer {user_token}"})

    assert response.status_code == HTTPStatus.OK
    assert response.json["username"] == regular_user.username
    assert response.json["email"] == regular_user.email
    assert response.json["role"] == "user"


def test_get_user_details(client: FlaskClient, admin_token: str, regular_user: User) -> None:
    """Test getting specific user details as admin."""
    response = client.get(f"/admin/users/{regular_user.id}", headers={"Authorization": f"Bearer {admin_token}"})

    assert response.status_code == HTTPStatus.OK
    assert response.json["username"] == regular_user.username
    assert response.json["email"] == regular_user.email
    assert response.json["role"] == "user"
    assert "joined_at" in response.json
    assert response.json["joined_at"] is not None


def test_admin_can_delete_user(client: FlaskClient, admin_token: str, regular_user: User) -> None:
    """Test admin can delete a user."""
    response = client.delete(f"/admin/users/{regular_user.id}", headers={"Authorization": f"Bearer {admin_token}"})

    assert response.status_code == HTTPStatus.OK
    assert response.json["message"] == "User deleted successfully"
