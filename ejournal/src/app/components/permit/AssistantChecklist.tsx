import React, { useState } from 'react';
import {
  CheckCircle2, Circle, AlertCircle, MessageSquare, Save, ChevronDown, ChevronUp,
} from 'lucide-react';
import type { AssistantCheckItem } from '../../types';

interface MeasureRow {
  installation: string;
  measures: string;
}

interface Props {
  rows: MeasureRow[];
  checklist: AssistantCheckItem[];
  onChange?: (checklist: AssistantCheckItem[]) => void;
  onSave?: (checklist: AssistantCheckItem[]) => void;
  /** true = только просмотр (допускающий, остальные) */
  readOnly?: boolean;
  /** показать кнопку «Сохранить чек-лист» */
  showSave?: boolean;
}

export function AssistantChecklist({ rows, checklist, onChange, onSave, readOnly = false, showSave = false }: Props) {
  const [openNote, setOpenNote] = useState<number | null>(null);

  /* Initialize missing items */
  const getItem = (idx: number): AssistantCheckItem =>
    checklist.find(c => c.rowIndex === idx) ?? { rowIndex: idx, checked: false, note: '' };

  const updateItem = (idx: number, patch: Partial<AssistantCheckItem>) => {
    if (readOnly || !onChange) return;
    const next = rows.map((_, i) => {
      const cur = getItem(i);
      return i === idx ? { ...cur, ...patch, checkedAt: patch.checked !== undefined ? new Date().toISOString() : cur.checkedAt } : cur;
    });
    onChange(next);
  };

  const doneCount = rows.filter((_, i) => getItem(i).checked).length;
  const allDone   = doneCount === rows.length;
  const hasIssues = rows.some((_, i) => !getItem(i).checked && getItem(i).note.trim());

  const fmtTime = (iso?: string) => iso
    ? new Date(iso).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
    : '';

  if (rows.length === 0) return (
    <div className="py-6 text-center text-gray-400 text-sm border border-gray-200 rounded-lg">
      Меры безопасности не указаны
    </div>
  );

  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden">

      {/* Header */}
      <div className="px-4 py-2.5 bg-indigo-50 border-b border-indigo-200 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <CheckCircle2 size={14} className="text-indigo-600" />
          <span className="text-xs text-indigo-800 font-semibold uppercase tracking-wider">
            Чек-лист выполнения мер (Помощник ГД)
          </span>
        </div>
        <div className="flex items-center gap-2">
          {hasIssues && (
            <span className="flex items-center gap-1 text-[10px] text-amber-700 bg-amber-100 border border-amber-200 px-2 py-0.5 rounded">
              <AlertCircle size={9} /> Есть замечания
            </span>
          )}
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
            allDone
              ? 'text-emerald-700 bg-emerald-100 border border-emerald-200'
              : 'text-gray-600 bg-gray-100 border border-gray-200'
          }`}>
            {doneCount} / {rows.length} выполнено
          </span>
        </div>
      </div>

      {/* Rows */}
      <div className="divide-y divide-gray-100">
        {rows.map((row, idx) => {
          const item = getItem(idx);
          const noteOpen = openNote === idx;

          return (
            <div key={idx} className={`${item.checked ? 'bg-emerald-50/40' : 'bg-white'} transition-colors`}>

              {/* Main row */}
              <div className="flex items-start gap-3 px-3 py-3">
                {/* Checkbox */}
                <div className="flex-shrink-0 mt-0.5">
                  {readOnly ? (
                    item.checked
                      ? <CheckCircle2 size={18} className="text-emerald-500" />
                      : <Circle size={18} className="text-gray-300" />
                  ) : (
                    <button
                      onClick={() => updateItem(idx, { checked: !item.checked })}
                      className={`w-[18px] h-[18px] rounded border-2 flex items-center justify-center transition-all ${
                        item.checked
                          ? 'bg-emerald-500 border-emerald-500 text-white'
                          : 'border-gray-400 hover:border-emerald-500 bg-white'
                      }`}
                    >
                      {item.checked && <CheckCircle2 size={12} />}
                    </button>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[10px] text-gray-400 font-mono flex-shrink-0">{idx + 1}.</span>
                        <p className={`text-sm leading-snug ${item.checked ? 'text-gray-500 line-through decoration-emerald-400' : 'text-gray-800'}`}>
                          {row.installation || <span className="italic text-gray-400">—</span>}
                        </p>
                      </div>
                      {row.measures && (
                        <p className="text-xs text-gray-500 ml-5 leading-snug">{row.measures}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-1 flex-shrink-0">
                      {/* Timestamp */}
                      {item.checked && item.checkedAt && (
                        <span className="text-[9px] text-emerald-600 font-mono bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                          {fmtTime(item.checkedAt)}
                        </span>
                      )}
                      {/* Note toggle */}
                      {!readOnly && (
                        <button
                          onClick={() => setOpenNote(noteOpen ? null : idx)}
                          title="Добавить примечание"
                          className={`p-1 rounded transition-colors ${
                            item.note ? 'text-amber-600 bg-amber-50' : 'text-gray-400 hover:text-gray-600'
                          }`}
                        >
                          <MessageSquare size={13} />
                        </button>
                      )}
                      {readOnly && item.note && (
                        <button
                          onClick={() => setOpenNote(noteOpen ? null : idx)}
                          className="p-1 rounded text-amber-600 bg-amber-50"
                        >
                          {noteOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Note field */}
                  {noteOpen && (
                    <div className="mt-2 ml-5">
                      {readOnly ? (
                        <div className="px-2.5 py-2 bg-amber-50 border border-amber-200 rounded text-xs text-amber-800 leading-relaxed">
                          <span className="text-[9px] text-amber-600 block mb-0.5 font-semibold uppercase tracking-wide">Примечание Пом. ГД:</span>
                          {item.note}
                        </div>
                      ) : (
                        <textarea
                          value={item.note}
                          onChange={e => updateItem(idx, { note: e.target.value })}
                          placeholder="Примечание: укажите отклонения, причины невыполнения..."
                          rows={2}
                          className="w-full px-2.5 py-2 border border-amber-200 bg-amber-50 rounded text-xs resize-none
                            focus:outline-none focus:ring-1 focus:ring-amber-300 text-gray-800 placeholder-amber-400"
                        />
                      )}
                    </div>
                  )}

                  {/* Read-only: show note inline if any */}
                  {readOnly && !noteOpen && item.note && (
                    <p className="mt-1 ml-5 text-[10px] text-amber-700 italic truncate">
                      Примечание: {item.note}
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className={`px-4 py-2.5 border-t flex items-center justify-between gap-3 ${
        allDone ? 'bg-emerald-50 border-emerald-200' : 'bg-gray-50 border-gray-200'
      }`}>
        <div className="flex items-center gap-2">
          {allDone ? (
            <span className="flex items-center gap-1.5 text-xs text-emerald-700">
              <CheckCircle2 size={13} /> Все меры выполнены
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-xs text-gray-500">
              <Circle size={13} /> {rows.length - doneCount} мер ожидают отметки
            </span>
          )}
        </div>

        {showSave && onSave && !readOnly && (
          <button
            onClick={() => onSave(rows.map((_, i) => getItem(i)))}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-700 hover:bg-indigo-800 text-white text-xs rounded transition-colors"
          >
            <Save size={11} /> Сохранить чек-лист
          </button>
        )}
      </div>
    </div>
  );
}
