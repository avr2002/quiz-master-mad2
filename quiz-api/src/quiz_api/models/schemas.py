"""Pydantic Schemas for quiz API."""

from datetime import date, datetime, timedelta, timezone
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator


class SearchSchema(BaseModel):
    """Base schema for search queries."""

    model_config = ConfigDict(from_attributes=True)

    q: str = Field("", description="Search query string")
    limit: int = Field(10, ge=1, le=100, description="Maximum number of results to return")
    offset: int = Field(0, ge=0, description="Number of results to skip")


class UserSchema(BaseModel):
    """Schema for user data validation."""

    model_config = ConfigDict(from_attributes=True)

    username: str = Field(..., min_length=3, max_length=80)
    password: str = Field(..., min_length=6, max_length=120)
    full_name: str = Field(..., min_length=1, max_length=120)
    email: EmailStr
    role: str = Field(..., pattern="^(admin|user)$")
    dob: Optional[date] = None
    joined_at: Optional[datetime] = None

    @field_validator("dob", mode="before")
    @classmethod
    def parse_date(cls, value):
        if not value:
            return None
        if isinstance(value, date):
            return value
        # return datetime.strptime(value, "%d/%m/%Y").date()
        for fmt in ("%d/%m/%Y", "%d-%m-%Y", "%Y-%m-%d", "%Y/%m/%d"):  # Support both formats
            try:
                return datetime.strptime(value, fmt).date()
            except ValueError:
                continue
        raise ValueError("Invalid date format. Use DD/MM/YYYY or DD-MM-YYYY or YYYY-MM-DD or YYYY/MM/DD")  # pylint: disable=raise-missing-from  # noqa: B904


class UserUpdateSchema(BaseModel):
    """Schema for user update data validation."""

    model_config = ConfigDict(from_attributes=True)

    username: Optional[str] = Field(None, min_length=3, max_length=80)
    full_name: Optional[str] = Field(None, min_length=1, max_length=120)
    dob: Optional[date] = None

    @field_validator("dob", mode="before")
    @classmethod
    def parse_date(cls, value):
        if not value:
            return None
        if isinstance(value, date):
            return value
        try:
            return datetime.strptime(value, "%Y-%m-%d").date()
        except ValueError:
            raise ValueError("Invalid date format. Use DD/MM/YYYY or DD-MM-YYYY or YYYY-MM-DD or YYYY/MM/DD")  # pylint: disable=raise-missing-from # noqa: B904


class SubjectSchema(BaseModel):
    """Schema for subject data validation."""

    model_config = ConfigDict(from_attributes=True)

    name: str = Field(..., min_length=2, max_length=100)
    description: str = Field(..., min_length=10, max_length=500)


class SubjectUpdateSchema(BaseModel):
    """Schema for subject update validation."""

    model_config = ConfigDict(from_attributes=True)

    name: str | None = Field(None, min_length=2, max_length=100)
    description: str | None = Field(None, min_length=10, max_length=500)


class ChapterSchema(BaseModel):
    """Schema for creating a new chapter."""

    model_config = ConfigDict(from_attributes=True)

    name: str = Field(..., min_length=3, max_length=100)
    description: str = Field(..., min_length=10, max_length=500)
    subject_id: int = Field(...)


class ChapterUpdateSchema(BaseModel):
    """Schema for updating a chapter."""

    model_config = ConfigDict(from_attributes=True)

    name: str | None = Field(None, min_length=3, max_length=100)
    description: str | None = Field(None, min_length=10, max_length=500)


class QuizSchema(BaseModel):
    """Schema for quiz data validation."""

    model_config = ConfigDict(from_attributes=True)

    chapter_id: Optional[int] = Field(None, gt=0)
    name: str = Field(..., min_length=2, max_length=100)
    date_of_quiz: datetime = Field(...)
    time_duration: str = Field(..., pattern=r"^\d{2}:\d{2}$")  # HH:MM format
    remarks: str | None = None

    @field_validator("date_of_quiz", mode="after")
    @classmethod
    def convert_to_utc(cls, dt: datetime) -> datetime:
        """Convert a naive datetime to UTC."""
        if dt.tzinfo is None:
            # Assume naive datetime is in local time — convert to UTC
            return dt.astimezone().astimezone(timezone.utc)
        # If datetime is already timezone-aware, just convert to UTC
        return dt.astimezone(timezone.utc)

    # @property
    # def end_time(self) -> datetime:
    #     hours, minutes = map(int, self.time_duration.split(":"))
    #     return self.date_of_quiz + timedelta(hours=hours, minutes=minutes)


class QuizUpdateSchema(BaseModel):
    """Schema for quiz update validation."""

    model_config = ConfigDict(from_attributes=True)

    name: str | None = Field(None, min_length=2, max_length=100)
    date_of_quiz: datetime | None = None
    time_duration: str | None = Field(None, pattern=r"^\d{2}:\d{2}$")  # HH:MM format
    remarks: str | None = None


class QuestionSchema(BaseModel):
    """Schema for question data validation."""

    model_config = ConfigDict(from_attributes=True)

    quiz_id: int = Field(..., gt=0)
    id: int = Field(..., gt=0)  # question ID
    question_statement: str = Field(..., min_length=1)
    option1: str = Field(..., min_length=1)
    option2: str = Field(..., min_length=1)
    option3: str = Field(..., min_length=1)
    option4: str = Field(..., min_length=1)
    correct_option: int = Field(..., ge=1, le=4)
    points: int = Field(default=1, ge=1)


class MultipleQuestionsSchema(BaseModel):
    """Schema for creating multiple questions at once."""

    model_config = ConfigDict(from_attributes=True)
    questions: List[QuestionSchema]


class QuestionUpdateSchema(BaseModel):
    """Schema for question update validation."""

    model_config = ConfigDict(from_attributes=True)

    question_statement: str | None = Field(None, min_length=1)
    option1: str | None = Field(None, min_length=1)
    option2: str | None = Field(None, min_length=1)
    option3: str | None = Field(None, min_length=1)
    option4: str | None = Field(None, min_length=1)
    correct_option: int | None = Field(None, ge=1, le=4)
    points: int | None = Field(None, ge=1)


class ScoreSchema(BaseModel):
    """Schema for score data validation."""

    model_config = ConfigDict(from_attributes=True)

    quiz_id: int = Field(..., gt=0)
    user_id: int = Field(..., gt=0)
    total_score: int = Field(..., ge=0)
    timestamp: datetime | None = None


class QuizAnswerSchema(BaseModel):
    """Schema for quiz answer validation."""

    model_config = ConfigDict(from_attributes=True)

    question_id: int = Field(..., gt=0)
    selected_option: int = Field(..., ge=1, le=4)


class QuizAttemptSchema(BaseModel):
    """Schema for quiz attempt validation."""

    model_config = ConfigDict(from_attributes=True)

    answers: list[QuizAnswerSchema]
