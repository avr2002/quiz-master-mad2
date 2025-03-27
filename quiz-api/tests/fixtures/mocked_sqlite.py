from datetime import (
    date,
    datetime,
    timezone,
)

import pytest
from flask.testing import FlaskClient
from quiz_api.models.database import db
from quiz_api.models.models import (
    Chapter,
    Question,
    Quiz,
    Score,
    Subject,
    User,
)
from quiz_api.utils.fts import setup_fts
from werkzeug.security import generate_password_hash


@pytest.fixture(autouse=True, scope="function")
def setup_database(client: FlaskClient):
    """Setup test database before each test and cleanup after."""
    # We're already in app context from client fixture
    # db.session.remove()
    # db.drop_all()
    db.create_all()
    setup_fts()

    yield db.session

    db.session.remove()
    db.drop_all()


@pytest.fixture
def admin_user(setup_database) -> User:
    """Create an admin user for testing."""
    admin: User = User(
        username="admin",
        password=generate_password_hash("admin123"),
        full_name="Test Admin",
        email="admin@test.com",
        role="admin",
    )
    setup_database.add(admin)
    setup_database.commit()
    return admin


@pytest.fixture
def regular_user(setup_database) -> User:
    """Create a regular user for testing."""
    user: User = User(
        username="testuser",
        password=generate_password_hash("test123"),
        full_name="Test User",
        email="test@test.com",
        role="user",
        dob=date(2000, 1, 1),
    )
    setup_database.add(user)
    setup_database.commit()
    return user


@pytest.fixture
def subject(setup_database) -> Subject:
    """Create a test subject."""
    subject: Subject = Subject(name="Test Subject", description="Test Description")
    setup_database.add(subject)
    setup_database.commit()
    return subject


@pytest.fixture
def chapter(setup_database, subject: Subject) -> Chapter:
    """Create a test chapter."""
    chapter: Chapter = Chapter(name="Test Chapter", description="Test Description", subject_id=subject.id)
    setup_database.add(chapter)
    setup_database.commit()
    return chapter


@pytest.fixture
def quiz(setup_database, chapter: Chapter) -> Quiz:
    """Create a test quiz."""
    quiz: Quiz = Quiz(
        chapter_id=chapter.id, date_of_quiz=datetime.now(timezone.utc), time_duration="01:00", remarks="Test quiz"
    )
    setup_database.add(quiz)
    setup_database.commit()
    return quiz


@pytest.fixture
def question(setup_database, quiz: Quiz) -> Question:
    """Create a test question."""
    question: Question = Question(
        quiz_id=quiz.id,
        question_statement="Test question statement",
        option1="Option 1",
        option2="Option 2",
        option3="Option 3",
        option4="Option 4",
        correct_option=1,
        points=2,
    )
    setup_database.add(question)
    setup_database.commit()
    return question


@pytest.fixture
def score(setup_database, quiz: Quiz, regular_user: User) -> Score:
    """Create a test score."""
    score: Score = Score(quiz_id=quiz.id, user_id=regular_user.id, user_score=2)
    setup_database.add(score)
    setup_database.commit()
    return score
