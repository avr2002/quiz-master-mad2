"""Question routes for the Quiz API."""

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
    Question,
    Quiz,
    User,
)
from quiz_api.models.schemas import (
    QuestionSchema,
    QuestionUpdateSchema,
)

questions_bp: Blueprint = Blueprint("questions", __name__)


@questions_bp.route("/quizzes/<int:quiz_id>/questions", methods=[HTTPMethod.POST])
@jwt_required()
def create_question(quiz_id: int):
    """Create a new question under a quiz. (Admin only)"""
    # Check if user is admin
    current_user_id = int(get_jwt_identity())
    current_user: User | None = db.session.get(User, current_user_id)
    if not current_user or current_user.role != "admin":
        return jsonify({"message": "Unauthorized"}), HTTPStatus.FORBIDDEN

    # Verify quiz exists
    quiz: Quiz | None = db.session.get(Quiz, quiz_id)
    if not quiz:
        return jsonify({"message": "Quiz not found"}), HTTPStatus.NOT_FOUND

    # Validate request data
    data = QuestionSchema(**request.get_json())
    question = Question(
        quiz_id=quiz_id,
        question_statement=data.question_statement,
        option1=data.option1,
        option2=data.option2,
        option3=data.option3,
        option4=data.option4,
        correct_option=data.correct_option,
    )

    db.session.add(question)
    db.session.commit()

    return (
        jsonify(
            {
                "message": "Question created successfully",
                "question": QuestionSchema.model_validate(question).model_dump(),
            }
        ),
        HTTPStatus.CREATED,
    )


@questions_bp.route("/quizzes/<int:quiz_id>/questions", methods=[HTTPMethod.GET])
@jwt_required()
def get_quiz_questions(quiz_id: int):
    """Get all questions under a quiz."""
    # Verify quiz exists
    quiz: Quiz | None = db.session.get(Quiz, quiz_id)
    if not quiz:
        return jsonify({"message": "Quiz not found"}), HTTPStatus.NOT_FOUND

    questions = Question.query.filter_by(quiz_id=quiz_id).all()
    return jsonify([QuestionSchema.model_validate(question).model_dump() for question in questions]), HTTPStatus.OK


@questions_bp.route("/questions/<int:question_id>", methods=[HTTPMethod.GET])
@jwt_required()
def get_question(question_id: int):
    """Get details of a specific question."""
    question: Question | None = db.session.get(Question, question_id)
    if not question:
        return jsonify({"message": "Question not found"}), HTTPStatus.NOT_FOUND

    return jsonify(QuestionSchema.model_validate(question).model_dump()), HTTPStatus.OK


@questions_bp.route("/questions/<int:question_id>", methods=[HTTPMethod.PATCH])
@jwt_required()
def update_question(question_id: int):
    """Update a question. (Admin only)"""
    # Check if user is admin
    current_user_id = int(get_jwt_identity())
    current_user: User | None = db.session.get(User, current_user_id)
    if not current_user or current_user.role != "admin":
        return jsonify({"message": "Unauthorized"}), HTTPStatus.FORBIDDEN

    question: Question | None = db.session.get(Question, question_id)
    if not question:
        return jsonify({"message": "Question not found"}), HTTPStatus.NOT_FOUND

    data = QuestionUpdateSchema(**request.get_json())

    if data.question_statement:
        question.question_statement = data.question_statement
    if data.option1:
        question.option1 = data.option1
    if data.option2:
        question.option2 = data.option2
    if data.option3:
        question.option3 = data.option3
    if data.option4:
        question.option4 = data.option4
    if data.correct_option:
        question.correct_option = data.correct_option

    db.session.commit()

    return (
        jsonify(
            {
                "message": "Question updated successfully",
                "question": QuestionSchema.model_validate(question).model_dump(),
            }
        ),
        HTTPStatus.OK,
    )


@questions_bp.route("/questions/<int:question_id>", methods=[HTTPMethod.DELETE])
@jwt_required()
def delete_question(question_id: int):
    """Delete a question. (Admin only)"""
    # Check if user is admin
    current_user_id = int(get_jwt_identity())
    current_user: User | None = db.session.get(User, current_user_id)
    if not current_user or current_user.role != "admin":
        return jsonify({"message": "Unauthorized"}), HTTPStatus.FORBIDDEN

    question: Question | None = db.session.get(Question, question_id)
    if not question:
        return jsonify({"message": "Question not found"}), HTTPStatus.NOT_FOUND

    db.session.delete(question)
    db.session.commit()

    return jsonify({"message": "Question deleted successfully"}), HTTPStatus.OK
