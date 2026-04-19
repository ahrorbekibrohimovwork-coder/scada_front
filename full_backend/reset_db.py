"""
Reset script — clears all data and seeds a clean user set.
Run: python reset_db.py
"""
import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from db_operations import get_db, Base, engine
from models import (
    AppUser, WorkPermit, BrigadeMember, DailyBriefing, PermitEvent,
    ReturnComment, ExtensionRecord,
    ResponsibleManager, Dispetcher, DispetcherAssistant,
    Admitter, Supervisor, WorkProducer, Worker,
)

# ── Clean user roster ──────────────────────────────────────────────────────────
# One person = one role. Password for all: 1234
CLEAN_USERS = [
    # ── Выдающий (issuer) ──────────────────────────────────────────────────
    dict(id="u1", login="ivanov",      password="1234",
         full_name="Иванов Александр Петрович",     short_name="Иванов А.П.",
         role="issuer",              position="Начальник электротехнической службы",
         electrical_group="V",      department="Электротехнический отдел",   phone=""),

    # ── Главный диспетчер (dispatcher) ────────────────────────────────────
    dict(id="u2", login="borkov",      password="1234",
         full_name="Борков Виктор Александрович",   short_name="Борков В.А.",
         role="dispatcher",          position="Главный диспетчер",
         electrical_group="V",      department="Диспетчерская служба",        phone=""),

    # ── Помощник ГД (dispatcher_assistant) ────────────────────────────────
    dict(id="u3", login="petrov_a",    password="1234",
         full_name="Петров Алексей Викторович",     short_name="Петров А.В.",
         role="dispatcher_assistant", position="Помощник главного диспетчера",
         electrical_group="IV",     department="Диспетчерская служба",        phone=""),

    # ── Допускающий (admitter) ────────────────────────────────────────────
    dict(id="u4", login="musaev",      password="1234",
         full_name="Мусаев Нурулло Исмоилович",    short_name="Мусаев Н.И.",
         role="admitter",            position="Допускающий (мастер электроцеха)",
         electrical_group="IV",     department="Электрический цех",           phone=""),

    dict(id="u5", login="bobokalon",   password="1234",
         full_name="Бобокалонов Дониёр Отаевич",   short_name="Бобокалонов Д.О.",
         role="admitter",            position="Допускающий (начальник смены)",
         electrical_group="IV",     department="Электрический цех",           phone=""),

    # ── Ответственный руководитель (manager) ──────────────────────────────
    dict(id="u6", login="nikolaev",    password="1234",
         full_name="Николаев Александр Михайлович", short_name="Николаев А.М.",
         role="manager",             position="Ответственный руководитель (главный инженер)",
         electrical_group="V",      department="Электротехнический отдел",   phone=""),

    dict(id="u7", login="makhmakov",   password="1234",
         full_name="Махкамов Алишер Тоирович",     short_name="Махкамов А.Т.",
         role="manager",             position="Ответственный руководитель (нач. смены ГЭС-1)",
         electrical_group="V",      department="ГЭС-1",                       phone=""),

    dict(id="u8", login="khodjaev",    password="1234",
         full_name="Ходжиев Нодирбек Алишерович",  short_name="Ходжиев Н.А.",
         role="manager",             position="Ответственный руководитель (нач. смены ГЭС-2)",
         electrical_group="V",      department="ГЭС-2",                       phone=""),

    # ── Наблюдающий (observer) ────────────────────────────────────────────
    dict(id="u9", login="volkov_v",    password="1234",
         full_name="Волков Виктор Александрович",  short_name="Волков В.А.",
         role="observer",            position="Наблюдающий (электромонтёр-релейщик)",
         electrical_group="IV",     department="Электрический цех",           phone=""),

    # ── Производитель работ (foreman) ─────────────────────────────────────
    dict(id="u10", login="lukov",      password="1234",
         full_name="Луков Олег Олегович",          short_name="Луков О.О.",
         role="foreman",             position="Производитель работ (электромонтёр)",
         electrical_group="IV",     department="ЭМС",                         phone=""),

    dict(id="u11", login="karpov",     password="1234",
         full_name="Карпов Андрей Николаевич",     short_name="Карпов А.Н.",
         role="foreman",             position="Производитель работ (мастер ЭМС)",
         electrical_group="IV",     department="ЭМС",                         phone=""),

    # ── Члены бригады (worker) ────────────────────────────────────────────
    dict(id="u12", login="pulatov",    password="1234",
         full_name="Пулатов Санжар Яюбович",       short_name="Пулатов С.Я.",
         role="worker",              position="Электромонтёр",
         electrical_group="III",    department="ЭМС",                         phone=""),

    dict(id="u13", login="umarov_se",  password="1234",
         full_name="Умаров Самандар Элдорович",    short_name="Умаров С.Э.",
         role="worker",              position="Электромонтёр",
         electrical_group="IV",     department="ЭМС",                         phone=""),

    dict(id="u14", login="khasanov",   password="1234",
         full_name="Хасанов Равшан Самадович",     short_name="Хасанов Р.С.",
         role="worker",              position="Электромонтёр",
         electrical_group="V",      department="ЭМС",                         phone=""),
]


def reset():
    db = next(get_db())
    print("=== Сброс базы данных ===\n")

    # 1. Удалить все наряды и связанные таблицы
    print("Удаление нарядов и связанных записей...")
    db.query(ReturnComment).delete()
    db.query(ExtensionRecord).delete()
    db.query(PermitEvent).delete()
    db.query(DailyBriefing).delete()
    db.query(BrigadeMember).delete()
    db.query(WorkPermit).delete()

    # 2. Очистить legacy-таблицы (источник дублей)
    print("Очистка устаревших таблиц...")
    db.query(ResponsibleManager).delete()
    db.query(Dispetcher).delete()
    db.query(DispetcherAssistant).delete()
    db.query(Admitter).delete()
    db.query(Supervisor).delete()
    db.query(WorkProducer).delete()
    db.query(Worker).delete()

    # 3. Удалить всех пользователей
    print("Удаление всех пользователей...")
    db.query(AppUser).delete()

    db.commit()

    # 4. Создать чистых пользователей
    print("Создание чистых пользователей...")
    for u in CLEAN_USERS:
        db.add(AppUser(
            id=u["id"], login=u["login"], password=u["password"],
            full_name=u["full_name"], short_name=u["short_name"],
            role=u["role"], position=u["position"],
            electrical_group=u["electrical_group"],
            department=u["department"], phone=u["phone"],
            is_active=1,
        ))

    db.commit()

    # 5. Вывести итог
    users = db.query(AppUser).order_by(AppUser.role, AppUser.full_name).all()
    print(f"\n✓ Создано {len(users)} пользователей:\n")
    role_order = ["issuer","dispatcher","dispatcher_assistant","admitter","manager","observer","foreman","worker"]
    for role in role_order:
        group = [u for u in users if u.role == role]
        if group:
            role_label = {
                "issuer": "Выдающий", "dispatcher": "Гл. диспетчер",
                "dispatcher_assistant": "Помощник ГД", "admitter": "Допускающий",
                "manager": "Отв. руководитель", "observer": "Наблюдающий",
                "foreman": "Производитель работ", "worker": "Электромонтёр (рабочий)",
            }[role]
            print(f"  [{role_label}]")
            for u in group:
                print(f"    login={u.login:<15} | {u.full_name}")
    print("\n=== Готово. База данных чистая. ===")


if __name__ == "__main__":
    reset()
