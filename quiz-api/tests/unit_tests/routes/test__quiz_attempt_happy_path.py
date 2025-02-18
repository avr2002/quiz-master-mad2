"""Tests for successful quiz attempt operations."""

from http import HTTPStatus

from flask.testing import FlaskClient

from quiz_api.models.models import (
    Question,
    Quiz,
    Score,
    User,
)


def test_start_quiz_attempt(client: FlaskClient, user_token: str, quiz: Quiz, question: Question) -> None:
    """Test starting a quiz attempt."""
    response = client.get(f"/quizzes/{quiz.id}/attempt", headers={"Authorization": f"Bearer {user_token}"})

    assert response.status_code == HTTPStatus.OK
    assert response.json["total_questions"] == 1
    assert len(response.json["questions"]) >= 1
    assert "correct_option" not in response.json["questions"][0]
    assert response.json["questions"][0]["question_statement"] == "Test question statement"
    assert response.json["questions"][0]["points"] == 2  # Test points from fixture


def test_submit_quiz_answers(client: FlaskClient, user_token: str, quiz: Quiz, question: Question) -> None:
    """Test submitting quiz answers."""
    response = client.post(
        f"/quizzes/{quiz.id}/submit",
        headers={"Authorization": f"Bearer {user_token}"},
        json={"answers": [{"question_id": question.id, "selected_option": 1}]},
    )

    assert response.status_code == HTTPStatus.OK
    assert response.json["message"] == "Quiz submitted successfully"
    assert response.json["correct_answers"] == 1
    assert response.json["score"]["total_score"] == 2


def test_get_user_scores(client: FlaskClient, user_token: str, regular_user: User, score: Score) -> None:
    """Test getting user's quiz history."""
    response = client.get(f"/users/{regular_user.id}/scores", headers={"Authorization": f"Bearer {user_token}"})

    assert response.status_code == HTTPStatus.OK
    assert len(response.json) >= 1
    assert response.json[0]["total_score"] == 2


def test_get_score_details(client: FlaskClient, user_token: str, score: Score) -> None:
    """Test getting specific score details."""
    response = client.get(f"/scores/{score.id}", headers={"Authorization": f"Bearer {user_token}"})

    assert response.status_code == HTTPStatus.OK
    assert response.json["total_score"] == 2
