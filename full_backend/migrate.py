from sqlalchemy import text
from db_operations import engine

def migrate():
    commands = [
        # Добавляем новые колонки в work_permit
        "ALTER TABLE work_permit ADD COLUMN IF NOT EXISTS issuer_signature JSONB",
        "ALTER TABLE work_permit ADD COLUMN IF NOT EXISTS dispatcher_signature JSONB",
        "ALTER TABLE work_permit ADD COLUMN IF NOT EXISTS dispatcher_assistant_signature JSONB",
        "ALTER TABLE work_permit ADD COLUMN IF NOT EXISTS admitter_workplace_signature JSONB",
        "ALTER TABLE work_permit ADD COLUMN IF NOT EXISTS workplace_verifier_signature JSONB",
        "ALTER TABLE work_permit ADD COLUMN IF NOT EXISTS workplace_verifier_role VARCHAR",
        "ALTER TABLE work_permit ADD COLUMN IF NOT EXISTS live_parts VARCHAR",
        "ALTER TABLE work_permit ADD COLUMN IF NOT EXISTS closure_notify_person VARCHAR",
        "ALTER TABLE work_permit ADD COLUMN IF NOT EXISTS closure_datetime TIMESTAMP",
        "ALTER TABLE work_permit ADD COLUMN IF NOT EXISTS foreman_closure_signature JSONB",
        "ALTER TABLE work_permit ADD COLUMN IF NOT EXISTS manager_closure_signature JSONB",
        "ALTER TABLE work_permit ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP",
        "ALTER TABLE work_permit ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP",
        "ALTER TABLE work_permit ADD COLUMN IF NOT EXISTS safety_measures JSONB",
        "ALTER TABLE work_permit ADD COLUMN IF NOT EXISTS assistant_checklist JSONB",
        "ALTER TABLE work_permit ADD COLUMN IF NOT EXISTS versions_data JSONB",
        "ALTER TABLE work_permit ADD COLUMN IF NOT EXISTS next_day_request JSONB",

        # Создаем таблицу инструктажей
        """
        CREATE TABLE IF NOT EXISTS daily_briefings (
            id SERIAL PRIMARY KEY,
            permit_id INTEGER REFERENCES work_permit(id) ON DELETE CASCADE,
            is_first BOOLEAN DEFAULT FALSE,
            work_location VARCHAR,
            briefing_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            admitter_signature JSONB,
            responsible_signature JSONB,
            brigade_signatures JSONB,
            end_datetime TIMESTAMP,
            end_signature JSONB
        )
        """,

        # Создаем таблицу событий
        """
        CREATE TABLE IF NOT EXISTS permit_events (
            id SERIAL PRIMARY KEY,
            permit_id INTEGER REFERENCES work_permit(id) ON DELETE CASCADE,
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            user_id VARCHAR,
            user_name VARCHAR,
            action VARCHAR,
            comment TEXT
        )
        """,

        # Создаем таблицу комментариев при возврате
        """
        CREATE TABLE IF NOT EXISTS return_comments (
            id SERIAL PRIMARY KEY,
            permit_id INTEGER REFERENCES work_permit(id) ON DELETE CASCADE,
            from_user_id VARCHAR,
            from_user_name VARCHAR,
            comment TEXT,
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            step VARCHAR
        )
        """,

        # Создаем таблицу продлений
        """
        CREATE TABLE IF NOT EXISTS permit_extensions (
            id SERIAL PRIMARY KEY,
            permit_id INTEGER REFERENCES work_permit(id) ON DELETE CASCADE,
            new_end_time TIMESTAMP NOT NULL,
            issuer_signature JSONB
        )
        """
    ]

    with engine.connect() as conn:
        print("Начинаю миграцию базы данных...")
        for cmd in commands:
            try:
                conn.execute(text(cmd))
                conn.commit()
                print(f"Выполнено: {cmd[:50]}...")
            except Exception as e:
                print(f"Ошибка при выполнении: {e}")
        print("Миграция завершена успешно!")

if __name__ == "__main__":
    migrate()
