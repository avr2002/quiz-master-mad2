"""Tests for quiz route error cases."""

from datetime import datetime
from http import HTTPStatus

from flask.testing import FlaskClient
from quiz_api.models.models import (
    Chapter,
    Quiz,
)


def test_create_quiz_as_regular_user(client: FlaskClient, user_token: str, chapter: Chapter) -> None:
    """Test that regular users cannot create quizzes."""
    response = client.post(
        f"/chapters/{chapter.id}/quizzes",
        headers={"Authorization": f"Bearer {user_token}"},
        json={"chapter_id": chapter.id, "date_of_quiz": datetime.now().isoformat(), "time_duration": "01:00"},
    )

    assert response.status_code == HTTPStatus.FORBIDDEN
    assert response.json["message"] == "Unauthorized"


def test_create_quiz_with_invalid_chapter(client: FlaskClient, admin_token: str) -> None:
    """Test creating a quiz with non-existent chapter."""
    response = client.post(
        "/chapters/99999/quizzes",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={"chapter_id": 99999, "date_of_quiz": datetime.now().isoformat(), "time_duration": "01:00"},
    )

    assert response.status_code == HTTPStatus.NOT_FOUND
    assert response.json["message"] == "Chapter not found"


def test_get_quizzes_with_invalid_chapter(client: FlaskClient) -> None:
    """Test getting quizzes from non-existent chapter."""
    response = client.get("/chapters/99999/quizzes")

    assert response.status_code == HTTPStatus.NOT_FOUND
    assert response.json["message"] == "Chapter not found"


def test_get_nonexistent_quiz(client: FlaskClient, user_token: str, quiz: Quiz) -> None:
    """Test getting a quiz that doesn't exist."""
    nonexistent_id = quiz.id + 1
    response = client.get(f"/quizzes/{nonexistent_id}", headers={"Authorization": f"Bearer {user_token}"})

    assert response.status_code == HTTPStatus.NOT_FOUND
    assert response.json["message"] == "Quiz not found"


def test_update_quiz_as_regular_user(client: FlaskClient, user_token: str, quiz: Quiz) -> None:
    """Test that regular users cannot update quizzes."""
    response = client.patch(
        f"/quizzes/{quiz.id}", headers={"Authorization": f"Bearer {user_token}"}, json={"time_duration": "02:00"}
    )

    assert response.status_code == HTTPStatus.FORBIDDEN
    assert response.json["message"] == "Unauthorized"


def test_update_nonexistent_quiz(client: FlaskClient, admin_token: str) -> None:
    """Test updating a non-existent quiz."""
    response = client.patch(
        "/quizzes/99999", headers={"Authorization": f"Bearer {admin_token}"}, json={"time_duration": "02:00"}
    )

    assert response.status_code == HTTPStatus.NOT_FOUND
    assert response.json["message"] == "Quiz not found"


def test_delete_quiz_as_regular_user(client: FlaskClient, user_token: str, quiz: Quiz) -> None:
    """Test that regular users cannot delete quizzes."""
    response = client.delete(f"/quizzes/{quiz.id}", headers={"Authorization": f"Bearer {user_token}"})

    assert response.status_code == HTTPStatus.FORBIDDEN
    assert response.json["message"] == "Unauthorized"


def test_delete_nonexistent_quiz(client: FlaskClient, admin_token: str) -> None:
    """Test deleting a non-existent quiz."""
    response = client.delete("/quizzes/99999", headers={"Authorization": f"Bearer {admin_token}"})

    assert response.status_code == HTTPStatus.NOT_FOUND
    assert response.json["message"] == "Quiz not found"
