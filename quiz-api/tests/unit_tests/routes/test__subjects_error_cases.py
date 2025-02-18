"""Tests for error cases in subject routes."""

from http import HTTPStatus

from flask.testing import FlaskClient


def test_create_subject_without_auth(client: FlaskClient) -> None:
    """Test creating a subject without authentication."""
    response = client.post(
        "/subjects", json={"name": "Mathematics", "description": "Learn advanced mathematics concepts"}
    )

    assert response.status_code == HTTPStatus.UNAUTHORIZED


def test_create_subject_as_regular_user(client: FlaskClient, user_token: str) -> None:
    """Test that regular users cannot create subjects."""
    response = client.post(
        "/subjects",
        headers={"Authorization": f"Bearer {user_token}"},
        json={"name": "Mathematics", "description": "Learn advanced mathematics concepts"},
    )

    assert response.status_code == HTTPStatus.FORBIDDEN
    assert response.json["message"] == "Unauthorized"


def test_create_subject_with_invalid_data(client: FlaskClient, admin_token: str) -> None:
    """Test creating a subject with invalid data."""
    response = client.post(
        "/subjects",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={"name": "M", "description": "Too short"},  # Too short  # Too short
    )

    assert response.status_code == HTTPStatus.BAD_REQUEST


def test_get_nonexistent_subject(client: FlaskClient) -> None:
    """Test getting a subject that doesn't exist."""
    response = client.get("/subjects/99999")

    assert response.status_code == HTTPStatus.NOT_FOUND
    assert response.json["message"] == "Subject not found"


def test_update_subject_without_auth(client: FlaskClient) -> None:
    """Test updating a subject without authentication."""
    response = client.patch(
        "/subjects/1", json={"name": "New Name", "description": "New description that is long enough"}
    )

    assert response.status_code == HTTPStatus.UNAUTHORIZED


def test_update_subject_as_regular_user(client: FlaskClient, user_token: str) -> None:
    """Test that regular users cannot update subjects."""
    response = client.patch(
        "/subjects/1",
        headers={"Authorization": f"Bearer {user_token}"},
        json={"name": "New Name", "description": "New description that is long enough"},
    )

    assert response.status_code == HTTPStatus.FORBIDDEN
    assert response.json["message"] == "Unauthorized"


def test_update_nonexistent_subject(client: FlaskClient, admin_token: str) -> None:
    """Test updating a subject that doesn't exist."""
    response = client.patch(
        "/subjects/99999",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={"name": "New Name", "description": "New description that is long enough"},
    )

    assert response.status_code == HTTPStatus.NOT_FOUND
    assert response.json["message"] == "Subject not found"


def test_delete_subject_without_auth(client: FlaskClient) -> None:
    """Test deleting a subject without authentication."""
    response = client.delete("/subjects/1")

    assert response.status_code == HTTPStatus.UNAUTHORIZED


def test_delete_subject_as_regular_user(client: FlaskClient, user_token: str) -> None:
    """Test that regular users cannot delete subjects."""
    response = client.delete("/subjects/1", headers={"Authorization": f"Bearer {user_token}"})

    assert response.status_code == HTTPStatus.FORBIDDEN
    assert response.json["message"] == "Unauthorized"


def test_delete_nonexistent_subject(client: FlaskClient, admin_token: str) -> None:
    """Test deleting a subject that doesn't exist."""
    response = client.delete("/subjects/99999", headers={"Authorization": f"Bearer {admin_token}"})

    assert response.status_code == HTTPStatus.NOT_FOUND
    assert response.json["message"] == "Subject not found"
