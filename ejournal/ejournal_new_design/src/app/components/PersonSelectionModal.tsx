import React, { useState } from 'react';
import { X, Search, User, Loader2, Award } from 'lucide-react';

interface Person {
  id: string | number;
  full_name: string;
  position?: string;
  ex_group?: string;
}

interface PersonSelectionModalProps {
  title: string;
  items: Person[];
  loading?: boolean;
  onSelect: (id: string) => void;
  onClose: () => void;
}

export function PersonSelectionModal({ title, items, loading, onSelect, onClose }: PersonSelectionModalProps) {
  const [search, setSearch] = useState('');

  const filteredItems = items.filter(i => 
    i.full_name.toLowerCase().includes(search.toLowerCase()) ||
    (i.position || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h3 className="text-slate-900 font-semibold">{title}</h3>
            <p className="text-slate-500 text-[11px] mt-0.5 uppercase tracking-wider font-semibold">Выбор ответственного лица</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-slate-100">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              autoFocus
              type="text"
              placeholder="Поиск по ФИО или должности..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-100 border-transparent focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-xl text-sm transition-all outline-none"
            />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-slate-200">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <Loader2 className="animate-spin mb-3" size={32} />
              <p className="text-sm">Загрузка персонала...</p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <User className="mb-3 opacity-20" size={48} />
              <p className="text-sm italic">Работники не найдены</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-1">
              {filteredItems.map(person => (
                <button
                  key={person.id}
                  onClick={() => onSelect(String(person.id))}
                  className="w-full flex items-center justify-between p-3 hover:bg-blue-50 rounded-xl group transition-all text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors font-bold text-xs">
                      {person.full_name.split(' ').map(s => s[0]).slice(0, 2).join('')}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-700 group-hover:text-blue-700">{person.full_name}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {person.position || 'Должность не указана'}
                      </p>
                    </div>
                  </div>
                  {person.ex_group && (
                    <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-100 rounded-lg group-hover:bg-blue-100 transition-colors">
                      <Award size={12} className="text-slate-400 group-hover:text-blue-500" />
                      <span className="text-[11px] font-bold text-slate-600 group-hover:text-blue-700">Гр. {person.ex_group}</span>
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-end">
          <button onClick={onClose} className="px-4 py-2 text-sm text-slate-600 hover:text-slate-900 font-medium">
            Отмена
          </button>
        </div>
      </div>
    </div>
  );
}
