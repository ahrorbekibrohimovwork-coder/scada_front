import React, { useState } from 'react';
import { Users, Plus, CheckCircle, XCircle, AlertCircle, Search } from 'lucide-react';
import { useUserManagement } from '../context/UserManagementContext';
import { BRIGADE_REGISTRY } from '../data/mockData';
import { CreateAccountModal } from '../components/account/CreateAccountModal';

export function AccountManagement() {
  const { users } = useUserManagement();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedRegistryId, setSelectedRegistryId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const registryWithAccounts = BRIGADE_REGISTRY.map(entry => {
    const user = users.find(u => u.id === entry.userId);
    return {
      ...entry,
      hasAccount: !!user,
      user,
    };
  }).filter(entry => {
    if (!searchQuery.trim()) return true;
    return entry.name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const withAccounts = registryWithAccounts.filter(r => r.hasAccount);
  const withoutAccounts = registryWithAccounts.filter(r => !r.hasAccount);

  const handleCreateAccount = (registryId: string) => {
    setSelectedRegistryId(registryId);
    setShowCreateModal(true);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Users size={20} className="text-gray-700" />
          <h1 className="text-xl font-semibold text-gray-900">Управление учетными записями</h1>
        </div>
        <p className="text-sm text-gray-600">Создание и управление учетными записями для членов бригады</p>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Поиск сотрудника по ФИО..."
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Registry members without accounts */}
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="px-4 py-3 bg-orange-50 border-b border-orange-100 flex items-center gap-2">
            <AlertCircle size={16} className="text-orange-600" />
            <h2 className="text-sm font-semibold text-orange-900">
              Требуется создание учетных записей ({withoutAccounts.length})
            </h2>
          </div>

          {withoutAccounts.length === 0 ? (
            <div className="p-6 text-center">
              <CheckCircle size={32} className="text-green-500 mx-auto mb-2" />
              <p className="text-sm text-gray-600">Все члены бригады имеют учетные записи</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {withoutAccounts.map(entry => (
                <div key={entry.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <XCircle size={14} className="text-red-500 flex-shrink-0" />
                        <p className="text-sm font-medium text-gray-900">{entry.name}</p>
                      </div>
                      <div className="ml-5 space-y-0.5">
                        <p className="text-xs text-gray-600">{entry.position}</p>
                        <p className="text-xs text-gray-500">{entry.department}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] font-mono font-semibold text-yellow-600 bg-yellow-50 px-1.5 py-0.5 rounded">
                            ГР.{entry.electricalGroup}
                          </span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleCreateAccount(entry.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 hover:bg-black text-white rounded text-xs font-medium transition-colors"
                    >
                      <Plus size={12} />
                      Создать
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Registry members with accounts */}
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="px-4 py-3 bg-green-50 border-b border-green-100 flex items-center gap-2">
            <CheckCircle size={16} className="text-green-600" />
            <h2 className="text-sm font-semibold text-green-900">
              Учетные записи созданы ({withAccounts.length})
            </h2>
          </div>

          <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
            {withAccounts.map(entry => (
              <div key={entry.id} className="p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle size={14} className="text-green-500 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 mb-1">{entry.name}</p>
                    <div className="space-y-0.5">
                      <p className="text-xs text-gray-600">{entry.position}</p>
                      <p className="text-xs text-gray-500">{entry.department}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-[10px] font-mono font-semibold text-yellow-600 bg-yellow-50 px-1.5 py-0.5 rounded">
                          ГР.{entry.electricalGroup}
                        </span>
                        {entry.user && (
                          <code className="text-[10px] text-gray-600 bg-gray-100 px-1.5 py-0.5 rounded">
                            {entry.user.login}
                          </code>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {showCreateModal && selectedRegistryId && (
        <CreateAccountModal
          registryEntry={BRIGADE_REGISTRY.find(r => r.id === selectedRegistryId)!}
          onClose={() => {
            setShowCreateModal(false);
            setSelectedRegistryId(null);
          }}
        />
      )}
    </div>
  );
}
