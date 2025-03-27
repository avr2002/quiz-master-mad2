"""Database models for quiz API."""

from datetime import date, datetime, timedelta, timezone
from typing import List

from sqlalchemy import ForeignKey, String, Text
from sqlalchemy.ext.hybrid import hybrid_property
from sqlalchemy.orm import Mapped, mapped_column, relationship

from quiz_api.models.database import db


class User(db.Model):
    """User database model."""

    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    username: Mapped[str] = mapped_column(String(80), unique=True, nullable=False, index=True)
    password: Mapped[str] = mapped_column(String(120), nullable=False)
    full_name: Mapped[str] = mapped_column(String(120), nullable=False)
    dob: Mapped[date | None] = mapped_column(nullable=True)
    email: Mapped[str] = mapped_column(String, unique=True, nullable=False, index=True)
    role: Mapped[str] = mapped_column(String(10), nullable=False, default="user")  # 'admin' or 'user'
    joined_at: Mapped[datetime] = mapped_column(default=datetime.now(timezone.utc), nullable=False)

    # Relationships
    scores: Mapped[List["Score"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    quiz_signups: Mapped[List["QuizSignup"]] = relationship(back_populates="user", cascade="all, delete-orphan")

    # Helper property to access quizzes directly
    @hybrid_property
    def quizzes(self):
        """Get quizzes the user has signed up for."""
        return [signup.quiz for signup in self.quiz_signups]

    @hybrid_property
    def total_score_across_all_quizzes(self) -> int:
        """Calculate the total score of the user across all quizzes."""
        return sum(score.user_score for score in self.scores)


class Subject(db.Model):
    """Subject database model."""

    __tablename__ = "subjects"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    description: Mapped[str] = mapped_column(String(500), nullable=False)
    created_at: Mapped[datetime] = mapped_column(default=datetime.now(timezone.utc), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        default=datetime.now(timezone.utc), onupdate=datetime.now(timezone.utc)
    )

    # Relationships
    chapters: Mapped[List["Chapter"]] = relationship(back_populates="subject", cascade="all, delete-orphan")


class Chapter(db.Model):
    """Chapter database model."""

    __tablename__ = "chapters"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    subject_id: Mapped[int] = mapped_column(ForeignKey("subjects.id"), nullable=False, index=True)
    created_at: Mapped[datetime] = mapped_column(default=datetime.now(timezone.utc), nullable=False)
    updated_at: Mapped[datetime | None] = mapped_column(default=None, onupdate=datetime.now(timezone.utc))

    # Relationships
    subject: Mapped["Subject"] = relationship(back_populates="chapters")
    quizzes: Mapped[List["Quiz"]] = relationship(back_populates="chapter", cascade="all, delete-orphan")


class Quiz(db.Model):
    """Quiz database model."""

    __tablename__ = "quizzes"

    id: Mapped[int] = mapped_column(primary_key=True)
    chapter_id: Mapped[int] = mapped_column(ForeignKey("chapters.id"), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    date_of_quiz: Mapped[datetime] = mapped_column(nullable=False, index=True)
    time_duration: Mapped[str] = mapped_column(String(10), nullable=False)  # 'hh:mm'
    remarks: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(default=datetime.now(timezone.utc))
    updated_at: Mapped[datetime | None] = mapped_column(default=None, onupdate=datetime.now(timezone.utc))

    # Relationships
    chapter: Mapped["Chapter"] = relationship(back_populates="quizzes")
    questions: Mapped[List["Question"]] = relationship(back_populates="quiz", cascade="all, delete-orphan")
    scores: Mapped[List["Score"]] = relationship(back_populates="quiz", cascade="all, delete-orphan")
    user_signups: Mapped[List["QuizSignup"]] = relationship(back_populates="quiz", cascade="all, delete-orphan")

    # Helper properties
    @hybrid_property
    def signups(self):
        """Get users signed up for this quiz."""
        return [signup.user for signup in self.user_signups]

    @hybrid_property
    def end_time(self) -> datetime | None:
        """Calculate the end datetime of the quiz."""
        if self.time_duration and self.date_of_quiz:
            hours, minutes = map(int, self.time_duration.split(":"))
            return self.date_of_quiz + timedelta(hours=hours, minutes=minutes)
        return None

    @hybrid_property
    def total_quiz_score(self) -> int:
        """Calculate the total score of the quiz."""
        return sum(question.points for question in self.questions)

    @hybrid_property
    def number_of_questions(self) -> int:
        """Calculate the number of questions in the quiz."""
        return len(self.questions)

    @hybrid_property
    def is_upcoming(self) -> bool:
        """Check if the quiz is upcoming."""
        return self.date_of_quiz > datetime.now(timezone.utc)

    @hybrid_property
    def is_active(self) -> bool:
        """Check if the quiz is active."""
        return self.date_of_quiz <= datetime.now(timezone.utc) <= self.end_time


class Question(db.Model):
    """Question database model."""

    __tablename__ = "questions"

    id: Mapped[int] = mapped_column(primary_key=True)
    quiz_id: Mapped[int] = mapped_column(ForeignKey("quizzes.id"), nullable=False)
    question_statement: Mapped[str] = mapped_column(Text, nullable=False)
    option1: Mapped[str] = mapped_column(Text, nullable=False)
    option2: Mapped[str] = mapped_column(Text, nullable=False)
    option3: Mapped[str] = mapped_column(Text, nullable=False)
    option4: Mapped[str] = mapped_column(Text, nullable=False)
    correct_option: Mapped[int] = mapped_column(nullable=False)
    points: Mapped[int] = mapped_column(nullable=False, default=1)

    # Relationships
    quiz: Mapped["Quiz"] = relationship(back_populates="questions")


class Score(db.Model):
    """Score database model."""

    __tablename__ = "scores"

    id: Mapped[int] = mapped_column(primary_key=True)
    quiz_id: Mapped[int] = mapped_column(ForeignKey("quizzes.id"), nullable=False, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    # timestamp <-- The time at which the score was recorded
    timestamp: Mapped[datetime] = mapped_column(default=datetime.now(timezone.utc), index=False)
    user_score: Mapped[int] = mapped_column(nullable=False)
    number_of_correct_answers: Mapped[int] = mapped_column(nullable=False)

    # Relationships
    quiz: Mapped["Quiz"] = relationship(back_populates="scores")
    user: Mapped["User"] = relationship(back_populates="scores")
    question_attempts: Mapped[List["QuestionAttempt"]] = relationship(
        back_populates="score", cascade="all, delete-orphan"
    )


class QuizSignup(db.Model):
    """Association model for user quiz signups."""

    __tablename__ = "quiz_signups"

    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), primary_key=True)
    quiz_id: Mapped[int] = mapped_column(ForeignKey("quizzes.id"), primary_key=True)
    signup_time: Mapped[datetime] = mapped_column(default=datetime.now(timezone.utc))

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="quiz_signups")
    quiz: Mapped["Quiz"] = relationship("Quiz", back_populates="user_signups")


class QuestionAttempt(db.Model):
    """Model to store user's selected answers for questions."""

    __tablename__ = "question_attempts"

    id: Mapped[int] = mapped_column(primary_key=True)
    score_id: Mapped[int] = mapped_column(ForeignKey("scores.id"), nullable=False, index=True)
    question_id: Mapped[int] = mapped_column(ForeignKey("questions.id"), nullable=False)
    selected_option: Mapped[int] = mapped_column(nullable=False)  # 1-4 representing user's choice
    is_correct: Mapped[bool] = mapped_column(nullable=False)  # Whether the selected answer was correct

    # Relationships
    score: Mapped["Score"] = relationship(back_populates="question_attempts")
    question: Mapped["Question"] = relationship("Question")
