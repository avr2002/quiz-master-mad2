"""Quiz API application factory."""

import os
from typing import Optional

from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from flask_migrate import Migrate

from quiz_api.config import config
from quiz_api.errors import register_error_handlers
from quiz_api.models.database import db
from quiz_api.routes.admin import admin_bp
from quiz_api.routes.auth import auth_bp
from quiz_api.routes.chapters import chapters_bp
from quiz_api.routes.home import home_bp
from quiz_api.routes.questions import questions_bp
from quiz_api.routes.quiz_attempts import quiz_attempts_bp
from quiz_api.routes.quizzes import quiz_bp
from quiz_api.routes.subjects import subjects_bp
from quiz_api.utils.auth import init_admin, init_jwt
from quiz_api.utils.fts import setup_fts


def create_app(test_config: Optional[dict | object] = None) -> Flask:
    """
    Create and configure the Flask application.

    Args:
        test_config: Configuration dictionary or config class

    Returns:
        Configured Flask application instance.

    """
    app: Flask = Flask(__name__)

    # Load configuration
    flask_env = os.getenv("FLASK_ENVIRONMENT", "default")
    if test_config:
        if isinstance(test_config, dict):
            app.config.update(test_config)
        else:
            app.config.from_object(test_config)
    else:
        app.config.from_object(config[flask_env])

    # Initialize the database
    db.init_app(app)

    # Initialize Flask-Migrate for database migrations
    migrate = Migrate(app, db)

    # Initialize JWT Manager
    jwt = JWTManager(app)
    init_jwt(jwt)  # Initialize JWT blacklist

    # Register error handlers
    register_error_handlers(app)

    # Register CORS
    CORS(app, resources={r"/*": {"origins": "*"}})

    # Register blueprints
    app.register_blueprint(home_bp)
    app.register_blueprint(auth_bp)
    app.register_blueprint(admin_bp)
    app.register_blueprint(subjects_bp)
    app.register_blueprint(chapters_bp)
    app.register_blueprint(quiz_bp)
    app.register_blueprint(questions_bp)
    app.register_blueprint(quiz_attempts_bp)

    return app


# Create the app instance
app = create_app()

# Create tables and initialize admin when the module is imported
with app.app_context():
    db.create_all()
    init_admin()  # Initialize admin user
    setup_fts()  # Set up Full-Text Search


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000)
