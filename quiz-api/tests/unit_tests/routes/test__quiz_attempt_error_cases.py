"""Tests for quiz attempt error cases."""

from http import HTTPStatus

from flask.testing import FlaskClient

from quiz_api.models.database import db
from quiz_api.models.models import (
    Quiz,
    Score,
    User,
)


def test_start_nonexistent_quiz(client: FlaskClient, user_token: str) -> None:
    """Test starting a non-existent quiz."""
    response = client.get("/quizzes/99999/attempt", headers={"Authorization": f"Bearer {user_token}"})

    assert response.status_code == HTTPStatus.NOT_FOUND
    assert response.json["message"] == "Quiz not found"


def test_submit_nonexistent_quiz(client: FlaskClient, user_token: str) -> None:
    """Test submitting answers to non-existent quiz."""
    response = client.post(
        "/quizzes/99999/submit",
        headers={"Authorization": f"Bearer {user_token}"},
        json={"answers": [{"question_id": 1, "selected_option": 1}]},
    )

    assert response.status_code == HTTPStatus.NOT_FOUND
    assert response.json["message"] == "Quiz not found"


def test_submit_invalid_question(client: FlaskClient, user_token: str, quiz: Quiz) -> None:
    """Test submitting answer for non-existent question."""
    response = client.post(
        f"/quizzes/{quiz.id}/submit",
        headers={"Authorization": f"Bearer {user_token}"},
        json={"answers": [{"question_id": 99999, "selected_option": 1}]},
    )

    assert response.status_code == HTTPStatus.OK
    assert response.json["correct_answers"] == 0


def test_view_other_user_scores(client: FlaskClient, user_token: str, admin_user: User) -> None:
    """Test that users cannot view other users' scores."""
    response = client.get(f"/users/{admin_user.id}/scores", headers={"Authorization": f"Bearer {user_token}"})

    assert response.status_code == HTTPStatus.FORBIDDEN
    assert response.json["message"] == "Unauthorized"


def test_view_other_user_score_details(client: FlaskClient, user_token: str, score: Score, admin_user: User) -> None:
    """Test that users cannot view other users' score details."""
    # Create a score for admin user
    admin_score = Score(quiz_id=score.quiz_id, user_id=admin_user.id, total_score=3)
    db.session.add(admin_score)
    db.session.commit()

    response = client.get(f"/scores/{admin_score.id}", headers={"Authorization": f"Bearer {user_token}"})

    assert response.status_code == HTTPStatus.FORBIDDEN
    assert response.json["message"] == "Unauthorized"


def test_view_nonexistent_score(client: FlaskClient, user_token: str) -> None:
    """Test viewing a non-existent score."""
    response = client.get("/scores/99999", headers={"Authorization": f"Bearer {user_token}"})

    assert response.status_code == HTTPStatus.NOT_FOUND
    assert response.json["message"] == "Score not found"
