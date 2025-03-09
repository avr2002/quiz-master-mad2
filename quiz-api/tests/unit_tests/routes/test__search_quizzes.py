"""Tests for quiz search functionality."""

from datetime import datetime, timedelta
from http import HTTPStatus

from flask.testing import FlaskClient

from quiz_api.models.database import db
from quiz_api.models.models import Chapter, Quiz, Subject


def test_search_quizzes_empty_query(client: FlaskClient, chapter: Chapter, quiz: Quiz) -> None:
    """Test searching quizzes with empty query returns all quizzes for the chapter."""
    # Create additional quizzes
    now = datetime.now()
    quizzes = [
        Quiz(chapter_id=chapter.id, date_of_quiz=now + timedelta(days=1), time_duration="01:00", 
             remarks="Midterm quiz"),
        Quiz(chapter_id=chapter.id, date_of_quiz=now + timedelta(days=2), time_duration="01:30", 
             remarks="Final quiz"),
        Quiz(chapter_id=chapter.id, date_of_quiz=now + timedelta(days=3), time_duration="00:45", 
             remarks="Pop quiz"),
    ]
    db.session.add_all(quizzes)
    db.session.commit()

    response = client.get(f"/chapters/{chapter.id}/quizzes/search")

    assert response.status_code == HTTPStatus.OK
    assert "items" in response.json
    assert len(response.json["items"]) >= 4  # Including the fixture quiz
    assert response.json["total"] >= 4
    assert response.json["limit"] == 10  # Default limit
    assert response.json["offset"] == 0  # Default offset


def test_search_quizzes_with_query(client: FlaskClient, chapter: Chapter) -> None:
    """Test searching quizzes with a specific query."""
    # Create quizzes with specific terms for searching
    now = datetime.now()
    quizzes = [
        Quiz(chapter_id=chapter.id, date_of_quiz=now + timedelta(days=1), time_duration="01:00", 
             remarks="Midterm assessment"),
        Quiz(chapter_id=chapter.id, date_of_quiz=now + timedelta(days=2), time_duration="01:30", 
             remarks="Final assessment"),
        Quiz(chapter_id=chapter.id, date_of_quiz=now + timedelta(days=3), time_duration="00:45", 
             remarks="Practice quiz"),
    ]
    db.session.add_all(quizzes)
    db.session.commit()

    response = client.get(f"/chapters/{chapter.id}/quizzes/search?q=assessment")

    assert response.status_code == HTTPStatus.OK
    assert "items" in response.json
    assert len(response.json["items"]) >= 2  # Should find at least 2 quizzes with "assessment"
    assert all("assessment" in item["remarks"].lower() for item in response.json["items"])


def test_search_quizzes_with_pagination(client: FlaskClient, chapter: Chapter) -> None:
    """Test searching quizzes with pagination parameters."""
    # Create multiple quizzes
    now = datetime.now()
    quizzes = []
    for i in range(15):
        quizzes.append(Quiz(
            chapter_id=chapter.id, 
            date_of_quiz=now + timedelta(days=i), 
            time_duration="01:00", 
            remarks=f"Quiz {i}"
        ))
    db.session.add_all(quizzes)
    db.session.commit()

    # Test with limit and offset
    response = client.get(f"/chapters/{chapter.id}/quizzes/search?limit=5&offset=5")

    assert response.status_code == HTTPStatus.OK
    assert "items" in response.json
    assert len(response.json["items"]) == 5  # Should return exactly 5 items
    assert response.json["limit"] == 5
    assert response.json["offset"] == 5


def test_search_quizzes_with_invalid_chapter(client: FlaskClient) -> None:
    """Test searching quizzes with an invalid chapter ID."""
    response = client.get("/chapters/99999/quizzes/search")

    assert response.status_code == HTTPStatus.NOT_FOUND
    assert response.json["message"] == "Chapter not found"


def test_search_quizzes_with_invalid_params(client: FlaskClient, chapter: Chapter) -> None:
    """Test searching quizzes with invalid parameters."""
    response = client.get(f"/chapters/{chapter.id}/quizzes/search?limit=invalid&offset=invalid")

    assert response.status_code == HTTPStatus.BAD_REQUEST
    assert "details" in response.json  # Pydantic validation error


def test_search_quizzes_no_results(client: FlaskClient, chapter: Chapter) -> None:
    """Test searching quizzes with a query that returns no results."""
    response = client.get(f"/chapters/{chapter.id}/quizzes/search?q=nonexistentterm123456789")

    assert response.status_code == HTTPStatus.OK
    assert "items" in response.json
    assert len(response.json["items"]) == 0
    assert response.json["total"] == 0


def test_search_quizzes_across_chapters(client: FlaskClient, subject: Subject, chapter: Chapter) -> None:
    """Test that quiz search only returns quizzes from the specified chapter."""
    # Create another chapter with quizzes
    other_chapter = Chapter(name="Other Chapter", description="Another chapter", subject_id=subject.id)
    db.session.add(other_chapter)
    db.session.commit()
    
    now = datetime.now()
    # Add quizzes to both chapters with similar remarks
    quiz1 = Quiz(chapter_id=chapter.id, date_of_quiz=now, time_duration="01:00", remarks="Common Quiz")
    quiz2 = Quiz(chapter_id=other_chapter.id, date_of_quiz=now, time_duration="01:00", remarks="Common Quiz")
    db.session.add_all([quiz1, quiz2])
    db.session.commit()

    # Search in first chapter
    response = client.get(f"/chapters/{chapter.id}/quizzes/search?q=common")

    assert response.status_code == HTTPStatus.OK
    assert "items" in response.json
    assert len(response.json["items"]) == 1  # Should only find the quiz in the first chapter
    assert all(item["chapter_id"] == chapter.id for item in response.json["items"]) 