from sqlalchemy import text
from db_operations import engine
from datetime import datetime
import json

def finalize_history():
    with engine.connect() as conn:
        print("Заполняю историю подписей для существующих нарядов...")
        
        # Получаем все наряды
        query = text("""
            SELECT id, status,
                   responsible_manager, dispetcher, dispetcher_assistant, admitting, supervisor, work_producer,
                   responsible_manager_user_id, dispetcher_user_id, dispetcher_assistant_user_id, admitting_user_id, supervisor_user_id, work_producer_user_id
            FROM work_permit
        """)
        
        results = conn.execute(query).fetchall()
        
        for row in results:
            pid = row[0]
            status = row[1]
            
            # Маппинг прогресса (как в permits.py)
            STATUS_PROGRESS = {
                "DRAFT": 0, "PENDING_DISPATCHER": 1, "PENDING_ASSISTANT": 2, "PREPARING_WORKPLACES": 3,
                "PENDING_ADMITTER": 4, "ADMITTER_CHECKED": 5, "WORKPLACE_APPROVED": 6, "ADMITTED": 7,
                "IN_PROGRESS": 8, "DAILY_ENDED": 9, "CLOSING": 10, "CLOSED": 11
            }
            progress = STATUS_PROGRESS.get(status, 0)
            
            def make_sig(uid, name, role_name):
                if not name: return None
                return json.dumps({
                    "userId": uid or "unknown",
                    "userName": name,
                    "userPosition": role_name,
                    "userGroup": "IV",
                    "timestamp": datetime.utcnow().isoformat()
                })

            updates = {}
            if progress >= 1: updates["issuer_signature"] = make_sig(row[8], row[2], "Выдающий")
            if progress >= 2: updates["dispatcher_signature"] = make_sig(row[9], row[3], "Гл. Диспетчер")
            if progress >= 3: updates["dispatcher_assistant_signature"] = make_sig(row[10], row[4], "Помощник ГД")
            if progress >= 5: updates["admitter_workplace_signature"] = make_sig(row[11], row[5], "Допускающий")
            if progress >= 6: 
                # Verifier is either Observer or Foreman
                is_observer_verifier = bool(row[6])
                uid = row[12] if is_observer_verifier else row[13]
                name = row[6] if is_observer_verifier else row[7]
                updates["workplace_verifier_signature"] = make_sig(uid, name, "Проверяющий")
                updates["workplace_verifier_role"] = "observer" if is_observer_verifier else "foreman"

            if updates:
                set_clause = ", ".join([f"{k} = :{k}" for k in updates.keys()])
                stmt = text(f"UPDATE work_permit SET {set_clause} WHERE id = :pid")
                updates["pid"] = pid
                conn.execute(stmt, updates)
                print(f"-> Обновлена история для наряда №{pid}")

        conn.commit()
        print("Готово! Теперь история подписей выглядит корректно.")

if __name__ == "__main__":
    finalize_history()
