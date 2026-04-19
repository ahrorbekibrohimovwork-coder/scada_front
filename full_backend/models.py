from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, JSON, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from db_operations import Base

class Filial(Base):
    __tablename__ = "filials"
    filial_id = Column(Integer, primary_key=True, index=True)
    filial = Column(String, nullable=False)

class ResponsibleManager(Base):
    __tablename__ = "responsible_managers"
    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String, nullable=False)
    position = Column(String, nullable=False)
    ex_group = Column(String, nullable=True)

class Dispetcher(Base):
    __tablename__ = "dispetchers"
    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String, nullable=False)
    position = Column(String, nullable=False)
    ex_group = Column(String, nullable=True)

class DispetcherAssistant(Base):
    __tablename__ = "dispetcher_assistants"
    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String, nullable=False)
    position = Column(String, nullable=False)
    ex_group = Column(String, nullable=True)

class Admitter(Base):
    __tablename__ = "admitters"
    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String, nullable=False)
    position = Column(String, nullable=False)
    ex_group = Column(String, nullable=True)

class Supervisor(Base):
    __tablename__ = "supervisors"
    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String, nullable=False)
    position = Column(String, nullable=False)
    ex_group = Column(String, nullable=True)

class WorkProducer(Base):
    __tablename__ = "work_producers"
    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String, nullable=False)
    position = Column(String, nullable=False)
    ex_group = Column(String, nullable=True)

class Worker(Base):
    __tablename__ = "workers"
    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String, nullable=False)
    position = Column(String, nullable=False)
    ex_group = Column(String, nullable=True)

class AppUser(Base):
    __tablename__ = "app_users"
    id = Column(String, primary_key=True, index=True)
    login = Column(String, unique=True, nullable=False, index=True)
    password = Column(String, nullable=False)
    full_name = Column(String, nullable=False)
    short_name = Column(String, nullable=False)
    role = Column(String, nullable=False, index=True)
    position = Column(String, nullable=False)
    electrical_group = Column(String, nullable=True)
    department = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    is_active = Column(Integer, nullable=False, default=1)

class WorkPermit(Base):
    __tablename__ = "work_permit"
    id = Column(Integer, primary_key=True, index=True)
    organization = Column(String, nullable=False)
    department = Column(String, nullable=False)
    start_time = Column(DateTime, nullable=False)
    end_time = Column(DateTime, nullable=False)
    responsible_manager = Column(String, nullable=True)
    admitting = Column(String, nullable=True)
    work_producer = Column(String, nullable=True)
    supervisor = Column(String, nullable=True)
    dispetcher = Column(String, nullable=True)
    dispetcher_assistant = Column(String, nullable=True)
    responsible_manager_user_id = Column(String, nullable=True)
    admitting_user_id = Column(String, nullable=True)
    work_producer_user_id = Column(String, nullable=True)
    supervisor_user_id = Column(String, nullable=True)
    dispetcher_user_id = Column(String, nullable=True)
    dispetcher_assistant_user_id = Column(String, nullable=True)
    object_type = Column(String, nullable=True)
    work_description = Column(Text, nullable=True)
    special_instructions = Column(Text, nullable=True)
    status = Column(String, default="DRAFT")
    
    # EDS Signatures (stored as JSON objects)
    issuer_user_id = Column(String, nullable=True)
    issuer_name = Column(String, nullable=True)
    issuer_signature = Column(JSON, nullable=True)
    dispatcher_signature = Column(JSON, nullable=True)
    dispatcher_assistant_signature = Column(JSON, nullable=True)
    admitter_workplace_signature = Column(JSON, nullable=True)
    workplace_verifier_signature = Column(JSON, nullable=True)
    workplace_verifier_role = Column(String, nullable=True)
    live_parts = Column(String, nullable=True)
    
    # New fields for design v2
    safety_measures = Column(JSON, nullable=True)  # List of strings
    assistant_checklist = Column(JSON, nullable=True)  # List of AssistantCheckItem
    versions_data = Column(JSON, nullable=True)  # List of PermitVersion
    next_day_request = Column(JSON, nullable=True)  # NextDayRequest object

    # Closure
    closure_notify_person = Column(String, nullable=True)
    closure_datetime = Column(DateTime, nullable=True)
    foreman_closure_signature = Column(JSON, nullable=True)
    manager_closure_signature = Column(JSON, nullable=True)

    # Date metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    brigade_members = relationship("BrigadeMember", back_populates="permit", cascade="all, delete-orphan")
    daily_briefings = relationship("DailyBriefing", back_populates="permit", cascade="all, delete-orphan")
    events = relationship("PermitEvent", back_populates="permit", cascade="all, delete-orphan")
    return_comments = relationship("ReturnComment", back_populates="permit", cascade="all, delete-orphan")
    extensions = relationship("ExtensionRecord", back_populates="permit", cascade="all, delete-orphan")

class BrigadeMember(Base):
    __tablename__ = "brigade_members"
    id = Column(Integer, primary_key=True, index=True)
    permit_id = Column(Integer, ForeignKey("work_permit.id"), nullable=False)
    name = Column(String, nullable=False)
    surname = Column(String, nullable=False)
    father_name = Column(String, nullable=True)
    role = Column(String, nullable=True)
    group_number = Column(String, nullable=True)
    permit = relationship("WorkPermit", back_populates="brigade_members")

class DailyBriefing(Base):
    __tablename__ = "daily_briefings"
    id = Column(Integer, primary_key=True, index=True)
    permit_id = Column(Integer, ForeignKey("work_permit.id"), nullable=False)
    is_first = Column(Boolean, default=False)
    work_location = Column(String, nullable=True)
    briefing_date = Column(DateTime, default=datetime.utcnow)
    admitter_signature = Column(JSON, nullable=True)
    responsible_signature = Column(JSON, nullable=True)
    brigade_signatures = Column(JSON, nullable=True) # List of signature objects
    end_datetime = Column(DateTime, nullable=True)
    end_signature = Column(JSON, nullable=True)
    permit = relationship("WorkPermit", back_populates="daily_briefings")

class PermitEvent(Base):
    __tablename__ = "permit_events"
    id = Column(Integer, primary_key=True, index=True)
    permit_id = Column(Integer, ForeignKey("work_permit.id"), nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)
    user_id = Column(String, nullable=True)
    user_name = Column(String, nullable=True)
    action = Column(String, nullable=False)
    comment = Column(Text, nullable=True)
    permit = relationship("WorkPermit", back_populates="events")

class ReturnComment(Base):
    __tablename__ = "return_comments"
    id = Column(Integer, primary_key=True, index=True)
    permit_id = Column(Integer, ForeignKey("work_permit.id"), nullable=False)
    from_user_id = Column(String, nullable=True)
    from_user_name = Column(String, nullable=True)
    comment = Column(Text, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)
    step = Column(String, nullable=True)
    permit = relationship("WorkPermit", back_populates="return_comments")

class ExtensionRecord(Base):
    __tablename__ = "permit_extensions"
    id = Column(Integer, primary_key=True, index=True)
    permit_id = Column(Integer, ForeignKey("work_permit.id"), nullable=False)
    new_end_time = Column(DateTime, nullable=False)
    issuer_signature = Column(JSON, nullable=True)
    permit = relationship("WorkPermit", back_populates="extensions")