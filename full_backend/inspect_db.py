import sqlite3
import json

def inspect():
    try:
        conn = sqlite3.connect('test.db')
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()

        print("--- ИНФОРМАЦИЯ О ПОЛЬЗОВАТЕЛЕ (Хушбаков Х.) ---")
        cursor.execute("SELECT id, login, name, role FROM users WHERE name LIKE '%Хушбаков%'")
        user = cursor.fetchone()
        if user:
            print(dict(user))
        else:
            print("Пользователь не найден")

        print("\n--- ИНФОРМАЦИЯ О НАРЯДЕ №47 ---")
        cursor.execute("SELECT * FROM permits WHERE id = 47 OR number = '47'")
        permit = cursor.fetchone()
        if permit:
            p_dict = dict(permit)
            # Выводим основные поля
            for key in ['id', 'number', 'status', 'issuer_id', 'dispatcher_id', 'admitter_id', 'observer_id', 'foreman_id']:
                print(f"{key}: {p_dict.get(key)} (type: {type(p_dict.get(key))})")
            
            print("\n--- ПОДПИСИ И ИНСТРУКТАЖИ ---")
            print(f"issuer_signature: {p_dict.get('issuer_signature')}")
            print(f"daily_briefings (raw): {p_dict.get('daily_briefings')}")
        else:
            print("Наряд №47 не найден")

        conn.close()
    except Exception as e:
        print(f"Ошибка при чтении базы: {e}")

if __name__ == "__main__":
    inspect()
