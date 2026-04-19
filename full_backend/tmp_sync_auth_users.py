import re
from sqlalchemy import text
from db_operations import SessionLocal
from models import AppUser
from app.api.auth import USERS


def make_short_name(full_name: str) -> str:
    parts = [part for part in (full_name or "").strip().split() if part]
    if len(parts) >= 3:
        return f"{parts[0]} {parts[1][0]}.{parts[2][0]}."
    if len(parts) == 2:
        return f"{parts[0]} {parts[1][0]}."
    return full_name or ""


def main() -> None:
    db = SessionLocal()
    try:
        existing = db.query(AppUser).all()
        existing_ids = {u.id for u in existing}
        existing_logins = {u.login for u in existing}

        def ensure_login(base: str) -> str:
            login = base
            idx = 2
            while login in existing_logins:
                login = f"{base}_{idx}"
                idx += 1
            existing_logins.add(login)
            return login

        added = 0
        for user in USERS:
            if user["id"] in existing_ids:
                continue
            db.add(AppUser(
                id=user["id"],
                login=ensure_login(user["login"]),
                password="1234",
                full_name=user["name"],
                short_name=user["shortName"],
                role=user["role"],
                position=user["position"],
                electrical_group=user.get("electricalGroup"),
                department=user.get("department"),
                phone=user.get("phone"),
                is_active=1,
            ))
            existing_ids.add(user["id"])
            added += 1

        sources = [
            ("dispatcher", "dispetchers", "SELECT id, full_name, position, ex_group FROM dispetchers ORDER BY id"),
            ("dispatcher_assistant", "dispetcher_assistants", "SELECT id, full_name, position, ex_group FROM dispetcher_assistants ORDER BY id"),
            ("admitter", "admitters", "SELECT id, full_name, position, ex_group FROM admitters ORDER BY id"),
            ("manager", "responsible_managers", "SELECT id, full_name, position, ex_group FROM responsible_managers ORDER BY id"),
            ("observer", "supervisors", "SELECT id, full_name, position, ex_group FROM supervisors ORDER BY id"),
            ("foreman", "work_producers", "SELECT id, full_name, position, ex_group FROM work_producers ORDER BY id"),
            ("worker", "workers", "SELECT ROW_NUMBER() OVER (ORDER BY fullname), fullname, '' as position, group_num FROM workers"),
        ]
        for role, table_name, query in sources:
            try:
                rows = db.execute(text(query)).fetchall()
            except Exception:
                db.rollback()
                continue
            for row in rows:
                source_id = str(row[0])
                full_name = (row[1] or "").strip()
                if not full_name:
                    continue
                user_id = f"{role}_{source_id}"
                if user_id in existing_ids:
                    continue
                login_base = re.sub(r"[^a-z0-9_]+", "", f"{role}_{source_id}".lower()) or f"user_{source_id}"
                db.add(AppUser(
                    id=user_id,
                    login=ensure_login(login_base),
                    password="1234",
                    full_name=full_name,
                    short_name=make_short_name(full_name),
                    role=role,
                    position=(row[2] or "").strip() or role,
                    electrical_group=(row[3] or "").strip() if row[3] else "",
                    department="",
                    phone="",
                    is_active=1,
                ))
                existing_ids.add(user_id)
                added += 1

        permit_name_sources = [
            ("dispatcher", "dispetcher"),
            ("dispatcher_assistant", "dispetcher_assistant"),
            ("admitter", "admitting"),
            ("observer", "supervisor"),
            ("foreman", "work_producer"),
            ("manager", "responsible_manager"),
        ]
        for role, column in permit_name_sources:
            rows = db.execute(text(f"SELECT DISTINCT {column} FROM work_permit WHERE {column} IS NOT NULL AND {column} <> ''")).fetchall()
            for row in rows:
                full_name = (row[0] or "").strip()
                if not full_name:
                    continue
                normalized = " ".join(full_name.lower().split())
                exists = db.execute(
                    text("SELECT 1 FROM app_users WHERE lower(trim(full_name)) = :name AND role = :role LIMIT 1"),
                    {"name": normalized, "role": role},
                ).fetchone()
                if exists:
                    continue
                user_id = f"{role}_permit_{len(existing_ids)+1}"
                login_base = re.sub(r"[^a-z0-9_]+", "", f"{role}_{len(existing_ids)+1}".lower()) or f"user_{len(existing_ids)+1}"
                db.add(AppUser(
                    id=user_id,
                    login=ensure_login(login_base),
                    password="1234",
                    full_name=full_name,
                    short_name=make_short_name(full_name),
                    role=role,
                    position=role,
                    electrical_group="",
                    department="",
                    phone="",
                    is_active=1,
                ))
                existing_ids.add(user_id)
                added += 1

        db.commit()
        print(f"Added users: {added}")
    finally:
        db.close()


if __name__ == "__main__":
    main()
