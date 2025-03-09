"""Tests for chapter search functionality."""

from http import HTTPStatus

from flask.testing import FlaskClient

from quiz_api.models.database import db
from quiz_api.models.models import Chapter, Subject


def test_search_chapters_empty_query(client: FlaskClient, subject: Subject, chapter: Chapter) -> None:
    """Test searching chapters with empty query returns all chapters for the subject."""
    # Create additional chapters
    chapters = [
        Chapter(name="Introduction", description="Basic concepts", subject_id=subject.id),
        Chapter(name="Advanced Topics", description="Complex topics", subject_id=subject.id),
        Chapter(name="Applications", description="Real-world applications", subject_id=subject.id),
    ]
    db.session.add_all(chapters)
    db.session.commit()

    response = client.get(f"/subjects/{subject.id}/chapters/search")

    assert response.status_code == HTTPStatus.OK
    assert "items" in response.json
    assert len(response.json["items"]) >= 4  # Including the fixture chapter
    assert response.json["total"] >= 4
    assert response.json["limit"] == 10  # Default limit
    assert response.json["offset"] == 0  # Default offset


def test_search_chapters_with_query(client: FlaskClient, subject: Subject) -> None:
    """Test searching chapters with a specific query."""
    # Create chapters with specific terms for searching
    chapters = [
        Chapter(name="Basic Concepts", description="Introduction to basic concepts", subject_id=subject.id),
        Chapter(name="Advanced Concepts", description="Study of advanced topics", subject_id=subject.id),
        Chapter(name="Applications", description="Applications in real world", subject_id=subject.id),
    ]
    db.session.add_all(chapters)
    db.session.commit()

    response = client.get(f"/subjects/{subject.id}/chapters/search?q=concepts")

    assert response.status_code == HTTPStatus.OK
    assert "items" in response.json
    assert len(response.json["items"]) >= 2  # Should find at least 2 chapters with "concepts"
    assert all("concepts" in item["name"].lower() or "concepts" in item["description"].lower() 
               for item in response.json["items"])


def test_search_chapters_with_pagination(client: FlaskClient, subject: Subject) -> None:
    """Test searching chapters with pagination parameters."""
    # Create multiple chapters
    chapters = [Chapter(name=f"Chapter {i}", description=f"Description {i}", subject_id=subject.id) for i in range(15)]
    db.session.add_all(chapters)
    db.session.commit()

    # Test with limit and offset
    response = client.get(f"/subjects/{subject.id}/chapters/search?limit=5&offset=5")

    assert response.status_code == HTTPStatus.OK
    assert "items" in response.json
    assert len(response.json["items"]) == 5  # Should return exactly 5 items
    assert response.json["limit"] == 5
    assert response.json["offset"] == 5


def test_search_chapters_with_invalid_subject(client: FlaskClient) -> None:
    """Test searching chapters with an invalid subject ID."""
    response = client.get("/subjects/99999/chapters/search")

    assert response.status_code == HTTPStatus.NOT_FOUND
    assert response.json["message"] == "Subject not found"


def test_search_chapters_with_invalid_params(client: FlaskClient, subject: Subject) -> None:
    """Test searching chapters with invalid parameters."""
    response = client.get(f"/subjects/{subject.id}/chapters/search?limit=invalid&offset=invalid")

    assert response.status_code == HTTPStatus.BAD_REQUEST
    assert "details" in response.json  # Pydantic validation error


def test_search_chapters_no_results(client: FlaskClient, subject: Subject) -> None:
    """Test searching chapters with a query that returns no results."""
    response = client.get(f"/subjects/{subject.id}/chapters/search?q=nonexistentterm123456789")

    assert response.status_code == HTTPStatus.OK
    assert "items" in response.json
    assert len(response.json["items"]) == 0
    assert response.json["total"] == 0


def test_search_chapters_across_subjects(client: FlaskClient, subject: Subject) -> None:
    """Test that chapter search only returns chapters from the specified subject."""
    # Create another subject with chapters
    other_subject = Subject(name="Other Subject", description="Another subject")
    db.session.add(other_subject)
    db.session.commit()
    
    # Add chapters to both subjects with similar names
    chapters1 = [Chapter(name="Common Chapter", description="Same name in both subjects", subject_id=subject.id)]
    chapters2 = [Chapter(name="Common Chapter", description="Same name in both subjects", subject_id=other_subject.id)]
    db.session.add_all(chapters1 + chapters2)
    db.session.commit()

    # Search in first subject
    response = client.get(f"/subjects/{subject.id}/chapters/search?q=common")

    assert response.status_code == HTTPStatus.OK
    assert "items" in response.json
    assert len(response.json["items"]) == 1  # Should only find the chapter in the first subject
    assert all(item["subject_id"] == subject.id for item in response.json["items"]) 