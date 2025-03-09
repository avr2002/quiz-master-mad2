"""Quiz routes for the Quiz API."""

from http import (
    HTTPMethod,
    HTTPStatus,
)

from flask import (
    Blueprint,
    jsonify,
    request,
)
from flask_jwt_extended import (
    get_jwt_identity,
    jwt_required,
)

from quiz_api.models.database import db
from quiz_api.models.models import (
    Chapter,
    Quiz,
    User,
)
from quiz_api.models.schemas import (
    SearchSchema,
    QuizSchema,
    QuizUpdateSchema,
)
from quiz_api.utils.search import search_quizzes

quiz_bp: Blueprint = Blueprint("quizzes", __name__)


@quiz_bp.route("/chapters/<int:chapter_id>/quizzes", methods=[HTTPMethod.POST])
@jwt_required()
def create_quiz(chapter_id: int):
    """Create a new quiz under a chapter. (Admin only)"""
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
        chapter_id=chapter_id, date_of_quiz=data.date_of_quiz, time_duration=data.time_duration, remarks=data.remarks
    )

    db.session.add(quiz)
    db.session.commit()

    return (
        jsonify({"message": "Quiz created successfully", "quiz": QuizSchema.model_validate(quiz).model_dump()}),
        HTTPStatus.CREATED,
    )


@quiz_bp.route("/chapters/<int:chapter_id>/quizzes", methods=[HTTPMethod.GET])
def get_chapter_quizzes(chapter_id: int):
    """Get all quizzes under a chapter."""
    # Verify chapter exists
    chapter: Chapter | None = db.session.get(Chapter, chapter_id)
    if not chapter:
        return jsonify({"message": "Chapter not found"}), HTTPStatus.NOT_FOUND

    quizzes = Quiz.query.filter_by(chapter_id=chapter_id).all()
    return jsonify([QuizSchema.model_validate(quiz).model_dump() for quiz in quizzes]), HTTPStatus.OK


@quiz_bp.route("/quizzes/<int:quiz_id>", methods=[HTTPMethod.GET])
def get_quiz(quiz_id: int):
    """Get details of a specific quiz."""
    quiz: Quiz | None = db.session.get(Quiz, quiz_id)
    if not quiz:
        return jsonify({"message": "Quiz not found"}), HTTPStatus.NOT_FOUND

    return jsonify(QuizSchema.model_validate(quiz).model_dump()), HTTPStatus.OK


@quiz_bp.route("/quizzes/<int:quiz_id>", methods=[HTTPMethod.PATCH])
@jwt_required()
def update_quiz(quiz_id: int):
    """Update a quiz. (Admin only)"""
    # Check if user is admin
    current_user_id = int(get_jwt_identity())
    current_user: User | None = db.session.get(User, current_user_id)
    if not current_user or current_user.role != "admin":
        return jsonify({"message": "Unauthorized"}), HTTPStatus.FORBIDDEN

    quiz: Quiz | None = db.session.get(Quiz, quiz_id)
    if not quiz:
        return jsonify({"message": "Quiz not found"}), HTTPStatus.NOT_FOUND

    data = QuizUpdateSchema(**request.get_json())

    if data.date_of_quiz:
        quiz.date_of_quiz = data.date_of_quiz
    if data.time_duration:
        quiz.time_duration = data.time_duration
    if data.remarks:
        quiz.remarks = data.remarks

    db.session.commit()

    return (
        jsonify({"message": "Quiz updated successfully", "quiz": QuizSchema.model_validate(quiz).model_dump()}),
        HTTPStatus.OK,
    )


@quiz_bp.route("/quizzes/<int:quiz_id>", methods=[HTTPMethod.DELETE])
@jwt_required()
def delete_quiz(quiz_id: int):
    """Delete a quiz. (Admin only)"""
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


@quiz_bp.route("/chapters/<int:chapter_id>/quizzes/search", methods=[HTTPMethod.GET])
def search_chapter_quizzes(chapter_id: int):
    """Search quizzes within a chapter using Full-Text Search."""
    # Check if chapter exists
    chapter: Chapter | None = db.session.get(Chapter, chapter_id)
    if not chapter:
        return jsonify({"message": "Chapter not found"}), HTTPStatus.NOT_FOUND
    
    search_params = SearchSchema(**request.args)
    query = search_params.q
    
    if not query:
        # Return all quizzes for this chapter if no query
        quizzes = Quiz.query.filter_by(chapter_id=chapter_id).limit(search_params.limit).offset(search_params.offset).all()
        quizzes_list = [
            {
                "id": quiz.id,
                "chapter_id": quiz.chapter_id,
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
            query, 
            limit=search_params.limit, 
            offset=search_params.offset,
            chapter_id=chapter_id
        )
        
        # Format results
        quizzes_list = [
            {
                "id": row[0],
                "chapter_id": row[1],
                "date_of_quiz": row[2] if isinstance(row[2], str) else row[2].isoformat() if row[2] else None,
                "time_duration": row[3],
                "remarks": row[4],
                "created_at": row[5] if isinstance(row[5], str) else row[5].isoformat() if row[5] else None,
                "updated_at": row[6] if isinstance(row[6], str) else row[6].isoformat() if row[6] else None,
            }
            for row in results
        ]
    
    # Return with metadata
    response = {
        "items": quizzes_list,
        "total": len(quizzes_list),
        "limit": search_params.limit,
        "offset": search_params.offset
    }
    
    return jsonify(response), HTTPStatus.OK
