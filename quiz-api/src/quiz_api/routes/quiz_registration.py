"""User's Quiz Routes."""

from datetime import datetime, timezone
from http import HTTPMethod, HTTPStatus

from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required

from quiz_api.models.database import db
from quiz_api.models.models import Question, Quiz, QuizSignup, Score, User
from quiz_api.models.schemas import QuizAttemptSchema, ScoreSchema

user_quiz_bp: Blueprint = Blueprint("user_quiz", __name__)


@user_quiz_bp.route("/quiz-registration/<int:quiz_id>/signup", methods=[HTTPMethod.POST])
@jwt_required()
def quiz_signup(quiz_id: int):
    """Sign up a user for a upcoming quiz."""
    # Get current user
    current_user_id = int(get_jwt_identity())
    current_user: User | None = db.session.get(User, current_user_id)
    if not current_user or current_user.role == "admin":
        return jsonify({"message": "Unauthorized"}), HTTPStatus.UNAUTHORIZED

    # Verify quiz exists
    quiz: Quiz | None = db.session.get(Quiz, quiz_id)
    if not quiz:
        return jsonify({"message": "Quiz not found"}), HTTPStatus.NOT_FOUND

    # Check if quiz is upcoming
    if not quiz.is_upcoming or quiz.is_active:
        return jsonify({"message": "Date of registration is over"}), HTTPStatus.BAD_REQUEST

    # Check if user is already signed up for the quiz
    existing_signup = QuizSignup.query.filter_by(user_id=current_user_id, quiz_id=quiz_id).first()
    if existing_signup:
        return jsonify({"message": "User already signed up for this quiz"}), HTTPStatus.BAD_REQUEST

    # If quiz has no questions, cannot sign up
    if quiz.number_of_questions == 0:
        return jsonify({"message": "No questions found for this quiz"}), HTTPStatus.NOT_FOUND

    # Create new signup
    new_signup = QuizSignup(user_id=current_user_id, quiz_id=quiz_id)
    db.session.add(new_signup)
    db.session.commit()

    return jsonify({"message": "User signed up for quiz successfully"}), HTTPStatus.CREATED


@user_quiz_bp.route("/quiz-registration/<int:quiz_id>/cancel", methods=[HTTPMethod.DELETE])
@jwt_required()
def cancel_quiz_registration(quiz_id: int):
    """Cancel a user's registration for a upcoming quiz."""
    # Get current user
    current_user_id = int(get_jwt_identity())
    current_user: User | None = db.session.get(User, current_user_id)
    if not current_user or current_user.role != "admin":
        return jsonify({"message": "Unauthorized"}), HTTPStatus.UNAUTHORIZED

    # Verify quiz exists and is upcoming
    quiz: Quiz | None = db.session.get(Quiz, quiz_id)
    if not quiz:
        return jsonify({"message": "Quiz not found"}), HTTPStatus.NOT_FOUND

    # Check if user is signed up for the quiz
    existing_signup = QuizSignup.query.filter_by(user_id=current_user_id, quiz_id=quiz_id).first()
    if not existing_signup:
        return jsonify({"message": "User is not signed up for this quiz"}), HTTPStatus.BAD_REQUEST

    # If quiz is over, cannot cancel
    if not quiz.is_upcoming:
        return jsonify({"message": "Past quizzes cannot be cancelled"}), HTTPStatus.BAD_REQUEST

    # Cannot cancel a quiz that is ongoing
    if quiz.is_active:
        return jsonify({"message": "Cannot cancel a quiz that is ongoing"}), HTTPStatus.BAD_REQUEST

    # Delete the signup
    db.session.delete(existing_signup)
    db.session.commit()

    return jsonify({"message": "Quiz registration cancelled successfully"}), HTTPStatus.OK


@user_quiz_bp.route("/users/quizzes/signups", methods=[HTTPMethod.GET])
@jwt_required()
def get_user_quizzes():
    """Get all quizzes that the current user has ."""
    current_user_id = int(get_jwt_identity())
    # Get quiz signups for the user
    signups = QuizSignup.query.filter_by(user_id=current_user_id).all()

    # Format response with quiz details
    result = []
    for signup in signups:
        quiz = signup.quiz
        status = "upcoming" if quiz.is_upcoming else "active" if quiz.is_active else "completed"

        user_score = Score.query.filter_by(user_id=current_user_id, quiz_id=quiz.id).first()
        user_score_value = user_score.user_score if user_score else "?"
        user_number_of_correct_answers = user_score.number_of_correct_answers if user_score else "?"

        quiz_data = {
            "id": quiz.id,
            "name": quiz.name,
            "date_of_quiz": quiz.date_of_quiz,
            "time_duration": quiz.time_duration,
            "chapter_name": quiz.chapter.name,
            "subject_name": quiz.chapter.subject.name,
            "status": status,
            "user_score": user_score_value,
            "total_quiz_score": quiz.total_quiz_score,
            "number_of_correct_answers": user_number_of_correct_answers,
            "total_questions": quiz.number_of_questions,
        }
        result.append(quiz_data)

    return jsonify(result), HTTPStatus.OK
