from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime
from models import WorkPermit, BrigadeMember, Filial

# Импортируем из твоего файла db_operations.py
# Если файлы в разных папках, проверь правильность пути
try:
    from db_operations import (
        get_db,
        get_all_organizations,
        get_all_departments,
        get_organizations_by_filial_id,
        get_all_responsible_managers,
        get_all_dispetchers,
        get_all_supervisors,
        get_all_work_producers,
    )
except ImportError:
    # Если запуск идет из корня, а файл в подпапке
    from ...db_operations import (
        get_db,
        get_all_organizations,
        get_all_departments,
        get_organizations_by_filial_id,
        get_all_responsible_managers,
        get_all_dispetchers,
        get_all_supervisors,
        get_all_work_producers,
    )

# Импортируй свои модели из файла, где они описаны (например, models.py)
# from models import WorkPermit, BrigadeMember 

# --- ВСЕ СХЕМЫ (Pydantic) ---


from pydantic import BaseModel

class FilialResponse(BaseModel):
    filial_id: int
    filial: str

    class Config:
        from_attributes = True # Позволяет Pydantic работать с объектами SQLAlchemy


class OfficialPersonResponse(BaseModel):
    id: int
    full_name: str
    position: str
    ex_group: Optional[str] = None

    class Config:
        orm_mode = True


class PermitInitSchema(BaseModel):
    organization: str
    department: str
    start_time: datetime
    end_time: datetime
    work_description: str

class OfficialsUpdateSchema(BaseModel):
    permit_id: int
    responsible_manager: str
    admitting: str
    work_producer: str
    supervisor: str
    dispetcher: str
    dispetcher_assistant: str

class BrigadeMemberInput(BaseModel):
    name: str
    surname: str
    father_name: Optional[str] = None
    role: str
    group_number: str

class BrigadeBulkCreate(BaseModel):
    permit_id: int
    members: List[BrigadeMemberInput]

class WorkDetailsUpdate(BaseModel):
    permit_id: int
    object_type: str
    work_description: str

class SpecialInstructionsUpdate(BaseModel):
    permit_id: int
    special_instructions: str

# --- ЭНДПОИНТЫ ---

app = FastAPI()


@app.get("/api/filials", response_model=List[FilialResponse])
def get_all_filials(db: Session = Depends(get_db)):
    """
    Возвращает список всех филиалов с их ID
    """
    filials = db.query(Filial).all()
    return filials

@app.get("/api/responsible_managers", response_model=List[OfficialPersonResponse])
def get_responsible_managers(db: Session = Depends(get_db)):
    return get_all_responsible_managers(db)

@app.get("/api/dispetchers", response_model=List[OfficialPersonResponse])
def get_dispetchers(db: Session = Depends(get_db)):
    return get_all_dispetchers(db)

@app.get("/api/dispetcher_assistants", response_model=List[OfficialPersonResponse])
def get_dispetcher_assistants(db: Session = Depends(get_db)):
    try:
        from models import DispetcherAssistant
        assistants = db.query(DispetcherAssistant).all()
        print(f"Found assistants in DB: {assistants}")
        return [{"id": a.id, "full_name": a.full_name, "position": a.position, "ex_group": a.ex_group} for a in assistants]
    except:
        return []

@app.get("/api/admitters", response_model=List[OfficialPersonResponse])
def get_admitters(db: Session = Depends(get_db)):
    try:
        from models import Admitter
        admitters = db.query(Admitter).all()
        return [{"id": a.id, "full_name": a.full_name, "position": a.position, "ex_group": a.ex_group} for a in admitters]
    except:
        return []

@app.get("/api/supervisors", response_model=List[OfficialPersonResponse])
def get_supervisors(db: Session = Depends(get_db)):
    return get_all_supervisors(db)

@app.get("/api/work_producers", response_model=List[OfficialPersonResponse])
def get_work_producers(db: Session = Depends(get_db)):
    return get_all_work_producers(db)

