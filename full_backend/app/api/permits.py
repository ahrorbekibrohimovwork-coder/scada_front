from fastapi import APIRouter, HTTPException, Query, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from db_operations import get_db
from models import (
    WorkPermit, BrigadeMember, AppUser, DailyBriefing, PermitEvent, ReturnComment, ExtensionRecord,
    ResponsibleManager, Dispetcher, DispetcherAssistant, Admitter, Supervisor, WorkProducer, Worker
)
from app.api.auth import USERS

router = APIRouter()

class BrigadeMemberResponse(BaseModel):
    id: str
    userId: Optional[str] = None
    name: str
    group: str
    direction: Optional[str] = None
    addedAt: str
    removedAt: Optional[str] = None
    isActive: bool

class PermitResponse(BaseModel):
    id: str
    number: str
    status: str
    organization: str
    department: str
    task: str
    workStartDateTime: str
    workEndDateTime: str
    safetyMeasures: List[str]
    specialInstructions: Optional[str] = ''
    issuerId: Optional[str] = None
    dispatcherId: Optional[str] = None
    dispatcherAssistantId: Optional[str] = None
    admitterId: Optional[str] = None
    managerId: Optional[str] = None
    observerId: Optional[str] = None
    foremanId: Optional[str] = None
    issuerName: Optional[str] = None
    dispatcherName: Optional[str] = None
    dispatcherAssistantName: Optional[str] = None
    admitterName: Optional[str] = None
    managerName: Optional[str] = None
    observerName: Optional[str] = None
    foremanName: Optional[str] = None
    brigadeMembers: List[BrigadeMemberResponse] = []
    issuerSignature: Optional[dict] = None
    dispatcherSignature: Optional[dict] = None
    dispatcherAssistantSignature: Optional[dict] = None
    liveParts: Optional[str] = None
    admitterWorkplaceSignature: Optional[dict] = None
    workplaceVerifierRole: Optional[str] = None
    workplaceVerifierSignature: Optional[dict] = None
    dailyBriefings: List[dict] = []
    extensions: List[dict] = []
    closureNotifyPerson: Optional[str] = None
    closureDateTime: Optional[str] = None
    foremanClosureSignature: Optional[dict] = None
    managerClosureSignature: Optional[dict] = None
    returnComments: List[dict] = []
    events: List[dict] = []
    assistantChecklist: Optional[List[dict]] = None
    versions: List[dict] = []
    nextDayRequest: Optional[dict] = None
    createdAt: str
    updatedAt: str

PERMITS = []

class PermitCreateRequest(BaseModel):
    organization: str
    department: str
    task: str
    workStartDateTime: str
    workEndDateTime: str
    safetyMeasures: List[str] = []
    specialInstructions: Optional[str] = ''
    issuerId: str
    dispatcherId: Optional[str] = None
    dispatcherAssistantId: Optional[str] = None
    admitterId: Optional[str] = None
    managerId: Optional[str] = None
    observerId: Optional[str] = None
    foremanId: Optional[str] = None
    brigadeMembers: List[BrigadeMemberResponse] = []

class PermitInitSchema(BaseModel):
    organization: str
    department: str
    start_time: str
    end_time: str
    work_description: str

@router.post("/init")
def init_work_permit(data: PermitInitSchema, db: Session = Depends(get_db)):
    try:
        new_permit = WorkPermit(
            organization=data.organization,
            department=data.department,
            start_time=datetime.fromisoformat(data.start_time.replace('Z', '+00:00')),
            end_time=datetime.fromisoformat(data.end_time.replace('Z', '+00:00')),
            work_description=data.work_description,
            status="DRAFT"
        )
        db.add(new_permit)
        db.commit()
        db.refresh(new_permit)
        return {"status": "success", "permit_id": new_permit.id, "current_status": new_permit.status}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

class OfficialsUpdateSchema(BaseModel):
    permit_id: int
    responsible_manager: Optional[str] = None
    admitter: Optional[str] = None
    admitting: Optional[str] = None
    work_producer: str
    supervisor: Optional[str] = None
    dispetcher: str
    dispetcher_assistant: str

