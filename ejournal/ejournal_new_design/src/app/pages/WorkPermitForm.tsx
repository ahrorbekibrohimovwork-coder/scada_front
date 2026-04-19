import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  ChevronLeft, Plus, X, Zap, Users, Shield, Calendar, FileText, Save, Send, AlertCircle, CheckCircle2,
  Building2, MapPin
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useWorkPermit } from '../context/WorkPermitContext';
import { EDSModal } from '../components/EDSModal';
import { SafetyMeasuresTable, SafetyMeasureRow, makeSafetyRow } from '../components/permit/SafetyMeasuresTable';
import { BranchSelectionModal } from '../components/BranchSelectionModal';
import { PersonSelectionModal } from '../components/PersonSelectionModal';
import type { BrigadeMember, EDSSignature } from '../types';


const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:8000';

const GROUPS = ['I', 'II', 'III', 'IV', 'V'];

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

/* Encode SafetyMeasureRow[] → string[] for storage */
const encodeRows = (rows: SafetyMeasureRow[]): string[] =>
  rows
    .filter(r => r.installation.trim() || r.measures.trim())
    .map(r => `${r.installation}\x1F${r.measures}`);

export function WorkPermitForm() {
  const { currentUser } = useAuth();
  const { createPermit, signByIssuer } = useWorkPermit();
  const navigate = useNavigate();

  const now = new Date();
  const [form, setForm] = useState({
    organization: '',
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
    issuerId: '',
  });

  const [officials, setOfficials] = useState<Record<string, any[]>>({
    issuer: [],
    dispatcher: [],
    assistant: [],
    admitter: [],
    manager: [],
    observer: [],
    foreman: [],
    worker: [],
  });
  const [staffLoading, setStaffLoading] = useState(false);
  const [branchModalOpen, setBranchModalOpen] = useState(false);
  const [personModal, setPersonModal] = useState<{ open: boolean, role: string, title: string }>({ 
    open: false, role: '', title: '' 
  });

  const [measureRows, setMeasureRows] = useState<SafetyMeasureRow[]>([
    makeSafetyRow(), makeSafetyRow(), makeSafetyRow(),
  ]);
  const [brigade, setBrigade] = useState<BrigadeMember[]>([]);
  const [section, setSection] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showEDS, setShowEDS] = useState(false);
  const [savedPermitId, setSavedPermitId] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  React.useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    setStaffLoading(true);
    try {
      const endpoints = {
        dispatcher: 'dispetchers',
        dispatcherAssistant: 'dispetcher_assistants',
        admitter: 'admitters',
        manager: 'responsible_managers',
        observer: 'supervisors',
        foreman: 'work_producers',
        worker: 'workers',
      };
      
      const results: Record<string, any[]> = {};
      await Promise.all(Object.entries(endpoints).map(async ([key, path]) => {
        try {
          const r = await fetch(`${API_BASE}/api/${path}`);
          if (r.ok) results[key] = await r.json();
          else results[key] = [];
        } catch (e) {
          results[key] = [];
        }
      }));
      setOfficials(results);
 
      // Fetch issuers from auth/users
      try {
        const resp = await fetch(`${API_BASE}/api/auth/users`);
        if (resp.ok) {
          const users = await resp.json();
          setOfficials(prev => ({
            ...prev,
            issuer: users.filter((u: any) => u.role === 'issuer').map((u: any) => ({
              id: u.id,
              full_name: u.name,
              position: u.position,
              ex_group: u.electricalGroup
            }))
          }));
        }
      } catch (e) {
        console.error('Failed to fetch issuers', e);
      }
    } finally {
      setStaffLoading(false);
    }
  };
 
  const getOfficialItems = (role: string) => {
    return officials[role] || [];
  };

  const set = (k: string, v: string) => {
    setForm(p => ({ ...p, [k]: v }));
    setErrors(p => { const n = { ...p }; delete n[k]; return n; });
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
    if (brigade.find(m => String(m.userId) === String(userId))) return;
    const workersList = officials['worker'] || [];
    const u = workersList.find(u => String(u.id) === String(userId));
    if (!u) return;
    const newMember: BrigadeMember = {
      id: `bm_${Date.now()}`, userId: String(u.id), name: u.full_name || u.name || '',
      group: u.ex_group || u.electricalGroup || '', direction: '', addedAt: new Date().toISOString(), isActive: true,
    };
    setBrigade(p => [...p, newMember]);
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.department.trim()) errs.department = 'Обязательное поле';
    if (!form.task.trim()) errs.task = 'Обязательное поле';
    if (!form.issuerId) errs.issuerId = 'Выберите выдающего наряд-допуск';
    if (!form.dispatcherId) errs.dispatcherId = 'Выберите главного диспетчера';
    if (!form.dispatcherAssistantId) errs.dispatcherAssistantId = 'Выберите помощника ГД';
    if (!form.admitterId) errs.admitterId = 'Выберите допускающего';
    if (!form.foremanId) errs.foremanId = 'Выберите производителя работ';
    if (!form.workStartDateTime) errs.workStartDateTime = 'Укажите дату и время начала';
    if (!form.workEndDateTime) errs.workEndDateTime = 'Укажите дату и время окончания';
    if (form.workEndDateTime && form.workStartDateTime && new Date(form.workEndDateTime) <= new Date(form.workStartDateTime))
      errs.workEndDateTime = 'Дата окончания должна быть позже начала';
    const encoded = encodeRows(measureRows);
    if (encoded.length === 0) errs.measures = 'Заполните хотя бы одну строку таблицы мер';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const buildPermitData = () => ({
    organization: form.organization, department: form.department, task: form.task,
    workStartDateTime: new Date(form.workStartDateTime).toISOString(),
    workEndDateTime: new Date(form.workEndDateTime).toISOString(),
    safetyMeasures: encodeRows(measureRows),
    specialInstructions: form.specialInstructions,
    issuerId: form.issuerId || currentUser!.id,
    dispatcherId: form.dispatcherId,
    dispatcherAssistantId: form.dispatcherAssistantId,
    admitterId: form.admitterId,
    managerId: form.managerId || undefined,
    observerId: form.observerId || undefined,
    foremanId: form.foremanId,
    brigadeMembers: brigade,
  });

  const handleSaveDraft = async () => {
    if (!currentUser) return;
    try {
      const p = await createPermit(buildPermitData());
      navigate(`/permits/${p.id}`);
    } catch (e) {
      console.error(e);
      setErrors({ submit: 'Не удалось сохранить черновик' });
    }
  };

  const handlePrepareSign = async () => {
    if (!validate()) {
      const basicFields = ['department', 'task', 'workStartDateTime', 'workEndDateTime', 'organization'];
      const personnelFields = ['issuerId', 'dispatcherId', 'dispatcherAssistantId', 'admitterId', 'foremanId', 'managerId', 'observerId'];
      
      const errs: Record<string, string> = {};
      if (!form.department.trim()) errs.department = 'Обязательное поле';
      if (!form.task.trim()) errs.task = 'Обязательное поле';
      if (!form.issuerId) errs.issuerId = 'Выберите выдающего наряд-допуск';
      if (!form.dispatcherId) errs.dispatcherId = 'Выберите главного диспетчера';
      if (!form.dispatcherAssistantId) errs.dispatcherAssistantId = 'Выберите помощника ГД';
      if (!form.admitterId) errs.admitterId = 'Выберите допускающего';
      if (!form.foremanId) errs.foremanId = 'Выберите производителя работ';
      if (!form.workStartDateTime) errs.workStartDateTime = 'Укажите дату и время начала';
      if (!form.workEndDateTime) errs.workEndDateTime = 'Укажите дату и время окончания';

      const freshKeys = Object.keys(errs);
      if (freshKeys.some(k => basicFields.includes(k))) {
        setSection(0);
      } else if (freshKeys.some(k => personnelFields.includes(k))) {
        setSection(1);
      } else {
        setSection(3);
      }
      return;
    }
    try {
      const p = await createPermit(buildPermitData());
      setSavedPermitId(p.id);
      setShowEDS(true);
    } catch (e) {
      console.error(e);
      setErrors({ submit: 'Не удалось создать наряд-допуск' });
    }
  };

  const handleSign = async (sig: EDSSignature) => {
    if (savedPermitId) {
      try {
        await signByIssuer(savedPermitId, sig);
        setDone(true);
        setTimeout(() => navigate(`/permits/${savedPermitId}`), 1500);
      } catch (e) {
        console.error(e);
        alert('Ошибка при подписании');
      }
    }
    setShowEDS(false);
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
                <div className="relative">
                  <input 
                    readOnly
                    value={form.organization} 
                    onClick={() => setBranchModalOpen(true)}
                    className={`${inputCls('organization')} cursor-pointer pr-10`} 
                  />
                  <Building2 className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                </div>
              </div>
              <div>
                <label className="text-sm text-slate-700 mb-1 block">Подразделение *</label>
                <div className="relative">
                  <input 
                    readOnly
                    value={form.department} 
                    onClick={() => setBranchModalOpen(true)}
                    placeholder="Выберите подразделение..." 
                    className={`${inputCls('department')} cursor-pointer pr-10`} 
                  />
                  <MapPin size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
                {errors.department && <p className="text-red-500 text-xs mt-1">{errors.department}</p>}
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

            {/* Issuer (Selectable) */}
            <div>
              <div className="mb-1.5">
                <label className="text-sm text-slate-700">① Выдающий наряд-допуск *</label>
                <p className="text-slate-400 text-xs">Отвечает за правильность и безопасность наряда</p>
              </div>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input 
                    readOnly
                    value={(() => {
                      const u = getOfficialItems('issuer').find(i => String(i.id) === String(form.issuerId));
                      return u ? `${u.full_name}${u.ex_group ? ` (Гр. ${u.ex_group})` : ''}` : '';
                    })()}
                    placeholder="Выберите выдающего..."
                    className={`${inputCls('issuerId')} bg-slate-100 cursor-default`}
                  />
                </div>
                <button 
                  type="button"
                  onClick={() => setPersonModal({ 
                    open: true, 
                    role: 'issuer', 
                    title: 'Выдающий наряд-допуск' 
                  })}
                  className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm hover:bg-slate-50 transition-colors shadow-sm font-medium"
                >
                  Выбрать
                </button>
              </div>
              {errors.issuerId && <p className="text-red-500 text-xs mt-1">{errors.issuerId}</p>}
            </div>

            {[
              { key: 'dispatcherId',          label: '② Главный диспетчер',          subtitle: 'Проверяет меры безопасности, выдаёт разрешение на подготовку рабочих мест', req: true  },
              { key: 'dispatcherAssistantId', label: '③ Помощник главного диспетчера', subtitle: 'Получает разрешение, заполняет чек-лист выполненных мер', req: true  },
              { key: 'admitterId',            label: '④ Допускающий',                subtitle: 'Проверяет чек-лист, проводит инструктаж, допускает к работе', req: true  },
              { key: 'managerId',             label: '⑤ Ответственный руководитель', subtitle: 'Необязательно — проверяет рабочие места, подписывает закрытие', req: false },
              { key: 'observerId',            label: '⑥ Наблюдающий',               subtitle: 'Необязательно — надзор за безопасностью', req: false },
              { key: 'foremanId',             label: '⑦ Производитель работ',        subtitle: 'Руководит бригадой, закрывает наряд', req: true  },
            ].map(({ key, label, subtitle, req }) => {
              const role = key.replace('Id', '');
              const selected = getOfficialItems(role).find(u => String(u.id) === String((form as any)[key]));
              return (
                <div key={key}>
                  <div className="mb-1.5">
                    <label className="text-sm text-slate-700">{label} {req && '*'}</label>
                    <p className="text-slate-400 text-xs">{subtitle}</p>
                  </div>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <input 
                        readOnly
                        value={selected ? `${selected.full_name || (selected as any).name}${selected.ex_group || (selected as any).electricalGroup ? ` (Гр. ${selected.ex_group || (selected as any).electricalGroup})` : ''}` : ''}
                        placeholder="Нажмите 'Выбрать' для поиска..."
                        className={`${inputCls(key)} bg-slate-100 cursor-default`}
                      />
                    </div>
                    <button 
                      type="button"
                      onClick={() => setPersonModal({ 
                        open: true, 
                        role: key.replace('Id', ''), 
                        title: label 
                      })}
                      className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm hover:bg-slate-50 transition-colors shadow-sm font-medium"
                    >
                      Выбрать
                    </button>
                  </div>
                  {errors[key] && <p className="text-red-500 text-xs mt-1">{errors[key]}</p>}
                  {selected && (
                    <div className="mt-1.5 flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg">
                      <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center text-xs font-semibold text-slate-700 flex-shrink-0">
                        {(selected.full_name || (selected as any).name || '').split(' ').map((s: string) => s[0]).slice(0, 2).join('')}
                      </div>
                      <div>
                        <p className="text-slate-700 text-xs font-medium">{selected.full_name || (selected as any).name}</p>
                        <p className="text-slate-500 text-xs">{selected.position} · {selected.department || (selected as any).department || '—'}</p>
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
                className="px-3 py-2 border border-slate-200 bg-white rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">+ Добавить из системы</option>
                {(officials['worker'] || []).filter(u => String(u.id) !== String(form.foremanId) && !brigade.find(m => String(m.userId) === String(u.id))).map(u => (
                  <option key={u.id} value={u.id}>{u.full_name || u.name} — Гр. {u.ex_group || u.electricalGroup}</option>
                ))}
              </select>
            </div>

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
                      </div>
                      <div>
                        <label className="text-xs text-slate-500 mb-1 block">Группа ЭБ *</label>
                        <select value={m.group} onChange={e => updateMember(m.id, 'group', e.target.value)}
                          className="w-full px-2.5 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                          {GROUPS.map(g => <option key={g}>{g}</option>)}
                        </select>
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
          </div>
        )}

        {/* ── Section 3: Safety measures ── */}
        {section === 3 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-slate-800 flex items-center gap-2 mb-1">
                <Shield size={18} className="text-blue-600" /> Меры по подготовке рабочих мест
              </h2>
              <p className="text-slate-500 text-sm">
                Заполняется выдающим. Проверяется главным диспетчером.
                Помощник ГД отмечает выполнение каждой меры (чек-лист).
                Допускающий проверяет чек-лист.
              </p>
            </div>

            {errors.measures && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-lg">
                <AlertCircle size={14} className="text-red-500" />
                <span className="text-red-600 text-sm">{errors.measures}</span>
              </div>
            )}

            {/* 2-column table */}
            <SafetyMeasuresTable
              rows={measureRows}
              onChange={setMeasureRows}
              mode="edit"
            />

            {/* Special instructions */}
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <div className="px-3 py-2 bg-slate-50 border-b border-slate-200">
                <label className="text-xs text-slate-600 font-semibold uppercase tracking-wide">
                  Особые указания
                </label>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Дополнительные условия, ограничения и требования безопасности
                </p>
              </div>
              <div className="p-3">
                <textarea
                  value={form.specialInstructions}
                  onChange={e => set('specialInstructions', e.target.value)}
                  rows={4}
                  placeholder="Укажите особые условия выполнения работ, дополнительные меры безопасности, ограничения по времени или погоде, контактные лица и прочее..."
                  className="w-full px-3 py-2 border border-slate-200 rounded text-sm text-slate-900 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 focus:bg-white"
                />
              </div>
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-xs flex items-start gap-2">
              <Shield size={13} className="flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold mb-0.5">Порядок работы с таблицей мер</p>
                <p>Выдающий заполняет обе колонки → ГД проверяет → Пом. ГД заполняет чек-лист (выполнено/не выполнено) → Допускающий проверяет чек-лист и подписывает.</p>
              </div>
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
            <button onClick={() => setSection(s => s + 1)}
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

      {showEDS && currentUser && (
        <EDSModal
          user={currentUser}
          title="Выдача наряда-допуска"
          description="Подписывая данный наряд-допуск, вы подтверждаете корректность всех указанных сведений. После подписания наряд будет направлен главному диспетчеру для выдачи разрешения на подготовку рабочих мест."
          onSign={handleSign}
          onCancel={() => setShowEDS(false)}
        />
      )}

      {branchModalOpen && (
        <BranchSelectionModal 
          onClose={() => setBranchModalOpen(false)}
          onSelect={(org, dept) => {
            set('organization', org);
            set('department', dept);
            setBranchModalOpen(false);
          }}
        />
      )}

      {personModal.open && (
        <PersonSelectionModal
          title={personModal.title}
          items={getOfficialItems(personModal.role)}
          loading={staffLoading}
          onClose={() => setPersonModal({ ...personModal, open: false })}
          onSelect={(id) => {
            if (personModal.role === 'worker') {
              addFromSystem(id);
            } else {
              set(`${personModal.role}Id`, id);
            }
            setPersonModal({ ...personModal, open: false });
          }}
        />
      )}
    </div>
  );
}