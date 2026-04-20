from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from sqlalchemy import text
from sqlalchemy.orm import Session
import re

from db_operations import engine, Base
from db_operations import get_db, SessionLocal
from models import *  # Import all models to register them
from app.api import permits, auth, lookups, tts, chat
from app.api.auth import USERS
from change_svg_numbers import router as svg_router

# Create all tables
Base.metadata.create_all(bind=engine)

app = FastAPI(redirect_slashes=False)

# Add CORS middleware early
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def seed_auth_users() -> None:
    """Sync static USERS list into app_users: add missing, update existing, remove old test users."""
    db = SessionLocal()
    try:
        from models import AppUser
        static_ids = {u["id"] for u in USERS}

        # Remove users with old test IDs (u1..u14) not in new list
        old_test_ids = [f"u{i}" for i in range(1, 20)]
        for old_id in old_test_ids:
            if old_id not in static_ids:
                u = db.query(AppUser).filter(AppUser.id == old_id).first()
                if u:
                    db.delete(u)

        existing_by_id = {u.id: u for u in db.query(AppUser).all()}
        for user in USERS:
            existing = existing_by_id.get(user["id"])
            if existing:
                # Update in case data changed
                existing.login = user["login"]
                existing.full_name = user["name"]
                existing.short_name = user["shortName"]
                existing.role = user["role"]
                existing.position = user["position"]
                existing.electrical_group = user.get("electricalGroup", "")
                existing.department = user.get("department", "")
                existing.is_active = 1
            else:
                db.add(AppUser(
                    id=user["id"], login=user["login"], password=user["password"],
                    full_name=user["name"], short_name=user["shortName"],
                    role=user["role"], position=user["position"],
                    electrical_group=user.get("electricalGroup", ""),
                    department=user.get("department", ""),
                    phone=user.get("phone", ""),
                    is_active=1,
                ))
        db.commit()
        print(f"DEBUG: Synced {len(USERS)} users from static list")
    except Exception as e:
        print(f"DEBUG: Seeding error: {e}")
        db.rollback()
    finally:
        db.close()


def ensure_permit_user_id_columns() -> None:
    with engine.begin() as connection:
        connection.execute(text("ALTER TABLE work_permit ADD COLUMN IF NOT EXISTS responsible_manager_user_id VARCHAR"))
        connection.execute(text("ALTER TABLE work_permit ADD COLUMN IF NOT EXISTS admitting_user_id VARCHAR"))
        connection.execute(text("ALTER TABLE work_permit ADD COLUMN IF NOT EXISTS work_producer_user_id VARCHAR"))
        connection.execute(text("ALTER TABLE work_permit ADD COLUMN IF NOT EXISTS supervisor_user_id VARCHAR"))
        connection.execute(text("ALTER TABLE work_permit ADD COLUMN IF NOT EXISTS dispetcher_user_id VARCHAR"))
        connection.execute(text("ALTER TABLE work_permit ADD COLUMN IF NOT EXISTS dispetcher_assistant_user_id VARCHAR"))


ensure_permit_user_id_columns()
seed_auth_users()

app.include_router(permits.router, prefix="/api/permits", tags=["Permits"])
app.include_router(auth.router, prefix="/api/auth", tags=["Auth"])
app.include_router(lookups.router, prefix="/api", tags=["Lookup"])
app.include_router(svg_router, prefix="/api", tags=["Schema"])
app.include_router(tts.router, prefix="/api", tags=["TTS"])
app.include_router(chat.router, prefix="/api", tags=["Chat"])

@app.get("/")
def root():
    return {"message": "Electron Journal Backend Running"}


@app.get("/api/debug/db_overview")
def db_overview(db: Session = Depends(get_db)):
    tables = db.execute(text("""
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
        ORDER BY table_name
    """)).fetchall()

    users = db.execute(text("""
        SELECT id, login, role, full_name
        FROM app_users
        ORDER BY role, full_name
    """)).fetchall()

    permits_rows = db.execute(text("""
        SELECT
            id,
            status,
            dispetcher,
            dispetcher_user_id,
            dispetcher_assistant,
            dispetcher_assistant_user_id,
            admitting,
            admitting_user_id,
            supervisor,
            supervisor_user_id,
            work_producer,
            work_producer_user_id,
            responsible_manager,
            responsible_manager_user_id
        FROM work_permit
        ORDER BY id DESC
        LIMIT 100
    """)).fetchall()

    pending_by_status = {
        "PENDING_DISPATCHER": "dispatcher",
        "PENDING_ASSISTANT": "dispatcher_assistant",
        "PENDING_ADMITTER": "admitter",
        "ADMITTER_CHECKED": "manager/observer/foreman",
        "WORKPLACE_APPROVED": "admitter",
        "ADMITTED": "observer/foreman",
        "CLOSING": "manager",
    }

    return {
        "tables": [row[0] for row in tables],
        "users": [
            {"id": row[0], "login": row[1], "role": row[2], "name": row[3]}
            for row in users
        ],
        "permits": [
            {
                "id": row[0],
                "status": row[1],
                "dispatcher": row[2],
                "dispatcher_user_id": row[3],
                "dispatcher_assistant": row[4],
                "dispatcher_assistant_user_id": row[5],
                "admitter": row[6],
                "admitter_user_id": row[7],
                "observer": row[8],
                "observer_user_id": row[9],
                "foreman": row[10],
                "foreman_user_id": row[11],
                "manager": row[12],
                "manager_user_id": row[13],
                "unsigned_for_role": pending_by_status.get((row[1] or "").upper(), "unknown"),
            }
            for row in permits_rows
        ],
    }


@app.post("/api/admin/reset")
def admin_reset(db: Session = Depends(get_db)):
    """Full DB reset: delete all data and reseed clean users."""
    from models import (
        AppUser, WorkPermit, BrigadeMember, DailyBriefing, PermitEvent,
        ReturnComment, ExtensionRecord,
        ResponsibleManager, Dispetcher, DispetcherAssistant,
        Admitter, Supervisor, WorkProducer, Worker,
    )
    # Delete all permit data
    db.query(ReturnComment).delete()
    db.query(ExtensionRecord).delete()
    db.query(PermitEvent).delete()
    db.query(DailyBriefing).delete()
    db.query(BrigadeMember).delete()
    db.query(WorkPermit).delete()
    # Clear legacy tables
    db.query(ResponsibleManager).delete()
    db.query(Dispetcher).delete()
    db.query(DispetcherAssistant).delete()
    db.query(Admitter).delete()
    db.query(Supervisor).delete()
    db.query(WorkProducer).delete()
    db.query(Worker).delete()
    # Delete all users
    db.query(AppUser).delete()
    db.commit()
    # Reseed clean users
    for user in USERS:
        db.add(AppUser(
            id=user["id"], login=user["login"], password=user["password"],
            full_name=user["name"], short_name=user["shortName"],
            role=user["role"], position=user["position"],
            electrical_group=user.get("electricalGroup", ""),
            department=user.get("department", ""),
            phone=user.get("phone", ""),
            is_active=1,
        ))
    db.commit()
    users = db.query(AppUser).order_by(AppUser.role, AppUser.full_name).all()
    return {
        "status": "ok",
        "message": "Database reset complete",
        "users": [{"id": u.id, "login": u.login, "name": u.full_name, "role": u.role} for u in users]
    }


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)