class BrigadeMemberInput(BaseModel):
    name: str
    surname: Optional[str] = None
    father_name: Optional[str] = None
    role: Optional[str] = None
    group_number: str

class BrigadeBulkCreate(BaseModel):
    permit_id: int
    members: List[BrigadeMemberInput]

class PermitIssueSchema(BaseModel):
    permit_id: int
    special_instructions: Optional[str] = None

class PermitActionSchema(BaseModel):
    permit_id: int
    action: str
    new_end_time: Optional[str] = None
    signature: Optional[dict] = None
    briefing_id: Optional[str] = None
    comment: Optional[str] = None
    verifier_role: Optional[str] = None

class ChecklistSaveSchema(BaseModel):
    permit_id: int
    checklist: List[dict]

class ReworkSaveSchema(BaseModel):
    permit_id: int
    safety_measures: List[str]
    special_instructions: str


def normalize_person_name(value: Optional[str]) -> str:
    return " ".join((value or "").strip().lower().split())

def _name(val: Optional[str], fallback: Optional[str] = None) -> Optional[str]:
    """Return val unless it's a bare number (bad legacy ID), then return fallback."""
    if val and not val.strip().lstrip("-").isdigit():
        return val
    return fallback

NAME_TO_USER = {normalize_person_name(user["name"]): user for user in USERS}

def user_id_by_name(full_name: Optional[str]) -> Optional[str]:
    user = NAME_TO_USER.get(normalize_person_name(full_name))
    return user["id"] if user else None

def build_user_name_indexes(db: Session):
    name_to_id_by_role = {}
    id_to_name = {}
    id_to_info = {}
    
    # 1. AppUser
    try:
        with db.begin_nested():
            users = db.query(AppUser).all()
            for u in users:
                role = u.role
                if role not in name_to_id_by_role: name_to_id_by_role[role] = {}
                name_to_id_by_role[role][normalize_person_name(u.full_name)] = u.id
                id_to_name[u.id] = u.full_name
                id_to_info[u.id] = {"name": u.full_name, "position": u.position or "", "group": u.electrical_group or ""}
    except Exception:
        pass


    # 2. Legacy tables
    roles_tables = [
        (ResponsibleManager, "manager"), (Dispetcher, "dispatcher"), (DispetcherAssistant, "dispatcher_assistant"),
        (Admitter, "admitter"), (Supervisor, "observer"), (WorkProducer, "foreman"), (Worker, "worker")
    ]
    for model, role_key in roles_tables:
        try:
            with db.begin_nested():
                items = db.query(model).all()
                if role_key not in name_to_id_by_role: name_to_id_by_role[role_key] = {}
                for item in items:
                    sid = str(item.id)
                    name_to_id_by_role[role_key][normalize_person_name(item.full_name)] = sid
                    if sid not in id_to_name:
                        id_to_name[sid] = item.full_name
                        id_to_info[sid] = {"name": item.full_name, "position": getattr(item, 'position', ""), "group": getattr(item, 'ex_group', "")}
        except Exception:
            pass

                
    # 3. Mock users
    for mock_user in USERS:
        normalized = normalize_person_name(mock_user["name"])
        role_map = name_to_id_by_role.setdefault(mock_user["role"], {})
        if normalized not in role_map: role_map[normalized] = mock_user["id"]
        if mock_user["id"] not in id_to_name: id_to_name[mock_user["id"]] = mock_user["name"]
        if mock_user["id"] not in id_to_info:
            id_to_info[mock_user["id"]] = {"name": mock_user["name"], "position": mock_user.get("position", ""), "group": mock_user.get("electricalGroup", "")}
            
    return name_to_id_by_role, id_to_name, id_to_info

def get_user_id(value: Optional[str], name_to_id_by_role: dict[str, dict[str, str]], role: str) -> Optional[str]:
    cleaned = (value or "").strip()
    if not cleaned: return None
    role_map = name_to_id_by_role.get(role, {})
    if cleaned in role_map.values(): return cleaned
    return role_map.get(normalize_person_name(cleaned))

