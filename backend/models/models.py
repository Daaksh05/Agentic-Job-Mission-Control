from sqlalchemy import Column, Integer, String, Text, Float, JSON, Enum as SQLEnum, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from .database import Base
import datetime
import enum

class AppStatus(str, enum.Enum):
    QUEUE = "QUEUE"
    APPLIED = "APPLIED"
    INTERVIEW = "INTERVIEW"
    OFFER = "OFFER"
    REJECTED = "REJECTED"

class Profile(Base):
    __tablename__ = "profiles"
    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String)
    email = Column(String)
    master_resume = Column(Text)
    preferences = Column(JSON) # {"target_countries": ["FR", "US"], "min_match_score": 70}
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class Job(Base):
    __tablename__ = "jobs"
    id = Column(String, primary_key=True, index=True)
    title = Column(String)
    company = Column(String)
    location = Column(String)
    country = Column(String)
    description = Column(Text)
    url = Column(String)
    source = Column(String)
    job_type = Column(String) # e.g. "VIE", "Full-time"
    duration = Column(String) # For VIE
    deadline = Column(DateTime) # For VIE
    has_easy_apply = Column(Integer, default=0) # For LinkedIn
    match_score = Column(Integer, default=0)
    match_analysis = Column(JSON) # match_reasons, missing_skills
    discovered_at = Column(DateTime, default=datetime.datetime.utcnow)

class Application(Base):
    __tablename__ = "applications"
    id = Column(Integer, primary_key=True, index=True)
    job_id = Column(String, ForeignKey("jobs.id"))
    status = Column(SQLEnum(AppStatus), default=AppStatus.QUEUE)
    tailored_resume = Column(Text)
    cover_letter = Column(Text)
    notes = Column(Text)
    applied_at = Column(DateTime)
    follow_up_sent = Column(Integer, default=0) # 0: No, 1: Yes
    sub_status = Column(String) # e.g. "Assessment in progress"
    prep_sheet = Column(JSON) # AI generated interview prep
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    
    job = relationship("Job")

class SubmissionLog(Base):
    __tablename__ = "submission_logs"
    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(Integer, ForeignKey("applications.id"))
    screenshot_paths = Column(JSON, default=[]) # List of strings
    log_messages = Column(JSON, default=[])
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
