"""Search utilities for the application."""

from datetime import datetime
from flask import current_app
from sqlalchemy import text

from quiz_api.models.database import db


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
        result = db.session.execute(
            text("""
                 SELECT s.* FROM subjects s
                 JOIN subjects_fts ON s.id = subjects_fts.rowid
                 WHERE subjects_fts MATCH :query
                 ORDER BY subjects_fts.rank
                 LIMIT :limit OFFSET :offset
            """),
            {"query": f'{query_text}*', "limit": limit, "offset": offset}
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
                SELECT c.id, c.name, c.description, c.subject_id, c.created_at, c.updated_at 
                FROM chapters c
                JOIN chapters_fts fts ON c.id = fts.rowid
                WHERE chapters_fts MATCH :query
                ORDER BY rank
                LIMIT :limit OFFSET :offset
            """),
            {"query": f"{query_text}*", "limit": limit, "offset": offset}
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
                SELECT u.id, u.username, u.password, u.full_name, u.dob, u.email, u.role, u.joined_at
                FROM users u
                JOIN users_fts fts ON u.id = fts.rowid
                WHERE users_fts MATCH :query
                ORDER BY rank
                LIMIT :limit OFFSET :offset
            """),
            {"query": f'{query_text}*', "limit": limit, "offset": offset}
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
            SELECT q.id, q.chapter_id, q.date_of_quiz, q.time_duration, q.remarks, q.created_at, q.updated_at
            FROM quizzes q
            JOIN quizzes_fts fts ON q.id = fts.rowid
            WHERE quizzes_fts MATCH :query
        """
        
        params = {"query": f'{query_text}*', "limit": limit, "offset": offset}
        
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