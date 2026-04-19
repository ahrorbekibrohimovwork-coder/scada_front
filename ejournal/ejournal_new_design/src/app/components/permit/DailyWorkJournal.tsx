import React, { useState } from 'react';
import { Plus, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';
import type { DailyBriefing, BrigadeMember, User } from '../../types';

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
  iso ? new Date(iso).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' }) : '';

type RowStatus = 'active' | 'completed' | 'pending';

function getRowStatus(briefing: DailyBriefing, permitStatus: string): RowStatus {
  if (briefing.endSignature) return 'completed';
  if (briefing.admitterSignature && briefing.responsibleSignature) return 'active';
  return 'pending';
}

export function DailyWorkJournal({
  briefings, brigadeMembers, currentUser, observerId, permitStatus,
  canAddBriefing, canSignAdmitter, canSignResponsible, canSignMember, canEndWork,
  onAddBriefing, onSignAdmitter, onSignResponsible, onSignMember, onEndWork,
}: Props) {
  const [editingRow, setEditingRow] = useState<string | null>(null);
  const [newLocation, setNewLocation] = useState('');
  const [newDateTime, setNewDateTime] = useState(new Date().toISOString().slice(0, 16));
  const [endDateTimes, setEndDateTimes] = useState<Record<string, string>>({});

  const lastBriefing = briefings[briefings.length - 1];
  const canAddNewDay = canAddBriefing && (!lastBriefing || !!lastBriefing.endSignature);

  const handleAddBriefing = () => {
    if (!newLocation.trim()) return;
    onAddBriefing(newLocation, new Date(newDateTime).toISOString());
    setNewLocation('');
    setEditingRow(null);
  };

  const activeMembers = brigadeMembers.filter(m => m.isActive);
  const isTerminal = ['closed', 'cancelled'].includes(permitStatus);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
            Ежедневный допуск к работе и её окончание
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">Журнал инструктажей и регистрации рабочих дней</p>
        </div>
        {canAddNewDay && (
          <button
            onClick={() => setEditingRow('new')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 hover:bg-black text-white text-xs font-medium rounded transition-colors"
          >
            <Plus size={12} />
            Добавить день
          </button>
        )}
      </div>

      {/* Table */}
      <div className="border-2 border-gray-300 rounded overflow-hidden bg-white">
        {/* Fixed header */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse" style={{ minWidth: '1200px' }}>
            {/* Header: Level 1 */}
            <thead>
              <tr className="bg-gray-100 border-b-2 border-gray-300">
                <th rowSpan={2} className="border-r border-gray-300 px-2 py-2 text-[10px] font-bold text-gray-700 uppercase tracking-wide text-center w-12">
                  №
                </th>
                <th colSpan={5} className="border-r-2 border-gray-400 px-3 py-2 text-xs font-bold text-gray-900 uppercase text-center">
                  Проведен инструктаж бригаде и осуществлен допуск на подготовленное рабочее место
                </th>
                <th colSpan={2} className="px-3 py-2 text-xs font-bold text-gray-900 uppercase text-center">
                  Работа окончена, бригада с рабочего места выведена
                </th>
              </tr>

              {/* Header: Level 2 */}
              <tr className="bg-gray-50 border-b border-gray-300">
                {/* Left section */}
                <th className="border-r border-gray-300 px-2 py-2 text-[10px] font-semibold text-gray-600 uppercase tracking-wide w-48">
                  Наименование места работы
                </th>
                <th className="border-r border-gray-300 px-2 py-2 text-[10px] font-semibold text-gray-600 uppercase tracking-wide w-32">
                  Дата, время
                </th>
                <th className="border-r border-gray-300 px-2 py-2 text-[10px] font-semibold text-gray-600 uppercase tracking-wide w-32">
                  Допускающий
                </th>
                <th className="border-r border-gray-300 px-2 py-2 text-[10px] font-semibold text-gray-600 uppercase tracking-wide w-32">
                  Произв./Набл.
                </th>
                <th className="border-r-2 border-gray-400 px-2 py-2 text-[10px] font-semibold text-gray-600 uppercase tracking-wide w-40">
                  Члены бригады
                </th>
                {/* Right section */}
                <th className="border-r border-gray-300 px-2 py-2 text-[10px] font-semibold text-gray-600 uppercase tracking-wide w-32">
                  Дата, время
                </th>
                <th className="px-2 py-2 text-[10px] font-semibold text-gray-600 uppercase tracking-wide w-32">
                  Подпись
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-200">
              {/* Existing rows */}
              {briefings.map((b, idx) => {
                const rowStatus = getRowStatus(b, permitStatus);
                const myMember = activeMembers.find(m => m.userId === currentUser.id);
                const rowBg = rowStatus === 'completed' ? 'bg-emerald-50/30' : rowStatus === 'active' ? 'bg-blue-50/20' : 'bg-white';
                const endDT = endDateTimes[b.id] || new Date().toISOString().slice(0, 16);

                return (
                  <tr key={b.id} className={`${rowBg} hover:bg-gray-50 transition-colors`}>
                    {/* Day number */}
                    <td className="border-r border-gray-300 px-2 py-3 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-xs font-bold text-gray-700">{idx + 1}</span>
                        {b.isFirst && (
                          <span className="text-[9px] text-blue-600 font-semibold">1-й</span>
                        )}
                      </div>
                    </td>

                    {/* Work location */}
                    <td className="border-r border-gray-300 px-2 py-2">
                      <span className="text-xs text-gray-800">{b.workLocationName}</span>
                    </td>

                    {/* Date/time (admission) */}
                    <td className="border-r border-gray-300 px-2 py-2">
                      <span className="text-xs font-mono text-gray-700">{fmtDT(b.briefingDateTime)}</span>
                    </td>

                    {/* Admitter signature */}
                    <td className="border-r border-gray-300 px-2 py-2">
                      {b.admitterSignature ? (
                        <SignStatus status="signed" timestamp={b.admitterSignature.timestamp} />
                      ) : canSignAdmitter ? (
                        <button
                          onClick={() => onSignAdmitter(b.id)}
                          className="text-[10px] px-2 py-1 bg-gray-900 text-white rounded hover:bg-black transition-colors"
                        >
                          Подписать
                        </button>
                      ) : (
                        <SignStatus status={isTerminal ? 'not_required' : 'pending'} />
                      )}
                    </td>

                    {/* Responsible signature */}
                    <td className="border-r border-gray-300 px-2 py-2">
                      {b.responsibleSignature ? (
                        <SignStatus status="signed" timestamp={b.responsibleSignature.timestamp} />
                      ) : b.admitterSignature && canSignResponsible ? (
                        <button
                          onClick={() => onSignResponsible(b.id)}
                          className="text-[10px] px-2 py-1 bg-gray-900 text-white rounded hover:bg-black transition-colors"
                        >
                          Подписать
                        </button>
                      ) : (
                        <SignStatus status={isTerminal ? 'not_required' : 'pending'} />
                      )}
                    </td>

                    {/* Brigade members */}
                    <td className="border-r-2 border-gray-400 px-2 py-2">
                      <div className="space-y-1">
                        {activeMembers.map(m => {
                          const signed = b.brigadeSignatures.find(s => s.memberId === m.id);
                          const isMe = m.userId === currentUser.id;
                          const needsSign = b.isFirst && !signed && isMe && canSignMember && b.admitterSignature;

                          return (
                            <div key={m.id} className="flex items-center justify-between gap-2">
                              <span className="text-[10px] text-gray-600 truncate flex-1">{m.name}</span>
                              {signed ? (
                                <CheckCircle2 size={10} className="text-emerald-600 flex-shrink-0" />
                              ) : needsSign ? (
                                <button
                                  onClick={() => onSignMember(b.id, m.id, m.name)}
                                  className="text-[9px] px-1.5 py-0.5 bg-gray-800 text-white rounded hover:bg-black flex-shrink-0"
                                >
                                  ЭЦП
                                </button>
                              ) : b.isFirst ? (
                                <Clock size={10} className={isTerminal ? 'text-gray-200' : 'text-gray-300'} />
                              ) : (
                                <span className="text-[9px] text-gray-400">—</span>
                              )}
                            </div>
                          );
                        })}
                        {activeMembers.length === 0 && (
                          <span className="text-[10px] text-gray-400 italic">Нет членов</span>
                        )}
                      </div>
                    </td>

                    {/* End date/time */}
                    <td className="border-r border-gray-300 px-2 py-2">
                      {b.endDateTime ? (
                        <span className="text-xs font-mono text-gray-700">{fmtDT(b.endDateTime)}</span>
                      ) : canEndWork && b.admitterSignature && b.responsibleSignature ? (
                        <input
                          type="datetime-local"
                          value={endDT}
                          onChange={e => setEndDateTimes(prev => ({ ...prev, [b.id]: e.target.value }))}
                          className="text-[10px] px-1.5 py-1 border border-gray-200 rounded font-mono w-full focus:outline-none focus:ring-1 focus:ring-gray-800"
                        />
                      ) : (
                        <span className="text-xs text-gray-300">—</span>
                      )}
                    </td>

                    {/* End signature */}
                    <td className="px-2 py-2">
                      {b.endSignature ? (
                        <SignStatus status="signed" timestamp={b.endSignature.timestamp} />
                      ) : canEndWork && b.admitterSignature && b.responsibleSignature ? (
                        <button
                          onClick={() => onEndWork(b.id, endDT)}
                          className="text-[10px] px-2 py-1 bg-gray-900 text-white rounded hover:bg-black transition-colors w-full"
                        >
                          Завершить
                        </button>
                      ) : (
                        <SignStatus status={isTerminal ? 'not_required' : 'pending'} />
                      )}
                    </td>
                  </tr>
                );
              })}

              {/* New row form */}
              {editingRow === 'new' && (
                <tr className="bg-blue-50 border-2 border-blue-300">
                  <td className="border-r border-gray-300 px-2 py-3 text-center">
                    <span className="text-xs font-bold text-blue-600">{briefings.length + 1}</span>
                  </td>
                  <td className="border-r border-gray-300 px-2 py-2">
                    <input
                      type="text"
                      value={newLocation}
                      onChange={e => setNewLocation(e.target.value)}
                      placeholder="Введите место работы"
                      className="w-full text-xs px-2 py-1 border border-blue-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      autoFocus
                    />
                  </td>
                  <td className="border-r border-gray-300 px-2 py-2">
                    <input
                      type="datetime-local"
                      value={newDateTime}
                      onChange={e => setNewDateTime(e.target.value)}
                      className="w-full text-xs px-2 py-1 border border-blue-200 rounded font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </td>
                  <td className="border-r border-gray-300 px-2 py-2" colSpan={5}>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleAddBriefing}
                        disabled={!newLocation.trim()}
                        className="flex-1 px-3 py-1.5 bg-gray-900 text-white rounded text-xs hover:bg-black disabled:opacity-40 transition-colors"
                      >
                        Создать запись
                      </button>
                      <button
                        onClick={() => { setEditingRow(null); setNewLocation(''); }}
                        className="px-3 py-1.5 border border-gray-300 text-gray-600 rounded text-xs hover:bg-gray-50 transition-colors"
                      >
                        Отмена
                      </button>
                    </div>
                  </td>
                </tr>
              )}

              {/* Empty state */}
              {briefings.length === 0 && editingRow !== 'new' && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <Clock size={20} className="text-gray-300" />
                      <p className="text-xs text-gray-400">Записей об инструктаже ещё нет</p>
                      {canAddBriefing && (
                        <button
                          onClick={() => setEditingRow('new')}
                          className="mt-2 flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 text-white text-xs rounded hover:bg-black transition-colors"
                        >
                          <Plus size={12} />
                          Добавить первый день
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer info */}
        {briefings.length > 0 && (
          <div className="border-t-2 border-gray-300 bg-gray-50 px-3 py-2 flex items-center justify-between">
            <div className="flex items-center gap-4 text-xs text-gray-600">
              <span>Всего дней: <strong className="text-gray-900">{briefings.length}</strong></span>
              <span>Завершено: <strong className="text-emerald-600">{briefings.filter(b => b.endSignature).length}</strong></span>
              <span>В процессе: <strong className="text-blue-600">{briefings.filter(b => b.admitterSignature && !b.endSignature).length}</strong></span>
            </div>
            {!canAddNewDay && briefings.length > 0 && !lastBriefing?.endSignature && (
              <div className="flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 px-2 py-1 rounded border border-amber-200">
                <AlertTriangle size={11} />
                Завершите текущий день перед добавлением нового
              </div>
            )}
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-gray-500 px-2">
        <div className="flex items-center gap-1.5">
          <CheckCircle2 size={10} className="text-emerald-600" />
          <span>Подписано</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Clock size={10} className="text-gray-400" />
          <span>Ожидается</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 bg-emerald-50 border border-emerald-200 rounded" />
          <span>Завершённый день</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 bg-blue-50 border border-blue-200 rounded" />
          <span>Активный день</span>
        </div>
      </div>
    </div>
  );
}

// Helper component for signature status
function SignStatus({ status, timestamp }: { status: 'signed' | 'pending' | 'not_required'; timestamp?: string }) {
  if (status === 'signed') {
    return (
      <div className="flex flex-col items-center">
        <CheckCircle2 size={12} className="text-emerald-600 mb-0.5" />
        {timestamp && (
          <span className="text-[9px] text-gray-400 font-mono">
            {new Date(timestamp).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
          </span>
        )}
      </div>
    );
  }
  if (status === 'pending') {
    return (
      <div className="flex items-center justify-center">
        <Clock size={11} className="text-amber-500" />
      </div>
    );
  }
  return (
    <div className="flex items-center justify-center">
      <span className="text-[10px] text-gray-300">—</span>
    </div>
  );
}
