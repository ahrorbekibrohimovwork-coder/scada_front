from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
import secrets
from datetime import datetime
from sqlalchemy.orm import Session
from db_operations import get_db
from models import AppUser

router = APIRouter()

class UserResponse(BaseModel):
    id: str
    login: str
    name: str
    shortName: str
    role: str
    position: str
    electricalGroup: str
    department: str
    phone: str

class LoginRequest(BaseModel):
    login: str
    password: str

class LoginResponse(BaseModel):
    token: str
    user: UserResponse

class CreateUserRequest(BaseModel):
    login: str
    password: str
    name: str
    role: str
    position: str
    electricalGroup: str
    department: str
    phone: str

USERS = [
    # ── Выдающие наряд-допуск (issuer) ─────────────────────────────────────────
    {"id":"p1",  "login":"xodjiev",      "password":"1234", "name":"Хожиев Н.",       "shortName":"Хожиев Н.",       "role":"issuer",               "position":"Бош муҳандис",                          "electricalGroup":"V",   "department":"ГЭС-1",  "phone":""},
    {"id":"p2",  "login":"umarov_s",     "password":"1234", "name":"Умаров С.",        "shortName":"Умаров С.",        "role":"issuer",               "position":"ЭМЦ бошлиғи",                          "electricalGroup":"V",   "department":"ЭМЦ",    "phone":""},
    {"id":"p3",  "login":"jarov",        "password":"1234", "name":"Жаров М.",         "shortName":"Жаров М.",         "role":"issuer",               "position":"ПТЛ бошлиғи",                          "electricalGroup":"V",   "department":"ПТЛ",    "phone":""},
    {"id":"p4",  "login":"yuldashev",    "password":"1234", "name":"Юлдашев Ф.",       "shortName":"Юлдашев Ф.",       "role":"issuer",               "position":"ГЭС-1 Эксплуатация бошлиғи",           "electricalGroup":"V",   "department":"ГЭС-1",  "phone":""},
    {"id":"p5",  "login":"makhkamov_a",  "password":"1234", "name":"Махкамов А.",      "shortName":"Махкамов А.",      "role":"issuer",               "position":"ГЭС-1 смена бошлиғи",                  "electricalGroup":"V",   "department":"ГЭС-1",  "phone":""},
    {"id":"p6",  "login":"bobokalon_d",  "password":"1234", "name":"Бобокалонов Д.",   "shortName":"Бобокалонов Д.",   "role":"issuer",               "position":"ГЭС-1 смена бошлиғи",                  "electricalGroup":"V",   "department":"ГЭС-1",  "phone":""},
    # ── Руководители работ (manager) ───────────────────────────────────────────
    {"id":"p7",  "login":"xodjiev_m",    "password":"1234", "name":"Хожиев Н.",        "shortName":"Хожиев Н.",        "role":"manager",              "position":"Бош муҳандис",                          "electricalGroup":"V",   "department":"ГЭС-1",  "phone":""},
    {"id":"p8",  "login":"umarov_sm",    "password":"1234", "name":"Умаров С.",         "shortName":"Умаров С.",         "role":"manager",              "position":"ЭМЦ бошлиғи",                          "electricalGroup":"V",   "department":"ЭМЦ",    "phone":""},
    {"id":"p9",  "login":"jarov_m",      "password":"1234", "name":"Жаров М.",          "shortName":"Жаров М.",          "role":"manager",              "position":"ПТЛ бошлиғи",                          "electricalGroup":"V",   "department":"ПТЛ",    "phone":""},
    {"id":"p10", "login":"yuldashev_m",  "password":"1234", "name":"Юлдашев Ф.",        "shortName":"Юлдашев Ф.",        "role":"manager",              "position":"ГЭС-1 Эксплуатация бошлиғи",           "electricalGroup":"V",   "department":"ГЭС-1",  "phone":""},
    {"id":"p11", "login":"makhkamov_m",  "password":"1234", "name":"Махкамов А.",       "shortName":"Махкамов А.",       "role":"manager",              "position":"ГЭС-1 смена бошлиғи",                  "electricalGroup":"V",   "department":"ГЭС-1",  "phone":""},
    {"id":"p12", "login":"bobokalon_m",  "password":"1234", "name":"Бобокалонов Д.",    "shortName":"Бобокалонов Д.",    "role":"manager",              "position":"ГЭС-1 смена бошлиғи",                  "electricalGroup":"V",   "department":"ГЭС-1",  "phone":""},
    # ── Главные диспетчеры (dispatcher) ────────────────────────────────────────
    {"id":"p13", "login":"yuldashev_d",  "password":"1234", "name":"Юлдашев Ф.",        "shortName":"Юлдашев Ф.",        "role":"dispatcher",           "position":"ГЭС-1 Эксплуатация бошлиғи",           "electricalGroup":"V",   "department":"ГЭС-1",  "phone":""},
    {"id":"p14", "login":"makhkamov_d",  "password":"1234", "name":"Махкамов А.",        "shortName":"Махкамов А.",        "role":"dispatcher",           "position":"ГЭС-1 смена бошлиғи",                  "electricalGroup":"V",   "department":"ГЭС-1",  "phone":""},
    {"id":"p15", "login":"bobokalon_d2", "password":"1234", "name":"Бобокалонов Д.",    "shortName":"Бобокалонов Д.",    "role":"dispatcher",           "position":"ГЭС-1 смена бошлиғи",                  "electricalGroup":"V",   "department":"ГЭС-1",  "phone":""},
    {"id":"p16", "login":"musaev_n",     "password":"1234", "name":"Мусаев Н.",          "shortName":"Мусаев Н.",          "role":"dispatcher",           "position":"ГЭС-1 смена бошлиғи",                  "electricalGroup":"IV",  "department":"ГЭС-1",  "phone":""},
    {"id":"p17", "login":"makhkamboev", "password":"1234",  "name":"Махкамбоев О.",     "shortName":"Махкамбоев О.",     "role":"dispatcher",           "position":"ГЭС-1 смена бошлиғи",                  "electricalGroup":"IV",  "department":"ГЭС-1",  "phone":""},
    # ── Помощники диспетчера (dispatcher_assistant) ────────────────────────────
    {"id":"p18", "login":"yuldashev_da", "password":"1234", "name":"Юлдашев Ф.",        "shortName":"Юлдашев Ф.",        "role":"dispatcher_assistant", "position":"ГЭС-1 Эксплуатация бошлиғи",           "electricalGroup":"V",   "department":"ГЭС-1",  "phone":""},
    {"id":"p19", "login":"makhkamov_da", "password":"1234", "name":"Махкамов А.",        "shortName":"Махкамов А.",        "role":"dispatcher_assistant", "position":"ГЭС-1 смена бошлиғи",                  "electricalGroup":"V",   "department":"ГЭС-1",  "phone":""},
    {"id":"p20", "login":"bobokalon_da", "password":"1234", "name":"Бобокалонов Д.",    "shortName":"Бобокалонов Д.",    "role":"dispatcher_assistant", "position":"ГЭС-1 смена бошлиғи",                  "electricalGroup":"V",   "department":"ГЭС-1",  "phone":""},
    {"id":"p21", "login":"musaev_da",    "password":"1234", "name":"Мусаев Н.",          "shortName":"Мусаев Н.",          "role":"dispatcher_assistant", "position":"ГЭС-1 смена бошлиғи",                  "electricalGroup":"IV",  "department":"ГЭС-1",  "phone":""},
    {"id":"p22", "login":"makhkamb_da",  "password":"1234", "name":"Махкамбоев О.",     "shortName":"Махкамбоев О.",     "role":"dispatcher_assistant", "position":"ГЭС-1 смена бошлиғи",                  "electricalGroup":"IV",  "department":"ГЭС-1",  "phone":""},
    # ── Наблюдающие (observer) ─────────────────────────────────────────────────
    {"id":"p23", "login":"xushbaqov",    "password":"1234", "name":"Хўшбақов Х.",       "shortName":"Хўшбақов Х.",       "role":"observer",             "position":"ГЭС-1 электростанция смена бошлиғи",    "electricalGroup":"IV",  "department":"ГЭС-1",  "phone":""},
    {"id":"p24", "login":"kenjayev",     "password":"1234", "name":"Кенжаев Б.",         "shortName":"Кенжаев Б.",         "role":"observer",             "position":"ГЭС-1 электростанция смена бошлиғи",    "electricalGroup":"IV",  "department":"ГЭС-1",  "phone":""},
    {"id":"p25", "login":"isoqlov",      "password":"1234", "name":"Исоқулов Х.",        "shortName":"Исоқулов Х.",        "role":"observer",             "position":"ГЭС-1 электростанция смена бошлиғи",    "electricalGroup":"IV",  "department":"ГЭС-1",  "phone":""},
    {"id":"p26", "login":"baqiev",       "password":"1234", "name":"Боқиев Э.",           "shortName":"Боқиев Э.",           "role":"observer",             "position":"ГЭС-1 электростанция смена бошлиғи",    "electricalGroup":"IV",  "department":"ГЭС-1",  "phone":""},
    {"id":"p27", "login":"mirsaidov",    "password":"1234", "name":"Мирсаидов М.",       "shortName":"Мирсаидов М.",       "role":"observer",             "position":"ММ ва ХТ етакчи муҳандиси",             "electricalGroup":"V",   "department":"ГЭС-1",  "phone":""},
    {"id":"p28", "login":"karpov_a",     "password":"1234", "name":"Карпов А.",           "shortName":"Карпов А.",           "role":"observer",             "position":"Электромонтёр-релечи",                  "electricalGroup":"IV",  "department":"ЭМЦ",    "phone":""},
    {"id":"p29", "login":"tashtaev",     "password":"1234", "name":"Таштаев Б.",          "shortName":"Таштаев Б.",          "role":"observer",             "position":"ЭМЦ устаси",                            "electricalGroup":"IV",  "department":"ЭМЦ",    "phone":""},
    {"id":"p30", "login":"ismoilov",     "password":"1234", "name":"Исмоилов Ш.",         "shortName":"Исмоилов Ш.",         "role":"observer",             "position":"ЭМЦ электр-газ пайвандчи",              "electricalGroup":"III", "department":"ЭМЦ",    "phone":""},
    {"id":"p31", "login":"urinbaev",     "password":"1234", "name":"Ўринбаев Б.",         "shortName":"Ўринбаев Б.",         "role":"observer",             "position":"ЭМЦ электр чилангари",                  "electricalGroup":"III", "department":"ЭМЦ",    "phone":""},
    {"id":"p32", "login":"begimov",      "password":"1234", "name":"Бегимов Х.",          "shortName":"Бегимов Х.",          "role":"observer",             "position":"ЭМЦ электр чилангари",                  "electricalGroup":"III", "department":"ЭМЦ",    "phone":""},
    # ── Допускающие (admitter) — те же люди что и помощники диспетчера ──────────
    {"id":"p33", "login":"yuldashev_ad", "password":"1234", "name":"Юлдашев Ф.",        "shortName":"Юлдашев Ф.",        "role":"admitter",             "position":"ГЭС-1 Эксплуатация бошлиғи",           "electricalGroup":"V",   "department":"ГЭС-1",  "phone":""},
    {"id":"p34", "login":"makhkamov_ad", "password":"1234", "name":"Махкамов А.",        "shortName":"Махкамов А.",        "role":"admitter",             "position":"ГЭС-1 смена бошлиғи",                  "electricalGroup":"V",   "department":"ГЭС-1",  "phone":""},
    {"id":"p35", "login":"bobokalon_ad", "password":"1234", "name":"Бобокалонов Д.",    "shortName":"Бобокалонов Д.",    "role":"admitter",             "position":"ГЭС-1 смена бошлиғи",                  "electricalGroup":"V",   "department":"ГЭС-1",  "phone":""},
    {"id":"p36", "login":"musaev_ad",    "password":"1234", "name":"Мусаев Н.",          "shortName":"Мусаев Н.",          "role":"admitter",             "position":"ГЭС-1 смена бошлиғи",                  "electricalGroup":"IV",  "department":"ГЭС-1",  "phone":""},
    {"id":"p37", "login":"makhkamb_ad",  "password":"1234", "name":"Махкамбоев О.",     "shortName":"Махкамбоев О.",     "role":"admitter",             "position":"ГЭС-1 смена бошлиғи",                  "electricalGroup":"IV",  "department":"ГЭС-1",  "phone":""},
    # ── Производители работ (foreman) ──────────────────────────────────────────
    {"id":"p38", "login":"karpov_f",     "password":"1234", "name":"Карпов А.",           "shortName":"Карпов А.",           "role":"foreman",              "position":"Электромонтёр-релечи",                  "electricalGroup":"IV",  "department":"ЭМЦ",    "phone":""},
    {"id":"p39", "login":"jarov_f",      "password":"1234", "name":"Жаров М.",            "shortName":"Жаров М.",            "role":"foreman",              "position":"ПТЛ бошлиғи",                          "electricalGroup":"V",   "department":"ПТЛ",    "phone":""},
    {"id":"p40", "login":"umarov_f",     "password":"1234", "name":"Умаров С.",           "shortName":"Умаров С.",           "role":"foreman",              "position":"ЭМЦ бошлиғи",                          "electricalGroup":"V",   "department":"ЭМЦ",    "phone":""},
    {"id":"p41", "login":"igumenov",     "password":"1234", "name":"Игуменов Л.",         "shortName":"Игуменов Л.",         "role":"foreman",              "position":"Электромонтёр-релечи",                  "electricalGroup":"IV",  "department":"ЭМЦ",    "phone":""},
    # ── Состав бригады (worker) ────────────────────────────────────────────────
    {"id":"p42", "login":"toshmatov",    "password":"1234", "name":"Тошматов Б.",          "shortName":"Тошматов Б.",          "role":"worker",               "position":"Электромонтёр",                         "electricalGroup":"IV",  "department":"ЭМЦ",    "phone":""},
    {"id":"p43", "login":"raximov",      "password":"1234", "name":"Раҳимов Д.",           "shortName":"Раҳимов Д.",           "role":"worker",               "position":"Электромонтёр",                         "electricalGroup":"III", "department":"ЭМЦ",    "phone":""},
    {"id":"p44", "login":"yusupov_a",    "password":"1234", "name":"Юсупов А.",            "shortName":"Юсупов А.",            "role":"worker",               "position":"Электромонтёр",                         "electricalGroup":"III", "department":"ЭМЦ",    "phone":""},
    {"id":"p45", "login":"nazarov_s",    "password":"1234", "name":"Назаров С.",           "shortName":"Назаров С.",           "role":"worker",               "position":"Электромонтёр",                         "electricalGroup":"III", "department":"ЭМЦ",    "phone":""},
    {"id":"p46", "login":"xasanov_j",    "password":"1234", "name":"Ҳасанов Ж.",           "shortName":"Ҳасанов Ж.",           "role":"worker",               "position":"Электромонтёр",                         "electricalGroup":"III", "department":"ЭМЦ",    "phone":""},
    {"id":"p47", "login":"qodirov",      "password":"1234", "name":"Қодиров Т.",           "shortName":"Қодиров Т.",           "role":"worker",               "position":"Слесарь-электрик",                      "electricalGroup":"III", "department":"ЭМЦ",    "phone":""},
    {"id":"p48", "login":"ergashev",     "password":"1234", "name":"Эргашев У.",           "shortName":"Эргашев У.",           "role":"worker",               "position":"Слесарь-электрик",                      "electricalGroup":"III", "department":"ЭМЦ",    "phone":""},
    {"id":"p49", "login":"mirzayev",     "password":"1234", "name":"Мирзаев Х.",           "shortName":"Мирзаев Х.",           "role":"worker",               "position":"Электрогазосварщик",                    "electricalGroup":"II",  "department":"ЭМЦ",    "phone":""},
    {"id":"p50", "login":"holmatov",     "password":"1234", "name":"Ҳолматов Н.",          "shortName":"Ҳолматов Н.",          "role":"worker",               "position":"Электромонтёр",                         "electricalGroup":"IV",  "department":"ПТЛ",    "phone":""},
    {"id":"p51", "login":"sultonov",     "password":"1234", "name":"Султонов Р.",          "shortName":"Султонов Р.",          "role":"worker",               "position":"Электромонтёр",                         "electricalGroup":"III", "department":"ПТЛ",    "phone":""},
    {"id":"p52", "login":"askarov_m",    "password":"1234", "name":"Аскаров М.",           "shortName":"Аскаров М.",           "role":"worker",               "position":"Слесарь-электрик",                      "electricalGroup":"III", "department":"ГЭС-1",  "phone":""},
    {"id":"p53", "login":"pulatov_i",    "password":"1234", "name":"Пўлатов И.",           "shortName":"Пўлатов И.",           "role":"worker",               "position":"Электромонтёр",                         "electricalGroup":"II",  "department":"ГЭС-1",  "phone":""},
    {"id":"p54", "login":"xudoyberdiev", "password":"1234", "name":"Худойбердиев А.",      "shortName":"Худойбердиев А.",      "role":"worker",               "position":"Электромонтёр",                         "electricalGroup":"III", "department":"ГЭС-1",  "phone":""},
    {"id":"p55", "login":"razzaqov",     "password":"1234", "name":"Раззоқов Ф.",          "shortName":"Раззоқов Ф.",          "role":"worker",               "position":"Слесарь-электрик",                      "electricalGroup":"II",  "department":"ГЭС-1",  "phone":""},
]

