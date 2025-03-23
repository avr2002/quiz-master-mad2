"""User Management Routes."""

from datetime import datetime, timezone
from http import HTTPMethod, HTTPStatus

from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required

from quiz_api.models.database import db
from quiz_api.models.models import Question, Quiz, Score, User
from quiz_api.models.schemas import QuizAttemptSchema, ScoreSchema

quiz_attempts_bp: Blueprint = Blueprint("quiz_attempts", __name__)


@quiz_attempts_bp.route("/quizzes/<int:quiz_id>/attempt", methods=[HTTPMethod.GET])
@jwt_required()
def start_quiz_attempt(quiz_id: int):
    """Start a quiz attempt."""
    # Verify quiz exists
    quiz: Quiz | None = db.session.get(Quiz, quiz_id)
    if not quiz:
        return jsonify({"message": "Quiz not found"}), HTTPStatus.NOT_FOUND

    # Get questions for the quiz
    questions = Question.query.filter_by(quiz_id=quiz_id).all()
    if not questions:
        return jsonify({"message": "No questions found for this quiz"}), HTTPStatus.NOT_FOUND

    # Return questions without correct answers
    return (
        jsonify(
            {
                "total_questions": len(questions),
                "questions": [
                    {
                        "id": q.id,
                        "question_statement": q.question_statement,
                        "option1": q.option1,
                        "option2": q.option2,
                        "option3": q.option3,
                        "option4": q.option4,
                        "points": q.points,
                    }
                    for q in questions
                ],
            }
        ),
        HTTPStatus.OK,
    )


@quiz_attempts_bp.route("/quizzes/<int:quiz_id>/submit", methods=[HTTPMethod.POST])
@jwt_required()
def submit_quiz(quiz_id: int):
    """Submit quiz answers and get results."""
    # Verify quiz exists
    quiz: Quiz | None = db.session.get(Quiz, quiz_id)
    if not quiz:
        return jsonify({"message": "Quiz not found"}), HTTPStatus.NOT_FOUND

    # Get current user
    current_user_id = int(get_jwt_identity())
    current_user: User | None = db.session.get(User, current_user_id)
    if not current_user:
        return jsonify({"message": "User not found"}), HTTPStatus.NOT_FOUND

    # Validate submission data
    data = QuizAttemptSchema(**request.get_json())

    # Calculate score
    total_score = 0
    correct_answers = 0
    questions = Question.query.filter_by(quiz_id=quiz_id).all()
    question_map = {q.id: q for q in questions}

    for answer in data.answers:
        question = question_map.get(answer.question_id)
        if question and question.correct_option == answer.selected_option:
            total_score += question.points
            correct_answers += 1

    # Record score
    score = Score(
        quiz_id=quiz_id,
        user_id=current_user_id,
        total_score=total_score,
        timestamp=datetime.now(timezone.utc),
    )
    db.session.add(score)
    db.session.commit()

    return (
        jsonify(
            {
                "message": "Quiz submitted successfully",
                "correct_answers": correct_answers,
                "score": ScoreSchema.model_validate(score).model_dump(),
            }
        ),
        HTTPStatus.OK,
    )


@quiz_attempts_bp.route("/users/<int:user_id>/scores", methods=[HTTPMethod.GET])
@jwt_required()
def get_user_scores(user_id: int):
    """Get quiz history for a user."""
    # Verify user exists
    user: User | None = db.session.get(User, user_id)
    if not user:
        return jsonify({"message": "User not found"}), HTTPStatus.NOT_FOUND

    # Only allow users to view their own scores (except admin)
    current_user_id = int(get_jwt_identity())
    current_user: User | None = db.session.get(User, current_user_id)
    if not current_user:
        return jsonify({"message": "User not found"}), HTTPStatus.NOT_FOUND

    if current_user.role != "admin" and current_user_id != user_id:
        return jsonify({"message": "Unauthorized"}), HTTPStatus.FORBIDDEN

    scores = Score.query.filter_by(user_id=user_id).all()
    return jsonify([ScoreSchema.model_validate(score).model_dump() for score in scores]), HTTPStatus.OK


@quiz_attempts_bp.route("/scores/<int:score_id>", methods=[HTTPMethod.GET])
@jwt_required()
def get_score_details(score_id: int):
    """Get details of a specific quiz attempt."""
    # Verify score exists
    score: Score | None = db.session.get(Score, score_id)
    if not score:
        return jsonify({"message": "Score not found"}), HTTPStatus.NOT_FOUND

    # Only allow users to view their own scores (except admin)
    current_user_id = int(get_jwt_identity())
    current_user: User | None = db.session.get(User, current_user_id)
    if not current_user:
        return jsonify({"message": "User not found"}), HTTPStatus.NOT_FOUND

    if current_user.role != "admin" and current_user_id != score.user_id:
        return jsonify({"message": "Unauthorized"}), HTTPStatus.FORBIDDEN

    return jsonify(ScoreSchema.model_validate(score).model_dump()), HTTPStatus.OK
