"""Tests for chapter route error cases."""

from http import HTTPStatus

from flask.testing import FlaskClient

from quiz_api.models.database import db
from quiz_api.models.models import (
    Chapter,
    Subject,
)


def test_create_chapter_as_regular_user(client: FlaskClient, user_token: str, subject: Subject) -> None:
    """Test that regular users cannot create chapters."""
    response = client.post(
        f"/subjects/{subject.id}/chapters",
        headers={"Authorization": f"Bearer {user_token}"},
        json={"name": "Test Chapter", "description": "Test Description", "subject_id": subject.id},
    )

    assert response.status_code == HTTPStatus.FORBIDDEN


def test_create_chapter_with_invalid_subject(client: FlaskClient, admin_token: str) -> None:
    """Test creating a chapter with non-existent subject."""
    response = client.post(
        "/subjects/999/chapters",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={"name": "Test Chapter", "description": "Test Description", "subject_id": 999},
    )

    assert response.status_code == HTTPStatus.NOT_FOUND


def test_get_chapter_with_wrong_subject(client: FlaskClient, subject: Subject, chapter: Chapter) -> None:
    """Test getting a chapter with wrong subject ID."""
    # Create another subject
    other_subject = Subject(name="Other Subject", description="Other Description")
    db.session.add(other_subject)
    db.session.commit()

    response = client.get(f"/subjects/{other_subject.id}/chapters/{chapter.id}")

    assert response.status_code == HTTPStatus.NOT_FOUND


def test_update_chapter_as_regular_user(
    client: FlaskClient, user_token: str, subject: Subject, chapter: Chapter
) -> None:
    """Test that regular users cannot update chapters."""
    response = client.patch(
        f"/subjects/{subject.id}/chapters/{chapter.id}",
        headers={"Authorization": f"Bearer {user_token}"},
        json={"name": "Updated Name", "description": "Updated Description"},
    )

    assert response.status_code == HTTPStatus.FORBIDDEN


def test_delete_chapter_as_regular_user(
    client: FlaskClient, user_token: str, subject: Subject, chapter: Chapter
) -> None:
    """Test that regular users cannot delete chapters."""
    response = client.delete(
        f"/subjects/{subject.id}/chapters/{chapter.id}", headers={"Authorization": f"Bearer {user_token}"}
    )

    assert response.status_code == HTTPStatus.FORBIDDEN


def test_update_chapter_with_invalid_data(
    client: FlaskClient, admin_token: str, subject: Subject, chapter: Chapter
) -> None:
    """Test updating a chapter with invalid data."""
    response = client.patch(
        f"/subjects/{subject.id}/chapters/{chapter.id}",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={"name": "a", "description": "short"},  # Too short  # Too short
    )

    assert response.status_code == HTTPStatus.BAD_REQUEST
