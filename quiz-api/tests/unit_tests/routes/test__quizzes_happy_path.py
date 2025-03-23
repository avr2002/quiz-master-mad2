"""Tests for successful quiz route operations."""

from datetime import datetime
from http import HTTPStatus

from flask.testing import FlaskClient
from quiz_api.models.models import (
    Chapter,
    Quiz,
)


def test_create_quiz_as_admin(client: FlaskClient, admin_token: str, chapter: Chapter) -> None:
    """Test creating a quiz successfully as admin."""
    response = client.post(
        f"/chapters/{chapter.id}/quizzes",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={
            "chapter_id": chapter.id,
            "date_of_quiz": datetime.now().isoformat(),
            "time_duration": "01:00",
            "remarks": "Test quiz",
        },
    )

    assert response.status_code == HTTPStatus.CREATED
    assert response.json["message"] == "Quiz created successfully"
    assert response.json["quiz"]["chapter_id"] == chapter.id
    assert response.json["quiz"]["time_duration"] == "01:00"


def test_get_chapter_quizzes(client: FlaskClient, chapter: Chapter, quiz: Quiz) -> None:
    """Test getting all quizzes under a chapter."""
    response = client.get(f"/chapters/{chapter.id}/quizzes")

    assert response.status_code == HTTPStatus.OK
    assert len(response.json) >= 1
    assert any(q["remarks"] == "Test quiz" for q in response.json)


def test_get_quiz_by_id(client: FlaskClient, quiz: Quiz) -> None:
    """Test getting a specific quiz by ID."""
    response = client.get(f"/quizzes/{quiz.id}")

    assert response.status_code == HTTPStatus.OK
    assert response.json["remarks"] == "Test quiz"
    assert response.json["time_duration"] == "01:00"


def test_update_quiz_as_admin(client: FlaskClient, admin_token: str, quiz: Quiz) -> None:
    """Test updating a quiz as admin."""
    response = client.patch(
        f"/quizzes/{quiz.id}",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={"time_duration": "02:00", "remarks": "Updated remarks"},
    )

    assert response.status_code == HTTPStatus.OK
    assert response.json["message"] == "Quiz updated successfully"
    assert response.json["quiz"]["time_duration"] == "02:00"
    assert response.json["quiz"]["remarks"] == "Updated remarks"


def test_delete_quiz_as_admin(client: FlaskClient, admin_token: str, quiz: Quiz) -> None:
    """Test deleting a quiz as admin."""
    response = client.delete(f"/quizzes/{quiz.id}", headers={"Authorization": f"Bearer {admin_token}"})

    assert response.status_code == HTTPStatus.OK
    assert response.json["message"] == "Quiz deleted successfully"
