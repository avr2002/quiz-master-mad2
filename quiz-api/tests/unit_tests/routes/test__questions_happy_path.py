"""Tests for successful question route operations."""

from http import HTTPStatus

from flask.testing import FlaskClient

from quiz_api.models.models import (
    Question,
    Quiz,
)


def test_create_question_as_admin(client: FlaskClient, admin_token: str, quiz: Quiz) -> None:
    """Test creating a question successfully as admin."""
    response = client.post(
        f"/quizzes/{quiz.id}/questions",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={
            "quiz_id": quiz.id,
            "question_statement": "What is Python?",
            "option1": "A programming language",
            "option2": "A snake",
            "option3": "A movie",
            "option4": "A book",
            "correct_option": 1,
        },
    )

    assert response.status_code == HTTPStatus.CREATED
    assert response.json["message"] == "Question created successfully"
    assert response.json["question"]["question_statement"] == "What is Python?"
    assert response.json["question"]["correct_option"] == 1


def test_get_quiz_questions(client: FlaskClient, admin_token: str, quiz: Quiz, question: Question) -> None:
    """Test getting all questions under a quiz."""
    response = client.get(f"/quizzes/{quiz.id}/questions", headers={"Authorization": f"Bearer {admin_token}"})

    assert response.status_code == HTTPStatus.OK
    assert len(response.json) >= 1
    assert any(q["question_statement"] == "Test question statement" for q in response.json)


def test_get_question_by_id(client: FlaskClient, admin_token: str, question: Question) -> None:
    """Test getting a specific question by ID."""
    response = client.get(f"/questions/{question.id}", headers={"Authorization": f"Bearer {admin_token}"})

    assert response.status_code == HTTPStatus.OK
    assert response.json["question_statement"] == "Test question statement"
    assert response.json["correct_option"] == 1


def test_update_question_as_admin(client: FlaskClient, admin_token: str, question: Question) -> None:
    """Test updating a question as admin."""
    response = client.patch(
        f"/questions/{question.id}",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={"question_statement": "Updated question", "correct_option": 2},
    )

    assert response.status_code == HTTPStatus.OK
    assert response.json["message"] == "Question updated successfully"
    assert response.json["question"]["question_statement"] == "Updated question"
    assert response.json["question"]["correct_option"] == 2


def test_delete_question_as_admin(client: FlaskClient, admin_token: str, question: Question) -> None:
    """Test deleting a question as admin."""
    response = client.delete(f"/questions/{question.id}", headers={"Authorization": f"Bearer {admin_token}"})

    assert response.status_code == HTTPStatus.OK
    assert response.json["message"] == "Question deleted successfully"
