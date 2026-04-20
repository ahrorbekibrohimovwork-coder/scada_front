import React, { useState, useEffect } from 'react';
import { apiFetch } from '../lib/apiFetch';
import { X, ChevronRight, Search, Building2, MapPin, Loader2, AlertCircle } from 'lucide-react';

interface LookupItem {
  id: string;
  name: string;
}

interface BranchSelectionModalProps {
  onSelect: (org: string, dept: string) => void;
  onClose: () => void;
  initialFilialId?: string;
}

const API_BASE = import.meta.env.VITE_API_BASE ?? 'https://scruffy-chaos-drift.ngrok-free.dev';

export function BranchSelectionModal({ onSelect, onClose }: BranchSelectionModalProps) {
  const [step, setStep] = useState<'filial' | 'organization' | 'department'>('filial');
  const [filials, setFilials] = useState<LookupItem[]>([]);
  const [organizations, setOrganizations] = useState<LookupItem[]>([]);
  const [departments, setDepartments] = useState<LookupItem[]>([]);
  
  const [selectedFilial, setSelectedFilial] = useState<LookupItem | null>(null);
  const [selectedOrg, setSelectedOrg] = useState<LookupItem | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchFilials();
    fetchDepartments(); // Departments are global in this backend implementation
  }, []);

  const fetchFilials = async () => {
    setLoading(true);
    try {
      const resp = await apiFetch(`/api/filials`);
      if (!resp.ok) throw new Error('Failed to fetch filials');
      setFilials(await resp.json());
    } catch (e) {
      setError('Ошибка загрузки филиалов');
    } finally {
      setLoading(false);
    }
  };

  const fetchOrganizations = async (filialId: string) => {
    setLoading(true);
    try {
      const resp = await apiFetch(`/api/organizations/${filialId}`);
      if (!resp.ok) throw new Error('Failed to fetch organizations');
      setOrganizations(await resp.json());
    } catch (e) {
      setError('Ошибка загрузки организаций');
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const resp = await apiFetch(`/api/departments`);
      if (resp.ok) setDepartments(await resp.json());
    } catch (e) {}
  };

  const handleFilialSelect = (f: LookupItem) => {
    setSelectedFilial(f);
    fetchOrganizations(f.id);
    setSearch('');
    setStep('organization');
  };

  const handleOrgSelect = (o: LookupItem) => {
    setSelectedOrg(o);
    setSearch('');
    setStep('department');
  };

  const handleDeptSelect = (d: LookupItem) => {
    if (selectedOrg) {
      onSelect(selectedOrg.name, d.name);
    }
  };

  const filteredItems = () => {
    let items: LookupItem[] = [];
    if (step === 'filial') items = filials;
    else if (step === 'organization') items = organizations;
    else items = departments;

    if (!search.trim()) return items;
    return items.filter(i => i.name.toLowerCase().includes(search.toLowerCase()));
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h3 className="text-slate-900 font-semibold">
              {step === 'filial' && 'Выбор филиала'}
              {step === 'organization' && 'Выбор организации'}
              {step === 'department' && 'Выбор подразделения'}
            </h3>
            <div className="flex items-center gap-1.5 mt-1">
              <div className={`h-1.5 w-1.5 rounded-full ${step === 'filial' ? 'bg-blue-600' : 'bg-slate-300'}`} />
              <div className={`h-1.5 w-1.5 rounded-full ${step === 'organization' ? 'bg-blue-600' : 'bg-slate-300'}`} />
              <div className={`h-1.5 w-1.5 rounded-full ${step === 'department' ? 'bg-blue-600' : 'bg-slate-300'}`} />
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>

        {/* Breadcrumbs */}
        {step !== 'filial' && (
          <div className="px-4 py-2 bg-blue-50/50 border-b border-blue-100 flex items-center gap-2 text-xs overflow-x-auto whitespace-nowrap">
            <button onClick={() => setStep('filial')} className="text-blue-600 hover:underline">Филиалы</button>
            <ChevronRight size={12} className="text-slate-400" />
            {selectedFilial && (
              <>
                <button onClick={() => setStep('organization')} className="text-blue-600 hover:underline font-medium">
                  {selectedFilial.name}
                </button>
                {selectedOrg && (
                  <>
                    <ChevronRight size={12} className="text-slate-400" />
                    <span className="text-slate-600 font-medium">{selectedOrg.name}</span>
                  </>
                )}
              </>
            )}
          </div>
        )}

        {/* Search */}
        <div className="p-4 border-b border-slate-100">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              autoFocus
              type="text"
              placeholder="Поиск по названию..."
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
              <p className="text-sm">Загрузка данных...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-20 text-red-500 px-10 text-center">
              <AlertCircle className="mb-3" size={32} />
              <p className="text-sm font-medium">{error}</p>
              <button onClick={() => step === 'filial' ? fetchFilials() : fetchOrganizations(selectedFilial!.id)}
                className="mt-4 px-4 py-2 bg-red-50 hover:bg-red-100 rounded-lg text-xs transition-colors">
                Попробовать снова
              </button>
            </div>
          ) : filteredItems().length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <Building2 className="mb-3 opacity-20" size={48} />
              <p className="text-sm italic">Ничего не найдено</p>
            </div>
          ) : (
            <div className="space-y-1">
              {filteredItems().map(item => (
                <button
                  key={item.id}
                  onClick={() => {
                    if (step === 'filial') handleFilialSelect(item);
                    else if (step === 'organization') handleOrgSelect(item);
                    else handleDeptSelect(item);
                  }}
                  className="w-full flex items-center justify-between p-3 hover:bg-blue-50 rounded-xl group transition-all text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
                      {step === 'department' ? <MapPin size={20} /> : <Building2 size={20} />}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-700 group-hover:text-blue-700">{item.name}</p>
                      <p className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
                        {step === 'filial' && 'ID: ' + item.id}
                        {step === 'organization' && 'Предприятие'}
                        {step === 'department' && 'Подразделение'}
                      </p>
                    </div>
                  </div>
                  <ChevronRight size={18} className="text-slate-300 group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <p className="text-[11px] text-slate-400 italic">
            {step === 'filial' && 'Выберите основной филиал'}
            {step === 'organization' && 'Выберите организацию внутри филиала'}
            {step === 'department' && 'Укажите конкретный цех или отдел'}
          </p>
          <button onClick={onClose} className="px-4 py-2 text-sm text-slate-600 hover:text-slate-900 font-medium">
            Отмена
          </button>
        </div>
      </div>
    </div>
  );
}
