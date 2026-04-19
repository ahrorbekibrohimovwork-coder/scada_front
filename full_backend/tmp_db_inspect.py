from sqlalchemy import text
from db_operations import SessionLocal


def main() -> None:
    db = SessionLocal()
    try:
        print("=== TABLES ===")
        tables = db.execute(text("""
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'public'
            ORDER BY table_name
        """)).fetchall()
        for row in tables:
            print("-", row[0])

        print("\n=== APP USERS ===")
        users = db.execute(text("""
            SELECT id, login, role, full_name
            FROM app_users
            ORDER BY role, full_name
        """)).fetchall()
        for row in users:
            print(f"- {row[0]} | {row[1]} | {row[2]} | {row[3]}")

        print("\n=== WORK PERMIT SIGN FLOW ===")
        permits = db.execute(text("""
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
        for row in permits:
            print(
                f"- permit_id={row[0]} | status={row[1]} | "
                f"dispatcher={row[2]} ({row[3]}) | "
                f"assistant={row[4]} ({row[5]}) | "
                f"admitter={row[6]} ({row[7]}) | "
                f"observer={row[8]} ({row[9]}) | "
                f"foreman={row[10]} ({row[11]}) | "
                f"manager={row[12]} ({row[13]})"
            )
    finally:
        db.close()


if __name__ == "__main__":
    main()
