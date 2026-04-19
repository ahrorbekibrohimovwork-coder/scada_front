from db_operations import SessionLocal
from models import WorkPermit, AppUser
from typing import Optional
from sqlalchemy import text


def normalize(value: Optional[str]) -> str:
    return " ".join((value or "").strip().lower().split())


def main() -> None:
    db = SessionLocal()
    try:
        db.execute(text("ALTER TABLE work_permit ADD COLUMN IF NOT EXISTS responsible_manager_user_id VARCHAR"))
        db.execute(text("ALTER TABLE work_permit ADD COLUMN IF NOT EXISTS admitting_user_id VARCHAR"))
        db.execute(text("ALTER TABLE work_permit ADD COLUMN IF NOT EXISTS work_producer_user_id VARCHAR"))
        db.execute(text("ALTER TABLE work_permit ADD COLUMN IF NOT EXISTS supervisor_user_id VARCHAR"))
        db.execute(text("ALTER TABLE work_permit ADD COLUMN IF NOT EXISTS dispetcher_user_id VARCHAR"))
        db.execute(text("ALTER TABLE work_permit ADD COLUMN IF NOT EXISTS dispetcher_assistant_user_id VARCHAR"))
        db.commit()

        users = db.query(AppUser).filter(AppUser.is_active == 1).all()
        by_role_name = {}
        for user in users:
            role_map = by_role_name.setdefault(user.role, {})
            role_map[normalize(user.full_name)] = user.id

        updated = 0
        for permit in db.query(WorkPermit).all():
            before = (
                permit.dispetcher_user_id,
                permit.dispetcher_assistant_user_id,
                permit.admitting_user_id,
                permit.supervisor_user_id,
                permit.work_producer_user_id,
                permit.responsible_manager_user_id,
            )

            permit.dispetcher_user_id = by_role_name.get("dispatcher", {}).get(normalize(permit.dispetcher))
            permit.dispetcher_assistant_user_id = by_role_name.get("dispatcher_assistant", {}).get(normalize(permit.dispetcher_assistant))
            permit.admitting_user_id = by_role_name.get("admitter", {}).get(normalize(permit.admitting))
            permit.supervisor_user_id = by_role_name.get("observer", {}).get(normalize(permit.supervisor))
            permit.work_producer_user_id = by_role_name.get("foreman", {}).get(normalize(permit.work_producer))
            permit.responsible_manager_user_id = by_role_name.get("manager", {}).get(normalize(permit.responsible_manager))

            after = (
                permit.dispetcher_user_id,
                permit.dispetcher_assistant_user_id,
                permit.admitting_user_id,
                permit.supervisor_user_id,
                permit.work_producer_user_id,
                permit.responsible_manager_user_id,
            )
            if before != after:
                updated += 1

        db.commit()
        print(f"Updated permits: {updated}")
    finally:
        db.close()


if __name__ == "__main__":
    main()
