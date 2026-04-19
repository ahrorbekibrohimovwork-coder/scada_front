from sqlalchemy import create_engine, text
from db_operations import db_url

engine = create_engine(db_url)

def run_full_inspection():
    print(f"--- ПРОВЕРКА БАЗЫ: {db_url.split('/')[-1]} ---")
    
    with engine.connect() as conn:
        # 1. Проверяем существование таблиц напрямую в Postgres
        print("\n[1] ТАБЛИЦЫ В СХЕМЕ PUBLIC:")
        query_tables = text("""
            SELECT tablename FROM pg_catalog.pg_tables 
            WHERE schemaname = 'public';
        """)
        tables = conn.execute(query_tables).fetchall()
        
        if not tables:
            print("(!) ВНИМАНИЕ: В базе 0 таблиц. Структура не создана.")
            return

        for table in tables:
            t_name = table[0]
            print(f"\n>>> ТАБЛИЦА: {t_name}")
            
            # 2. Проверяем колонки, типы и автоинкремент (Default)
            print("    Колонки:")
            query_cols = text(f"""
                SELECT column_name, data_type, column_default, is_nullable
                FROM information_schema.columns
                WHERE table_name = '{t_name}';
            """)
            cols = conn.execute(query_cols).fetchall()
            for col in cols:
                default = f" | Default: {col[2]}" if col[2] else ""
                print(f"     - {col[0]} ({col[1]}) | {col[3]}{default}")

            # 3. Проверяем наличие записей
            query_count = text(f'SELECT COUNT(*) FROM "{t_name}"')
            count = conn.execute(query_count).scalar()
            print(f"    Записей: {count}")

        # 4. Проверяем связи (Foreign Keys)
        print("\n[2] ПРОВЕРКА СВЯЗЕЙ (FOREIGN KEYS):")
        query_fks = text("""
            SELECT
                tc.table_name, kcu.column_name, 
                ccu.table_name AS foreign_table_name,
                ccu.column_name AS foreign_column_name 
            FROM information_schema.table_constraints AS tc 
            JOIN information_schema.key_column_usage AS kcu
              ON tc.constraint_name = kcu.constraint_name
            JOIN information_schema.constraint_column_usage AS ccu
              ON ccu.constraint_name = tc.constraint_name
            WHERE constraint_type = 'FOREIGN KEY';
        """)
        fks = conn.execute(query_fks).fetchall()
        if fks:
            for fk in fks:
                print(f"    - {fk[0]}.{fk[1]} -> {fk[2]}.{fk[3]}")
        else:
            print("    (!) Связи между таблицами не обнаружены.")

if __name__ == "__main__":
    try:
        run_full_inspection()
    except Exception as e:
        print(f"Ошибка при подключении к БД: {e}")