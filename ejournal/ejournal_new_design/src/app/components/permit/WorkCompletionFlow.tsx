import React, { useState } from 'react';
import { CheckCircle2, XCircle, ChevronRight, AlertTriangle, Users, Clock, RefreshCw, X, Plus } from 'lucide-react';
import type { BrigadeMember } from '../../types';

interface Props {
  workEndDateTime: string;
  brigadeMembers: BrigadeMember[];
  managerId?: string;
  observerId?: string;
  hasExtensions: boolean;
  onClose: () => void;
  onExtend: () => void;
  onInitiateClosure: () => void;
  onUpdateBrigade: (members: BrigadeMember[]) => void;
}

type Step = 'work_done' | 'on_time' | 'changes' | 'brigade_changes' | 'brigade_pct' | 'brigade_edit' | 'done_continue';

const GROUPS = ['I', 'II', 'III', 'IV', 'V'];

export function WorkCompletionFlow({
  workEndDateTime, brigadeMembers, managerId, observerId,
  hasExtensions, onClose, onExtend, onInitiateClosure, onUpdateBrigade,
}: Props) {
  const [step, setStep] = useState<Step>('work_done');
  const [editMembers, setEditMembers] = useState<BrigadeMember[]>(brigadeMembers.filter(m => m.isActive));
  const isOverdue = new Date(workEndDateTime) < new Date();

  const activeCount = brigadeMembers.filter(m => m.isActive).length;

  const addMember = () => setEditMembers(prev => [
    ...prev,
    { id: `bm_new_${Date.now()}`, name: '', group: 'III', direction: '', addedAt: new Date().toISOString(), isActive: true },
  ]);

  const removeMember = (id: string) => {
    const updated = editMembers.map(m => m.id === id ? { ...m, isActive: false, removedAt: new Date().toISOString() } : m);
    const changedCount = updated.filter(m => !m.isActive).length + editMembers.filter(m => !brigadeMembers.find(o => o.id === m.id)).length;
    if (activeCount > 0 && changedCount / activeCount > 0.5) {
      onInitiateClosure();
    } else {
      setEditMembers(updated);
    }
  };

  const saveBrigade = () => {
    onUpdateBrigade(editMembers);
    onClose();
  };

  const steps: { key: Step; label: string }[] = [
    { key: 'work_done', label: 'Работы завершены?' },
    { key: 'on_time', label: 'Выполнены в срок?' },
    { key: 'changes', label: 'Есть изменения?' },
    { key: 'brigade_changes', label: 'Изменения в бригаде?' },
    { key: 'brigade_pct', label: 'Изменение >50%?' },
    { key: 'brigade_edit', label: 'Изменение состава' },
  ];

  const stepIdx = steps.findIndex(s => s.key === step);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-lg w-full border border-gray-200 overflow-hidden max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="px-5 py-4 bg-gray-900 flex items-center justify-between">
          <div>
            <p className="text-white text-sm font-semibold">Проверка завершения работ</p>
            <p className="text-white/50 text-xs mt-0.5">Шаг {Math.min(stepIdx + 1, steps.length)} из {steps.length}</p>
          </div>
          <button onClick={onClose} className="text-white/50 hover:text-white"><X size={16} /></button>
        </div>

        {/* Progress */}
        <div className="flex bg-gray-100 border-b border-gray-200">
          {steps.slice(0, 4).map((s, i) => (
            <div key={s.key} className={`flex-1 h-1 ${i <= stepIdx ? 'bg-gray-900' : 'bg-gray-200'} transition-all`} />
          ))}
        </div>

        <div className="p-6">
          {/* Step 1: Work done? */}
          {step === 'work_done' && (
            <div>
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle2 size={16} className="text-gray-700" />
                <h4 className="text-gray-900 font-semibold">Работы завершены полностью?</h4>
              </div>
              <p className="text-gray-500 text-sm mb-6 pl-6">Бригада выведена с рабочего места, заземления сняты</p>
              <div className="grid grid-cols-2 gap-3">
                <button onClick={onInitiateClosure}
                  className="flex items-center justify-center gap-2 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-medium transition-colors">
                  <CheckCircle2 size={16} /> Да, завершены
                </button>
                <button onClick={() => setStep('on_time')}
                  className="flex items-center justify-center gap-2 py-3 border border-gray-300 text-gray-700 rounded font-medium hover:bg-gray-50 transition-colors">
                  <ChevronRight size={16} /> Нет, продолжаются
                </button>
              </div>
            </div>
          )}

          {/* Step 2: On time? */}
          {step === 'on_time' && (
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Clock size={16} className="text-gray-700" />
                <h4 className="text-gray-900 font-semibold">Работы выполняются в срок?</h4>
              </div>
              <div className={`flex items-center gap-2 mb-6 pl-6 text-sm ${isOverdue ? 'text-red-600' : 'text-gray-500'}`}>
                {isOverdue && <AlertTriangle size={13} />}
                Плановое окончание: {new Date(workEndDateTime).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })}
                {isOverdue && ' — ПРОСРОЧЕН'}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => setStep('changes')}
                  className="flex items-center justify-center gap-2 py-3 bg-gray-900 hover:bg-black text-white rounded font-medium transition-colors">
                  <CheckCircle2 size={16} /> Да, в срок
                </button>
                <button onClick={onExtend}
                  className="flex items-center justify-center gap-2 py-3 border border-orange-300 text-orange-700 bg-orange-50 hover:bg-orange-100 rounded font-medium transition-colors">
                  <RefreshCw size={16} /> Продлить наряд
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Changes? */}
          {step === 'changes' && (
            <div>
              <div className="flex items-center gap-2 mb-1">
                <AlertTriangle size={16} className="text-gray-700" />
                <h4 className="text-gray-900 font-semibold">Есть изменения в условиях работы?</h4>
              </div>
              <div className="mb-6 pl-6 space-y-1">
                {['Смена ответственного руководителя', 'Смена производителя работ', 'Изменение условий работы'].map(c => (
                  <div key={c} className="flex items-center gap-1.5 text-sm text-gray-500">
                    <span className="w-1 h-1 rounded-full bg-gray-400 flex-shrink-0" /> {c}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button onClick={onInitiateClosure}
                  className="flex items-center justify-center gap-2 py-3 bg-red-600 hover:bg-red-700 text-white rounded font-medium transition-colors">
                  <XCircle size={16} /> Да → Закрыть наряд
                </button>
                <button onClick={() => setStep('brigade_changes')}
                  className="flex items-center justify-center gap-2 py-3 border border-gray-300 text-gray-700 rounded font-medium hover:bg-gray-50 transition-colors">
                  <ChevronRight size={16} /> Нет, продолжить
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Brigade changes? */}
          {step === 'brigade_changes' && (
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Users size={16} className="text-gray-700" />
                <h4 className="text-gray-900 font-semibold">Изменения в составе бригады?</h4>
              </div>
              <p className="text-gray-500 text-sm mb-6 pl-6">Добавление или исключение членов бригады</p>
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => setStep('brigade_pct')}
                  className="flex items-center justify-center gap-2 py-3 bg-gray-900 hover:bg-black text-white rounded font-medium transition-colors">
                  <CheckCircle2 size={16} /> Да, есть изменения
                </button>
                <button onClick={onClose}
                  className="flex items-center justify-center gap-2 py-3 border border-gray-300 text-gray-700 rounded font-medium hover:bg-gray-50 transition-colors">
                  <ChevronRight size={16} /> Нет, продолжаем
                </button>
              </div>
            </div>
          )}

          {/* Step 5: >50%? */}
          {step === 'brigade_pct' && (
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Users size={16} className="text-gray-700" />
                <h4 className="text-gray-900 font-semibold">Изменение состава более чем на 50%?</h4>
              </div>
              <div className="mb-6 pl-6 bg-gray-50 border border-gray-200 rounded p-3">
                <p className="text-sm text-gray-600">Текущий состав бригады: <span className="font-semibold text-gray-900">{activeCount} чел.</span></p>
                <p className="text-xs text-gray-500 mt-1">50% от текущего состава = {Math.ceil(activeCount / 2)} чел.</p>
                <p className="text-xs text-gray-500">При изменении более 50% наряд должен быть закрыт</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button onClick={onInitiateClosure}
                  className="flex items-center justify-center gap-2 py-3 bg-red-600 hover:bg-red-700 text-white rounded font-medium transition-colors">
                  <XCircle size={16} /> Да → Закрыть наряд
                </button>
                <button onClick={() => setStep('brigade_edit')}
                  className="flex items-center justify-center gap-2 py-3 bg-gray-900 hover:bg-black text-white rounded font-medium transition-colors">
                  <Users size={16} /> Нет, изменить состав
                </button>
              </div>
            </div>
          )}

          {/* Step 6: Brigade edit */}
          {step === 'brigade_edit' && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Users size={16} className="text-gray-700" />
                <h4 className="text-gray-900 font-semibold">Изменение состава бригады</h4>
              </div>

              <div className="space-y-2 mb-4">
                {editMembers.filter(m => m.isActive).map((m) => (
                  <div key={m.id} className="flex items-center gap-2 p-2 bg-gray-50 border border-gray-200 rounded">
                    <input value={m.name} disabled={!!m.userId}
                      onChange={e => setEditMembers(p => p.map(em => em.id === m.id ? { ...em, name: e.target.value } : em))}
                      placeholder="Ф.И.О."
                      className="flex-1 px-2 py-1 text-sm border border-gray-200 rounded bg-white focus:outline-none focus:ring-1 focus:ring-gray-800 disabled:bg-gray-100" />
                    <select value={m.group}
                      onChange={e => setEditMembers(p => p.map(em => em.id === m.id ? { ...em, group: e.target.value } : em))}
                      className="w-16 px-1.5 py-1 text-sm border border-gray-200 rounded bg-white focus:outline-none">
                      {GROUPS.map(g => <option key={g}>{g}</option>)}
                    </select>
                    <input value={m.direction}
                      onChange={e => setEditMembers(p => p.map(em => em.id === m.id ? { ...em, direction: e.target.value } : em))}
                      placeholder="Направление"
                      className="w-28 px-2 py-1 text-sm border border-gray-200 rounded bg-white focus:outline-none" />
                    <button onClick={() => removeMember(m.id)} className="text-gray-400 hover:text-red-500 transition-colors p-1">
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>

              <button onClick={addMember}
                className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 mb-4 px-2 py-1 border border-dashed border-gray-300 rounded hover:border-gray-400 transition-colors">
                <Plus size={14} /> Добавить члена бригады
              </button>

              <div className="bg-amber-50 border border-amber-200 rounded p-3 mb-4">
                <p className="text-amber-800 text-xs font-medium flex items-center gap-1.5">
                  <AlertTriangle size={12} /> После изменений потребуется подпись ЭЦП
                </p>
              </div>

              <div className="flex gap-2">
                <button onClick={() => setStep('brigade_pct')} className="px-4 py-2 border border-gray-300 text-gray-600 rounded text-sm hover:bg-gray-50">Назад</button>
                <button onClick={saveBrigade} className="flex-1 px-4 py-2 bg-gray-900 text-white rounded text-sm hover:bg-black flex items-center justify-center gap-2">
                  <CheckCircle2 size={14} /> Сохранить и подписать ЭЦП
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
