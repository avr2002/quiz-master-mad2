"""Full-Text Search utilities for SQLite."""

import os

from flask import current_app
from sqlalchemy import text

from quiz_api.models.database import db


def setup_fts():
    """Set up Full-Text Search virtual tables for searchable entities."""
    # Check if we're using SQLite (FTS is SQLite-specific)
    if not current_app.config["SQLALCHEMY_DATABASE_URI"].startswith("sqlite"):
        current_app.logger.warning("FTS setup skipped: Not using SQLite database")
        return

    # Skip FTS setup during migrations
    if os.environ.get("FLASK_DB_MIGRATION", "false").lower() == "true":
        current_app.logger.info("FTS setup skipped: Database migration in progress")
        return

    try:
        # Set up FTS for each entity type
        setup_subjects_fts()
        setup_chapters_fts()
        setup_users_fts()
        setup_quizzes_fts()

        current_app.logger.info("FTS setup completed successfully")

    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error setting up FTS: {str(e)}")
        raise


def setup_subjects_fts():
    """Set up FTS for subjects table."""
    try:
        # Create FTS virtual table for subjects
        db.session.execute(
            text("""
            CREATE VIRTUAL TABLE IF NOT EXISTS subjects_fts USING fts5(
                name,
                description,
                content='subjects',
                content_rowid='id',
                tokenize='porter'
            );
            """)
        )

        # Create INSERT trigger
        db.session.execute(
            text("""
            CREATE TRIGGER IF NOT EXISTS subjects_ai AFTER INSERT ON subjects
            BEGIN
                INSERT INTO subjects_fts(rowid, name, description)
                VALUES (new.id, new.name, new.description);
            END;
            """)
        )

        # Create UPDATE trigger (DELETE + INSERT workaround for FTS5)
        db.session.execute(
            text("""
            CREATE TRIGGER IF NOT EXISTS subjects_au AFTER UPDATE ON subjects
            BEGIN
                DELETE FROM subjects_fts WHERE rowid = old.id;
                INSERT INTO subjects_fts(rowid, name, description)
                VALUES (new.id, new.name, new.description);
            END;
            """)
        )

        # Create DELETE trigger
        db.session.execute(
            text("""
            CREATE TRIGGER IF NOT EXISTS subjects_ad AFTER DELETE ON subjects
            BEGIN
                DELETE FROM subjects_fts WHERE rowid = old.id;
            END;
            """)
        )

        # Rebuild FTS index (optional, if you need a full refresh)
        db.session.execute(text("INSERT INTO subjects_fts(subjects_fts) VALUES ('rebuild');"))

        db.session.commit()
        current_app.logger.info("Subjects FTS setup completed successfully")
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error setting up subjects FTS: {str(e)}")
        raise


def setup_chapters_fts():
    """Set up FTS for chapters table."""
    try:
        db.session.execute(
            text("""
            CREATE VIRTUAL TABLE IF NOT EXISTS chapters_fts USING fts5(
                name,
                description,
                content='chapters',
                content_rowid='id',
                tokenize='porter'
            );
        """)
        )

        db.session.execute(
            text("""
            CREATE TRIGGER IF NOT EXISTS chapters_ai AFTER INSERT ON chapters
            BEGIN
                INSERT INTO chapters_fts(rowid, name, description)
                VALUES (new.id, new.name, new.description);
            END;
        """)
        )

        db.session.execute(
            text("""
            CREATE TRIGGER IF NOT EXISTS chapters_ad AFTER DELETE ON chapters
            BEGIN
                DELETE FROM chapters_fts WHERE rowid = old.id;
            END;
        """)
        )

        db.session.execute(
            text("""
            CREATE TRIGGER IF NOT EXISTS chapters_au AFTER UPDATE ON chapters
            BEGIN
                DELETE FROM chapters_fts WHERE rowid = old.id;
                INSERT INTO chapters_fts(rowid, name, description)
                VALUES (new.id, new.name, new.description);
            END;
        """)
        )

        # More efficient index refresh
        db.session.execute(text("INSERT INTO chapters_fts(chapters_fts) VALUES ('rebuild');"))

        db.session.commit()
        current_app.logger.info("Chapters FTS setup completed successfully")
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error setting up chapters FTS: {str(e)}")
        raise


def setup_users_fts():
    """Set up FTS for users table."""
    try:
        db.session.execute(
            text("""
            CREATE VIRTUAL TABLE IF NOT EXISTS users_fts USING fts5(
                username,
                full_name,
                email,
                content='users',
                content_rowid='id',
                tokenize='porter'
            );
        """)
        )

        db.session.execute(
            text("""
            CREATE TRIGGER IF NOT EXISTS users_ai AFTER INSERT ON users
            BEGIN
                INSERT INTO users_fts(rowid, username, full_name, email)
                VALUES (new.id, new.username, new.full_name, new.email);
            END;
        """)
        )

        db.session.execute(
            text("""
            CREATE TRIGGER IF NOT EXISTS users_ad AFTER DELETE ON users
            BEGIN
                DELETE FROM users_fts WHERE rowid = old.id;
            END;
        """)
        )

        db.session.execute(
            text("""
            CREATE TRIGGER IF NOT EXISTS users_au AFTER UPDATE ON users
            BEGIN
                DELETE FROM users_fts WHERE rowid = old.id;
                INSERT INTO users_fts(rowid, username, full_name, email)
                VALUES (new.id, new.username, new.full_name, new.email);
            END;
        """)
        )

        # Rebuild FTS index (optional, if you need a full refresh)
        db.session.execute(text("INSERT INTO users_fts(users_fts) VALUES ('rebuild');"))

        db.session.commit()
        current_app.logger.info("Users FTS setup completed successfully")
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error setting up users FTS: {str(e)}")
        raise


def setup_quizzes_fts():
    """Set up FTS for quizzes table."""
    try:
        db.session.execute(
            text("""
            CREATE VIRTUAL TABLE IF NOT EXISTS quizzes_fts USING fts5(
                name,
                remarks,
                content='quizzes',
                content_rowid='id',
                tokenize='porter'
            );
        """)
        )

        db.session.execute(
            text("""
            CREATE TRIGGER IF NOT EXISTS quizzes_ai AFTER INSERT ON quizzes
            BEGIN
                INSERT INTO quizzes_fts(rowid, name, remarks)
                VALUES (new.id, new.name, new.remarks);
            END;
        """)
        )

        db.session.execute(
            text("""
            CREATE TRIGGER IF NOT EXISTS quizzes_ad AFTER DELETE ON quizzes
            BEGIN
                DELETE FROM quizzes_fts WHERE rowid = old.id;
            END;
        """)
        )

        db.session.execute(
            text("""
            CREATE TRIGGER IF NOT EXISTS quizzes_au AFTER UPDATE ON quizzes
            BEGIN
                DELETE FROM quizzes_fts WHERE rowid = old.id;
                INSERT INTO quizzes_fts(rowid, name, remarks)
                VALUES (new.id, new.name, new.remarks);
            END;
        """)
        )

        # Rebuild FTS index (optional, if you need a full refresh)
        db.session.execute(text("INSERT INTO quizzes_fts(quizzes_fts) VALUES ('rebuild');"))

        db.session.commit()
        current_app.logger.info("Quizzes FTS setup completed successfully")
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error setting up quizzes FTS: {str(e)}")
        raise
