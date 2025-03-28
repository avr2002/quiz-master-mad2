"""Quiz routes for the Quiz API."""

from datetime import datetime
from http import HTTPMethod, HTTPStatus

from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required

from quiz_api.models.database import db
from quiz_api.models.models import Chapter, Quiz, Score, User
from quiz_api.models.schemas import QuizSchema, QuizUpdateSchema, SearchSchema
from quiz_api.utils.search import search_quizzes

quiz_bp: Blueprint = Blueprint("quizzes", __name__)


@quiz_bp.route("/chapters/<int:chapter_id>/quizzes", methods=[HTTPMethod.POST])
@jwt_required()
def create_quiz(chapter_id: int):
    """Create a new quiz under a chapter. (Admin only)"""
    try:
        # Check if user is admin
        current_user_id = int(get_jwt_identity())
        current_user: User | None = db.session.get(User, current_user_id)
        if not current_user or current_user.role != "admin":
            return jsonify({"message": "Unauthorized"}), HTTPStatus.FORBIDDEN

        # Verify chapter exists
        chapter: Chapter | None = db.session.get(Chapter, chapter_id)
        if not chapter:
            return jsonify({"message": "Chapter not found"}), HTTPStatus.NOT_FOUND

        # Validate request data
        data = QuizSchema(**request.get_json())
        quiz = Quiz(
            chapter_id=chapter_id,
            name=data.name,
            date_of_quiz=data.date_of_quiz,
            time_duration=data.time_duration,
            remarks=data.remarks,
        )

        db.session.add(quiz)
        db.session.commit()

        return (
            jsonify({"message": "Quiz created successfully", "quiz": QuizSchema.model_validate(quiz).model_dump()}),
            HTTPStatus.CREATED,
        )
    except ValueError as e:
        return jsonify({"message": str(e)}), HTTPStatus.BAD_REQUEST
    except Exception as e:
        raise e
    finally:
        db.session.close()


@quiz_bp.route("/chapters/<int:chapter_id>/quizzes", methods=[HTTPMethod.GET])
@jwt_required()
def get_chapter_quizzes(chapter_id: int):
    """Get all quizzes under a chapter. (User is logged in)"""
    try:
        # Verify chapter exists
        chapter: Chapter | None = db.session.get(Chapter, chapter_id)
        if not chapter:
            return jsonify({"message": "Chapter not found"}), HTTPStatus.NOT_FOUND

        quizzes = Quiz.query.filter_by(chapter_id=chapter_id).all()
        quizzes_list = [
            {
                "id": quiz.id,
                "chapter_id": quiz.chapter_id,
                "name": quiz.name,
                "date_of_quiz": quiz.date_of_quiz.isoformat(),
                "time_duration": quiz.time_duration,
                "remarks": quiz.remarks,
            }
            for quiz in quizzes
        ]

        return jsonify(quizzes_list), HTTPStatus.OK
    finally:
        db.session.close()


@quiz_bp.route("/quizzes/<int:quiz_id>", methods=[HTTPMethod.GET])
@jwt_required()
def get_quiz(quiz_id: int):
    """Get details of a specific quiz. (User is logged in)"""
    try:
        quiz: Quiz | None = db.session.get(Quiz, quiz_id)
        if not quiz:
            return jsonify({"message": "Quiz not found"}), HTTPStatus.NOT_FOUND

        response = {
            "id": quiz.id,
            "chapter_id": quiz.chapter_id,
            "name": quiz.name,
            "date_of_quiz": quiz.date_of_quiz.isoformat(),
            "time_duration": quiz.time_duration,
            "remarks": quiz.remarks,
        }
        return jsonify(response), HTTPStatus.OK
    except Exception as e:
        raise e
    finally:
        db.session.close()


