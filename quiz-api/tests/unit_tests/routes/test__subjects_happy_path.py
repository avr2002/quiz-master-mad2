"""Tests for successful subject route operations."""

import pytest
from http import HTTPStatus

from flask.testing import FlaskClient

from quiz_api.models.database import db
from quiz_api.models.models import Subject


def test_create_subject_as_admin(client: FlaskClient, admin_token: str) -> None:
    """Test creating a subject successfully as admin."""
    response = client.post(
        "/subjects",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={"name": "Mathematics", "description": "Learn advanced mathematics concepts and problem-solving"},
    )

    assert response.status_code == HTTPStatus.CREATED
    assert response.json["message"] == "Subject created successfully"
    assert response.json["subject"]["name"] == "Mathematics"
    assert response.json["subject"]["description"] == "Learn advanced mathematics concepts and problem-solving"


def test_get_all_subjects(client: FlaskClient) -> None:
    """Test getting all subjects (no auth required)."""
    # First create a subject
    subject = Subject(name="Physics", description="Study of matter, energy, and their interactions")
    db.session.add(subject)
    db.session.commit()

    response = client.get("/subjects")

    assert response.status_code == HTTPStatus.OK
    assert len(response.json) >= 1
    assert any(s["name"] == "Physics" for s in response.json)


def test_get_subject_by_id(client: FlaskClient) -> None:
    """Test getting a specific subject by ID."""
    # Create a subject
    subject = Subject(name="Chemistry", description="Study of composition, structure, and properties of matter")
    db.session.add(subject)
    db.session.commit()

    response = client.get(f"/subjects/{subject.id}")

    assert response.status_code == HTTPStatus.OK
    assert response.json["name"] == "Chemistry"
    assert response.json["description"] == "Study of composition, structure, and properties of matter"
    assert "created_at" in response.json
    assert "updated_at" in response.json


@pytest.mark.skip(reason="Known SQLite in-memory database corruption issue - (sqlite3.DatabaseError) database disk image is malformed")
def test_update_subject_as_admin(client: FlaskClient, admin_token: str) -> None:
    """Test updating a subject as admin."""
    # Create a subject
    subject = Subject(name="Biology", description="Study of living organisms")
    db.session.add(subject)
    db.session.commit()

    response = client.patch(
        f"/subjects/{subject.id}",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={"name": "Advanced Biology", "description": "Study of complex living organisms and their systems"},
    )

    assert response.status_code == HTTPStatus.OK
    assert response.json["message"] == "Subject updated successfully"

    # Verify the update
    updated = db.session.get(Subject, subject.id)
    assert updated.name == "Advanced Biology"
    assert updated.description == "Study of complex living organisms and their systems"


def test_delete_subject_as_admin(client: FlaskClient, admin_token: str) -> None:
    """Test deleting a subject as admin."""
    # Create a subject
    subject = Subject(name="Computer Science", description="Study of computation and information")
    db.session.add(subject)
    db.session.commit()

    response = client.delete(f"/subjects/{subject.id}", headers={"Authorization": f"Bearer {admin_token}"})

    assert response.status_code == HTTPStatus.OK
    assert response.json["message"] == "Subject deleted successfully"

    # Verify deletion
    assert db.session.query(Subject).filter(Subject.id == subject.id).first() is None