TOKENS = {}

def serialize_user(user: AppUser) -> dict:
    return {
        "id": user.id,
        "login": user.login,
        "password": user.password,
        "name": user.full_name,
        "shortName": user.short_name,
        "role": user.role,
        "position": user.position,
        "electricalGroup": user.electrical_group or "",
        "department": user.department or "",
        "phone": user.phone or "",
    }


@router.post("/login", response_model=LoginResponse)
def login(data: LoginRequest, db: Session = Depends(get_db)):
    db_user = (
        db.query(AppUser)
        .filter(AppUser.login == data.login, AppUser.is_active == 1)
        .first()
    )
    if not db_user or db_user.password != data.password:
        raise HTTPException(status_code=401, detail="Неверный логин или пароль")

    token = secrets.token_urlsafe(24)
    TOKENS[token] = db_user.id

    return {
        "token": token,
        "user": serialize_user(db_user),
    }

@router.get("/me", response_model=UserResponse)
def me(authorization: Optional[str] = None, db: Session = Depends(get_db)):
    if not authorization:
        raise HTTPException(status_code=401, detail="Требуется Authorization заголовок")
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Неверный формат Authorization")

    token = authorization.split(" ", 1)[1]
    user_id = TOKENS.get(token)
    if not user_id:
        raise HTTPException(status_code=401, detail="Неверный токен")

    db_user = (
        db.query(AppUser)
        .filter(AppUser.id == user_id, AppUser.is_active == 1)
        .first()
    )
    if not db_user:
        raise HTTPException(status_code=401, detail="Пользователь не найден")

    return serialize_user(db_user)