def resolve_name_by_id(user_id: Optional[str], id_to_name: dict[str, str], fallback_name: Optional[str]) -> Optional[str]:
    if user_id and user_id in id_to_name: return id_to_name[user_id]
    return fallback_name

def role_match_with_name_fallback(permit: dict, *, role: str, user_id: str, user_name: str) -> bool:
    normalized_user_name = normalize_person_name(user_name)
    id_field_by_role = {
        "issuer": "issuerId",
        "dispatcher": "dispatcherId",
        "dispatcher_assistant": "dispatcherAssistantId",
        "admitter": "admitterId",
        "manager": "managerId",
        "observer": "observerId",
        "foreman": "foremanId"
    }
    
    if role == "worker":
        for member in permit.get("brigadeMembers", []):
            if member.get("userId") == user_id: return True
            if normalize_person_name(member.get("name")) == normalized_user_name: return True
        return False
        
    id_field = id_field_by_role.get(role)
    if id_field and permit.get(id_field) == user_id: return True
    
    # Fallback to name match for legacy data
    name_field_by_role = {
        "issuer": "issuerName",
        "dispatcher": "dispatcherName",
        "dispatcher_assistant": "dispatcherAssistantName",
        "admitter": "admitterName",
        "manager": "managerName",
        "observer": "observerName",
        "foreman": "foremanName"
    }
    name_field = name_field_by_role.get(role)
    if name_field and normalize_person_name(permit.get(name_field)) == normalized_user_name: return True
    
    return False

def format_member_name(member: BrigadeMember) -> str:
    return " ".join(part for part in [member.name, member.surname, member.father_name] if part)

def map_status(db_status: Optional[str]) -> str:
    mapping = {"DRAFT": "draft", "OFFICIALS_ASSIGNED": "draft", "BRIGADE_READY": "draft", "PENDING_DISPATCHER": "pending_dispatcher", "RETURNED_TO_ISSUER": "returned_to_issuer", "PENDING_ASSISTANT": "pending_assistant", "PREPARING_WORKPLACES": "preparing_workplaces", "PENDING_ADMITTER": "pending_admitter", "RETURNED_TO_ASSISTANT": "returned_to_assistant", "ADMITTER_CHECKED": "admitter_checked", "RETURNED_TO_ADMITTER": "returned_to_admitter", "WORKPLACE_APPROVED": "workplace_approved", "ADMITTED": "admitted", "IN_PROGRESS": "in_progress", "DAILY_ENDED": "daily_ended", "CLOSING": "closing", "CLOSED": "closed", "CANCELLED": "cancelled"}
    return mapping.get(db_status or "", "draft")

