from sqlalchemy import text
from db_operations import engine
from datetime import datetime
import json

def repair():
    with engine.connect() as conn:
        print("Начинаю исправление данных для активных нарядов...")
        
        # 1. Находим наряды в статусе ADMITTED, у которых нет записей в daily_briefings
        query = text("""
            SELECT p.id, p.admitting_user_id, p.admitting, u.position, u.electrical_group
            FROM work_permit p
            LEFT JOIN daily_briefings b ON p.id = b.permit_id
            LEFT JOIN app_users u ON p.admitting_user_id = u.id
            WHERE p.status IN ('ADMITTED', 'IN_PROGRESS', 'DAILY_ENDED') AND b.id IS NULL
        """)
        
        results = conn.execute(query).fetchall()
        
        for row in results:
            permit_id = row[0]
            admitter_id = row[1]
            admitter_name = row[2]
            position = row[3] or "Допускающий"
            group = row[4] or ""
            
            print(f"Исправляю наряд №{permit_id}...")
            
            # Создаем "синтетическую" подпись допускающего, чтобы разблокировать этап
            signature = {
                "userId": admitter_id,
                "userName": admitter_name,
                "userPosition": position,
                "userGroup": group,
                "timestamp": datetime.utcnow().isoformat()
            }
            
            # Вставляем запись об инструктаже
            insert_briefing = text("""
                INSERT INTO daily_briefings (permit_id, is_first, work_location, admitter_signature, briefing_date)
                VALUES (:pid, TRUE, 'Основное рабочее место', :sig, :now)
            """)
            
            conn.execute(insert_briefing, {
                "pid": permit_id,
                "sig": json.dumps(signature),
                "now": datetime.utcnow()
            })
            print(f"-> Создана запись об инструктаже для наряда №{permit_id}")
            
        conn.commit()
        print("Исправление завершено!")

if __name__ == "__main__":
    repair()