@quiz_bp.route("/quizzes/<int:quiz_id>", methods=[HTTPMethod.PATCH])
@jwt_required()
def update_quiz(quiz_id: int):
    """Update a quiz. (Admin only)"""
    try:
        # Check if user is admin
        current_user_id = int(get_jwt_identity())
        current_user: User | None = db.session.get(User, current_user_id)
        if not current_user or current_user.role != "admin":
            return jsonify({"message": "Unauthorized"}), HTTPStatus.FORBIDDEN

        quiz: Quiz | None = db.session.get(Quiz, quiz_id)
        if not quiz:
            return jsonify({"message": "Quiz not found"}), HTTPStatus.NOT_FOUND

        data = QuizUpdateSchema(**request.get_json())

        if data.name:
            quiz.name = data.name
        if data.date_of_quiz:
            quiz.date_of_quiz = data.date_of_quiz
        if data.time_duration:
            quiz.time_duration = data.time_duration
        if data.remarks:
            quiz.remarks = data.remarks

        db.session.commit()

        return (jsonify({"message": "Quiz updated successfully"}), HTTPStatus.OK)
    except Exception as e:
        raise e
    finally:
        db.session.close()


@quiz_bp.route("/quizzes/<int:quiz_id>", methods=[HTTPMethod.DELETE])
@jwt_required()
def delete_quiz(quiz_id: int):
    """Delete a quiz. (Admin only)"""
    try:
        # Check if user is admin
        current_user_id = int(get_jwt_identity())
        current_user: User | None = db.session.get(User, current_user_id)
        if not current_user or current_user.role != "admin":
            return jsonify({"message": "Unauthorized"}), HTTPStatus.FORBIDDEN

        quiz: Quiz | None = db.session.get(Quiz, quiz_id)
        if not quiz:
            return jsonify({"message": "Quiz not found"}), HTTPStatus.NOT_FOUND

        db.session.delete(quiz)
        db.session.commit()

        return jsonify({"message": "Quiz deleted successfully"}), HTTPStatus.OK
    finally:
        db.session.close()


@quiz_bp.route("/quizzes/upcoming", methods=[HTTPMethod.GET])
@jwt_required()
def get_all_upcoming_quizzes():
    """Get all upcoming quizzes. (User is logged in)"""
    try:
        current_user_id = int(get_jwt_identity())
        current_user: User = db.session.get(User, current_user_id)

        current_date = datetime.now()
        quizzes = Quiz.query.filter(Quiz.date_of_quiz >= current_date).all()

        if not quizzes:
            return jsonify({"message": "No upcoming quizzes found"}), HTTPStatus.NOT_FOUND

        # Get chapter id and subject id from quiz
        # Do not show quizzes with no questions to normal users
        quizzes_list = [
            {
                "id": quiz.id,
                "chapter_id": quiz.chapter_id,
                "chapter_name": quiz.chapter.name,
                "subject_id": quiz.chapter.subject_id,
                "subject_name": quiz.chapter.subject.name,
                "name": quiz.name,
                "date_of_quiz": quiz.date_of_quiz.isoformat(),
                "time_duration": quiz.time_duration,
                "remarks": quiz.remarks,
            }
            for quiz in quizzes
            if not quiz.is_active and not (current_user.role == "user" and quiz.number_of_questions == 0)
        ]
        return jsonify(quizzes_list), HTTPStatus.OK
    finally:
        db.session.close()


@quiz_bp.route("/quizzes/past", methods=[HTTPMethod.GET])
@jwt_required()
def get_all_past_quizzes():
    """Get all past quizzes."""
    try:
        current_user_id = int(get_jwt_identity())
        current_user: User = db.session.get(User, current_user_id)

        current_date = datetime.now()
        quizzes = Quiz.query.filter(Quiz.date_of_quiz < current_date).all()
        if not quizzes:
            return jsonify({"message": "No quizzes found"}), HTTPStatus.NOT_FOUND

        # get seperate list of past and upcoming quizzes
        # Do not show quizzes with no questions to normal users
        past_quizzes = [
            {
                "id": quiz.id,
                "chapter_id": quiz.chapter_id,
                "chapter_name": quiz.chapter.name,
                "subject_id": quiz.chapter.subject_id,
                "subject_name": quiz.chapter.subject.name,
                "name": quiz.name,
                "date_of_quiz": quiz.date_of_quiz.isoformat(),
                "time_duration": quiz.time_duration,
                "remarks": quiz.remarks,
            }
            for quiz in quizzes
            if not quiz.is_active and not (current_user.role == "user" and quiz.number_of_questions == 0)
        ]

        return jsonify(past_quizzes), HTTPStatus.OK
    finally:
        db.session.close()


