from db_operations import engine, Base
import models

def rebuild():
    print("--- ПЕРЕСОЗДАНИЕ ТАБЛИЦ ---")
    
    # Список таблиц, которые нужно пересоздать (organizations не трогаем, там 10 записей)
    target_tables = [
        models.BrigadeMember.__table__,
        models.WorkPermit.__table__
    ]
    
    try:
        print("1. Удаляю таблицы work_permit и brigade_members...")
        # Удаляем только те таблицы, где ошибки в типах данных
        Base.metadata.drop_all(bind=engine, tables=target_tables)
        
        print("2. Создаю таблицы с правильными типами (Integer + Serial)...")
        # Создаем их заново по новому коду из models.py
        Base.metadata.create_all(bind=engine, tables=target_tables)
        
        print("\n[УСПЕХ] База данных исправлена!")
    except Exception as e:
        print(f"\n[ОШИБКА] Не удалось пересоздать таблицы: {e}")

if __name__ == "__main__":
    rebuild()