@app.post("/api/organizations") 
def get_organizations(db: Session = Depends(get_db)):
    # Пробуем получить из БД
    organizations = get_all_organizations(db)
    organizations = [x for x in organizations if x is not None]

    
    # Если в базе пусто — отдаем твой список
    if not organizations:
        return ["ОАО «ГЭС-1»", "АО «Энергосервис»", "ООО «Подрядчик»", "Ремонт-Сервис"]
    return organizations

@app.get("/api/organizations/{filial_id}")
def get_organizations_by_filial(filial_id: int, db: Session = Depends(get_db)):
    print(f"Received filial_id: {filial_id}")
    organizations = get_organizations_by_filial_id(db, filial_id)
    organizations = [x for x in organizations if x is not None]
    return organizations

@app.get("/api/departments")
def get_departments(db: Session = Depends(get_db)): # Добавили зависимость db
    all_departments = get_all_departments(db)
    all_departments = [x for x in all_departments if x is not None]
    
    # Если в базе пусто — отдаем твой список
    if not all_departments:
        return [
            "Электротехническая лаборатория", 
            "Электроцех", 
            "Служба РЗА", 
            "Участок связи", 
            "Дежурная служба", 
            "Служба защиты"
        ]
    
    return all_departments

@app.post("/api/permits/init")
def init_work_permit(data: PermitInitSchema, db: Session = Depends(get_db)):
    try:
        new_permit = WorkPermit(
            organization=data.organization,
            department=data.department,  
            start_time=data.start_time,
            end_time=data.end_time,
            work_description=data.work_description,
            status="DRAFT" 
        )
        db.add(new_permit)
        db.commit()      
        db.refresh(new_permit)
        
        return {
            "status": "success",
            "permit_id": new_permit.id, # Здесь вернется число (например, 1)
            "current_status": new_permit.status
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/permits/update_officials")
def update_officials(data: OfficialsUpdateSchema, db: Session = Depends(get_db)):
    db_permit = db.query(WorkPermit).filter(WorkPermit.id == data.permit_id).first()
    if not db_permit:
        raise HTTPException(status_code=404, detail="Наряд не найден")

    db_permit.responsible_manager = data.responsible_manager
    db_permit.admitting = data.admitting
    db_permit.work_producer = data.work_producer
    db_permit.supervisor = data.supervisor
    db_permit.dispetcher = data.dispetcher
    db_permit.dispetcher_assistant = data.dispetcher_assistant
    db_permit.status = "OFFICIALS_ASSIGNED"

    try:
        db.commit()
        return {"status": "success", "permit_id": db_permit.id}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/permits/brigade")
def save_brigade_members(data: BrigadeBulkCreate, db: Session = Depends(get_db)):
    db_permit = db.query(WorkPermit).filter(WorkPermit.id == data.permit_id).first()
    if not db_permit:
        raise HTTPException(status_code=404, detail="Наряд-допуск не найден")

    try:
        for m in data.members:
            new_member = BrigadeMember(
                permit_id=data.permit_id,
                name=m.name,
                surname=m.surname,
                father_name=m.father_name,
                role=m.role,
                group_number=m.group_number
            )
            db.add(new_member)
        db_permit.status = "BRIGADE_READY"
        db.commit()
        return {"status": "success", "count": len(data.members)}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@app.patch("/api/permits/work_details")
def update_work_details(data: WorkDetailsUpdate, db: Session = Depends(get_db)):
    db_permit = db.query(WorkPermit).filter(WorkPermit.id == data.permit_id).first()
    if not db_permit:
        raise HTTPException(status_code=404, detail="Наряд не найден")

    db_permit.object_type = data.object_type
    db_permit.work_description = data.work_description
    db_permit.status = "DETAILS_FILLED"

    try:
        db.commit()
        return {"status": "success", "permit_id": db_permit.id}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@app.patch("/api/permits/special_instructions")
def update_special_instructions(data: SpecialInstructionsUpdate, db: Session = Depends(get_db)):
    db_permit = db.query(WorkPermit).filter(WorkPermit.id == data.permit_id).first()
    if not db_permit:
        raise HTTPException(status_code=404, detail="Наряд не найден")

    db_permit.special_instructions = data.special_instructions
    db_permit.status = "INSTRUCTIONS_ADDED"

    try:
        db.commit()
        return {"status": "success", "permit_id": db_permit.id}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))