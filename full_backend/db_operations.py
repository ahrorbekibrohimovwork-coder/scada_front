from __future__ import annotations
import os
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, Session, declarative_base

# 1. Добавляем Base — это "фундамент" для твоих моделей
Base = declarative_base()

DEFAULT_DATABASE_URL_docker = "postgresql+psycopg2://postgres:zse4XDR%@host.docker.internal:5432/electron_journal"
DEFAULT_DATABASE_URL_local = "postgresql+psycopg2://postgres:zse4XDR%@localhost:5432/electron_journal"


def _make_engine(url: str):
    e = create_engine(url, pool_pre_ping=True)
    with e.connect() as conn:
        conn.execute(text("SELECT 1"))
    return e

if os.getenv("DATABASE_URL"):
    engine = _make_engine(os.getenv("DATABASE_URL"))
else:
    try:
        engine = _make_engine(DEFAULT_DATABASE_URL_docker)
    except Exception:
        engine = _make_engine(DEFAULT_DATABASE_URL_local)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Исправленные функции получения данных
def get_all_organizations(db: Session):
    try:
        result = db.execute(text("SELECT organization FROM organizations"))
        return [row[0] for row in result.fetchall()]
    except Exception:
        return []


def get_all_responsible_managers(db: Session):
    try:
        result = db.execute(text("SELECT id, full_name, position, ex_group FROM responsible_managers ORDER BY id"))
        return [dict(id=row[0], full_name=row[1], position=row[2], ex_group=row[3]) for row in result.fetchall()]
    except Exception:
        return []


def get_all_dispetchers(db: Session):
    try:
        result = db.execute(text("SELECT id, full_name, position, ex_group FROM dispetchers ORDER BY id"))
        return [dict(id=row[0], full_name=row[1], position=row[2], ex_group=row[3]) for row in result.fetchall()]
    except Exception:
        return []


def get_all_supervisors(db: Session):
    try:
        result = db.execute(text("SELECT id, full_name, position, ex_group FROM supervisors ORDER BY id"))
        return [dict(id=row[0], full_name=row[1], position=row[2], ex_group=row[3]) for row in result.fetchall()]
    except Exception:
        return []


def get_all_work_producers(db: Session):
    try:
        result = db.execute(text("SELECT id, full_name, position, ex_group FROM work_producers ORDER BY id"))
        return [dict(id=row[0], full_name=row[1], position=row[2], ex_group=row[3]) for row in result.fetchall()]
    except Exception:
        return []


def get_organizations_by_filial_id(db: Session, filial_id: int):
    try:
        print(f"Querying organizations for filial_id: {filial_id}")
        # First, let's see all organizations with filial_id
        all_result = db.execute(text("SELECT organization, filial_id FROM organizations"))
        all_orgs = all_result.fetchall()
        print(f"All organizations in DB: {all_orgs}")
        result = db.execute(text("SELECT organization FROM organizations WHERE filial_id = :filial_id"), {"filial_id": filial_id})
        orgs = [row[0] for row in result.fetchall()]
        print(f"Found organizations: {orgs}")
        return orgs
    except Exception as e:
        print(f"Error in get_organizations_by_filial_id: {e}")
        return []

def get_all_departments(db: Session):
    try:
        # Если у тебя есть отдельная таблица для цехов
        result = db.execute(text("SELECT name FROM departments"))
        return [row[0] for row in result.fetchall()]
    except Exception:
        return []