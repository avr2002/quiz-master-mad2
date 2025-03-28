"""User Management Routes."""

from datetime import datetime, timezone
from http import HTTPMethod, HTTPStatus
from typing import List

from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required

from quiz_api.models.database import db
from quiz_api.models.models import Question, QuestionAttempt, Quiz, QuizSignup, Score, User
from quiz_api.models.schemas import QuizAttemptSchema, ScoreSchema

quiz_attempts_bp: Blueprint = Blueprint("quiz_attempts", __name__, url_prefix="/quiz")


@quiz_attempts_bp.route("/<int:quiz_id>/attempt", methods=[HTTPMethod.GET])
@jwt_required()
def start_quiz_attempt(quiz_id: int):
    """Start a quiz attempt."""
    current_user_id = int(get_jwt_identity())
    
    # Verify quiz exists
    quiz: Quiz | None = db.session.get(Quiz, quiz_id)
    if not quiz:
        return jsonify({"message": "Quiz not found"}), HTTPStatus.NOT_FOUND

    # If user hasn't signed up for the quiz, return error
    quiz_signup: QuizSignup | None = QuizSignup.query.filter_by(user_id=current_user_id, quiz_id=quiz_id).first()
    if not quiz_signup:
        return jsonify({"message": "User has not signed up for this quiz"}), HTTPStatus.FORBIDDEN

    # If quiz is not active, return error
    if not quiz.is_active:
        return jsonify({"message": "Quiz is not active"}), HTTPStatus.FORBIDDEN

    # Get questions for the quiz
    # questions = Question.query.filter_by(quiz_id=quiz_id).all()
    # Return list of questions without correct answers
    questions_list = [
        {
            "id": q.id,
            "question_statement": q.question_statement,
            "option1": q.option1,
            "option2": q.option2,
            "option3": q.option3,
            "option4": q.option4,
            "points": q.points,
        }
        for q in quiz.questions
    ]
    response = {
        "name": quiz.name,
        "total_questions": quiz.number_of_questions,
        "total_quiz_score": quiz.total_quiz_score,
        "time_duration": quiz.time_duration,
        "questions": questions_list,
    }
    return jsonify(response), HTTPStatus.OK


@quiz_attempts_bp.route("/<int:quiz_id>/submit", methods=[HTTPMethod.POST])
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
    if not current_user or current_user.role != "user":
        return jsonify({"message": "Unauthorized"}), HTTPStatus.UNAUTHORIZED

    # Validate submission data
    data = QuizAttemptSchema(**request.get_json())

    # Calculate score
    user_score = 0  # Total points scored by the user
    correct_answers = 0  # Number of correct answers
    questions = Question.query.filter_by(quiz_id=quiz_id).all()
    question_map = {q.id: q for q in questions}

    for answer in data.answers:
        question = question_map.get(answer.question_id)
        if question and question.correct_option == answer.selected_option:
            user_score += question.points
            correct_answers += 1

    # Record score
    score = Score(
        quiz_id=quiz_id,
        user_id=current_user_id,
        user_score=user_score,
        number_of_correct_answers=correct_answers,
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


@quiz_attempts_bp.route("/<int:quiz_id>/results", methods=[HTTPMethod.GET])
@jwt_required()
def get_user_quiz_attempt_results(quiz_id: int):
    """Get details of a user's quiz attempt with correctanswers and score."""
    # Get current user
    current_user_id = int(get_jwt_identity())
    current_user: User | None = db.session.get(User, current_user_id)
    if not current_user or current_user.role != "user":
        return jsonify({"message": "Unauthorized"}), HTTPStatus.UNAUTHORIZED

    # Verify if user has signed up and attempted the quiz
    quiz_signup: QuizSignup | None = QuizSignup.query.filter_by(quiz_id=quiz_id, user_id=current_user_id).first()
    if not quiz_signup:
        return jsonify({"message": "Unauthorized"}), HTTPStatus.FORBIDDEN

    # Get score, correct answers and questions
    score: Score | None = Score.query.filter_by(quiz_id=quiz_id, user_id=current_user_id).first()
    if not score:
        return jsonify({"message": "Quiz not attempted or User did not sign up for the quiz"}), HTTPStatus.NOT_FOUND

    # Get questions with correct answers and user's selected answers
    question_attempts: List[QuestionAttempt] = QuestionAttempt.query.filter_by(score_id=score.id).all()
    question_attempts_list = [
        {
            "question_statement": qa.question.question_statement,
            "correct_answer": qa.question.correct_option,
            "user_answer": qa.selected_option,
            "is_correct": qa.is_correct,
            "points": qa.question.points,
            "option1": qa.question.option1,
            "option2": qa.question.option2,
            "option3": qa.question.option3,
            "option4": qa.question.option4,
        }
        for qa in question_attempts
    ]
    response = {
        "total_quiz_score": quiz_signup.quiz.total_quiz_score,
        "user_score": score.user_score,
        "questions": question_attempts_list,
    }
    return jsonify(response), HTTPStatus.OK


@quiz_attempts_bp.route("/<int:quiz_id>/score", methods=[HTTPMethod.GET])
@jwt_required()
def get_user_quiz_score_details(quiz_id: int):
    """Get details of a specific quiz attempt by the user."""
    # Only allow users to view their own scores (except admin)
    current_user_id = int(get_jwt_identity())

    # Verify user has attempted the quiz
    score: Score | None = Score.query.filter_by(quiz_id=quiz_id, user_id=current_user_id).first()
    if not score:
        return jsonify({"message": "Quiz not attempted or User did not sign up for the quiz"}), HTTPStatus.NOT_FOUND

    # get quiz name, total quiz score, total user score, time duration, date of quiz
    response = {
        "quiz_name": score.quiz.name,
        "date_of_quiz": score.quiz.date_of_quiz,
        "time_duration": score.quiz.time_duration,
        "user_score": score.user_score,
        "total_quiz_score": score.quiz.total_quiz_score,
        "number_of_correct_answers": score.number_of_correct_answers,
        "total_questions": score.quiz.number_of_questions,
    }
    return jsonify(response), HTTPStatus.OK


@quiz_attempts_bp.route("/attempts/history", methods=[HTTPMethod.GET])
@jwt_required()
def get_user_quiz_attempts_history():
    """Get all quiz attempts history for a user."""
    # Only allow admin or a user to view their own scores
    current_user_id = int(get_jwt_identity())

    # Get all quiz attempts history for the user
    scores = Score.query.filter_by(user_id=current_user_id).all()
    if not scores:
        return jsonify({"message": "No quiz attempts history found"}), HTTPStatus.NOT_FOUND

    response = [
        {
            "quiz_name": score.quiz.name,
            "date_of_quiz": score.quiz.date_of_quiz,
            "time_duration": score.quiz.time_duration,
            "user_score": score.user_score,
            "total_quiz_score": score.quiz.total_quiz_score,
            "number_of_correct_answers": score.number_of_correct_answers,
            "total_questions": score.quiz.number_of_questions,
        }
        for score in scores
    ]
    return jsonify(response), HTTPStatus.OK