@router.get("/users")
def list_users(db: Session = Depends(get_db)):
    users = (
        db.query(AppUser)
        .filter(AppUser.is_active == 1)
        .order_by(AppUser.role, AppUser.full_name)
        .all()
    )
    if users:
        return [serialize_user(user) for user in users]

    return [{key: value for key, value in user.items() if key != "password"} for user in USERS]

@router.post("/create", response_model=UserResponse)
def create_user(data: CreateUserRequest, db: Session = Depends(get_db)):
    # Check if login exists
    existing = db.query(AppUser).filter(AppUser.login == data.login).first()
    if existing:
        raise HTTPException(status_code=400, detail="Логин уже занят")
    
    def make_short_name(full_name: str) -> str:
        parts = [part for part in (full_name or "").strip().split() if part]
        if len(parts) >= 3:
            return f"{parts[0]} {parts[1][0]}.{parts[2][0]}."
        if len(parts) == 2:
            return f"{parts[0]} {parts[1][0]}."
        return full_name or ""

    user_id = f"u{int(datetime.utcnow().timestamp())}"
    new_user = AppUser(
        id=user_id,
        login=data.login,
        password=data.password,
        full_name=data.name,
        short_name=make_short_name(data.name),
        role=data.role,
        position=data.position,
        electrical_group=data.electricalGroup,
        department=data.department,
        phone=data.phone,
        is_active=1
    )
    db.add(new_user)
    try:
        db.commit()
        db.refresh(new_user)
        return serialize_user(new_user)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.patch("/update/{user_id}", response_model=UserResponse)
def update_user(user_id: str, data: dict, db: Session = Depends(get_db)):
    db_user = db.query(AppUser).filter(AppUser.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    
    if "login" in data: db_user.login = data["login"]
    if "password" in data: db_user.password = data["password"]
    if "name" in data: 
        db_user.full_name = data["name"]
        # Update short name too if name changed
        parts = [part for part in (data["name"] or "").strip().split() if part]
        if len(parts) >= 3:
            db_user.short_name = f"{parts[0]} {parts[1][0]}.{parts[2][0]}."
        elif len(parts) == 2:
            db_user.short_name = f"{parts[0]} {parts[1][0]}."
        else:
            db_user.short_name = data["name"]
            
    if "role" in data: db_user.role = data["role"]
    if "position" in data: db_user.position = data["position"]
    if "electricalGroup" in data: db_user.electrical_group = data["electricalGroup"]
    if "department" in data: db_user.department = data["department"]
    if "phone" in data: db_user.phone = data["phone"]
    
    try:
        db.commit()
        db.refresh(db_user)
        return serialize_user(db_user)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