@quiz_bp.route("/quizzes/ongoing", methods=[HTTPMethod.GET])
@jwt_required()
def get_all_ongoing_quizzes():
    """Get all ongoing quizzes. (User is logged in)"""
    try:
        current_user_id = int(get_jwt_identity())
        current_user: User = db.session.get(User, current_user_id)

        # Fetch only quizzes that have started (optimizing DB filtering)
        current_time = datetime.now()
        quizzes = Quiz.query.filter(Quiz.date_of_quiz <= current_time).all()
        if not quizzes:
            return jsonify({"message": "No ongoing quizzes found"}), HTTPStatus.NOT_FOUND

        quizzes_list = [
            {
                "id": quiz.id,
                "chapter_id": quiz.chapter_id,
                "chapter_name": quiz.chapter.name,
                "subject_id": quiz.chapter.subject_id,
                "subject_name": quiz.chapter.subject.name,
                "name": quiz.name,
                "date_of_quiz": quiz.date_of_quiz.isoformat(),
                "time_duration": quiz.time_duration,
                "remarks": quiz.remarks,
            }
            for quiz in quizzes
            if quiz.is_active and not (current_user.role == "user" and quiz.number_of_questions == 0)
        ]
        return jsonify(quizzes_list), HTTPStatus.OK
    finally:
        db.session.close()


@quiz_bp.route("/quizzes/user", methods=[HTTPMethod.GET])
@jwt_required()
def get_quizzes_by_user():
    """Get all quizzes attempted by a user. (User is logged in)"""
    try:
        current_user_id = int(get_jwt_identity())
        current_user: User | None = db.session.get(User, current_user_id)
        if not current_user:
            return jsonify({"message": "Unauthorized"}), HTTPStatus.FORBIDDEN

        quizzes = Score.query.filter_by(user_id=current_user_id).all()
        if not quizzes:
            return jsonify({"message": "No quizzes attempted by the user"}), HTTPStatus.NOT_FOUND

        quizzes_list = [
            {
                "id": quiz.id,
                "quiz_id": quiz.quiz_id,
                "user_id": quiz.user_id,
                "score": quiz.score,
            }
            for quiz in quizzes
        ]

        return jsonify(quizzes_list), HTTPStatus.OK
    finally:
        db.session.close()


@quiz_bp.route("/chapters/<int:chapter_id>/quizzes/search", methods=[HTTPMethod.GET])
def search_chapter_quizzes(chapter_id: int):
    """Search quizzes within a chapter using Full-Text Search."""
    try:
        # Check if chapter exists
        chapter: Chapter | None = db.session.get(Chapter, chapter_id)
        if not chapter:
            return jsonify({"message": "Chapter not found"}), HTTPStatus.NOT_FOUND

        search_params = SearchSchema(**request.args)
        query = search_params.q

        if not query:
            # Return all quizzes for this chapter if no query
            quizzes = (
                Quiz.query.filter_by(chapter_id=chapter_id)
                .limit(search_params.limit)
                .offset(search_params.offset)
                .all()
            )
            quizzes_list = [
                {
                    "id": quiz.id,
                    "chapter_id": quiz.chapter_id,
                    "name": quiz.name,
                    "date_of_quiz": quiz.date_of_quiz.isoformat(),
                    "time_duration": quiz.time_duration,
                    "remarks": quiz.remarks,
                    "created_at": quiz.created_at.isoformat(),
                    "updated_at": quiz.updated_at.isoformat() if quiz.updated_at else None,
                }
                for quiz in quizzes
            ]
        else:
            # Use FTS to search quizzes
            results = search_quizzes(
                query, limit=search_params.limit, offset=search_params.offset, chapter_id=chapter_id
            )

            # Format results
            quizzes_list = [
                {
                    "id": row[0],
                    "chapter_id": row[1],
                    "name": row[2],
                    "date_of_quiz": row[3] if isinstance(row[3], str) else row[3].isoformat() if row[3] else None,
                    "time_duration": row[4],
                    "remarks": row[5],
                    "created_at": row[6] if isinstance(row[6], str) else row[6].isoformat() if row[6] else None,
                    "updated_at": row[7] if isinstance(row[7], str) else row[7].isoformat() if row[7] else None,
                }
                for row in results
            ]

        # Return with metadata
        response = {
            "items": quizzes_list,
            "total": len(quizzes_list),
            "limit": search_params.limit,
            "offset": search_params.offset,
        }

        return jsonify(response), HTTPStatus.OK
    finally:
        db.session.close()
