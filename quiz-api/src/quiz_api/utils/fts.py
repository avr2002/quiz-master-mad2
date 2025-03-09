"""Full-Text Search utilities for SQLite."""

from flask import current_app
from sqlalchemy import text

from quiz_api.models.database import db


def setup_fts():
    """Set up Full-Text Search virtual tables for searchable entities."""
    # Check if we're using SQLite (FTS is SQLite-specific)
    if not current_app.config["SQLALCHEMY_DATABASE_URI"].startswith("sqlite"):
        current_app.logger.warning("FTS setup skipped: Not using SQLite database")
        return

    try:
        # Create FTS virtual table for subjects
        db.session.execute(
            text("""
            CREATE VIRTUAL TABLE IF NOT EXISTS subjects_fts USING fts5(
                name, 
                description, 
                content='subjects',
                content_rowid='id'
            );
            """)
        )
        
        # Create triggers to keep FTS table in sync with main table
        db.session.execute(
            text("""
            CREATE TRIGGER IF NOT EXISTS subjects_ai AFTER INSERT ON subjects
            BEGIN
                INSERT INTO subjects_fts(rowid, name, description)
                VALUES (new.id, new.name, new.description);
            END;
            """)
        )
        
        db.session.execute(
            text("""
            CREATE TRIGGER IF NOT EXISTS subjects_ad AFTER DELETE ON subjects
            BEGIN
                DELETE FROM subjects_fts WHERE rowid = old.id;
            END;
            """)
        )
        
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
        
        # Populate FTS table with existing data (if any)
        db.session.execute(
            text("""
            INSERT OR IGNORE INTO subjects_fts(rowid, name, description)
            SELECT id, name, description FROM subjects;
            """)
        )
        
        # Create FTS virtual table for chapters
        db.session.execute(
            text("""
            CREATE VIRTUAL TABLE IF NOT EXISTS chapters_fts USING fts5(
                name, 
                description, 
                content='chapters',
                content_rowid='id'
            );
            """)
        )
        
        # Create triggers for chapters
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
        
        # Populate chapters FTS table
        db.session.execute(
            text("""
            INSERT OR IGNORE INTO chapters_fts(rowid, name, description)
            SELECT id, name, description FROM chapters;
            """)
        )
        
        # Create FTS virtual table for users
        db.session.execute(
            text("""
            CREATE VIRTUAL TABLE IF NOT EXISTS users_fts USING fts5(
                username, 
                full_name,
                email,
                content='users',
                content_rowid='id'
            );
            """)
        )
        
        # Create triggers for users
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
        
        # Populate users FTS table
        db.session.execute(
            text("""
            INSERT OR IGNORE INTO users_fts(rowid, username, full_name, email)
            SELECT id, username, full_name, email FROM users;
            """)
        )
        
        # Create FTS virtual table for quizzes
        db.session.execute(
            text("""
            CREATE VIRTUAL TABLE IF NOT EXISTS quizzes_fts USING fts5(
                remarks,
                content='quizzes',
                content_rowid='id'
            );
            """)
        )
        
        # Create triggers for quizzes
        db.session.execute(
            text("""
            CREATE TRIGGER IF NOT EXISTS quizzes_ai AFTER INSERT ON quizzes
            BEGIN
                INSERT INTO quizzes_fts(rowid, remarks)
                VALUES (new.id, new.remarks);
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
                INSERT INTO quizzes_fts(rowid, remarks)
                VALUES (new.id, new.remarks);
            END;
            """)
        )
        
        # Populate quizzes FTS table
        db.session.execute(
            text("""
            INSERT OR IGNORE INTO quizzes_fts(rowid, remarks)
            SELECT id, remarks FROM quizzes WHERE remarks IS NOT NULL;
            """)
        )
        
        db.session.commit()
        current_app.logger.info("FTS setup completed successfully")
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error setting up FTS: {str(e)}")
        raise


def search_subjects(query_text, limit=10, offset=0):
    """
    Search subjects using FTS.
    
    Args:
        query_text: The search query text
        limit: Maximum number of results to return
        offset: Number of results to skip
        
    Returns:
        List of Subject objects matching the query
    """
    if not query_text:
        return []
        
    try:
        # Use FTS to search subjects
        result = db.session.execute(
            text("""
                SELECT s.* FROM subjects s
                JOIN subjects_fts fts ON s.id = fts.rowid
                WHERE subjects_fts MATCH :query
                ORDER BY rank
                LIMIT :limit OFFSET :offset
            """),
            {"query": query_text, "limit": limit, "offset": offset}
        ).fetchall()
        
        return result
        
    except Exception as e:
        current_app.logger.error(f"Error searching subjects: {str(e)}")
        return []


def search_chapters(query_text, limit=10, offset=0):
    """
    Search chapters using FTS.
    
    Args:
        query_text: The search query text
        limit: Maximum number of results to return
        offset: Number of results to skip
        
    Returns:
        List of Chapter objects matching the query
    """
    if not query_text:
        return []
        
    try:
        # Use FTS to search chapters
        result = db.session.execute(
            text("""
                SELECT c.* FROM chapters c
                JOIN chapters_fts fts ON c.id = fts.rowid
                WHERE chapters_fts MATCH :query
                ORDER BY rank
                LIMIT :limit OFFSET :offset
            """),
            {"query": query_text, "limit": limit, "offset": offset}
        ).fetchall()
        
        return result
        
    except Exception as e:
        current_app.logger.error(f"Error searching chapters: {str(e)}")
        return []


def search_users(query_text, limit=10, offset=0):
    """
    Search users using FTS.
    
    Args:
        query_text: The search query text
        limit: Maximum number of results to return
        offset: Number of results to skip
        
    Returns:
        List of User objects matching the query
    """
    if not query_text:
        return []
        
    try:
        # Use FTS to search users
        result = db.session.execute(
            text("""
                SELECT u.* FROM users u
                JOIN users_fts fts ON u.id = fts.rowid
                WHERE users_fts MATCH :query
                ORDER BY rank
                LIMIT :limit OFFSET :offset
            """),
            {"query": query_text, "limit": limit, "offset": offset}
        ).fetchall()
        
        return result
        
    except Exception as e:
        current_app.logger.error(f"Error searching users: {str(e)}")
        return []


def search_quizzes(query_text, limit=10, offset=0, chapter_id=None):
    """
    Search quizzes using FTS.
    
    Args:
        query_text: The search query text
        limit: Maximum number of results to return
        offset: Number of results to skip
        chapter_id: Optional chapter ID to filter results
        
    Returns:
        List of Quiz objects matching the query
    """
    if not query_text:
        return []
        
    try:
        # Base query
        sql_query = """
            SELECT q.* FROM quizzes q
            JOIN quizzes_fts fts ON q.id = fts.rowid
            WHERE quizzes_fts MATCH :query
        """
        
        params = {"query": query_text, "limit": limit, "offset": offset}
        
        # Add chapter filter if provided
        if chapter_id is not None:
            sql_query += " AND q.chapter_id = :chapter_id"
            params["chapter_id"] = chapter_id
        
        # Add ordering and pagination
        sql_query += " ORDER BY rank LIMIT :limit OFFSET :offset"
        
        # Execute query
        result = db.session.execute(text(sql_query), params).fetchall()
        
        return result
        
    except Exception as e:
        current_app.logger.error(f"Error searching quizzes: {str(e)}")
        return [] 