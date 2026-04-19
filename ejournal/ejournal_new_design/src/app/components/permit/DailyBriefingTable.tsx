import React, { useState } from 'react';
import { Plus, ChevronDown, ChevronUp, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';
import type { DailyBriefing, EDSSignature, BrigadeMember, User } from '../../types';
import { SignatureCell } from './SignatureCell';

interface Props {
  briefings: DailyBriefing[];
  brigadeMembers: BrigadeMember[];
  currentUser: User;
  observerId?: string;
  permitStatus: string;
  canAddBriefing: boolean;
  canSignAdmitter: boolean;
  canSignResponsible: boolean;
  canSignMember: boolean;
  canEndWork: boolean;
  onAddBriefing: (location: string, dateTime: string) => void;
  onSignAdmitter: (briefingId: string) => void;
  onSignResponsible: (briefingId: string) => void;
  onSignMember: (briefingId: string, memberId: string, memberName: string) => void;
  onEndWork: (briefingId: string, endDateTime: string) => void;
}

const fmtDT = (iso?: string) =>
  iso ? new Date(iso).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—';

export function DailyBriefingTable({
  briefings, brigadeMembers, currentUser, observerId, permitStatus,
  canAddBriefing, canSignAdmitter, canSignResponsible, canSignMember, canEndWork,
  onAddBriefing, onSignAdmitter, onSignResponsible, onSignMember, onEndWork,
}: Props) {
  const [expanded, setExpanded] = useState<string | null>(briefings[briefings.length - 1]?.id ?? null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newLocation, setNewLocation] = useState('');
  const [newDateTime, setNewDateTime] = useState(new Date().toISOString().slice(0, 16));
  const [endDT, setEndDT] = useState(new Date().toISOString().slice(0, 16));

  const handleAdd = () => {
    if (!newLocation.trim()) return;
    onAddBriefing(newLocation, new Date(newDateTime).toISOString());
    setNewLocation('');
    setShowAddForm(false);
  };

  return (
    <div>
      {/* Table header for desktop */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="bg-gray-50 border-y border-gray-200">
              {['№', 'Место работы', 'Дата/время инструктажа', 'Допускающий (ЭЦП)', 'Произв./Набл. (ЭЦП)', 'Члены бригады (ЭЦП)', 'Дата/время окончания', 'Подпись окончания', ''].map(h => (
                <th key={h} className="text-left px-3 py-2 text-gray-500 font-semibold uppercase tracking-wide whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {briefings.map((b, idx) => {
              const myMember = brigadeMembers.find(m => m.userId === currentUser.id && m.isActive);
              const mySigned = myMember ? !!b.brigadeSignatures.find(s => s.memberId === myMember.id) : false;
              return (
                <tr key={b.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-3 py-3 font-mono text-gray-500 whitespace-nowrap">
                    {b.isFirst ? <span className="text-blue-600 font-semibold">Первич.</span> : `#${idx + 1}`}
                  </td>
                  <td className="px-3 py-3 max-w-[160px]">
                    <span className="text-gray-800">{b.workLocationName}</span>
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap font-mono text-gray-600">{fmtDT(b.briefingDateTime)}</td>
                  <td className="px-3 py-3">
                    {b.admitterSignature ? (
                      <SignatureCell sig={b.admitterSignature} compact />
                    ) : canSignAdmitter ? (
                      <button onClick={() => onSignAdmitter(b.id)}
                        className="text-[11px] px-2 py-1 bg-gray-900 text-white rounded hover:bg-black transition-colors flex items-center gap-1">
                        <CheckCircle2 size={10} /> Подписать
                      </button>
                    ) : <SignatureCell pendingLabel={['closed','cancelled'].includes(permitStatus) ? 'Не требуется' : 'Ожидается'} />}
                  </td>
                  <td className="px-3 py-3">
                    {b.responsibleSignature ? (
                      <SignatureCell sig={b.responsibleSignature} compact />
                    ) : b.admitterSignature && canSignResponsible ? (
                      <button onClick={() => onSignResponsible(b.id)}
                        className="text-[11px] px-2 py-1 bg-gray-900 text-white rounded hover:bg-black transition-colors flex items-center gap-1">
                        <CheckCircle2 size={10} /> Подписать
                      </button>
                    ) : <SignatureCell pendingLabel={['closed','cancelled'].includes(permitStatus) ? 'Не требуется' : 'Ожидается'} />}
                  </td>
                  <td className="px-3 py-3">
                    <div className="space-y-1 min-w-[140px]">
                      {brigadeMembers.filter(m => m.isActive).map(m => {
                        const signed = b.brigadeSignatures.find(s => s.memberId === m.id);
                        const isMe = m.userId === currentUser.id;
                        return (
                          <div key={m.id} className="flex items-center justify-between gap-2">
                            <span className="text-gray-600 truncate text-[11px]">{m.name}</span>
                            {signed ? (
                              <CheckCircle2 size={11} className="text-emerald-500 flex-shrink-0" />
                            ) : isMe && canSignMember && b.admitterSignature ? (
                              <button onClick={() => onSignMember(b.id, m.id, m.name)}
                                className="text-[10px] px-1.5 py-0.5 bg-gray-800 text-white rounded hover:bg-black flex-shrink-0">
                                ЭЦП
                              </button>
                            ) : ['closed','cancelled'].includes(permitStatus) ? (
                              <span className="text-[9px] text-gray-300">—</span>
                            ) : (
                              <Clock size={11} className="text-gray-300 flex-shrink-0" />
                            )}
                          </div>
                        );
                      })}
                      {brigadeMembers.filter(m => m.isActive).length === 0 && (
                        <span className="text-gray-400 text-[11px]">Нет членов бригады</span>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap">
                    {b.endDateTime ? (
                      <span className="font-mono text-gray-600">{fmtDT(b.endDateTime)}</span>
                    ) : canEndWork && b.admitterSignature && b.responsibleSignature ? (
                      <div className="flex items-center gap-1.5">
                        <input type="datetime-local" defaultValue={endDT}
                          onChange={e => setEndDT(e.target.value)}
                          className="text-[10px] px-1.5 py-1 border border-gray-200 rounded font-mono w-[130px]" />
                      </div>
                    ) : <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-3 py-3">
                    {b.endSignature ? (
                      <SignatureCell sig={b.endSignature} compact />
                    ) : canEndWork && b.admitterSignature && b.responsibleSignature && !b.endDateTime ? (
                      <button onClick={() => onEndWork(b.id, endDT)}
                        className="text-[11px] px-2 py-1 bg-gray-900 text-white rounded hover:bg-black transition-colors flex items-center gap-1">
                        <CheckCircle2 size={10} /> Завершить
                      </button>
                    ) : <SignatureCell pendingLabel="Ожидается" />}
                  </td>
                  <td className="px-3 py-3">
                    {b.endDateTime && !b.endSignature && canEndWork && (
                      <button onClick={() => onEndWork(b.id, endDT)}
                        className="text-[11px] px-2 py-1 bg-gray-900 text-white rounded hover:bg-black flex items-center gap-1">
                        <CheckCircle2 size={10} /> ЭЦП
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}

            {briefings.length === 0 && (
              <tr>
                <td colSpan={9} className="px-3 py-10 text-center text-gray-400">
                  <Clock size={24} className="mx-auto mb-2 opacity-40" />
                  <p className="text-sm">Записей об инструктаже ещё нет</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile: card-based */}
      <div className="lg:hidden space-y-3">
        {briefings.map((b, idx) => (
          <div key={b.id} className="border border-gray-200 rounded-lg overflow-hidden">
            <button
              onClick={() => setExpanded(expanded === b.id ? null : b.id)}
              className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-gray-600">{b.isFirst ? 'Первичный допуск' : `Инструктаж #${idx + 1}`}</span>
                <span className="text-xs text-gray-400 font-mono">{fmtDT(b.briefingDateTime)}</span>
              </div>
              <div className="flex items-center gap-2">
                {b.endSignature && <span className="text-xs text-emerald-600 font-medium">Завершён</span>}
                {expanded === b.id ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
              </div>
            </button>
            {expanded === b.id && (
              <div className="p-4 space-y-3">
                <div>
                  <p className="text-[10px] text-gray-400 uppercase mb-1">Место работы</p>
                  <p className="text-sm text-gray-800">{b.workLocationName}</p>
                </div>
                <SignatureCell label="Допускающий" sig={b.admitterSignature} />
                <SignatureCell label="Произв./Набл." sig={b.responsibleSignature} />
                {canSignAdmitter && !b.admitterSignature && (
                  <button onClick={() => onSignAdmitter(b.id)} className="w-full py-2 bg-gray-900 text-white rounded text-sm">Подписать (Допускающий)</button>
                )}
                {canSignResponsible && b.admitterSignature && !b.responsibleSignature && (
                  <button onClick={() => onSignResponsible(b.id)} className="w-full py-2 bg-gray-900 text-white rounded text-sm">Подписать (Произв./Набл.)</button>
                )}
                {b.endSignature ? <SignatureCell label="Окончание" sig={b.endSignature} /> : canEndWork && b.admitterSignature && (
                  <button onClick={() => onEndWork(b.id, new Date().toISOString())} className="w-full py-2 border border-gray-300 text-gray-700 rounded text-sm">Завершить работы ЭЦП</button>
                )}
              </div>
            )}
          </div>
        ))}
        {briefings.length === 0 && (
          <div className="text-center py-8 text-gray-400">
            <Clock size={24} className="mx-auto mb-2 opacity-40" />
            <p className="text-sm">Записей об инструктаже ещё нет</p>
          </div>
        )}
      </div>

      {/* Add new briefing */}
      {canAddBriefing && (
        <div className="mt-4">
          {!showAddForm ? (
            <button onClick={() => setShowAddForm(true)}
              className="flex items-center gap-2 px-3 py-2 border border-dashed border-gray-300 text-gray-600 hover:border-gray-400 hover:text-gray-800 rounded transition-colors text-sm">
              <Plus size={14} /> Добавить запись инструктажа
            </button>
          ) : (
            <div className="border border-blue-200 bg-blue-50 rounded-lg p-4">
              <p className="text-xs font-semibold text-blue-800 uppercase tracking-wide mb-3">Новая запись инструктажа</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="text-xs text-gray-600 mb-1 block">Наименование места работы *</label>
                  <input value={newLocation} onChange={e => setNewLocation(e.target.value)}
                    placeholder="Укажите место производства работ"
                    className="w-full px-3 py-2 border border-gray-200 rounded text-sm bg-white focus:outline-none focus:ring-1 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="text-xs text-gray-600 mb-1 block">Дата и время инструктажа *</label>
                  <input type="datetime-local" value={newDateTime} onChange={e => setNewDateTime(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded text-sm bg-white focus:outline-none focus:ring-1 focus:ring-blue-500" />
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setShowAddForm(false)} className="px-4 py-2 border border-gray-300 text-gray-600 rounded text-sm hover:bg-gray-50">Отмена</button>
                <button onClick={handleAdd} disabled={!newLocation.trim()}
                  className="px-4 py-2 bg-gray-900 text-white rounded text-sm hover:bg-black disabled:opacity-50">Создать запись</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Helper - reexport
function SignatureLabel({ label, sig }: { label: string; sig?: EDSSignature }) {
  return (
    <div>
      <p className="text-[10px] text-gray-400 uppercase mb-1">{label}</p>
      <SignatureCell sig={sig} />
    </div>
  );
}