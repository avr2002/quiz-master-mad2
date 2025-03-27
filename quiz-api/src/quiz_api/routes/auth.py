"""Authentication Routes (User Registration, Login, and Current User Info)"""

import datetime
from http import HTTPMethod, HTTPStatus

from flask import Blueprint, jsonify, request
from flask.typing import ResponseReturnValue
from flask_jwt_extended import create_access_token, get_jwt, get_jwt_identity, jwt_required
from werkzeug.security import check_password_hash, generate_password_hash

from quiz_api.models.database import db
from quiz_api.models.models import User
from quiz_api.models.schemas import UserSchema, UserUpdateSchema
from quiz_api.utils import add_token_to_blacklist

JWT_EXPIRATION_TIME_IN_HOURS = 1

auth_bp: Blueprint = Blueprint("auth", __name__, url_prefix="/auth")


@auth_bp.route("/register", methods=[HTTPMethod.POST])
def register() -> ResponseReturnValue:
    """
    Register a new user.

    API JSON Body:
        username (str): The username of the user.
        email (str): The email of the user.
        password (str): The password of the user.
        full_name (str): The full name of the user.
        dob (str): The date of birth of the user.
        role (str): The role of the user.

    Returns:
        json: A JSON response indicating the success of the registration.

    """
    user_data = UserSchema(**request.get_json())

    # Prevent admin registration through API
    if user_data.role == "admin":
        return jsonify({"message": "Admin registration not allowed"}), HTTPStatus.FORBIDDEN

    # Check both email and username uniqueness
    if User.query.filter_by(email=user_data.email).first():
        return jsonify({"message": "Email already registered"}), HTTPStatus.BAD_REQUEST

    if User.query.filter_by(username=user_data.username).first():
        return jsonify({"message": "Username already taken"}), HTTPStatus.BAD_REQUEST

    hashed_password = generate_password_hash(user_data.password, method="pbkdf2:sha256")
    new_user = User(
        username=user_data.username,
        password=hashed_password,
        full_name=user_data.full_name,
        dob=user_data.dob,  # date is already parsed in pydantic UserSchema
        email=user_data.email,
        role=user_data.role,  # default role is "user"
    )

    db.session.add(new_user)
    db.session.commit()

    return jsonify({"message": "User registered successfully"}), HTTPStatus.CREATED


@auth_bp.route("/login", methods=[HTTPMethod.POST])
def login() -> ResponseReturnValue:
    """
    Login to the application.

    API JSON Body:
        email (str): The email of the user.
        username (str): The username of the user. (optional if email is provided)
        password (str): The password of the user.

    Returns:
        json: A JSON response indicating the success of the login.

    """
    data = request.get_json()
    identifier = data.get("email") or data.get("username")
    if not identifier or not data.get("password"):
        return jsonify({"message": "Email/username and password are required"}), HTTPStatus.BAD_REQUEST

    # Try to find user by email or username
    user = User.query.filter((User.email == identifier) | (User.username == identifier)).first()

    if not user or not check_password_hash(user.password, data["password"]):
        return jsonify({"message": "Invalid credentials"}), HTTPStatus.UNAUTHORIZED

    # Convert user.id to string otherwise I get "Subject must be a string" error while logging
    # in `get_current_user` due to @jwt_required()
    # Flask-JWT-Extended expects the identity to be a string, but we were passing user.id as an integer.
    access_token = create_access_token(
        identity=str(user.id),
        expires_delta=datetime.timedelta(hours=JWT_EXPIRATION_TIME_IN_HOURS),
    )

    response = {
        "access_token": access_token,
        "user": {
            "id": user.id,
            "email": user.email,
            "username": user.username,
            "full_name": user.full_name,
            "role": user.role,
        },
    }
    return jsonify(response), HTTPStatus.OK


@auth_bp.route("/me", methods=[HTTPMethod.GET])
@jwt_required()
def get_current_user() -> ResponseReturnValue:
    """Get current user information."""
    current_user_id = int(get_jwt_identity())
    current_user: User | None = db.session.get(User, current_user_id)

    if not current_user:
        return jsonify({"message": "User not found"}), HTTPStatus.NOT_FOUND

    return (
        jsonify(
            {
                "id": current_user.id,
                "username": current_user.username,
                "email": current_user.email,
                "full_name": current_user.full_name,
                "role": current_user.role,
                "dob": current_user.dob.strftime("%d/%m/%Y") if current_user.dob else None,
                "joined_at": current_user.joined_at.isoformat(),
            }
        ),
        HTTPStatus.OK,
    )


@auth_bp.route("/me", methods=[HTTPMethod.PATCH])
@jwt_required()
def update_profile() -> ResponseReturnValue:
    """Update the current user's profile."""
    try:
        current_user_id = int(get_jwt_identity())
        current_user: User | None = db.session.get(User, current_user_id)
        if not current_user:
            return jsonify({"message": "Unauthorized"}), HTTPStatus.FORBIDDEN

        update_data = UserUpdateSchema(**request.get_json())

        # Check username uniqueness if it's being updated
        if update_data.username and update_data.username != current_user.username:
            if User.query.filter_by(username=update_data.username).first():
                return jsonify({"message": "Username already taken"}), HTTPStatus.BAD_REQUEST

        # Update the allowed fields if they are provided
        if update_data.username:
            current_user.username = update_data.username
        if update_data.full_name:
            current_user.full_name = update_data.full_name
        if update_data.dob:
            current_user.dob = update_data.dob

        db.session.commit()
        return jsonify({"message": "Profile updated successfully"}), HTTPStatus.OK

    except ValueError as e:
        return jsonify({"message": str(e)}), HTTPStatus.BAD_REQUEST


@auth_bp.route("/logout", methods=[HTTPMethod.GET])
@jwt_required()
def logout() -> ResponseReturnValue:
    """
    Logout the current user by blacklisting their token.

    Returns:
        json: A message indicating successful logout

    """
    jti = get_jwt()["jti"]  # Get JWT ID from token
    add_token_to_blacklist(jti)
    return jsonify({"message": "Successfully logged out"}), HTTPStatus.OK
