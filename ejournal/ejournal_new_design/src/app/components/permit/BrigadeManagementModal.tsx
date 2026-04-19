import React, { useState } from 'react';
import { X, Users, Plus, Trash2, CheckCircle2, AlertTriangle, Info, UserPlus, Search, CheckCircle, XCircle, AlertCircle as AlertCircleIcon } from 'lucide-react';
import type { BrigadeMember, BrigadeRegistryEntry, EDSSignature } from '../../types';
import { BRIGADE_REGISTRY } from '../../data/mockData';
import { useUserManagement } from '../../context/UserManagementContext';

interface Props {
  currentMembers: BrigadeMember[];
  onClose: () => void;
  onSave: (members: BrigadeMember[], sig: EDSSignature) => void;
  makeSig: () => EDSSignature;
}

export function BrigadeManagementModal({ currentMembers, onClose, onSave, makeSig }: Props) {
  const { users } = useUserManagement();
  const [members, setMembers] = useState<BrigadeMember[]>(currentMembers);
  const [showRegistry, setShowRegistry] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [attemptedAdd, setAttemptedAdd] = useState<string | null>(null);

  // Get active member user IDs to avoid duplicates
  const activeMemberUserIds = members.filter(m => m.isActive).map(m => m.userId);

  // Check if registry entry has user account
  const getAccountStatus = (entry: BrigadeRegistryEntry) => {
    const hasAccount = users.some(u => u.id === entry.userId);
    return hasAccount;
  };

  // Available members from registry (not already in brigade)
  const availableMembers = BRIGADE_REGISTRY.filter(r => !activeMemberUserIds.includes(r.userId))
    .filter(r => {
      if (!searchQuery.trim()) return true;
      return r.name.toLowerCase().includes(searchQuery.toLowerCase());
    });

  const addMemberFromRegistry = (entry: BrigadeRegistryEntry) => {
    // Check if user has account
    if (!getAccountStatus(entry)) {
      setAttemptedAdd(entry.id);
      setTimeout(() => setAttemptedAdd(null), 3000);
      return;
    }

    const newMember: BrigadeMember = {
      id: `bm_${Date.now()}_${Math.random()}`,
      userId: entry.userId,
      name: entry.name,
      group: entry.electricalGroup,
      direction: 'Электромонтажные работы',
      addedAt: new Date().toISOString(),
      isActive: true,
    };
    setMembers([...members, newMember]);
    setShowRegistry(false);
    setSearchQuery('');
  };

  const removeMember = (memberId: string) => {
    setMembers(members.map(m =>
      m.id === memberId
        ? { ...m, isActive: false, removedAt: new Date().toISOString() }
        : m
    ));
  };

  const handleSave = () => {
    onSave(members, makeSig());
  };

  const activeCount = members.filter(m => m.isActive).length;
  const hasChanges = JSON.stringify(members) !== JSON.stringify(currentMembers);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-3xl w-full border border-gray-200 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 bg-gray-900 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <Users size={16} className="text-white" />
            <h3 className="text-white text-base font-semibold">Управление составом бригады</h3>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          {/* Stats */}
          <div className="bg-blue-50 border border-blue-200 rounded p-3">
            <div className="flex items-center gap-2 mb-2">
              <Info size={12} className="text-blue-600" />
              <p className="text-xs font-semibold text-blue-800">Информация о бригаде</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-blue-700">Активных членов:</span>
                <span className="text-xs text-blue-900 font-bold">{activeCount}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-blue-700">Всего в истории:</span>
                <span className="text-xs text-blue-900 font-bold">{members.length}</span>
              </div>
            </div>
          </div>

          {/* Add member button */}
          <button
            onClick={() => setShowRegistry(true)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-sm font-medium transition-colors"
          >
            <UserPlus size={14} />
            <span>Добавить члена бригады из справочника</span>
          </button>

          {/* Registry selection modal */}
          {showRegistry && (
            <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4">
              <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full border border-gray-200 overflow-hidden flex flex-col max-h-[80vh]">
                <div className="px-5 py-4 bg-emerald-600 flex items-center justify-between flex-shrink-0">
                  <div className="flex items-center gap-2">
                    <Users size={16} className="text-white" />
                    <h3 className="text-white text-base font-semibold">Справочник сотрудников</h3>
                  </div>
                  <button onClick={() => { setShowRegistry(false); setSearchQuery(''); }} className="text-white/70 hover:text-white transition-colors">
                    <X size={18} />
                  </button>
                </div>

                {/* Search */}
                <div className="px-5 py-3 border-b border-gray-200 flex-shrink-0">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      placeholder="Поиск по ФИО..."
                      className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded text-sm text-gray-900 bg-gray-50 focus:outline-none focus:ring-1 focus:ring-emerald-600 focus:bg-white"
                    />
                  </div>
                </div>

                <div className="p-5 overflow-y-auto flex-1">
                  {availableMembers.length === 0 ? (
                    <div className="text-center py-8">
                      <Users size={32} className="mx-auto text-gray-300 mb-2" />
                      <p className="text-sm text-gray-500">
                        {searchQuery ? 'Сотрудники не найдены' : 'Все доступные работники уже добавлены в бригаду'}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {availableMembers.map(entry => {
                        const hasAccount = getAccountStatus(entry);
                        const showWarning = attemptedAdd === entry.id;
                        return (
                          <div key={entry.id}>
                            <button
                              onClick={() => addMemberFromRegistry(entry)}
                              disabled={!hasAccount}
                              className={`w-full text-left p-3 border rounded transition-colors group ${
                                hasAccount
                                  ? 'border-gray-200 hover:bg-emerald-50 hover:border-emerald-300'
                                  : 'border-red-200 bg-red-50 opacity-75 cursor-not-allowed'
                              }`}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <p className={`text-sm font-semibold truncate ${hasAccount ? 'text-gray-900 group-hover:text-emerald-800' : 'text-gray-600'}`}>
                                      {entry.name}
                                    </p>
                                    <span className={`text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded flex-shrink-0 ${
                                      hasAccount ? 'text-yellow-600 bg-yellow-50' : 'text-gray-500 bg-gray-100'
                                    }`}>
                                      ГР.{entry.electricalGroup}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-xs text-gray-500">{entry.position}</span>
                                    {hasAccount ? (
                                      <div className="flex items-center gap-1 text-green-600">
                                        <CheckCircle size={11} />
                                        <span className="text-[10px] font-medium">Активна</span>
                                      </div>
                                    ) : (
                                      <div className="flex items-center gap-1 text-red-600">
                                        <XCircle size={11} />
                                        <span className="text-[10px] font-medium">Нет учетной записи</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                                {hasAccount ? (
                                  <Plus size={16} className="text-emerald-600 flex-shrink-0 mt-0.5" />
                                ) : (
                                  <AlertCircleIcon size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
                                )}
                              </div>
                            </button>
                            {showWarning && (
                              <div className="mt-1 p-2 bg-red-50 border border-red-200 rounded flex items-start gap-2">
                                <AlertCircleIcon size={12} className="text-red-600 flex-shrink-0 mt-0.5" />
                                <p className="text-[11px] text-red-700">
                                  Невозможно добавить сотрудника без учетной записи. Создайте учетную запись в разделе "Учетные записи".
                                </p>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Current members list */}
          <div>
            <p className="text-[10px] text-gray-400 uppercase font-semibold tracking-wide mb-2">Текущий состав</p>
            <div className="space-y-2">
              {members.filter(m => m.isActive).length === 0 ? (
                <div className="text-center py-6 border border-dashed border-gray-300 rounded">
                  <Users size={24} className="mx-auto text-gray-300 mb-2" />
                  <p className="text-xs text-gray-400">Члены бригады не добавлены</p>
                </div>
              ) : (
                members.filter(m => m.isActive).map((member, idx) => {
                  const isNewMember = currentMembers.find(m => m.id === member.id) === undefined;
                  const addedRecently = new Date().getTime() - new Date(member.addedAt).getTime() < 3600000;
                  return (
                    <div
                      key={member.id}
                      className={`border rounded p-3 transition-all ${
                        isNewMember && addedRecently
                          ? 'border-emerald-300 bg-emerald-50 shadow-sm'
                          : 'border-gray-200 bg-white hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1.5">
                            <span className="text-[10px] text-gray-400 font-mono">#{idx + 1}</span>
                            <p className="text-sm font-semibold text-gray-900">{member.name}</p>
                            {isNewMember && addedRecently && (
                              <span className="text-[9px] font-semibold text-emerald-700 bg-emerald-200 px-1.5 py-0.5 rounded">
                                НОВЫЙ
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 mb-2">
                            <span className="text-[10px] font-mono font-semibold text-yellow-600 bg-yellow-50 px-1.5 py-0.5 rounded">
                              ГР.{member.group}
                            </span>
                            <span className="text-xs text-gray-500">{member.direction}</span>
                          </div>
                          <div className="text-xs text-gray-500">
                            <span className="text-gray-400">Добавлен:</span>{' '}
                            <span className="font-mono">{new Date(member.addedAt).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        </div>
                        <button
                          onClick={() => removeMember(member.id)}
                          className="text-red-600 hover:text-red-700 p-1.5 hover:bg-red-50 rounded transition-colors"
                          title="Удалить из бригады"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Removed members (history) */}
          {members.filter(m => !m.isActive).length > 0 && (
            <div>
              <p className="text-[10px] text-gray-400 uppercase font-semibold tracking-wide mb-2">История (удалённые)</p>
              <div className="space-y-2 opacity-60">
                {members.filter(m => !m.isActive).map((member) => (
                  <div key={member.id} className="border border-gray-200 rounded p-2.5 bg-gray-50">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-xs font-medium text-gray-700 line-through">{member.name}</p>
                      <span className="text-[9px] text-red-600 bg-red-100 px-1.5 py-0.5 rounded">Удалён</span>
                    </div>
                    <p className="text-[10px] text-gray-500">
                      Удалён: {member.removedAt && new Date(member.removedAt).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Warning */}
          {hasChanges && (
            <div className="bg-amber-50 border border-amber-200 rounded p-3 flex items-start gap-2">
              <AlertTriangle size={14} className="text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-amber-800">
                <p className="font-semibold mb-1">Внимание!</p>
                <p>При изменении состава бригады более чем на 50% наряд-допуск должен быть закрыт и оформлен новый.</p>
                <p className="mt-1">Новым членам бригады потребуется пройти инструктаж и поставить подпись.</p>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 p-5 border-t border-gray-200 bg-gray-50 flex-shrink-0">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded text-sm font-medium hover:bg-gray-100 transition-colors"
          >
            Отмена
          </button>
          <button
            onClick={handleSave}
            disabled={!hasChanges}
            className="flex-1 px-4 py-2.5 bg-gray-900 hover:bg-black text-white rounded text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <CheckCircle2 size={14} />
            Сохранить изменения
          </button>
        </div>
      </div>
    </div>
  );
}
