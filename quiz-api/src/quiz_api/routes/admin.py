"""Admin Management Routes."""

from http import (
    HTTPMethod,
    HTTPStatus,
)

from flask import (
    Blueprint,
    jsonify,
    request,
)
from flask.typing import ResponseReturnValue
from flask_jwt_extended import (
    get_jwt_identity,
    jwt_required,
)

from quiz_api.models.database import db
from quiz_api.models.models import User
from quiz_api.models.schemas import SearchSchema, UserUpdateSchema
from quiz_api.utils.search import search_users

admin_bp = Blueprint("admin", __name__, url_prefix="/admin/users")


@admin_bp.route("", methods=[HTTPMethod.GET])
@jwt_required()
def get_all_users() -> ResponseReturnValue:
    """Get all users (Admin only)."""
    current_user_id = int(get_jwt_identity())
    current_user: User | None = db.session.get(User, current_user_id)
    if not current_user or current_user.role != "admin":
        return jsonify({"message": "Unauthorized"}), HTTPStatus.FORBIDDEN

    users = User.query.all()
    return (
        jsonify(
            [
                {
                    "id": user.id,
                    "username": user.username,
                    "email": user.email,
                    "full_name": user.full_name,
                    "role": user.role,
                    "dob": user.dob.strftime("%d/%m/%Y") if user.dob else None,
                    "joined_at": user.joined_at.isoformat(),
                }
                for user in users
            ]
        ),
        HTTPStatus.OK,
    )


@admin_bp.route("/<int:user_id>", methods=[HTTPMethod.GET])
@jwt_required()
def get_user(user_id: int) -> ResponseReturnValue:
    """Get a specific user's details (Admin only)."""
    current_user_id = int(get_jwt_identity())
    current_user: User | None = db.session.get(User, current_user_id)
    if not current_user or current_user.role != "admin":
        return jsonify({"message": "Unauthorized"}), HTTPStatus.FORBIDDEN

    user: User | None = db.session.get(User, user_id)
    if not user:
        return jsonify({"message": "User not found"}), HTTPStatus.NOT_FOUND

    return (
        jsonify(
            {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "full_name": user.full_name,
                "role": user.role,
                "dob": user.dob.strftime("%d/%m/%Y") if user.dob else None,
                "joined_at": user.joined_at.isoformat(),
            }
        ),
        HTTPStatus.OK,
    )


@admin_bp.route("/<int:user_id>", methods=[HTTPMethod.DELETE])
@jwt_required()
def delete_user(user_id: int) -> ResponseReturnValue:
    """Delete a user (Admin only)."""
    current_user_id = int(get_jwt_identity())
    current_user: User | None = db.session.get(User, current_user_id)
    if not current_user or current_user.role != "admin":
        return jsonify({"message": "Unauthorized"}), HTTPStatus.FORBIDDEN

    user: User | None = db.session.get(User, user_id)
    if not user:
        return jsonify({"message": "User not found"}), HTTPStatus.NOT_FOUND

    db.session.delete(user)
    db.session.commit()
    return jsonify({"message": "User deleted successfully"}), HTTPStatus.OK


@admin_bp.route("/<int:user_id>", methods=[HTTPMethod.PATCH])
@jwt_required()
def update_user(user_id: int) -> ResponseReturnValue:
    """Update a user's details (Admin only)."""
    try:
        current_user_id = int(get_jwt_identity())
        current_user: User | None = db.session.get(User, current_user_id)
        if not current_user or current_user.role != "admin":
            return jsonify({"message": "Unauthorized"}), HTTPStatus.FORBIDDEN

        user: User | None = db.session.get(User, user_id)
        if not user:
            return jsonify({"message": "User not found"}), HTTPStatus.NOT_FOUND

        update_data = UserUpdateSchema(**request.get_json())

        # Check username uniqueness if it's being updated
        if update_data.username and update_data.username != user.username:
            if User.query.filter_by(username=update_data.username).first():
                return jsonify({"message": "Username already taken"}), HTTPStatus.BAD_REQUEST

        # Update the allowed fields if they are provided
        if update_data.username:
            user.username = update_data.username
        if update_data.full_name:
            user.full_name = update_data.full_name
        if update_data.dob:
            user.dob = update_data.dob

        db.session.commit()
        return jsonify({"message": "User updated successfully"}), HTTPStatus.OK

    except ValueError as e:
        return jsonify({"message": str(e)}), HTTPStatus.BAD_REQUEST


@admin_bp.route("/search", methods=[HTTPMethod.GET])
@jwt_required()
def search_users_endpoint():
    """Search users (Admin only)."""
    # Check if user is admin
    current_user_id = int(get_jwt_identity())
    current_user: User | None = db.session.get(User, current_user_id)
    if not current_user or current_user.role != "admin":
        return jsonify({"message": "Unauthorized"}), HTTPStatus.FORBIDDEN

    search_params = SearchSchema(**request.args)
    query = search_params.q

    if not query:
        # Return all users if no query
        users = User.query.limit(search_params.limit).offset(search_params.offset).all()
        users_list = [
            {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "full_name": user.full_name,
                "role": user.role,
                "dob": user.dob.strftime("%d/%m/%Y") if user.dob else None,
                "joined_at": user.joined_at.isoformat(),
            }
            for user in users
        ]
    else:
        # Use FTS to search
        results = search_users(query, limit=search_params.limit, offset=search_params.offset)

        # Format results
        users_list = [
            {
                "id": row[0],
                "username": row[1],
                "password": "********",  # Don't return actual password
                "full_name": row[2],
                "dob": row[3] if isinstance(row[3], str) else row[3].strftime("%d/%m/%Y") if row[3] else None,
                "email": row[4],
                "role": row[5],
                "joined_at": row[6] if isinstance(row[6], str) else row[6].isoformat() if row[6] else None,
            }
            for row in results
        ]

    # Return with metadata
    response = {
        "items": users_list,
        "total": len(users_list),
        "limit": search_params.limit,
        "offset": search_params.offset,
    }

    return jsonify(response), HTTPStatus.OK
