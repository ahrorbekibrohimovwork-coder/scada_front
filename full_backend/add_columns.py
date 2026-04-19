import os
from sqlalchemy import create_engine, text

DEFAULT_DATABASE_URL = "postgresql+psycopg2://postgres:zse4XDR%@localhost:5432/electron_journal"
db_url = os.getenv("DATABASE_URL", DEFAULT_DATABASE_URL)
engine = create_engine(db_url)

cols_to_add = [
    ("issuer_user_id", "VARCHAR"),
    ("issuer_name", "VARCHAR"),
]

with engine.connect() as conn:
    for col, type in cols_to_add:
        try:
            conn.execute(text(f"ALTER TABLE work_permit ADD COLUMN {col} {type}"))
            print(f"Added column {col}")
        except Exception as e:
            print(f"Column {col} might already exist or error: {e}")
    conn.commit()
