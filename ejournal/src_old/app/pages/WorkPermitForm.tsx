import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router';
import {
  ChevronLeft, Plus, X, Zap, Users, Shield, Calendar, FileText, Save, Send, AlertCircle, CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useWorkPermit } from '../context/WorkPermitContext';
import { EDSModal } from '../components/EDSModal';
import type { BrigadeMember, EDSSignature } from '../types';
import { MOCK_USERS } from '../data/mockData';

type LookupItem = { id: string; name: string };
type PersonLookupItem = { id: string; name: string; position?: string; ex_group?: string };

const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:8000';

const GROUPS = ['I', 'II', 'III', 'IV', 'V'];
const DEFAULT_MEASURES = [
  'Отключить выключатель (указать обозначение)',
  'Отключить разъединители (указать обозначения)',
  'Вывесить плакаты «Не включать! Работают люди»',
  'Наложить заземление (указать обозначение)',
  'Проверить отсутствие напряжения указателем',
  'Оградить рабочее место переносными ограждениями',
  'Вывесить плакат «Работа здесь»',
];

const fmtDateTimeInput = (iso: string) => {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toISOString().slice(0, 16);
};

const sectionIcons = [
  { icon: FileText, label: 'Основные\nсведения' },
  { icon: Users,    label: 'Персонал' },
  { icon: Users,    label: 'Бригада' },
  { icon: Shield,   label: 'Меры\nбезопасности' },
];

