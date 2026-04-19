from typing import List
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import text

from db_operations import get_db, get_all_organizations, get_all_departments, get_organizations_by_filial_id
from models import Filial, Dispetcher, DispetcherAssistant, Admitter, ResponsibleManager, Supervisor, WorkProducer, Worker

router = APIRouter()

class ItemResponse(BaseModel):
    id: str
    name: str

    class Config:
        from_attributes = True

class OfficialResponse(BaseModel):
    id: int
    full_name: str
    position: str
    ex_group: str = None

    class Config:
        from_attributes = True

class FilialResponse(BaseModel):
    id: str
    name: str

    class Config:
        from_attributes = True

@router.get("/filials", response_model=List[FilialResponse])
def get_filials(db: Session = Depends(get_db)):
    filials = db.query(Filial).all()
    if not filials:
        return [
            {"id": "1", "name": "Филиал Северный"},
            {"id": "2", "name": "Филиал Центральный"},
            {"id": "3", "name": "Филиал Юго-Западный"},
        ]
    # Convert Filial model to response format
    return [{"id": str(f.filial_id), "name": f.filial} for f in filials]

@router.get("/organizations/{filial_id}", response_model=List[ItemResponse])
def get_organizations(filial_id: int, db: Session = Depends(get_db)):
    organizations = get_organizations_by_filial_id(db, filial_id)
    if not organizations:
        return [
            {"id": "1", "name": "ОАО «ГЭС-1»"},
            {"id": "2", "name": "АО «Энергосервис»"},
            {"id": "3", "name": "ООО «Подрядчик»"},
            {"id": "4", "name": "Ремонт-Сервис"},
        ]
    # Convert to response format if they're from DB
    return [{"id": str(i), "name": org} for i, org in enumerate(organizations, 1)]

@router.get("/departments", response_model=List[ItemResponse])
def get_departments(db: Session = Depends(get_db)):
    departments = get_all_departments(db)
    if not departments:
        return [
            {"id": "1", "name": "Электротехническая лаборатория"},
            {"id": "2", "name": "Электроцех"},
            {"id": "3", "name": "Служба РЗА"},
            {"id": "4", "name": "Участок связи"},
            {"id": "5", "name": "Дежурная служба"},
            {"id": "6", "name": "Служба защиты"},
        ]
    # Convert to response format if they're from DB
    return [{"id": str(i), "name": dept} for i, dept in enumerate(departments, 1)]

@router.get("/dispetchers", response_model=List[OfficialResponse])
def get_dispetchers(db: Session = Depends(get_db)):
    dispetchers = db.query(Dispetcher).all()
    if not dispetchers:
        return [
            {"id": 1, "full_name": "Волков Михаил Андреевич", "position": "Главный диспетчер", "ex_group": "V"},
            {"id": 2, "full_name": "Иванов Сергей Петрович", "position": "Главный диспетчер", "ex_group": "IV"},
        ]
    return dispetchers

@router.get("/dispetcher_assistants", response_model=List[OfficialResponse])
def get_dispetcher_assistants(db: Session = Depends(get_db)):
    try:
        assistants = db.query(DispetcherAssistant).all()
        if not assistants:
            return [
                {"id": 1, "full_name": "Смирнов Дмитрий Олегович", "position": "Помощник главного диспетчера", "ex_group": "III"},
                {"id": 2, "full_name": "Петров Алексей Викторович", "position": "Помощник главного диспетчера", "ex_group": "III"},
            ]
        return assistants
    except:
        return [
            {"id": 1, "full_name": "Смирнов Дмитрий Олегович", "position": "Помощник главного диспетчера", "ex_group": "III"},
            {"id": 2, "full_name": "Петров Алексей Викторович", "position": "Помощник главного диспетчера", "ex_group": "III"},
        ]

@router.get("/admitters", response_model=List[OfficialResponse])
def get_admitters(db: Session = Depends(get_db)):
    admitters = db.query(Admitter).all()
    if not admitters:
        return [
            {"id": 1, "full_name": "Сидоров Николай Васильевич", "position": "Допускающий", "ex_group": "III"},
            {"id": 2, "full_name": "Кузнецов Алексей Иванович", "position": "Допускающий", "ex_group": "III"},
        ]
    return admitters

@router.get("/workers", response_model=List[OfficialResponse])
def get_workers(db: Session = Depends(get_db)):
    try:
        result = db.execute(text("""
            SELECT
                ROW_NUMBER() OVER (ORDER BY fullname) AS id,
                fullname AS full_name,
                '' AS position,
                group_num AS ex_group
            FROM workers
        """))
        workers = [
            {
                "id": row[0],
                "full_name": row[1],
                "position": row[2],
                "ex_group": row[3],
            }
            for row in result.fetchall()
        ]
        if not workers:
            return [
                {"id": 1, "full_name": "Новиков Виктор Алексеевич", "position": "Монтажник", "ex_group": "III"},
                {"id": 2, "full_name": "Фёдоров Игорь Николаевич", "position": "Монтажник", "ex_group": "III"},
                {"id": 3, "full_name": "Соколов Владимир Петрович", "position": "Электрик", "ex_group": "II"},
                {"id": 4, "full_name": "Морозов Андрей Юрьевич", "position": "Сварщик", "ex_group": "IV"},
            ]
        return workers
    except Exception as e:
        print(f"Error in get_workers: {e}")
        return [
            {"id": 1, "full_name": "Новиков Виктор Алексеевич", "position": "Монтажник", "ex_group": "III"},
            {"id": 2, "full_name": "Фёдоров Игорь Николаевич", "position": "Монтажник", "ex_group": "III"},
            {"id": 3, "full_name": "Соколов Владимир Петрович", "position": "Электрик", "ex_group": "II"},
            {"id": 4, "full_name": "Морозов Андрей Юрьевич", "position": "Сварщик", "ex_group": "IV"},
        ]

@router.get("/responsible_managers", response_model=List[OfficialResponse])
def get_responsible_managers(db: Session = Depends(get_db)):
    managers = db.query(ResponsibleManager).all()
    if not managers:
        return [
            {"id": 1, "full_name": "Петров Иван Сергеевич", "position": "Ответственный руководитель", "ex_group": "V"},
        ]
    return managers

@router.get("/supervisors", response_model=List[OfficialResponse])
def get_supervisors(db: Session = Depends(get_db)):
    supervisors = db.query(Supervisor).all()
    if not supervisors:
        return [
            {"id": 1, "full_name": "Ковалев Андрей Николаевич", "position": "Наблюдающий", "ex_group": "III"},
        ]
    return supervisors

@router.get("/work_producers", response_model=List[OfficialResponse])
def get_work_producers(db: Session = Depends(get_db)):
    producers = db.query(WorkProducer).all()
    if not producers:
        return [
            {"id": 1, "full_name": "Семенов Виктор Петрович", "position": "Производитель работ", "ex_group": "IV"},
        ]
    return producers