def serialize_permit(permit: WorkPermit, *, name_to_id_by_role: dict[str, dict[str, str]], id_to_name: dict[str, str], id_to_info: dict = None) -> dict:
    if id_to_info is None: id_to_info = {}
    start_iso = permit.start_time.isoformat() if permit.start_time else datetime.utcnow().isoformat()
    end_iso = permit.end_time.isoformat() if permit.end_time else start_iso
    
    brigade_members = [
        {
            "id": str(m.id),
            "userId": user_id_by_name(format_member_name(m)),
            "name": format_member_name(m),
            "group": m.group_number or "",
            "direction": m.role or "",
            "addedAt": start_iso,
            "isActive": True
        } for m in permit.brigade_members
    ]
    
    def resolve_id(uid, name, role):
        if uid: return uid
        if not name: return None
        return get_user_id(name, name_to_id_by_role, role)

    # Roles
    issuer_id = resolve_id(permit.issuer_user_id, permit.issuer_name, "issuer")
    dispatcher_id = resolve_id(permit.dispetcher_user_id, permit.dispetcher, "dispatcher")
    assistant_id = resolve_id(permit.dispetcher_assistant_user_id, permit.dispetcher_assistant, "dispatcher_assistant")
    admitter_id = resolve_id(permit.admitting_user_id, permit.admitting, "admitter")
    manager_id = resolve_id(permit.responsible_manager_user_id, permit.responsible_manager, "manager")
    observer_id = resolve_id(permit.supervisor_user_id, permit.supervisor, "observer")
    foreman_id = resolve_id(permit.work_producer_user_id, permit.work_producer, "foreman")

    # Relationships
    events = [
        {
            "id": str(ev.id),
            "timestamp": ev.timestamp.isoformat(),
            "userId": ev.user_id,
            "userName": ev.user_name,
            "action": ev.action,
            "comment": ev.comment
        } for ev in permit.events
    ]
    
    briefings = [
        {
            "id": str(b.id),
            "isFirst": b.is_first,
            "workLocationName": b.work_location,
            "briefingDateTime": b.briefing_date.isoformat(),
            "admitterSignature": b.admitter_signature,
            "responsibleSignature": b.responsible_signature,
            "brigadeSignatures": b.brigade_signatures or [],
            "endDateTime": b.end_datetime.isoformat() if b.end_datetime else None,
            "endSignature": b.end_signature
        } for b in permit.daily_briefings
    ]
    
    extensions = [
        {
            "id": str(ext.id),
            "newEndDateTime": ext.new_end_time.isoformat(),
            "issuerSignature": ext.issuer_signature
        } for ext in permit.extensions
    ]
    
    return_comments = [
        {
            "id": str(rc.id),
            "fromUserId": rc.from_user_id,
            "fromUserName": rc.from_user_name,
            "comment": rc.comment,
            "timestamp": rc.timestamp.isoformat(),
            "step": rc.step
        } for rc in permit.return_comments
    ]

    return {
        "id": str(permit.id),
        "number": str(permit.id),
        "status": map_status(permit.status),
        "organization": permit.organization,
        "department": permit.department,
        "task": permit.work_description or "",
        "workStartDateTime": start_iso,
        "workEndDateTime": end_iso,
        "safetyMeasures": permit.safety_measures or [],
        "specialInstructions": permit.special_instructions or "",
        "issuerId": issuer_id,
        "issuerName": _name(permit.issuer_name, id_to_name.get(issuer_id)),
        "dispatcherId": dispatcher_id,
        "dispatcherName": _name(permit.dispetcher, id_to_name.get(dispatcher_id)),
        "dispatcherAssistantId": assistant_id,
        "dispatcherAssistantName": _name(permit.dispetcher_assistant, id_to_name.get(assistant_id)),
        "admitterId": admitter_id,
        "admitterName": _name(permit.admitting, id_to_name.get(admitter_id)),
        "managerId": manager_id,
        "managerName": _name(permit.responsible_manager, id_to_name.get(manager_id)),
        "observerId": observer_id,
        "observerName": _name(permit.supervisor, id_to_name.get(observer_id)),
        "foremanId": foreman_id,
        "foremanName": _name(permit.work_producer, id_to_name.get(foreman_id)),
        "brigadeMembers": brigade_members,
        "issuerSignature": permit.issuer_signature,
        "dispatcherSignature": permit.dispatcher_signature,
        "dispatcherAssistantSignature": permit.dispatcher_assistant_signature,
        "liveParts": permit.live_parts,
        "admitterWorkplaceSignature": permit.admitter_workplace_signature,
        "workplaceVerifierRole": permit.workplace_verifier_role,
        "workplaceVerifierSignature": permit.workplace_verifier_signature,
        "assistantChecklist": permit.assistant_checklist,
        "versions": permit.versions_data or [],
        "nextDayRequest": permit.next_day_request,
        "closureNotifyPerson": permit.closure_notify_person,
        "closureDateTime": permit.closure_datetime.isoformat() if permit.closure_datetime else None,
        "foremanClosureSignature": permit.foreman_closure_signature,
        "managerClosureSignature": permit.manager_closure_signature,
        "dailyBriefings": briefings,
        "extensions": extensions,
        "events": events,
        "returnComments": return_comments,
        "createdAt": permit.created_at.isoformat() if permit.created_at else start_iso,
        "updatedAt": permit.updated_at.isoformat() if permit.updated_at else start_iso,
    }


@router.get("/", response_model=List[PermitResponse])
def list_permits(db: Session = Depends(get_db)):
    name_to_id_by_role, id_to_name, id_to_info = build_user_name_indexes(db)
    return [
        serialize_permit(p, name_to_id_by_role=name_to_id_by_role, id_to_name=id_to_name, id_to_info=id_to_info)
        for p in db.query(WorkPermit).order_by(WorkPermit.id.desc()).all()
    ]

