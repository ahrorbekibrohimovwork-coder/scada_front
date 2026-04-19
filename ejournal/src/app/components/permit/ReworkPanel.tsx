import React, { useState } from 'react';
import { Plus, X, Save, Shield, AlertTriangle, Edit3 } from 'lucide-react';

interface Props {
  initialMeasures: string[];
  initialInstructions: string;
  lastComment: string;
  onSave: (measures: string[], instructions: string) => void;
  onSign: () => void;
}

export function ReworkPanel({ initialMeasures, initialInstructions, lastComment, onSave, onSign }: Props) {
  const [measures, setMeasures] = useState<string[]>(initialMeasures.length ? initialMeasures : ['']);
  const [instructions, setInstructions] = useState(initialInstructions);
  const [saved, setSaved] = useState(false);

  const addMeasure = () => { setMeasures(p => [...p, '']); setSaved(false); };
  const setMeasure = (i: number, v: string) => { setMeasures(p => p.map((m, idx) => idx === i ? v : m)); setSaved(false); };
  const removeMeasure = (i: number) => { setMeasures(p => p.filter((_, idx) => idx !== i)); setSaved(false); };

  const handleSave = () => {
    onSave(measures.filter(m => m.trim()), instructions);
    setSaved(true);
  };

  return (
    <div className="border border-orange-200 bg-orange-50 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 bg-orange-100 border-b border-orange-200 flex items-center gap-2">
        <Edit3 size={14} className="text-orange-700" />
        <span className="text-orange-800 text-sm font-semibold">Режим доработки наряда</span>
      </div>

      {/* Return comment */}
      <div className="px-4 py-3 border-b border-orange-200">
        <p className="text-[10px] text-orange-600 uppercase font-semibold tracking-wide mb-1">Комментарий диспетчера</p>
        <div className="flex items-start gap-2">
          <AlertTriangle size={13} className="text-orange-500 mt-0.5 flex-shrink-0" />
          <p className="text-orange-900 text-sm">{lastComment}</p>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Safety measures */}
        <div>
          <p className="text-xs text-gray-600 font-semibold uppercase tracking-wide mb-2">Меры по подготовке рабочих мест</p>
          <div className="space-y-2">
            {measures.map((m, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="w-5 text-xs text-gray-400 text-right flex-shrink-0">{i + 1}.</span>
                <input value={m} onChange={e => setMeasure(i, e.target.value)}
                  placeholder={`Мера безопасности ${i + 1}`}
                  className="flex-1 px-2.5 py-2 border border-gray-200 rounded text-sm bg-white focus:outline-none focus:ring-1 focus:ring-gray-800" />
                <button onClick={() => removeMeasure(i)} className="text-gray-400 hover:text-red-500 transition-colors p-1">
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
          <button onClick={addMeasure}
            className="flex items-center gap-1.5 mt-2 text-sm text-gray-600 hover:text-gray-900 px-2.5 py-1.5 border border-dashed border-gray-300 rounded hover:border-gray-400 transition-colors">
            <Plus size={13} /> Добавить запись
          </button>
        </div>

        {/* Special instructions */}
        <div>
          <label className="text-xs text-gray-600 font-semibold uppercase tracking-wide mb-1.5 block">Особые указания</label>
          <textarea value={instructions} onChange={e => { setInstructions(e.target.value); setSaved(false); }} rows={2}
            placeholder="Особые требования безопасности..."
            className="w-full px-3 py-2 border border-gray-200 rounded text-sm bg-white focus:outline-none focus:ring-1 focus:ring-gray-800 resize-none" />
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-1 border-t border-orange-200">
          <button onClick={handleSave}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 bg-white rounded text-sm hover:bg-gray-50 transition-colors">
            <Save size={14} /> Сохранить
          </button>
          <button onClick={onSign} disabled={!saved}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 text-white rounded text-sm transition-all ${
              saved ? 'bg-gray-900 hover:bg-black' : 'bg-gray-300 cursor-not-allowed'
            }`}>
            <Shield size={14} />
            {saved ? 'Подписать ЭЦП и выдать' : 'Сначала сохраните изменения'}
          </button>
        </div>
        {!saved && (
          <p className="text-xs text-orange-600 flex items-center gap-1">
            <AlertTriangle size={11} /> Нажмите «Сохранить» перед подписанием ЭЦП
          </p>
        )}
      </div>
    </div>
  );
}