export function WorkPermitForm() {
  const { currentUser } = useAuth();
  const { createPermit, registerExistingPermit, signByIssuer } = useWorkPermit();
  const navigate = useNavigate();

  const dispatchers  = MOCK_USERS.filter(u => u.role === 'dispatcher');
  const assistants   = MOCK_USERS.filter(u => u.role === 'dispatcher_assistant');
  const admitters    = MOCK_USERS.filter(u => u.role === 'admitter');
  const managers     = MOCK_USERS.filter(u => u.role === 'manager');
  const observers    = MOCK_USERS.filter(u => u.role === 'observer');
  const foremen      = MOCK_USERS.filter(u => u.role === 'foreman');

  const now = new Date();
  const [form, setForm] = useState({
    organization: 'АО «ЭнергоПром»',
    department: '',
    task: '',
    workStartDateTime: fmtDateTimeInput(now.toISOString()),
    workEndDateTime: fmtDateTimeInput(new Date(now.getTime() + 5 * 86400000).toISOString()),
    specialInstructions: '',
    dispatcherId: '',
    dispatcherAssistantId: '',
    admitterId: '',
    managerId: '',
    observerId: '',
    foremanId: '',
  });

  const [measures, setMeasures] = useState<string[]>(['', '', '']);
  const [brigade, setBrigade] = useState<BrigadeMember[]>([]);
  const [section, setSection] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showEDS, setShowEDS] = useState(false);
  const [savedPermitId, setSavedPermitId] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [filials, setFilials] = useState<LookupItem[]>([]);
  const [organizations, setOrganizations] = useState<LookupItem[]>([]);
  const [departments, setDepartments] = useState<LookupItem[]>([]);
  const [selectedFilialId, setSelectedFilialId] = useState('');
  const [selectedOrganizationId, setSelectedOrganizationId] = useState('');
  const [selectedDepartmentId, setSelectedDepartmentId] = useState('');
  const [branchModalOpen, setBranchModalOpen] = useState(true);
  const [branchLoading, setBranchLoading] = useState(false);
  const [branchError, setBranchError] = useState<string | null>(null);
  const [backendDispetchers, setBackendDispetchers] = useState<PersonLookupItem[]>([]);
  const [backendDispetcherAssistants, setBackendDispetcherAssistants] = useState<PersonLookupItem[]>([]);
  const [backendAdmitters, setBackendAdmitters] = useState<PersonLookupItem[]>([]);
  const [backendManagers, setBackendManagers] = useState<PersonLookupItem[]>([]);
  const [backendSupervisors, setBackendSupervisors] = useState<PersonLookupItem[]>([]);
  const [backendWorkProducers, setBackendWorkProducers] = useState<PersonLookupItem[]>([]);
  const [backendWorkers, setBackendWorkers] = useState<PersonLookupItem[]>([]);
  const [workersLoading, setWorkersLoading] = useState(false);
  const [workersError, setWorkersError] = useState<string | null>(null);
  const [personModalOpen, setPersonModalOpen] = useState(false);
  const [personModalRole, setPersonModalRole] = useState('');
  const [personModalTitle, setPersonModalTitle] = useState('');
  const [personModalSearch, setPersonModalSearch] = useState('');

  const allWorkers = useMemo(() =>
    backendWorkers.map(w => ({ ...w, shortName: w.name, electricalGroup: w.ex_group })),
    [backendWorkers]
  );

  const set = (k: string, v: string) => {
    setForm(p => ({ ...p, [k]: v }));
    setErrors(p => { const n = { ...p }; delete n[k]; return n; });
  };

  const setMeasure = (i: number, v: string) => setMeasures(p => p.map((m, idx) => idx === i ? v : m));
  const addMeasure = () => setMeasures(p => [...p, '']);
  const removeMeasure = (i: number) => setMeasures(p => p.filter((_, idx) => idx !== i));

  const getPersonOptions = (key: string): PersonLookupItem[] => {
    const fallback = (users: typeof MOCK_USERS) => users.map(u => ({
      id: u.id,
      name: u.name,
      position: u.position,
      ex_group: u.electricalGroup,
    }));

    switch (key) {
      case 'dispatcherId': return backendDispetchers.length > 0 ? backendDispetchers : fallback(dispatchers);
      case 'dispatcherAssistantId': return backendDispetcherAssistants.length > 0 ? backendDispetcherAssistants : fallback(assistants);
      case 'admitterId': return backendAdmitters.length > 0 ? backendAdmitters : fallback(admitters);
      case 'managerId': return backendManagers.length > 0 ? backendManagers : fallback(managers);
      case 'observerId': return backendSupervisors.length > 0 ? backendSupervisors : fallback(observers);
      case 'foremanId': return backendWorkProducers.length > 0 ? backendWorkProducers : fallback(foremen);
      default: return [];
    }
  };

  const openPersonModal = (key: string, title: string) => {
    setPersonModalRole(key);
    setPersonModalTitle(title);
    setPersonModalSearch('');
    setPersonModalOpen(true);
  };

  const closePersonModal = () => setPersonModalOpen(false);

  const selectPerson = (id: string) => {
    if (personModalRole) set(personModalRole, id);
    closePersonModal();
  };

  const getFilteredPersonOptions = () => {
    const items = getPersonOptions(personModalRole);
    const search = personModalSearch.trim().toLowerCase();
    if (!search) return items;
    return items.filter(item =>
      item.name.toLowerCase().includes(search)
      || (item.position ?? '').toLowerCase().includes(search)
      || (item.ex_group ?? '').toLowerCase().includes(search),
    );
  };

  const fetchFilials = async () => {
    setBranchError(null);
    setBranchLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/filials`);
      if (!response.ok) throw new Error('Failed to load filials');
      const data = await response.json();
      setFilials(data);
    } catch (error) {
      setBranchError('Не удалось загрузить филиалы');
    } finally {
      setBranchLoading(false);
    }
  };

  const fetchOrganizations = async (filialId: string) => {
    if (!filialId) return;
    setBranchError(null);
    setBranchLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/organizations/${filialId}`);
      if (!response.ok) throw new Error('Failed to load organizations');
      const data = await response.json();
      setOrganizations(data);
    } catch (error) {
      setBranchError('Не удалось загрузить организации');
    } finally {
      setBranchLoading(false);
    }
  };

  const fetchDepartments = async () => {
    setBranchError(null);
    setBranchLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/departments`);
      if (!response.ok) throw new Error('Failed to load departments');
      const data = await response.json();
      setDepartments(data);
    } catch (error) {
      setBranchError('Не удалось загрузить подразделения');
    } finally {
      setBranchLoading(false);
    }
  };

  const fetchDispetchers = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/dispetchers`);
      if (response.ok) {
        const data = await response.json();
        setBackendDispetchers(data.map((d: any) => ({ id: String(d.id), name: d.full_name, position: d.position, ex_group: d.ex_group })));
      }
    } catch (error) {
      console.warn('Failed to load dispetchers');
    }
  };

  const fetchDispetcherAssistants = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/dispetcher_assistants`);
      if (response.ok) {
        const data = await response.json();
        setBackendDispetcherAssistants(data.map((d: any) => ({ id: String(d.id), name: d.full_name, position: d.position, ex_group: d.ex_group })));
      }
    } catch (error) {
      console.warn('Failed to load dispetcher assistants');
    }
  };

  const fetchAdmitters = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/admitters`);
      if (response.ok) {
        const data = await response.json();
        setBackendAdmitters(data.map((d: any) => ({ id: String(d.id), name: d.full_name, position: d.position, ex_group: d.ex_group })));
      }
    } catch (error) {
      console.warn('Failed to load admitters');
    }
  };

  const fetchManagers = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/responsible_managers`);
      if (response.ok) {
        const data = await response.json();
        setBackendManagers(data.map((d: any) => ({ id: String(d.id), name: d.full_name, position: d.position, ex_group: d.ex_group })));
      }
    } catch (error) {
      console.warn('Failed to load managers');
    }
  };

  const fetchSupervisors = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/supervisors`);
      if (response.ok) {
        const data = await response.json();
        setBackendSupervisors(data.map((d: any) => ({ id: String(d.id), name: d.full_name, position: d.position, ex_group: d.ex_group })));
      }
    } catch (error) {
      console.warn('Failed to load supervisors');
    }
  };

  const fetchWorkProducers = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/work_producers`);
      if (response.ok) {
        const data = await response.json();
        setBackendWorkProducers(data.map((d: any) => ({ id: String(d.id), name: d.full_name, position: d.position, ex_group: d.ex_group })));
      }
    } catch (error) {
      console.warn('Failed to load work producers');
    }
  };

  const fetchWorkers = async () => {
    setWorkersLoading(true);
    setWorkersError(null);
    try {
      const response = await fetch(`${API_BASE}/api/workers`);
      if (!response.ok) {
        throw new Error(`Workers request failed: ${response.status}`);
      }
      const data = await response.json();
      setBackendWorkers(data.map((d: any) => ({ id: String(d.id), name: d.full_name, position: d.position, ex_group: d.ex_group })));
    } catch (error) {
      setBackendWorkers([]);
      setWorkersError('Не удалось загрузить работников с сервера');
      console.warn('Failed to load workers', error);
    } finally {
      setWorkersLoading(false);
    }
  };

  useEffect(() => {
    if (!branchModalOpen) return;
    fetchFilials();
    fetchDepartments();
  }, [branchModalOpen]);

  useEffect(() => {
    // Load staff data on component mount
    fetchDispetchers();
    fetchDispetcherAssistants();
    fetchAdmitters();
    fetchManagers();
    fetchSupervisors();
    fetchWorkProducers();
  }, []);

  useEffect(() => {
    if (section !== 2) return;
    if (workersLoading || backendWorkers.length > 0) return;
    void fetchWorkers();
  }, [section, workersLoading, backendWorkers.length]);

  const handleFilialSelect = async (filialId: string) => {
    setSelectedFilialId(filialId);
    setSelectedOrganizationId('');
    setSelectedDepartmentId('');
    setOrganizations([]);
    if (filialId) await fetchOrganizations(filialId);
  };

  const handleConfirmBranchSelection = () => {
    const chosenOrganization = organizations.find(o => o.id === selectedOrganizationId);
    const chosenDepartment = departments.find(d => d.id === selectedDepartmentId);
    if (!selectedFilialId || !chosenOrganization || !chosenDepartment) return;
    set('organization', chosenOrganization.name);
    set('department', chosenDepartment.name);
    setBranchModalOpen(false);
  };

  const addBrigadeMember = () => {
    const newMember: BrigadeMember = {
      id: `bm_new_${Date.now()}`, name: '', group: 'III', direction: '', addedAt: new Date().toISOString(), isActive: true,
    };
    setBrigade(p => [...p, newMember]);
  };
  const updateMember = (id: string, key: keyof BrigadeMember, val: string) =>
    setBrigade(p => p.map(m => m.id === id ? { ...m, [key]: val } : m));
  const removeMember = (id: string) => setBrigade(p => p.filter(m => m.id !== id));

  const addFromSystem = (userId: string) => {
    if (brigade.find(m => m.userId === userId)) return;
    const u = backendWorkers.find(u => u.id === userId) || MOCK_USERS.find(u => u.id === userId);
    if (!u) return;
    const newMember: BrigadeMember = {
      id: `bm_${Date.now()}`, userId: u.id, name: u.name,
      group: u.ex_group || 'III', direction: '', addedAt: new Date().toISOString(), isActive: true,
    };
    setBrigade(p => [...p, newMember]);
  };

  const saveBrigadeMembers = async () => {
    const secErrs: Record<string, string> = {};

    if (!savedPermitId) secErrs.section2 = 'Сначала сохраните основные сведения и ответственных лиц';
    if (brigade.length === 0) secErrs.section2 = 'Добавьте хотя бы одного члена бригады';

    brigade.forEach((member, index) => {
      if (!member.name.trim()) secErrs[`brigade_name_${member.id}`] = `Укажите ФИО для участника #${index + 1}`;
      if (!member.group.trim()) secErrs[`brigade_group_${member.id}`] = `Укажите группу ЭБ для участника #${index + 1}`;
    });

    if (Object.keys(secErrs).length > 0) {
      setErrors(prev => ({ ...prev, ...secErrs }));
      return false;
    }

    try {
      const response = await fetch(`${API_BASE}/api/permits/brigade`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          permit_id: Number(savedPermitId),
          members: brigade.map(member => ({
            name: member.name.trim(),
            role: member.direction.trim() || undefined,
            group_number: member.group.trim(),
          })),
        }),
      });

      if (!response.ok) {
        const err = await response.text();
        throw new Error(err || 'Failed to save brigade');
      }

      setErrors(prev => {
        const next = { ...prev };
        delete next.section2;
        return next;
      });
      return true;
    } catch (error) {
      setErrors(prev => ({ ...prev, section2: 'Ошибка при сохранении состава бригады: ' + String(error) }));
      return false;
    }
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.department.trim()) errs.department = 'Обязательное поле';
    if (!form.task.trim()) errs.task = 'Обязательное поле';
    if (!form.dispatcherId) errs.dispatcherId = 'Выберите главного диспетчера';
    if (!form.dispatcherAssistantId) errs.dispatcherAssistantId = 'Выберите помощника ГД';
    if (!form.admitterId) errs.admitterId = 'Выберите допускающего';
    if (!form.foremanId) errs.foremanId = 'Выберите производителя работ';
    if (!form.workStartDateTime) errs.workStartDateTime = 'Укажите дату и время начала';
    if (!form.workEndDateTime) errs.workEndDateTime = 'Укажите дату и время окончания';
    if (form.workEndDateTime && form.workStartDateTime && new Date(form.workEndDateTime) <= new Date(form.workStartDateTime))
      errs.workEndDateTime = 'Дата окончания должна быть позже начала';
    if (measures.filter(m => m.trim()).length === 0) errs.measures = 'Укажите хотя бы одну меру';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNextSection0 = async () => {
    const secErrs: Record<string, string> = {};
    if (!form.department.trim()) secErrs.department = 'Обязательное поле';
    if (!form.task.trim()) secErrs.task = 'Обязательное поле';
    if (!form.workStartDateTime) secErrs.workStartDateTime = 'Укажите дату и время начала';
    if (!form.workEndDateTime) secErrs.workEndDateTime = 'Укажите дату и время окончания';
    if (form.workEndDateTime && form.workStartDateTime && new Date(form.workEndDateTime) <= new Date(form.workStartDateTime))
      secErrs.workEndDateTime = 'Дата окончания должна быть позже начала';
    
    if (Object.keys(secErrs).length > 0) {
      setErrors(secErrs);
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/api/permits/init`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organization: form.organization,
          department: form.department,
          start_time: new Date(form.workStartDateTime).toISOString(),
          end_time: new Date(form.workEndDateTime).toISOString(),
          work_description: form.task,
        }),
      });
      if (!response.ok) throw new Error('Failed to init permit');
      const data = await response.json();
      setSavedPermitId(String(data.permit_id));
      setSection(1);
    } catch (error) {
      setErrors(prev => ({ ...prev, section0: 'Ошибка при создании наряда: ' + String(error) }));
    }
  };

  const handleNextSection1 = async () => {
    const requiredFields = ['dispatcherId', 'dispatcherAssistantId', 'admitterId', 'foremanId'];
    const secErrs: Record<string, string> = {};

    requiredFields.forEach((field) => {
      if (!(form as any)[field]) {
        secErrs[field] = 'Обязательное поле';
      }
    });

    if (Object.keys(secErrs).length > 0) {
      setErrors(secErrs);
      return;
    }

    if (!savedPermitId) {
      setErrors(prev => ({ ...prev, section1: 'Сначала сохраните основные сведения' }));
      return;
    }

    const findPersonName = (key: string) => getPersonOptions(key).find(u => u.id === (form as any)[key])?.name || '';

    try {
      const response = await fetch(`${API_BASE}/api/permits/update_officials`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          permit_id: Number(savedPermitId),
          responsible_manager: findPersonName('managerId'),
          admitting: findPersonName('admitterId'),
          work_producer: findPersonName('foremanId'),
          supervisor: findPersonName('observerId'),
          dispetcher: findPersonName('dispatcherId'),
          dispetcher_assistant: findPersonName('dispatcherAssistantId'),
        }),
      });
      if (!response.ok) {
        const err = await response.text();
        throw new Error(err || 'Failed to save officials');
      }
      setSection(2);
    } catch (error) {
      setErrors(prev => ({ ...prev, section1: 'Ошибка при сохранении ответственных лиц: ' + String(error) }));
    }
  };

  const handleSaveDraft = async () => {
    if (!currentUser) return;
    const p = await createPermit({
      organization: form.organization, department: form.department, task: form.task,
      workStartDateTime: form.workStartDateTime,
      workEndDateTime: form.workEndDateTime,
      safetyMeasures: measures.filter(m => m.trim()),
      specialInstructions: form.specialInstructions,
      issuerId: currentUser.id,
      dispatcherId: form.dispatcherId,
      dispatcherAssistantId: form.dispatcherAssistantId,
      admitterId: form.admitterId,
      managerId: form.managerId || undefined,
      observerId: form.observerId || undefined,
      foremanId: form.foremanId,
      brigadeMembers: brigade,
    });
    navigate(`/permits/${p.id}`);
  };

  const handlePrepareSign = async () => {
    if (!validate()) { setSection(0); return; }
    if (!savedPermitId) {
      const p = await createPermit({
        organization: form.organization, department: form.department, task: form.task,
        workStartDateTime: form.workStartDateTime,
        workEndDateTime: form.workEndDateTime,
        safetyMeasures: measures.filter(m => m.trim()),
        specialInstructions: form.specialInstructions,
        issuerId: currentUser!.id,
        dispatcherId: form.dispatcherId,
        dispatcherAssistantId: form.dispatcherAssistantId,
        admitterId: form.admitterId,
        managerId: form.managerId || undefined,
        observerId: form.observerId || undefined,
        foremanId: form.foremanId,
        brigadeMembers: brigade,
      });
      setSavedPermitId(p.id);
    }
    setShowEDS(true);
  };

  const handleSign = async (sig: EDSSignature) => {
    if (!savedPermitId || !currentUser) {
      setShowEDS(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/api/permits/issue`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          permit_id: Number(savedPermitId),
          special_instructions: form.specialInstructions,
        }),
      });

      if (!response.ok) {
        const err = await response.text();
        throw new Error(err || 'Failed to issue permit');
      }

      registerExistingPermit(savedPermitId, {
        organization: form.organization,
        department: form.department,
        task: form.task,
        workStartDateTime: form.workStartDateTime,
        workEndDateTime: form.workEndDateTime,
        safetyMeasures: measures.filter(m => m.trim()),
        specialInstructions: form.specialInstructions,
        issuerId: currentUser.id,
        dispatcherId: form.dispatcherId,
        dispatcherAssistantId: form.dispatcherAssistantId,
        admitterId: form.admitterId,
        managerId: form.managerId || undefined,
        observerId: form.observerId || undefined,
        foremanId: form.foremanId,
        brigadeMembers: brigade,
      });

      signByIssuer(savedPermitId, sig);
      setDone(true);
      setTimeout(() => navigate(`/permits/${savedPermitId}`), 1500);
    } catch (error) {
      setErrors(prev => ({ ...prev, issue: 'Ошибка при выдаче наряда: ' + String(error) }));
    } finally {
      setShowEDS(false);
    }
  };

  const inputCls = (f: string) =>
    `w-full px-3 py-2.5 border rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
      errors[f] ? 'border-red-300 bg-red-50' : 'border-slate-200 bg-slate-50 focus:bg-white'
    }`;

  if (done) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl border border-slate-200 p-10 max-w-md w-full mx-4 text-center">
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 size={32} className="text-green-600" />
        </div>
        <h2 className="text-slate-900 mb-2">Наряд-допуск выдан!</h2>
        <p className="text-slate-500 text-sm">Подписан ЭЦП. Направлен главному диспетчеру. Перенаправление...</p>
      </div>
    </div>
  );

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="p-2 rounded-lg hover:bg-slate-100 text-slate-500">
          <ChevronLeft size={20} />
        </button>
        <div>
          <h1 className="text-slate-900">Оформление наряда-допуска</h1>
          <p className="text-slate-500 text-sm mt-0.5">Электротехнические работы · ПТЭЭП, ПОТЭУ · Номер присваивается автоматически</p>
        </div>
      </div>

      {/* Steps */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl mb-6 overflow-x-auto">
        {sectionIcons.map((s, i) => (
          <button key={i} onClick={() => setSection(i)}
            className={`flex-1 min-w-0 flex flex-col items-center justify-center gap-1 px-2 py-2 rounded-lg text-xs transition-all ${
              section === i ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}>
            <s.icon size={14} />
            <span className="hidden sm:block text-center leading-tight whitespace-pre-line">{s.label}</span>
            <span className="sm:hidden font-medium">{i + 1}</span>
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6 mb-5">
        {/* ── Section 0: Basic info ── */}
        {section === 0 && (
          <div className="space-y-4">
            <h2 className="text-slate-800 flex items-center gap-2 mb-5">
              <FileText size={18} className="text-blue-600" /> Основные сведения о работах
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-slate-700 mb-1 block">Организация *</label>
                <input value={form.organization} onChange={e => set('organization', e.target.value)}
                  className={inputCls('organization')} readOnly={!branchModalOpen && !!form.organization} />
              </div>
              <div>
                <label className="text-sm text-slate-700 mb-1 block">Подразделение *</label>
                <input value={form.department} onChange={e => set('department', e.target.value)}
                  placeholder="Цех, отдел, участок" className={inputCls('department')} readOnly={!branchModalOpen && !!form.department} />
                {errors.department && <p className="text-red-500 text-xs mt-1">{errors.department}</p>}
                {!branchModalOpen && form.organization && form.department && (
                  <p className="text-slate-500 text-xs mt-2">
                    Выбрано: <span className="font-medium">{form.organization}</span>, подразделение <span className="font-medium">{form.department}</span>.{' '}
                    <button type="button" onClick={() => setBranchModalOpen(true)} className="text-blue-600 hover:underline">Изменить выбор</button>
                  </p>
                )}
              </div>
            </div>

            <div>
              <label className="text-sm text-slate-700 mb-1 block">Поручается (наименование работ) *</label>
              <textarea value={form.task} onChange={e => set('task', e.target.value)} rows={3} placeholder="Подробное описание поручаемых работ..."
                className={`${inputCls('task')} resize-none`} />
              {errors.task && <p className="text-red-500 text-xs mt-1">{errors.task}</p>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-slate-700 mb-1 flex items-center gap-1.5 block">
                  <Calendar size={13} /> Начало работ (дата и время) *
                </label>
                <input type="datetime-local" value={form.workStartDateTime} onChange={e => set('workStartDateTime', e.target.value)}
                  className={inputCls('workStartDateTime')} />
                {errors.workStartDateTime && <p className="text-red-500 text-xs mt-1">{errors.workStartDateTime}</p>}
              </div>
              <div>
                <label className="text-sm text-slate-700 mb-1 flex items-center gap-1.5 block">
                  <Calendar size={13} /> Окончание работ (дата и время) *
                </label>
                <input type="datetime-local" value={form.workEndDateTime} onChange={e => set('workEndDateTime', e.target.value)}
                  min={form.workStartDateTime} className={inputCls('workEndDateTime')} />
                {errors.workEndDateTime && <p className="text-red-500 text-xs mt-1">{errors.workEndDateTime}</p>}
              </div>
            </div>
            <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg text-blue-700 text-xs">
              Продление наряда возможно на срок не более 15 дней от даты окончания. Инициирует производитель работ.
            </div>
          </div>
        )}

        {/* ── Section 1: Personnel ── */}
        {section === 1 && (
          <div className="space-y-4">
            <h2 className="text-slate-800 flex items-center gap-2 mb-5">
              <Users size={18} className="text-blue-600" /> Назначение ответственного персонала
            </h2>

            {/* Issuer (readonly) */}
            <div className="p-4 bg-purple-50 border border-purple-200 rounded-xl">
              <p className="text-purple-600 text-xs font-semibold uppercase tracking-wide mb-2">① Выдающий наряд-допуск</p>
              <p className="text-slate-800 text-sm font-medium">{currentUser?.name}</p>
              <p className="text-slate-500 text-xs mt-0.5">{currentUser?.position} · Группа ЭБ {currentUser?.electricalGroup}</p>
              <p className="text-purple-500 text-xs mt-1">Подписывается ЭЦП при выдаче</p>
            </div>

            {[
              { key: 'dispatcherId',          label: '② Главный диспетчер',          subtitle: 'Выдаёт разрешение на подготовку рабочих мест', users: getPersonOptions('dispatcherId'),  req: true  },
              { key: 'dispatcherAssistantId', label: '③ Помощник главного диспетчера', subtitle: 'Подготавливает рабочие места', users: getPersonOptions('dispatcherAssistantId'),  req: true  },
              { key: 'admitterId',            label: '④ Допускающий',                subtitle: 'Проверяет рабочие места, проводит инструктаж', users: getPersonOptions('admitterId'),   req: true  },
              { key: 'managerId',             label: '⑤ Ответственный руководитель', subtitle: 'Необязательно — проверяет рабочие места, подписывает закрытие', users: getPersonOptions('managerId'), req: false },
              { key: 'observerId',            label: '⑥ Наблюдающий',               subtitle: 'Необязательно — надзор за безопасностью', users: getPersonOptions('observerId'),   req: false },
              { key: 'foremanId',             label: '⑦ Производитель работ',        subtitle: 'Руководит бригадой, закрывает наряд', users: getPersonOptions('foremanId'),     req: true  },
            ].map(({ key, label, subtitle, users, req }) => {
              const selected = users.find(u => u.id === (form as any)[key]);
              return (
                <div key={key}>
                  <div className="mb-1.5">
                    <label className="text-sm text-slate-700">{label} {req && '*'}</label>
                    <p className="text-slate-400 text-xs">{subtitle}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <select value={(form as any)[key]} onChange={e => set(key, e.target.value)}
                      className={`${inputCls(key)} appearance-none flex-1`}>
                      {!req && <option value="">— Не назначается —</option>}
                      {users.map(u => (
                        <option key={u.id} value={u.id}>
                          {u.name}{u.position ? ` — ${u.position}` : ''}{u.ex_group ? ` (Гр. ЭБ ${u.ex_group})` : ''}
                        </option>
                      ))}
                    </select>
                    <button type="button" onClick={() => openPersonModal(key, label)}
                      className="px-3 py-2 text-sm rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100">
                      Выбрать
                    </button>
                  </div>
                  {errors[key] && <p className="text-red-500 text-xs mt-1">{errors[key]}</p>}
                  {selected && (
                    <div className="mt-1.5 flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg">
                      <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center text-xs font-semibold text-slate-700 flex-shrink-0">
                        {selected.name.split(' ').map(s => s[0]).slice(0, 2).join('')}
                      </div>
                      <div>
                        <p className="text-slate-700 text-xs font-medium">{selected.name}</p>
                        {(selected as any).position && (
                          <p className="text-slate-500 text-xs">
                            {(selected as any).position}{(selected as any).ex_group ? ` · Гр. ЭБ ${(selected as any).ex_group}` : ''}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ── Section 2: Brigade ── */}
        {section === 2 && (
          <div className="space-y-4">
            <h2 className="text-slate-800 flex items-center gap-2 mb-5">
              <Users size={18} className="text-blue-600" /> Состав бригады
            </h2>
            <p className="text-slate-500 text-sm">Укажите всех членов бригады, их группу по электробезопасности и направление работ.</p>

            <div className="flex gap-2 flex-wrap">
              <button onClick={addBrigadeMember}
                className="flex items-center gap-1.5 px-3 py-2 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-sm hover:bg-blue-100 transition-colors">
                <Plus size={14} /> Добавить вручную
              </button>
              <select defaultValue="" onChange={e => { if (e.target.value) { addFromSystem(e.target.value); e.target.value = ''; }}}
                disabled={workersLoading || allWorkers.length === 0}
                className="px-3 py-2 border border-slate-200 bg-white rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">+ Добавить из системы</option>
                {allWorkers.filter(u => u.id !== form.foremanId && !brigade.find(m => m.userId === u.id)).map(u => (
                  <option key={u.id} value={u.id}>{u.shortName} — Гр. {u.electricalGroup}</option>
                ))}
              </select>
            </div>
            {workersError && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-lg">
                <AlertCircle size={14} className="text-red-500" />
                <span className="text-red-600 text-sm">{workersError}</span>
              </div>
            )}
            {!workersLoading && !workersError && allWorkers.length === 0 && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
                Сервер не вернул работников для выбора.
              </div>
            )}

            {brigade.length === 0 ? (
              <div className="py-10 border-2 border-dashed border-slate-200 rounded-xl text-center text-slate-400">
                <Users size={32} className="mx-auto mb-2 opacity-40" />
                <p className="text-sm">Добавьте членов бригады</p>
              </div>
            ) : (
              <div className="space-y-3">
                {brigade.map((m, i) => (
                  <div key={m.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-slate-500 text-xs font-medium">Член бригады #{i + 1}</span>
                      <button onClick={() => removeMember(m.id)} className="text-slate-400 hover:text-red-500 transition-colors">
                        <X size={15} />
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div className="sm:col-span-1">
                        <label className="text-xs text-slate-500 mb-1 block">Ф.И.О. *</label>
                        <input value={m.name} onChange={e => updateMember(m.id, 'name', e.target.value)}
                          placeholder="Фамилия И.О." disabled={!!m.userId}
                          className="w-full px-2.5 py-2 border border-slate-200 rounded-lg text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100" />
                        {errors[`brigade_name_${m.id}`] && <p className="text-red-500 text-xs mt-1">{errors[`brigade_name_${m.id}`]}</p>}
                      </div>
                      <div>
                        <label className="text-xs text-slate-500 mb-1 block">Группа ЭБ *</label>
                        <select value={m.group} onChange={e => updateMember(m.id, 'group', e.target.value)}
                          className="w-full px-2.5 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                          {GROUPS.map(g => <option key={g}>{g}</option>)}
                        </select>
                        {errors[`brigade_group_${m.id}`] && <p className="text-red-500 text-xs mt-1">{errors[`brigade_group_${m.id}`]}</p>}
                      </div>
                      <div>
                        <label className="text-xs text-slate-500 mb-1 block">Направление *</label>
                        <input value={m.direction} onChange={e => updateMember(m.id, 'direction', e.target.value)}
                          placeholder="Напр. работ" className="w-full px-2.5 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-500 text-xs">
              Итого в бригаде: {brigade.length} чел. (без учёта производителя работ).
              Изменение состава &gt;50% требует закрытия наряда.
            </div>
            {errors.section2 && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-lg">
                <AlertCircle size={14} className="text-red-500" />
                <span className="text-red-600 text-sm">{errors.section2}</span>
              </div>
            )}
          </div>
        )}

        {/* ── Section 3: Safety measures ── */}
        {section === 3 && (
          <div className="space-y-4">
            <h2 className="text-slate-800 flex items-center gap-2 mb-5">
              <Shield size={18} className="text-blue-600" /> Меры по подготовке рабочих мест
            </h2>
            <p className="text-slate-500 text-sm">Меры безопасности, которые должен выполнить помощник главного диспетчера для подготовки рабочих мест.</p>

            <div>
              <p className="text-sm text-slate-600 mb-2">Типовые меры (быстрое добавление):</p>
              <div className="flex flex-wrap gap-2">
                {DEFAULT_MEASURES.map(m => (
                  <button key={m} onClick={() => {
                    const emptyIdx = measures.findIndex(sm => !sm.trim());
                    if (emptyIdx >= 0) setMeasure(emptyIdx, m);
                    else addMeasure(), setTimeout(() => setMeasures(p => {
                      const n = [...p]; n[n.length - 1] = m; return n;
                    }), 0);
                  }} className="text-xs px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors">
                    + {m.slice(0, 42)}{m.length > 42 ? '…' : ''}
                  </button>
                ))}
              </div>
            </div>

            {errors.measures && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-lg">
                <AlertCircle size={14} className="text-red-500" />
                <span className="text-red-600 text-sm">{errors.measures}</span>
              </div>
            )}

            <div className="space-y-2">
              {measures.map((m, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-500 text-xs flex items-center justify-center flex-shrink-0">{i + 1}</span>
                  <input value={m} onChange={e => setMeasure(i, e.target.value)} placeholder={`Мера безопасности ${i + 1}`}
                    className="flex-1 px-3 py-2 border border-slate-200 bg-slate-50 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  <button onClick={() => removeMeasure(i)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
            <button onClick={addMeasure}
              className="flex items-center gap-2 px-4 py-2 border-2 border-dashed border-slate-300 hover:border-blue-400 text-slate-500 hover:text-blue-600 rounded-lg w-full justify-center text-sm transition-colors">
              <Plus size={15} /> Добавить меру
            </button>

            <div>
              <label className="text-sm text-slate-700 mb-1.5 block">Особые указания</label>
              <textarea value={form.specialInstructions} onChange={e => set('specialInstructions', e.target.value)} rows={3}
                placeholder="Особые условия, дополнительные требования безопасности..." className={`${inputCls('specialInstructions')} resize-none`} />
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex gap-2 w-full sm:w-auto">
          {section > 0 && (
            <button onClick={() => setSection(s => s - 1)}
              className="flex-1 sm:flex-none px-4 py-2.5 border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg text-sm">
              ← Назад
            </button>
          )}
          {section < 3 && (
            <button onClick={async () => {
                if (section === 0) return handleNextSection0();
                if (section === 1) return handleNextSection1();
                if (section === 2) {
                  const saved = await saveBrigadeMembers();
                  if (!saved) return;
                }
                return setSection(s => s + 1);
              }}
              className="flex-1 sm:flex-none px-4 py-2.5 bg-slate-700 hover:bg-slate-800 text-white rounded-lg text-sm">
              Далее →
            </button>
          )}
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button onClick={handleSaveDraft}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg text-sm">
            <Save size={15} /> Сохранить черновик
          </button>
          <button onClick={handlePrepareSign}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-sm">
            <Send size={15} /> Подписать ЭЦП и выдать
          </button>
        </div>
      </div>

      {branchModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden">
            <div className="p-6">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">Выберите филиал, организацию и подразделение</h2>
                  <p className="text-slate-500 text-sm mt-1">Список берётся с сервера. Этот выбор используется для оформления наряда.</p>
                </div>
                <button onClick={() => navigate(-1)} className="text-slate-500 hover:text-slate-700">
                  <X size={20} />
                </button>
              </div>

              {branchError && <div className="mb-4 rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700">{branchError}</div>}

              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label className="text-sm text-slate-700 mb-1 block">Филиал</label>
                  <select value={selectedFilialId} onChange={e => handleFilialSelect(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg text-sm border-slate-200 bg-white">
                    <option value="">— Выберите филиал —</option>
                    {filials.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-sm text-slate-700 mb-1 block">Организация</label>
                  <select value={selectedOrganizationId} onChange={e => setSelectedOrganizationId(e.target.value)}
                    disabled={!selectedFilialId || organizations.length === 0}
                    className="w-full px-3 py-2 border rounded-lg text-sm border-slate-200 bg-white disabled:bg-slate-100">
                    <option value="">— Выберите организацию —</option>
                    {organizations.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-sm text-slate-700 mb-1 block">Подразделение</label>
                  <select value={selectedDepartmentId} onChange={e => setSelectedDepartmentId(e.target.value)}
                    disabled={!selectedOrganizationId || departments.length === 0}
                    className="w-full px-3 py-2 border rounded-lg text-sm border-slate-200 bg-white disabled:bg-slate-100">
                    <option value="">— Выберите подразделение —</option>
                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
                <button onClick={() => navigate(-1)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 transition-colors">
                  Отмена
                </button>
                <button onClick={handleConfirmBranchSelection}
                  disabled={!selectedFilialId || !selectedOrganizationId || !selectedDepartmentId || branchLoading}
                  className="px-4 py-2 rounded-lg text-white bg-slate-800 disabled:bg-slate-300 disabled:text-slate-500 hover:bg-slate-900 transition-colors">
                  {branchLoading ? 'Загрузка...' : 'Продолжить'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {personModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden">
            <div className="p-6">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">Выберите {personModalTitle}</h2>
                  <p className="text-slate-500 text-sm mt-1">Список берётся с сервера. Можно искать по ФИО, должности или группе ЭБ.</p>
                </div>
                <button onClick={closePersonModal} className="text-slate-500 hover:text-slate-700">
                  <X size={20} />
                </button>
              </div>

              <div className="mb-4">
                <input value={personModalSearch} onChange={e => setPersonModalSearch(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Поиск по ФИО, должности или группе ЭБ" />
              </div>

              <div className="max-h-80 overflow-y-auto space-y-2">
                {getFilteredPersonOptions().length === 0 ? (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-6 text-center text-slate-500">
                    Сотрудники не найдены
                  </div>
                ) : getFilteredPersonOptions().map(item => (
                  <button key={item.id} type="button" onClick={() => selectPerson(item.id)}
                    className="w-full text-left px-4 py-3 border border-slate-200 rounded-2xl hover:border-blue-300 hover:bg-blue-50 transition-colors">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-slate-900 font-medium">{item.name}</p>
                        <p className="text-slate-500 text-sm">
                          {item.position ?? 'Должность не указана'}{item.ex_group ? ` · Гр. ЭБ ${item.ex_group}` : ''}
                        </p>
                      </div>
                      <span className="text-sm text-blue-600">Выбрать</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {showEDS && currentUser && (
        <EDSModal
          user={currentUser}
          title="Выдача наряда-допуска"
          description="Подписывая данный наряд-допуск, вы подтверждаете корректность всех указанных сведений. После подписания наряд будет направлен главному диспетчеру для выдачи разрешения на подготовку рабочих мест."
          onSign={handleSign}
          onCancel={() => setShowEDS(false)}
          signLabel="Подписать и выдать наряд"
        />
      )}
    </div>
  );
}