@router.get("/my", response_model=List[PermitResponse])
def get_my_permits(role: str = Query(...), userId: str = Query(...), db: Session = Depends(get_db)):
    name_to_id_by_role, id_to_name, id_to_info = build_user_name_indexes(db)
    db_user = db.query(AppUser).filter(AppUser.id == userId).first()
    user_name = db_user.full_name if db_user else ""
    results = []
    for p in db.query(WorkPermit).all():
        serialized = serialize_permit(p, name_to_id_by_role=name_to_id_by_role, id_to_name=id_to_name, id_to_info=id_to_info)
        if role_match_with_name_fallback(serialized, role=role, user_id=userId, user_name=user_name): results.append(serialized)
    return results

@router.get("/{permit_id}", response_model=PermitResponse)
def get_permit(permit_id: str, db: Session = Depends(get_db)):
    if permit_id.isdigit():
        p = db.query(WorkPermit).filter(WorkPermit.id == int(permit_id)).first()
        if p:
            n2id, id2n, id2i = build_user_name_indexes(db)
            return serialize_permit(p, name_to_id_by_role=n2id, id_to_name=id2n, id_to_info=id2i)
    raise HTTPException(status_code=404, detail="Permit not found")

@router.post("/create", response_model=PermitResponse)
def create_permit(data: PermitCreateRequest, db: Session = Depends(get_db)):
    try:
        _, id2n, _ = build_user_name_indexes(db)
        def get_n(uid): return id2n.get(uid) or uid if uid else None
        p = WorkPermit(
            organization=data.organization, department=data.department,
            start_time=datetime.fromisoformat(data.workStartDateTime.replace('Z', '+00:00')),
            end_time=datetime.fromisoformat(data.workEndDateTime.replace('Z', '+00:00')),
            work_description=data.task, special_instructions=data.specialInstructions,
            status="DRAFT", safety_measures=data.safetyMeasures,
            issuer_user_id=data.issuerId, issuer_name=get_n(data.issuerId),
            responsible_manager_user_id=data.managerId or data.issuerId,
            dispetcher_user_id=data.dispatcherId, dispetcher_assistant_user_id=data.dispatcherAssistantId,
            admitting_user_id=data.admitterId, supervisor_user_id=data.observerId,
            work_producer_user_id=data.foremanId,
            responsible_manager=get_n(data.managerId or data.issuerId),
            dispetcher=get_n(data.dispatcherId), dispetcher_assistant=get_n(data.dispatcherAssistantId),
            admitting=get_n(data.admitterId), supervisor=get_n(data.observerId), work_producer=get_n(data.foremanId)
        )
        db.add(p); db.flush()
        for m in data.brigadeMembers:
            db.add(BrigadeMember(permit_id=p.id, name=m.name, surname="-", group_number=m.group, role=m.direction))
        db.commit(); db.refresh(p)
        n2id, id2n, id2i = build_user_name_indexes(db)
        return serialize_permit(p, name_to_id_by_role=n2id, id_to_name=id2n, id_to_info=id2i)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/save_checklist")
def save_checklist(data: ChecklistSaveSchema, db: Session = Depends(get_db)):
    p = db.query(WorkPermit).filter(WorkPermit.id == data.permit_id).first()
    if not p: raise HTTPException(status_code=404, detail="Permit not found")
    p.assistant_checklist = data.checklist; db.commit(); return {"status": "success"}

@router.post("/save_rework")
def save_rework(data: ReworkSaveSchema, db: Session = Depends(get_db)):
    p = db.query(WorkPermit).filter(WorkPermit.id == data.permit_id).first()
    if not p: raise HTTPException(status_code=404, detail="Permit not found")
    p.safety_measures = data.safety_measures; p.special_instructions = data.special_instructions; db.commit(); return {"status": "success"}

