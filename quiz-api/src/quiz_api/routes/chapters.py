"""Chapter Management Routes."""

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
    Subject,
    User,
)
from quiz_api.models.schemas import (
    ChapterSchema,
    ChapterUpdateSchema,
)

# Define Blueprint
chapters_bp = Blueprint("chapters", __name__, url_prefix="/subjects/<int:subject_id>/chapters")


@chapters_bp.route("", methods=[HTTPMethod.POST])
@jwt_required()
def create_chapter(subject_id: int):
    """Create a new chapter (Admin only)."""
    try:
        # Check if user is admin
        current_user_id = int(get_jwt_identity())
        current_user: User | None = db.session.get(User, current_user_id)
        if not current_user or current_user.role != "admin":
            return jsonify({"message": "Unauthorized"}), HTTPStatus.FORBIDDEN

        # Check if subject exists
        subject: Subject | None = db.session.get(Subject, subject_id)
        if not subject:
            return jsonify({"message": "Subject not found"}), HTTPStatus.NOT_FOUND

        # Validate request data
        chapter_data = ChapterSchema(**request.get_json())

        # Create new chapter
        new_chapter = Chapter(name=chapter_data.name, description=chapter_data.description, subject_id=subject_id)

        db.session.add(new_chapter)
        db.session.commit()

        return (
            jsonify(
                {
                    "message": "Chapter created successfully",
                    "chapter": {
                        "id": new_chapter.id,
                        "name": new_chapter.name,
                        "description": new_chapter.description,
                        "subject_id": new_chapter.subject_id,
                    },
                }
            ),
            HTTPStatus.CREATED,
        )

    except ValueError as e:
        return jsonify({"message": str(e)}), HTTPStatus.BAD_REQUEST


@chapters_bp.route("", methods=[HTTPMethod.GET])
def get_subject_chapters(subject_id: int):
    """Get all chapters under a subject."""
    # Check if subject exists
    subject: Subject | None = db.session.get(Subject, subject_id)
    if not subject:
        return jsonify({"message": "Subject not found"}), HTTPStatus.NOT_FOUND

    chapters = Chapter.query.filter_by(subject_id=subject_id).all()
    chapters_list = [
        {
            "id": chapter.id,
            "name": chapter.name,
            "description": chapter.description,
            "subject_id": chapter.subject_id,
            "created_at": chapter.created_at.isoformat(),
            "updated_at": chapter.updated_at.isoformat() if chapter.updated_at else None,
        }
        for chapter in chapters
    ]

    return jsonify(chapters_list), HTTPStatus.OK


@chapters_bp.route("/<int:chapter_id>", methods=[HTTPMethod.GET])
def get_chapter(subject_id: int, chapter_id: int):
    """Get details of a specific chapter."""
    chapter: Chapter | None = db.session.get(Chapter, chapter_id)
    if not chapter or chapter.subject_id != subject_id:
        return jsonify({"message": "Chapter not found"}), HTTPStatus.NOT_FOUND

    return (
        jsonify(
            {
                "id": chapter.id,
                "name": chapter.name,
                "description": chapter.description,
                "subject_id": chapter.subject_id,
                "created_at": chapter.created_at.isoformat(),
                "updated_at": chapter.updated_at.isoformat() if chapter.updated_at else None,
            }
        ),
        HTTPStatus.OK,
    )


@chapters_bp.route("/<int:chapter_id>", methods=[HTTPMethod.PATCH])
@jwt_required()
def update_chapter(subject_id: int, chapter_id: int):
    """Update a chapter's details (Admin only)."""
    try:
        # Check if user is admin
        current_user_id = int(get_jwt_identity())
        current_user: User | None = db.session.get(User, current_user_id)
        if not current_user or current_user.role != "admin":
            return jsonify({"message": "Unauthorized"}), HTTPStatus.FORBIDDEN

        chapter: Chapter | None = db.session.get(Chapter, chapter_id)
        if not chapter or chapter.subject_id != subject_id:
            return jsonify({"message": "Chapter not found"}), HTTPStatus.NOT_FOUND

        # Validate update data
        update_data = ChapterUpdateSchema(**request.get_json())

        # Update fields if provided
        if update_data.name:
            chapter.name = update_data.name
        if update_data.description:
            chapter.description = update_data.description

        db.session.commit()
        return jsonify({"message": "Chapter updated successfully"}), HTTPStatus.OK

    except ValueError as e:
        return jsonify({"message": str(e)}), HTTPStatus.BAD_REQUEST


@chapters_bp.route("/<int:chapter_id>", methods=[HTTPMethod.DELETE])
@jwt_required()
def delete_chapter(subject_id: int, chapter_id: int):
    """Delete a chapter (Admin only)."""
    # Check if user is admin
    current_user_id = int(get_jwt_identity())
    current_user: User | None = db.session.get(User, current_user_id)
    if not current_user or current_user.role != "admin":
        return jsonify({"message": "Unauthorized"}), HTTPStatus.FORBIDDEN

    chapter: Chapter | None = db.session.get(Chapter, chapter_id)
    if not chapter or chapter.subject_id != subject_id:
        return jsonify({"message": "Chapter not found"}), HTTPStatus.NOT_FOUND

    db.session.delete(chapter)
    db.session.commit()
    return jsonify({"message": "Chapter deleted successfully"}), HTTPStatus.OK
