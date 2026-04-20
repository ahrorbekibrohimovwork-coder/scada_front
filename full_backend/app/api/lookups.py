from typing import List
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import text

from db_operations import get_db, get_all_organizations, get_all_departments, get_organizations_by_filial_id
from models import Filial, Dispetcher, DispetcherAssistant, Admitter, ResponsibleManager, Supervisor, WorkProducer, Worker, AppUser

router = APIRouter()

class ItemResponse(BaseModel):
    id: str
    name: str

    class Config:
        from_attributes = True

class OfficialResponse(BaseModel):
    id: str
    full_name: str
    position: str
    ex_group: str = None

    class Config:
        from_attributes = True


def _from_app_users(db: Session, *roles: str) -> List[dict]:
    """Query app_users filtered by one or more roles, return OfficialResponse dicts."""
    users = db.query(AppUser).filter(
        AppUser.role.in_(list(roles)),
        AppUser.is_active == 1,
    ).order_by(AppUser.full_name).all()
    return [
        {"id": u.id, "full_name": u.full_name, "position": u.position or "", "ex_group": u.electrical_group or ""}
        for u in users
    ]

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
    rows = db.query(Dispetcher).all()
    if rows:
        return [{"id": str(r.id), "full_name": r.full_name, "position": r.position or "", "ex_group": r.ex_group or ""} for r in rows]
    return _from_app_users(db, "dispatcher")

@router.get("/dispetcher_assistants", response_model=List[OfficialResponse])
def get_dispetcher_assistants(db: Session = Depends(get_db)):
    rows = db.query(DispetcherAssistant).all()
    if rows:
        return [{"id": str(r.id), "full_name": r.full_name, "position": r.position or "", "ex_group": r.ex_group or ""} for r in rows]
    return _from_app_users(db, "dispatcher_assistant")

@router.get("/admitters", response_model=List[OfficialResponse])
def get_admitters(db: Session = Depends(get_db)):
    rows = db.query(Admitter).all()
    if rows:
        return [{"id": str(r.id), "full_name": r.full_name, "position": r.position or "", "ex_group": r.ex_group or ""} for r in rows]
    return _from_app_users(db, "admitter")

@router.get("/workers", response_model=List[OfficialResponse])
def get_workers(db: Session = Depends(get_db)):
    try:
        result = db.execute(text(
            "SELECT ROW_NUMBER() OVER (ORDER BY fullname)::text, fullname, '', group_num FROM workers"
        ))
        rows = result.fetchall()
        if rows:
            return [{"id": row[0], "full_name": row[1], "position": row[2], "ex_group": row[3]} for row in rows]
    except Exception as e:
        print(f"workers table error: {e}")
    return _from_app_users(db, "worker")

@router.get("/responsible_managers", response_model=List[OfficialResponse])
def get_responsible_managers(db: Session = Depends(get_db)):
    rows = db.query(ResponsibleManager).all()
    if rows:
        return [{"id": str(r.id), "full_name": r.full_name, "position": r.position or "", "ex_group": r.ex_group or ""} for r in rows]
    return _from_app_users(db, "manager")

@router.get("/supervisors", response_model=List[OfficialResponse])
def get_supervisors(db: Session = Depends(get_db)):
    rows = db.query(Supervisor).all()
    if rows:
        return [{"id": str(r.id), "full_name": r.full_name, "position": r.position or "", "ex_group": r.ex_group or ""} for r in rows]
    return _from_app_users(db, "observer")

@router.get("/work_producers", response_model=List[OfficialResponse])
def get_work_producers(db: Session = Depends(get_db)):
    rows = db.query(WorkProducer).all()
    if rows:
        return [{"id": str(r.id), "full_name": r.full_name, "position": r.position or "", "ex_group": r.ex_group or ""} for r in rows]
    return _from_app_users(db, "foreman")
