"""Authentication utility functions."""

import os

from flask_jwt_extended import JWTManager
from werkzeug.security import generate_password_hash

from quiz_api.models.database import db
from quiz_api.models.models import User

# Store for blacklisted tokens (in a real app, use Redis or database)
token_blacklist = set()


def init_jwt(jwt_manager: JWTManager) -> None:
    """
    Initialize JWT manager with token blacklist.

    Args:
        jwt_manager: The JWT manager instance to configure

    """

    @jwt_manager.token_in_blocklist_loader
    def check_if_token_is_revoked(jwt_header, jwt_payload: dict) -> bool:
        """Check if the token is in the blacklist."""
        jti = jwt_payload["jti"]
        return jti in token_blacklist


def init_admin() -> None:
    """Initialize admin user if it doesn't exist."""
    try:
        admin = User.query.filter_by(role="admin").first()
        if not admin:
            print("Admin user not found, Creating Admin User")
            # Get admin credentials from environment variables
            admin_email = os.environ["ADMIN_EMAIL"]
            admin_username = os.environ["ADMIN_USERNAME"]
            admin_password = os.environ["ADMIN_PASSWORD"]

            hashed_password = generate_password_hash(admin_password, method="pbkdf2:sha256")
            admin = User(
                username=admin_username,
                password=hashed_password,
                full_name="Administrator",
                email=admin_email,
                role="admin",
            )
            db.session.add(admin)
            db.session.commit()
    finally:
        db.session.close()


def add_token_to_blacklist(jti: str) -> None:
    """
    Add a token to the blacklist.

    Args:
        jti: The JWT ID to blacklist

    """
    token_blacklist.add(jti)
