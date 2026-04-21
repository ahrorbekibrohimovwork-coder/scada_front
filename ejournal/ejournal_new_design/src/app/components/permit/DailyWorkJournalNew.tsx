import React, { useState } from 'react';
import { Plus, CheckCircle2, Clock, AlertTriangle, Users, Calendar, MapPin, Info } from 'lucide-react';
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
  iso ? new Date(iso).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—';

function SignatureStatus({ signed, canSign, onSign }: { signed: boolean; canSign: boolean; onSign: () => void }) {
  if (signed) {
    return (
      <div className="flex items-center gap-1.5">
        <CheckCircle2 size={12} className="text-emerald-600" />
        <span className="text-xs text-emerald-700 font-medium">Подписано</span>
      </div>
    );
  }
  if (canSign) {
    return (
      <button
        onClick={onSign}
        className="px-2.5 py-1 bg-gray-900 hover:bg-black text-white text-xs rounded font-medium transition-colors"
      >
        Подписать ЭЦП
      </button>
    );
  }
  return (
    <div className="flex items-center gap-1.5">
      <Clock size={12} className="text-amber-500" />
      <span className="text-xs text-amber-600">Ожидается</span>
    </div>
  );
}

export function DailyWorkJournalNew({
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

  const isTerminal = ['closed', 'cancelled'].includes(permitStatus);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
            Ежедневный допуск к работе и её окончание
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">Журнал инструктажей с индивидуальной регистрацией членов бригады</p>
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

      {/* Add new day form */}
      {editingRow === 'new' && (
        <div className="border-2 border-blue-300 rounded p-4 bg-blue-50">
          <p className="text-xs font-semibold text-blue-800 mb-3">Добавить новый рабочий день</p>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="text-xs text-gray-600 font-medium mb-1 block">Место работы</label>
              <input
                type="text"
                value={newLocation}
                onChange={(e) => setNewLocation(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-gray-300 rounded text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Например: РУ-10кВ, ячейка №5"
                autoFocus
              />
            </div>
            <div>
              <label className="text-xs text-gray-600 font-medium mb-1 block">Дата и время инструктажа</label>
              <input
                type="datetime-local"
                value={newDateTime}
                onChange={(e) => setNewDateTime(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-gray-300 rounded text-sm text-gray-900 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setEditingRow(null)}
              className="px-3 py-1.5 border border-gray-300 text-gray-700 rounded text-xs font-medium hover:bg-gray-50"
            >
              Отмена
            </button>
            <button
              onClick={handleAddBriefing}
              disabled={!newLocation.trim()}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-medium disabled:opacity-50"
            >
              Добавить
            </button>
          </div>
        </div>
      )}

      {/* Briefings list */}
      {briefings.length === 0 ? (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
          <Calendar size={32} className="mx-auto text-gray-300 mb-2" />
          <p className="text-sm text-gray-500">Инструктажи не добавлены</p>
          <p className="text-xs text-gray-400 mt-1">Нажмите "Добавить день" для создания первого инструктажа</p>
        </div>
      ) : (
        <div className="space-y-3">
          {briefings.map((briefing, dayIdx) => {
            const dayNumber = dayIdx + 1;
            const isCompleted = !!briefing.endSignature;
            const isActive = briefing.admitterSignature && briefing.responsibleSignature && !isCompleted;
            const activeMembers = brigadeMembers.filter(m => m.isActive);

            // Determine which members need to sign for this briefing
            // Only members without firstBriefingSignature need to sign
            const membersNeedingSignature = activeMembers.filter(m => !m.firstBriefingSignature);

            return (
              <div
                key={briefing.id}
                className={`border-2 rounded-lg overflow-hidden ${
                  isCompleted ? 'border-emerald-300 bg-emerald-50' :
                  isActive ? 'border-blue-300 bg-blue-50' :
                  'border-gray-300 bg-white'
                }`}
              >
                {/* Day header */}
                <div className={`px-4 py-2.5 flex items-center justify-between ${
                  isCompleted ? 'bg-emerald-100' :
                  isActive ? 'bg-blue-100' :
                  'bg-gray-100'
                }`}>
                  <div className="flex items-center gap-3">
                    <span className={`text-sm font-bold ${
                      isCompleted ? 'text-emerald-800' :
                      isActive ? 'text-blue-800' :
                      'text-gray-700'
                    }`}>
                      День {dayNumber}
                    </span>
                    {briefing.isFirst && (
                      <span className="text-[9px] px-2 py-0.5 bg-purple-600 text-white rounded font-semibold uppercase">
                        Первичный допуск
                      </span>
                    )}
                    {isCompleted && (
                      <span className="text-[9px] px-2 py-0.5 bg-emerald-600 text-white rounded font-semibold flex items-center gap-1">
                        <CheckCircle2 size={9} /> Завершён
                      </span>
                    )}
                    {isActive && (
                      <span className="text-[9px] px-2 py-0.5 bg-blue-600 text-white rounded font-semibold">
                        В работе
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <MapPin size={11} className="text-gray-400" />
                    <span className="font-medium">{briefing.workLocationName}</span>
                  </div>
                </div>

                {/* Briefing details */}
                <div className="p-4 space-y-3">
                  {/* Main briefing info */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-white border border-gray-200 rounded p-3">
                      <p className="text-[10px] text-gray-400 uppercase font-semibold mb-1.5">Дата инструктажа</p>
                      <p className="text-xs text-gray-900 font-mono font-medium">{fmtDT(briefing.briefingDateTime)}</p>
                    </div>
                    <div className="bg-white border border-gray-200 rounded p-3">
                      <p className="text-[10px] text-gray-400 uppercase font-semibold mb-1.5">Допускающий</p>
                      <SignatureStatus
                        signed={!!briefing.admitterSignature}
                        canSign={canSignAdmitter && !briefing.admitterSignature}
                        onSign={() => onSignAdmitter(briefing.id)}
                      />
                    </div>
                    <div className="bg-white border border-gray-200 rounded p-3">
                      <p className="text-[10px] text-gray-400 uppercase font-semibold mb-1.5">
                        {observerId ? 'Наблюдающий' : 'Производитель работ'}
                      </p>
                      <SignatureStatus
                        signed={!!briefing.responsibleSignature}
                        canSign={canSignResponsible && !!briefing.admitterSignature && !briefing.responsibleSignature}
                        onSign={() => onSignResponsible(briefing.id)}
                      />
                    </div>
                  </div>

                  {/* Info about second signatory */}
                  <div className="bg-blue-50 border border-blue-200 rounded px-3 py-2">
                    <div className="flex items-start gap-2">
                      <Info size={11} className="text-blue-600 flex-shrink-0 mt-0.5" />
                      <p className="text-[10px] text-blue-700 leading-relaxed">
                        Второй подписант определяется автоматически: <span className="font-semibold">Наблюдающий</span> (если назначен), иначе <span className="font-semibold">Производитель работ</span>
                      </p>
                    </div>
                  </div>

                  {/* Brigade members table */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Users size={12} className="text-gray-400" />
                      <p className="text-[10px] text-gray-400 uppercase font-semibold">
                        Состав бригады ({activeMembers.length} чел.)
                      </p>
                    </div>
                    <div className="border border-gray-200 rounded overflow-hidden">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="bg-gray-100">
                            <th className="text-left px-3 py-2 text-[10px] text-gray-500 font-semibold uppercase w-8">#</th>
                            <th className="text-left px-3 py-2 text-[10px] text-gray-500 font-semibold uppercase">ФИО</th>
                            <th className="text-left px-3 py-2 text-[10px] text-gray-500 font-semibold uppercase w-20">Группа</th>
                            <th className="text-left px-3 py-2 text-[10px] text-gray-500 font-semibold uppercase w-48">Статус инструктажа</th>
                          </tr>
                        </thead>
                        <tbody>
                          {activeMembers.map((member, idx) => {
                            const memberSigned = briefing.brigadeSignatures.find(s => s.memberId === member.id);
                            const hasFirstSignature = !!member.firstBriefingSignature;
                            const needsToSign = !hasFirstSignature;
                            const isMe = member.userId === currentUser.id;
                            const canSign = needsToSign && isMe && canSignMember && briefing.admitterSignature;

                            return (
                              <tr key={member.id} className="border-t border-gray-200 hover:bg-gray-50">
                                <td className="px-3 py-2.5 text-gray-400 font-mono">{idx + 1}</td>
                                <td className="px-3 py-2.5 text-gray-900 font-medium">
                                  {member.name}
                                  {isMe && (
                                    <span className="ml-2 text-[9px] px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded font-semibold">
                                      ВЫ
                                    </span>
                                  )}
                                </td>
                                <td className="px-3 py-2.5 text-gray-600 font-mono">{member.group}</td>
                                <td className="px-3 py-2.5">
                                  {hasFirstSignature ? (
                                    <div className="flex items-center gap-1.5">
                                      <CheckCircle2 size={12} className="text-emerald-600" />
                                      <span className="text-xs text-emerald-700">Расписался ранее</span>
                                      <span className="text-[10px] text-gray-400 font-mono ml-2">
                                        {fmtDT(member.firstBriefingSignature?.timestamp)}
                                      </span>
                                    </div>
                                  ) : memberSigned ? (
                                    <div className="flex items-center gap-1.5">
                                      <CheckCircle2 size={12} className="text-emerald-600" />
                                      <span className="text-xs text-emerald-700 font-medium">Подписано</span>
                                      <span className="text-[10px] text-gray-400 font-mono ml-2">
                                        {fmtDT(memberSigned.sig.timestamp)}
                                      </span>
                                    </div>
                                  ) : canSign ? (
                                    <button
                                      onClick={() => onSignMember(briefing.id, member.id, member.name)}
                                      className="px-2.5 py-1 bg-gray-900 hover:bg-black text-white text-xs rounded font-medium transition-colors"
                                    >
                                      Подписать ЭЦП
                                    </button>
                                  ) : (
                                    <div className="flex items-center gap-1.5">
                                      <Clock size={12} className="text-amber-500" />
                                      <span className="text-xs text-amber-600">Ожидается</span>
                                    </div>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* End of work */}
                  <div className="bg-white border border-gray-200 rounded p-3">
                    <p className="text-[10px] text-gray-400 uppercase font-semibold mb-2">Окончание работ</p>
                    {briefing.endSignature ? (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 size={14} className="text-emerald-600" />
                          <span className="text-xs text-emerald-700 font-medium">Работы завершены</span>
                        </div>
                        <span className="text-xs text-gray-600 font-mono">{fmtDT(briefing.endDateTime)}</span>
                      </div>
                    ) : canEndWork && briefing.responsibleSignature ? (
                      <div className="flex items-center gap-3">
                        <input
                          type="datetime-local"
                          value={endDateTimes[briefing.id] || new Date().toISOString().slice(0, 16)}
                          onChange={(e) => setEndDateTimes({ ...endDateTimes, [briefing.id]: e.target.value })}
                          className="px-2.5 py-1.5 border border-gray-300 rounded text-xs font-mono focus:outline-none focus:ring-2 focus:ring-gray-900"
                        />
                        <button
                          onClick={() => onEndWork(briefing.id, endDateTimes[briefing.id] || new Date().toISOString())}
                          className="px-3 py-1.5 bg-gray-900 hover:bg-black text-white rounded text-xs font-medium transition-colors"
                        >
                          Завершить работы
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <Clock size={12} className="text-amber-500" />
                        <span className="text-xs text-amber-600">Ожидается завершение работ</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
