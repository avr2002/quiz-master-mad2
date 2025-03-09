"""Subject Management Routes."""

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
    Subject,
    User,
)
from quiz_api.models.schemas import (
    SearchSchema,
    SubjectSchema,
    SubjectUpdateSchema,
)
from quiz_api.utils.search import search_subjects

# Define Blueprint
subjects_bp = Blueprint("subjects", __name__, url_prefix="/subjects")


@subjects_bp.route("", methods=[HTTPMethod.POST])
@jwt_required()
def create_subject():
    """Create a new subject (Admin only)."""
    try:
        # Check if user is admin
        current_user_id = int(get_jwt_identity())
        current_user: User | None = db.session.get(User, current_user_id)
        if not current_user or current_user.role != "admin":
            return jsonify({"message": "Unauthorized"}), HTTPStatus.FORBIDDEN

        # Validate request data
        subject_data = SubjectSchema(**request.get_json())

        # Create new subject
        new_subject = Subject(
            name=subject_data.name,
            description=subject_data.description,
        )

        db.session.add(new_subject)
        db.session.commit()

        return (
            jsonify(
                {
                    "message": "Subject created successfully",
                    "subject": {
                        "id": new_subject.id,
                        "name": new_subject.name,
                        "description": new_subject.description,
                    },
                }
            ),
            HTTPStatus.CREATED,
        )

    except ValueError as e:
        return jsonify({"message": str(e)}), HTTPStatus.BAD_REQUEST


@subjects_bp.route("", methods=[HTTPMethod.GET])
def get_all_subjects():
    """Get all subjects."""
    subjects = Subject.query.all()
    subjects_list = [
        {"id": subject.id, "name": subject.name, "description": subject.description} for subject in subjects
    ]

    return jsonify(subjects_list), HTTPStatus.OK


@subjects_bp.route("/<int:subject_id>", methods=[HTTPMethod.GET])
def get_subject(subject_id: int):
    """Get details of a specific subject."""
    subject: Subject | None = db.session.get(Subject, subject_id)
    if not subject:
        return jsonify({"message": "Subject not found"}), HTTPStatus.NOT_FOUND

    return (
        jsonify(
            {
                "id": subject.id,
                "name": subject.name,
                "description": subject.description,
                "created_at": subject.created_at,
                "updated_at": subject.updated_at,
            }
        ),
        HTTPStatus.OK,
    )


@subjects_bp.route("/<int:subject_id>", methods=[HTTPMethod.PATCH])
@jwt_required()
def update_subject(subject_id: int):
    """Update a subject's details (Admin only)."""
    try:
        # Check if user is admin
        current_user_id = int(get_jwt_identity())
        current_user: User | None = db.session.get(User, current_user_id)
        if not current_user or current_user.role != "admin":
            return jsonify({"message": "Unauthorized"}), HTTPStatus.FORBIDDEN

        subject: Subject | None = db.session.get(Subject, subject_id)
        if not subject:
            return jsonify({"message": "Subject not found"}), HTTPStatus.NOT_FOUND

        # Validate update data
        update_data = SubjectUpdateSchema(**request.get_json())

        # Update fields if provided
        if update_data.name:
            subject.name = update_data.name
        if update_data.description:
            subject.description = update_data.description

        db.session.commit()
        return jsonify({"message": "Subject updated successfully"}), HTTPStatus.OK

    except ValueError as e:
        return jsonify({"message": str(e)}), HTTPStatus.BAD_REQUEST


@subjects_bp.route("/<int:subject_id>", methods=[HTTPMethod.DELETE])
@jwt_required()
def delete_subject(subject_id: int):
    """Delete a subject (Admin only)."""
    # Check if user is admin
    current_user_id = int(get_jwt_identity())
    current_user: User | None = db.session.get(User, current_user_id)
    if not current_user or current_user.role != "admin":
        return jsonify({"message": "Unauthorized"}), HTTPStatus.FORBIDDEN

    subject: Subject | None = db.session.get(Subject, subject_id)
    if not subject:
        return jsonify({"message": "Subject not found"}), HTTPStatus.NOT_FOUND

    db.session.delete(subject)
    db.session.commit()
    return jsonify({"message": "Subject deleted successfully"}), HTTPStatus.OK


@subjects_bp.route("/search", methods=[HTTPMethod.GET])
def search():
    """Search subjects using Full-Text Search."""
    search_params = SearchSchema(**request.args)
    query = search_params.q
    
    if not query:
        # Return all subjects if no query
        subjects = Subject.query.limit(search_params.limit).offset(search_params.offset).all()
        subjects_list = [
            {
                "id": subject.id,
                "name": subject.name,
                "description": subject.description,
                "created_at": subject.created_at.isoformat(),
                "updated_at": subject.updated_at.isoformat() if subject.updated_at else None,
            }
            for subject in subjects
        ]
    else:
        # Use FTS to search
        results = search_subjects(query, limit=search_params.limit, offset=search_params.offset)
        
        # Format results
        subjects_list = [
            {
                "id": row[0],
                "name": row[1],
                "description": row[2],
                "created_at": row[3] if isinstance(row[3], str) else row[3].isoformat() if row[3] else None,
                "updated_at": row[4] if isinstance(row[4], str) else row[4].isoformat() if row[4] else None,
            }
            for row in results
        ]
    
    # Return with metadata
    response = {
        "items": subjects_list,
        "total": len(subjects_list),
        "limit": search_params.limit,
        "offset": search_params.offset
    }
    
    return jsonify(response), HTTPStatus.OK
