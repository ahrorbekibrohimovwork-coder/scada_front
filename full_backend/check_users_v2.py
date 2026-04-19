import os
import sys
from sqlalchemy import create_engine, text

# Set output to UTF-8
if sys.platform == "win32":
    import codecs
    sys.stdout = codecs.getwriter("utf-8")(sys.stdout.detach())

DEFAULT_DATABASE_URL = "postgresql+psycopg2://postgres:zse4XDR%@localhost:5432/electron_journal"
db_url = os.getenv("DATABASE_URL", DEFAULT_DATABASE_URL)
engine = create_engine(db_url)

with engine.connect() as conn:
    result = conn.execute(text("SELECT id, login, full_name, role FROM app_users"))
    for row in result:
        print(f"ID: {row[0]}, Login: {row[1]}, Name: {row[2]}, Role: {row[3]}")