@router.post("/update_officials")
def update_officials(data: OfficialsUpdateSchema, db: Session = Depends(get_db)):
    p = db.query(WorkPermit).filter(WorkPermit.id == data.permit_id).first()
    if not p: raise HTTPException(status_code=404, detail="Permit not found")
    n2id, _, _ = build_user_name_indexes(db)
    p.responsible_manager = data.responsible_manager; p.admitting = data.admitting or data.admitter
    p.work_producer = data.work_producer; p.supervisor = data.supervisor
    p.dispetcher = data.dispetcher; p.dispetcher_assistant = data.dispetcher_assistant
    p.responsible_manager_user_id = get_user_id(data.responsible_manager, n2id, "manager")
    p.admitting_user_id = get_user_id(p.admitting, n2id, "admitter")
    p.work_producer_user_id = get_user_id(data.work_producer, n2id, "foreman")
    p.supervisor_user_id = get_user_id(data.supervisor, n2id, "observer")
    p.dispetcher_user_id = get_user_id(data.dispetcher, n2id, "dispatcher")
    p.dispetcher_assistant_user_id = get_user_id(data.dispetcher_assistant, n2id, "dispatcher_assistant")
    p.status = "OFFICIALS_ASSIGNED"; db.commit(); return {"status": "success", "permit_id": p.id}

@router.post("/brigade")
def save_brigade_members(data: BrigadeBulkCreate, db: Session = Depends(get_db)):
    db.query(BrigadeMember).filter(BrigadeMember.permit_id == data.permit_id).delete()
    for m in data.members:
        db.add(BrigadeMember(permit_id=data.permit_id, name=m.name, surname=m.surname or "-", group_number=m.group_number, role=m.role))
    db.commit(); return {"status": "success"}

@router.post("/issue")
def issue_permit(data: PermitIssueSchema, db: Session = Depends(get_db)):
    p = db.query(WorkPermit).filter(WorkPermit.id == data.permit_id).first()
    if not p: raise HTTPException(status_code=404, detail="Permit not found")
    p.special_instructions = data.special_instructions; p.status = "PENDING_DISPATCHER"; db.commit(); return {"status": "success"}

