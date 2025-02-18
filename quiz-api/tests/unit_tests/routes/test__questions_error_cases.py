"""Tests for question route error cases."""

from http import HTTPStatus

from flask.testing import FlaskClient

from quiz_api.models.models import (
    Question,
    Quiz,
)


def test_create_question_as_regular_user(client: FlaskClient, user_token: str, quiz: Quiz) -> None:
    """Test that regular users cannot create questions."""
    response = client.post(
        f"/quizzes/{quiz.id}/questions",
        headers={"Authorization": f"Bearer {user_token}"},
        json={
            "quiz_id": quiz.id,
            "question_statement": "Test question",
            "option1": "Option 1",
            "option2": "Option 2",
            "option3": "Option 3",
            "option4": "Option 4",
            "correct_option": 1,
        },
    )

    assert response.status_code == HTTPStatus.FORBIDDEN
    assert response.json["message"] == "Unauthorized"


def test_create_question_with_invalid_quiz(client: FlaskClient, admin_token: str) -> None:
    """Test creating a question with non-existent quiz."""
    response = client.post(
        "/quizzes/99999/questions",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={
            "quiz_id": 99999,
            "question_statement": "Test question",
            "option1": "Option 1",
            "option2": "Option 2",
            "option3": "Option 3",
            "option4": "Option 4",
            "correct_option": 1,
        },
    )

    assert response.status_code == HTTPStatus.NOT_FOUND
    assert response.json["message"] == "Quiz not found"


def test_get_questions_with_invalid_quiz(client: FlaskClient, admin_token: str) -> None:
    """Test getting questions from non-existent quiz."""
    response = client.get("/quizzes/99999/questions", headers={"Authorization": f"Bearer {admin_token}"})

    assert response.status_code == HTTPStatus.NOT_FOUND
    assert response.json["message"] == "Quiz not found"


def test_get_nonexistent_question(client: FlaskClient, admin_token: str) -> None:
    """Test getting a non-existent question."""
    response = client.get("/questions/99999", headers={"Authorization": f"Bearer {admin_token}"})

    assert response.status_code == HTTPStatus.NOT_FOUND
    assert response.json["message"] == "Question not found"


def test_update_question_as_regular_user(client: FlaskClient, user_token: str, question: Question) -> None:
    """Test that regular users cannot update questions."""
    response = client.patch(
        f"/questions/{question.id}",
        headers={"Authorization": f"Bearer {user_token}"},
        json={"question_statement": "Updated question"},
    )

    assert response.status_code == HTTPStatus.FORBIDDEN
    assert response.json["message"] == "Unauthorized"


def test_update_nonexistent_question(client: FlaskClient, admin_token: str) -> None:
    """Test updating a non-existent question."""
    response = client.patch(
        "/questions/99999",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={"question_statement": "Updated question"},
    )

    assert response.status_code == HTTPStatus.NOT_FOUND
    assert response.json["message"] == "Question not found"


def test_delete_question_as_regular_user(client: FlaskClient, user_token: str, question: Question) -> None:
    """Test that regular users cannot delete questions."""
    response = client.delete(f"/questions/{question.id}", headers={"Authorization": f"Bearer {user_token}"})

    assert response.status_code == HTTPStatus.FORBIDDEN
    assert response.json["message"] == "Unauthorized"


def test_delete_nonexistent_question(client: FlaskClient, admin_token: str) -> None:
    """Test deleting a non-existent question."""
    response = client.delete("/questions/99999", headers={"Authorization": f"Bearer {admin_token}"})

    assert response.status_code == HTTPStatus.NOT_FOUND
    assert response.json["message"] == "Question not found"
