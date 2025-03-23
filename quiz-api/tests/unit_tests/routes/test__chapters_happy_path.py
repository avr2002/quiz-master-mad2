"""Tests for successful chapter route operations."""

from http import HTTPStatus

from flask.testing import FlaskClient
from quiz_api.models.database import db
from quiz_api.models.models import (
    Chapter,
    Subject,
)


def test_create_chapter_as_admin(client: FlaskClient, admin_token: str, subject: Subject) -> None:
    """Test creating a chapter successfully as admin."""
    subject_id = subject.id

    response = client.post(
        f"/subjects/{subject_id}/chapters",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={
            "name": "Introduction to Python",
            "description": "Learn the basics of Python programming language",
            "subject_id": subject_id,
        },
    )

    assert response.status_code == HTTPStatus.CREATED
    assert response.json["message"] == "Chapter created successfully"
    assert response.json["chapter"]["name"] == "Introduction to Python"
    assert response.json["chapter"]["subject_id"] == subject_id


def test_get_all_chapters(client: FlaskClient, subject: Subject) -> None:
    """Test getting all chapters under a subject."""
    # Create a chapter
    chapter = Chapter(name="Data Types", description="Understanding Python data types", subject_id=subject.id)
    db.session.add(chapter)
    db.session.commit()

    response = client.get(f"/subjects/{subject.id}/chapters")

    assert response.status_code == HTTPStatus.OK
    assert len(response.json) >= 1
    assert any(c["name"] == "Data Types" for c in response.json)


def test_get_chapter_by_id(client: FlaskClient, subject: Subject) -> None:
    """Test getting a specific chapter by ID."""
    chapter = Chapter(name="Functions", description="Learn about Python functions", subject_id=subject.id)
    db.session.add(chapter)
    db.session.commit()

    response = client.get(f"/subjects/{subject.id}/chapters/{chapter.id}")

    assert response.status_code == HTTPStatus.OK
    assert response.json["name"] == "Functions"
    assert response.json["description"] == "Learn about Python functions"
    assert "created_at" in response.json


def test_update_chapter_as_admin(client: FlaskClient, admin_token: str, subject: Subject) -> None:
    """Test updating a chapter as admin."""
    chapter = Chapter(name="Old Chapter", description="Old description", subject_id=subject.id)
    db.session.add(chapter)
    db.session.commit()

    response = client.patch(
        f"/subjects/{subject.id}/chapters/{chapter.id}",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={"name": "Updated Chapter", "description": "Updated description"},
    )

    assert response.status_code == HTTPStatus.OK
    assert response.json["message"] == "Chapter updated successfully"


def test_delete_chapter_as_admin(client: FlaskClient, admin_token: str, subject: Subject) -> None:
    """Test deleting a chapter as admin."""
    chapter = Chapter(name="To Delete", description="Chapter to be deleted", subject_id=subject.id)
    db.session.add(chapter)
    db.session.commit()

    response = client.delete(
        f"/subjects/{subject.id}/chapters/{chapter.id}", headers={"Authorization": f"Bearer {admin_token}"}
    )

    assert response.status_code == HTTPStatus.OK
    assert response.json["message"] == "Chapter deleted successfully"
