from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel


class SessionMessageBase(BaseModel):
    sender_type: str  # 'teacher', 'student', 'system'
    sender_name: str
    message_text: str
    student_personality: Optional[str] = None


class SessionMessageCreate(SessionMessageBase):
    pass


class SessionMessageOut(SessionMessageBase):
    id: int
    session_id: int
    timestamp: datetime

    class Config:
        from_attributes = True


class ClassroomSessionBase(BaseModel):
    subject: str
    topic: str
    class_level: str
    lesson_objectives: Optional[str] = None
    teaching_method: Optional[str] = None
    duration_minutes: int = 15
    language: str = "English"  # English, Hindi, Bengali


class ClassroomSessionCreate(ClassroomSessionBase):
    pass


class ClassroomSessionOut(ClassroomSessionBase):
    id: int
    created_at: datetime
    messages: List[SessionMessageOut] = []

    class Config:
        from_attributes = True


class SessionAnalyticsBase(BaseModel):
    communication_score: int
    engagement_score: int
    time_management_score: int
    question_handling_score: int
    suggestions: str
    transcript_summary: Optional[str] = None


class SessionAnalyticsCreate(SessionAnalyticsBase):
    session_id: int


class SessionAnalyticsOut(SessionAnalyticsBase):
    id: int
    session_id: int

    class Config:
        from_attributes = True


class TeacherTurnInput(BaseModel):
    message: str
    addressed_student: Optional[str] = None  # Name of student specifically addressed, if any
    action: Optional[str] = None  # Action to perform, e.g., "focus", "explain_basic", etc.