@router.post("/action")
def apply_permit_action(data: PermitActionSchema, db: Session = Depends(get_db)):
    p = db.query(WorkPermit).filter(WorkPermit.id == data.permit_id).first()
    if not p: raise HTTPException(status_code=404, detail="Permit not found")
    
    uid = data.signature.get("userId") if data.signature else None
    uname = data.signature.get("userName") if data.signature else data.comment # Fallback for some actions
    
    def log_event(action_text, comment=None):
        db.add(PermitEvent(permit_id=p.id, user_id=uid, user_name=uname, action=action_text, comment=comment))

    if data.action == "issuer_sign":
        p.issuer_signature = data.signature
        p.status = "PENDING_DISPATCHER"
        log_event("Наряд-допуск подписан ЭЦП (Выдающий)")
        
    elif data.action == "dispatcher_return":
        p.status = "REWORK"
        db.add(ReturnComment(permit_id=p.id, from_user_id=uid, from_user_name=uname, comment=data.comment, step="dispatcher_to_issuer"))
        log_event("Наряд-допуск возвращён на доработку", data.comment)
        
    elif data.action == "dispatcher_sign":
        p.dispatcher_signature = data.signature
        p.status = "PENDING_ASSISTANT"
        log_event("Разрешение на подготовку рабочих мест подписано ЭЦП (Главный диспетчер)")
        
    elif data.action == "assistant_ack":
        p.dispatcher_assistant_signature = data.signature
        p.status = "PREPARING_WORKPLACES"
        log_event("Получение разрешения подтверждено ЭЦП (Помощник ГД)")
        
    elif data.action == "assistant_ready":
        p.status = "PENDING_ADMITTER"
        log_event("Рабочие места подготовлены и сданы допускающему")
        
    elif data.action == "admitter_return":
        p.status = "RETURNED_TO_ASSISTANT"
        db.add(ReturnComment(permit_id=p.id, from_user_id=uid, from_user_name=uname, comment=data.comment, step="admitter_to_assistant"))
        log_event("Рабочие места возвращены помощнику ГД на доработку", data.comment)
        
    elif data.action == "admitter_sign":
        p.admitter_workplace_signature = data.signature
        p.status = "ADMITTER_CHECKED"
        log_event("Рабочие места проверены допускающим. Подписано ЭЦП.")
        
    elif data.action == "verifier_return":
        p.status = "RETURNED_TO_ADMITTER"
        db.add(ReturnComment(permit_id=p.id, from_user_id=uid, from_user_name=uname, comment=data.comment, step="verifier_to_admitter"))
        log_event("Рабочие места возвращены допускающему", data.comment)
        
    elif data.action == "verifier_approve":
        p.workplace_verifier_signature = data.signature
        p.workplace_verifier_role = data.verifier_role
        p.status = "WORKPLACE_APPROVED"
        log_event(f"Рабочие места одобрены. Подписано ЭЦП ({uname}).")
        
    elif data.action == "briefing_admitter_sign":
        b = db.query(DailyBriefing).filter(DailyBriefing.id == int(data.briefing_id)).first()
        if b:
            b.admitter_signature = data.signature
            p.status = "ADMITTED"
            log_event("Инструктаж проведён, допуск оформлен. Подписано ЭЦП (Допускающий).")
            
    elif data.action == "briefing_responsible_sign":
        b = db.query(DailyBriefing).filter(DailyBriefing.id == int(data.briefing_id)).first()
        if b:
            b.responsible_signature = data.signature
            p.status = "IN_PROGRESS"
            log_event(f"Инструктаж подтверждён ЭЦП ({uname})")
            
    elif data.action == "member_sign":
        b = db.query(DailyBriefing).filter(DailyBriefing.id == int(data.briefing_id)).first()
        if b:
            sigs = b.brigade_signatures or []
            # Check if already signed
            if not any(s.get("userId") == uid for s in sigs):
                sigs.append({"memberId": uid, "memberName": uname, "sig": data.signature})
                b.brigade_signatures = sigs
                log_event(f"Получение инструктажа подтверждено ЭЦП ({uname})")
                
    elif data.action == "end_daily":
        b = db.query(DailyBriefing).filter(DailyBriefing.id == int(data.briefing_id)).first()
        if b:
            b.end_signature = data.signature
            b.end_datetime = datetime.utcnow()
            p.status = "DAILY_ENDED"
            log_event("Ежедневные работы завершены. Подписано ЭЦП.")
            
    elif data.action == "extend":
        p.status = "IN_PROGRESS"
        p.end_time = datetime.fromisoformat(data.new_end_time.replace('Z', '+00:00'))
        db.add(ExtensionRecord(permit_id=p.id, new_end_time=p.end_time, issuer_signature=data.signature))
        log_event("Наряд-допуск продлён. Подписано ЭЦП.")
        
    elif data.action == "foreman_close":
        p.status = "CLOSING" if p.responsible_manager_user_id else "CLOSED"
        p.closure_notify_person = data.comment # Used for notify person in closure
        p.closure_datetime = datetime.utcnow()
        p.foreman_closure_signature = data.signature
        log_event("Закрытие наряда инициировано. Подписано ЭЦП производителем работ.")
        if p.status == "CLOSED":
            log_event("Наряд-допуск закрыт.")
            
    elif data.action == "manager_close":
        p.status = "CLOSED"
        p.manager_closure_signature = data.signature
        log_event("Закрытие подтверждено ЭЦП (Ответственный руководитель). Наряд-допуск закрыт.")
        
    elif data.action == "cancel":
        p.status = "CANCELLED"
        log_event("Наряд-допуск аннулирован", data.comment)

    db.commit()
    return {"status": "success"}

@router.post("/create_briefing")
def create_briefing(data: dict, db: Session = Depends(get_db)):
    pid = data.get("permit_id")
    p = db.query(WorkPermit).filter(WorkPermit.id == pid).first()
    if not p: raise HTTPException(status_code=404, detail="Permit not found")
    
    is_first = len(p.daily_briefings) == 0
    b = DailyBriefing(
        permit_id=pid,
        is_first=is_first,
        work_location=data.get("work_location", ""),
        briefing_date=datetime.utcnow()
    )
    db.add(b)
    db.commit()
    return {"id": b.id, "status": "success"}
