"""Database models for quiz API."""

from datetime import (
    date,
    datetime,
    timezone,
)
from typing import List

from sqlalchemy import (
    ForeignKey,
    String,
    Text,
    func,
)
from sqlalchemy.orm import (
    Mapped,
    mapped_column,
    relationship,
)

from quiz_api.models.database import db


class User(db.Model):
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


class Subject(db.Model):
    __tablename__ = "subjects"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    description: Mapped[str] = mapped_column(String(500), nullable=False)
    created_at: Mapped[datetime] = mapped_column(default=datetime.now(timezone.utc), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(default=datetime.now(timezone.utc), onupdate=datetime.now(timezone.utc))

    # Relationships
    chapters: Mapped[List["Chapter"]] = relationship(back_populates="subject", cascade="all, delete-orphan")


class Chapter(db.Model):
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
    __tablename__ = "quizzes"

    id: Mapped[int] = mapped_column(primary_key=True)
    chapter_id: Mapped[int] = mapped_column(ForeignKey("chapters.id"), nullable=False, index=True)
    date_of_quiz: Mapped[datetime] = mapped_column(nullable=False, index=True)
    time_duration: Mapped[str] = mapped_column(String(10), nullable=False)  # 'hh:mm'
    remarks: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(default=datetime.now(timezone.utc))
    updated_at: Mapped[datetime | None] = mapped_column(default=None, onupdate=datetime.now(timezone.utc))

    # Relationships
    chapter: Mapped["Chapter"] = relationship(back_populates="quizzes")
    questions: Mapped[List["Question"]] = relationship(back_populates="quiz", cascade="all, delete-orphan")
    scores: Mapped[List["Score"]] = relationship(back_populates="quiz", cascade="all, delete-orphan")


class Question(db.Model):
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
    __tablename__ = "scores"

    id: Mapped[int] = mapped_column(primary_key=True)
    quiz_id: Mapped[int] = mapped_column(ForeignKey("quizzes.id"), nullable=False, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    timestamp: Mapped[datetime] = mapped_column(default=func.current_timestamp(), index=True)
    total_score: Mapped[int] = mapped_column(nullable=False)

    # Relationships
    quiz: Mapped["Quiz"] = relationship(back_populates="scores")
    user: Mapped["User"] = relationship(back_populates="scores")
