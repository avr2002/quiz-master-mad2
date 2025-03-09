"""Tests for subject search functionality."""

from http import HTTPStatus

from flask.testing import FlaskClient
from sqlalchemy import text

from quiz_api.models.database import db
from quiz_api.models.models import Subject


def test_search_subjects_empty_query(client: FlaskClient, subject: Subject) -> None:
    """Test searching subjects with empty query returns all subjects."""
    # Create additional subjects
    subjects = [
        Subject(name="Mathematics", description="Study of numbers and patterns"),
        Subject(name="Physics", description="Study of matter and energy"),
        Subject(name="Chemistry", description="Study of substances and reactions"),
    ]
    db.session.add_all(subjects)
    db.session.commit()

    response = client.get("/subjects/search")

    assert response.status_code == HTTPStatus.OK
    assert "items" in response.json
    assert len(response.json["items"]) >= 4  # Including the fixture subject
    assert response.json["total"] >= 4
    assert response.json["limit"] == 10  # Default limit
    assert response.json["offset"] == 0  # Default offset


def test_search_subjects_with_query(client: FlaskClient) -> None:
    """Test searching subjects with a specific query."""
    # Create subjects with specific terms for searching
    subjects = [
        Subject(name="Advanced Mathematics", description="Complex mathematical concepts"),
        Subject(name="Basic Physics", description="Introduction to physics"),
        Subject(name="Mathematics for Physics", description="Mathematical methods in physics"),
    ]
    db.session.add_all(subjects)
    db.session.commit()

    response = client.get("/subjects/search?q=mathematics")

    assert response.status_code == HTTPStatus.OK
    assert "items" in response.json
    assert len(response.json["items"]) >= 2  # Should find at least 2 subjects with "mathematics"
    assert all("mathematics" in item["name"].lower() or "mathematics" in item["description"].lower() 
               for item in response.json["items"])


def test_search_subjects_with_pagination(client: FlaskClient) -> None:
    """Test searching subjects with pagination parameters."""
    # Create multiple subjects
    subjects = [Subject(name=f"Subject {i}", description=f"Description {i}") for i in range(15)]
    db.session.add_all(subjects)
    db.session.commit()

    # Test with limit and offset
    response = client.get("/subjects/search?limit=5&offset=5")

    assert response.status_code == HTTPStatus.OK
    assert "items" in response.json
    assert len(response.json["items"]) == 5  # Should return exactly 5 items
    assert response.json["limit"] == 5
    assert response.json["offset"] == 5


def test_search_subjects_with_invalid_params(client: FlaskClient) -> None:
    """Test searching subjects with invalid parameters."""
    response = client.get("/subjects/search?limit=invalid&offset=invalid")

    assert response.status_code == HTTPStatus.BAD_REQUEST
    assert "details" in response.json  # Pydantic validation error


def test_search_subjects_no_results(client: FlaskClient) -> None:
    """Test searching subjects with a query that returns no results."""
    response = client.get("/subjects/search?q=nonexistentterm123456789")

    assert response.status_code == HTTPStatus.OK
    assert "items" in response.json
    assert len(response.json["items"]) == 0
    assert response.json["total"] == 0 