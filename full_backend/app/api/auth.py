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
    {"id":"u1",  "login":"ivanov",     "password":"1234", "name":"Иванов Александр Петрович",     "shortName":"Иванов А.П.",       "role":"issuer",               "position":"Начальник электротехнической службы",           "electricalGroup":"V",  "department":"Электротехнический отдел", "phone":""},
    {"id":"u2",  "login":"borkov",     "password":"1234", "name":"Борков Виктор Александрович",   "shortName":"Борков В.А.",        "role":"dispatcher",           "position":"Главный диспетчер",                             "electricalGroup":"V",  "department":"Диспетчерская служба",     "phone":""},
    {"id":"u3",  "login":"petrov_a",   "password":"1234", "name":"Петров Алексей Викторович",     "shortName":"Петров А.В.",        "role":"dispatcher_assistant", "position":"Помощник главного диспетчера",                  "electricalGroup":"IV", "department":"Диспетчерская служба",     "phone":""},
    {"id":"u4",  "login":"musaev",     "password":"1234", "name":"Мусаев Нурулло Исмоилович",     "shortName":"Мусаев Н.И.",        "role":"admitter",             "position":"Допускающий (мастер электроцеха)",              "electricalGroup":"IV", "department":"Электрический цех",        "phone":""},
    {"id":"u5",  "login":"bobokalon",  "password":"1234", "name":"Бобокалонов Дониёр Отаевич",    "shortName":"Бобокалонов Д.О.",   "role":"admitter",             "position":"Допускающий (начальник смены)",                 "electricalGroup":"IV", "department":"Электрический цех",        "phone":""},
    {"id":"u6",  "login":"nikolaev",   "password":"1234", "name":"Николаев Александр Михайлович", "shortName":"Николаев А.М.",      "role":"manager",              "position":"Ответственный руководитель (главный инженер)", "electricalGroup":"V",  "department":"Электротехнический отдел", "phone":""},
    {"id":"u7",  "login":"makhmakov",  "password":"1234", "name":"Махкамов Алишер Тоирович",      "shortName":"Махкамов А.Т.",      "role":"manager",              "position":"Ответственный руководитель (нач. смены ГЭС-1)","electricalGroup":"V",  "department":"ГЭС-1",                    "phone":""},
    {"id":"u8",  "login":"khodjaev",   "password":"1234", "name":"Ходжиев Нодирбек Алишерович",   "shortName":"Ходжиев Н.А.",       "role":"manager",              "position":"Ответственный руководитель (нач. смены ГЭС-2)","electricalGroup":"V",  "department":"ГЭС-2",                    "phone":""},
    {"id":"u9",  "login":"volkov_v",   "password":"1234", "name":"Волков Виктор Александрович",   "shortName":"Волков В.А.",        "role":"observer",             "position":"Наблюдающий (электромонтёр-релейщик)",          "electricalGroup":"IV", "department":"Электрический цех",        "phone":""},
    {"id":"u10", "login":"lukov",      "password":"1234", "name":"Луков Олег Олегович",           "shortName":"Луков О.О.",         "role":"foreman",              "position":"Производитель работ (электромонтёр)",           "electricalGroup":"IV", "department":"ЭМС",                      "phone":""},
    {"id":"u11", "login":"karpov",     "password":"1234", "name":"Карпов Андрей Николаевич",      "shortName":"Карпов А.Н.",        "role":"foreman",              "position":"Производитель работ (мастер ЭМС)",              "electricalGroup":"IV", "department":"ЭМС",                      "phone":""},
    {"id":"u12", "login":"pulatov",    "password":"1234", "name":"Пулатов Санжар Яюбович",        "shortName":"Пулатов С.Я.",       "role":"worker",               "position":"Электромонтёр",                                "electricalGroup":"III","department":"ЭМС",                      "phone":""},
    {"id":"u13", "login":"umarov_se",  "password":"1234", "name":"Умаров Самандар Элдорович",     "shortName":"Умаров С.Э.",        "role":"worker",               "position":"Электромонтёр",                                "electricalGroup":"IV", "department":"ЭМС",                      "phone":""},
    {"id":"u14", "login":"khasanov",   "password":"1234", "name":"Хасанов Равшан Самадович",      "shortName":"Хасанов Р.С.",       "role":"worker",               "position":"Электромонтёр",                                "electricalGroup":"V",  "department":"ЭМС",                      "phone":""},
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
