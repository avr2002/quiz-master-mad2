"""Flask App Configuration."""

import os
from datetime import timedelta
from pathlib import Path
from typing import Any, Dict

from dotenv import load_dotenv

# Load .env file at the start
load_dotenv()

THIS_DIR = Path(__file__).resolve().parent
SRC_DIR = THIS_DIR.parent.resolve()
QUIZ_API_DIR = SRC_DIR.parent.resolve()

# TODO: Remove STATIC_FOLDER and TEMPLATE_DIR
STATIC_FOLDER = QUIZ_API_DIR / "static"
TEMPLATE_DIR = STATIC_FOLDER / "templates"

ROOT_DIR = QUIZ_API_DIR.parent.resolve()


class Config:
    """Base configuration."""

    # Flask settings
    SECRET_KEY = os.environ["SECRET_KEY"]

    # Database settings
    SQLALCHEMY_DATABASE_URI = os.getenv("SQLALCHEMY_DATABASE_URI")
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # JWT settings
    JWT_SECRET_KEY = os.environ["JWT_SECRET_KEY"]
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=1)
    JWT_BLACKLIST_ENABLED = True  # Enable token blacklist
    JWT_BLACKLIST_TOKEN_CHECKS = ["access"]

    # Admin user settings
    ADMIN_USERNAME = os.environ["ADMIN_USERNAME"]
    ADMIN_EMAIL = os.environ["ADMIN_EMAIL"]
    ADMIN_PASSWORD = os.environ["ADMIN_PASSWORD"]


class TestConfig(Config):
    """Test configuration."""

    TESTING = True
    # Use a shared in-memory database
    SQLALCHEMY_DATABASE_URI = "sqlite:///:memory:"  # "sqlite:///:memory:?cache=shared&uri=true"
    SECRET_KEY = "test-secret-key"
    JWT_SECRET_KEY = "test-jwt-secret-key"
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(seconds=1)  # Short expiry for tests


class DevelopmentConfig(Config):
    """Development configuration."""

    DEBUG = True
    SQLITE_DB_DIR = str(ROOT_DIR / "database" / "quiz_master.db")
    # SQLALCHEMY_DATABASE_URI = f"sqlite:///{SQLITE_DB_DIR}"
    SQLALCHEMY_DATABASE_URI = (
        f"sqlite:///{SQLITE_DB_DIR}"
        f"?journal_mode=WAL"          # Write-Ahead Logging for better concurrency
        f"&synchronous=NORMAL"        # Balance between safety and performance
        f"&foreign_keys=ON"           # Enforce referential integrity
        f"&locking_mode=NORMAL"       # Standard locking
        f"&busy_timeout=5000"         # Wait 5 seconds on busy before failing
    )
    SQLALCHEMY_ECHO = False  # Set True to Log SQL queries


class ProductionConfig(Config):
    """Production configuration."""

    DEBUG = False
    TESTING = False

    # In production, these must be set in environment
    def __init__(self):
        if not os.getenv("SECRET_KEY"):
            raise ValueError("SECRET_KEY must be set in production")
        if not os.getenv("JWT_SECRET_KEY"):
            raise ValueError("JWT_SECRET_KEY must be set in production")
        if not os.getenv("SQLALCHEMY_DATABASE_URI"):
            raise ValueError("SQLALCHEMY_DATABASE_URI must be set in production")


# Configuration dictionary
config: Dict[str, Any] = {
    "development": DevelopmentConfig,
    "testing": TestConfig,
    "production": ProductionConfig,
    "default": DevelopmentConfig,
}
