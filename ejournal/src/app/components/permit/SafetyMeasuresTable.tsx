import React, { useState, useRef, useEffect } from 'react';
import { Trash2, Plus, AlertCircle, Eye, Edit3, CheckCircle2 } from 'lucide-react';

/* ─── Types ─────────────────────────────────────────────────────────────── */
export interface SafetyMeasureRow {
  id: string;
  installation: string;
  measures: string;
  _errInstallation?: string;
  _errMeasures?: string;
}

interface Props {
  rows: SafetyMeasureRow[];
  onChange: (rows: SafetyMeasureRow[]) => void;
  /** true = нельзя редактировать (наряд подписан) */
  locked?: boolean;
  /** принудительный режим извне (если не задан — управляется кнопкой внутри) */
  mode?: 'edit' | 'view';
}

/* ─── Helpers ────────────────────────────────────────────────────────────── */
let _seq = 100;
export const makeSafetyRow = (): SafetyMeasureRow =>
  ({ id: `sm_${++_seq}`, installation: '', measures: '' });

function runValidation(rows: SafetyMeasureRow[]): SafetyMeasureRow[] {
  return rows.map(r => ({
    ...r,
    _errInstallation: r.installation.trim() ? undefined : 'Обязательное поле',
    _errMeasures:     r.measures.trim()     ? undefined : 'Обязательное поле',
  }));
}

/* ─── Auto-resize textarea ───────────────────────────────────────────────── */
function AutoTextarea({
  value, onChange, placeholder, hasError, readOnly,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  hasError: boolean;
  readOnly: boolean;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);

  const resize = () => {
    if (!ref.current) return;
    ref.current.style.height = 'auto';
    ref.current.style.height = ref.current.scrollHeight + 'px';
  };

  useEffect(() => { resize(); }, [value]);

  if (readOnly) {
    return (
      <p className={`text-sm leading-relaxed py-2.5 px-3 min-h-[42px] ${value ? 'text-gray-900' : 'text-gray-300 italic'}`}>
        {value || '—'}
      </p>
    );
  }

  return (
    <textarea
      ref={ref}
      value={value}
      onChange={e => { onChange(e.target.value); resize(); }}
      placeholder={placeholder}
      rows={2}
      className={`w-full resize-none px-3 py-2.5 text-sm text-gray-900 bg-transparent
        placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-inset leading-relaxed
        ${hasError ? 'focus:ring-red-300' : 'focus:ring-blue-300'}`}
      style={{ minHeight: 42, overflow: 'hidden' }}
    />
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Main component
═══════════════════════════════════════════════════════════════════════════ */
export function SafetyMeasuresTable({ rows, onChange, locked = false, mode: modeProp }: Props) {
  const [internalMode, setInternalMode] = useState<'edit' | 'view'>('edit');
  const [validated, setValidated] = useState(false);

  const mode = locked ? 'view' : (modeProp ?? internalMode);
  const isEdit = mode === 'edit';

  /* strip validation errors from exported rows */
  const emit = (next: SafetyMeasureRow[]) =>
    onChange(next.map(({ _errInstallation, _errMeasures, ...r }) => r));

  const update = (id: string, field: 'installation' | 'measures', val: string) => {
    const next = rows.map(r => r.id === id ? { ...r, [field]: val } : r);
    emit(validated ? runValidation(next) : next);
  };

  const addRow = () => emit([...rows, makeSafetyRow()]);

  const deleteRow = (id: string) => {
    const next = rows.filter(r => r.id !== id);
    emit(next.length ? next : [makeSafetyRow()]);
  };

  const handleSave = () => {
    const checked = runValidation(rows);
    const hasErr = checked.some(r => r._errInstallation || r._errMeasures);
    setValidated(true);
    onChange(checked); // keep errors in state for display
    if (!hasErr && !modeProp) setInternalMode('view');
    return !hasErr;
  };

  const errorCount = validated ? rows.filter(r => r._errInstallation || r._errMeasures).length : 0;

  return (
    <div className="w-full border border-gray-300 bg-white overflow-hidden">

      {/* ── Column headers ──────────────────────────────────────────────── */}
      <table className="w-full border-collapse table-fixed">
        <colgroup>
          <col style={{ width: 36 }} />
          <col style={{ width: '50%' }} />
          <col style={{ width: '50%' }} />
          {isEdit && <col style={{ width: 36 }} />}
        </colgroup>

        {/* Header row */}
        <thead>
          <tr className="bg-gray-100 border-b-2 border-gray-400">
            <th className="border-r border-gray-300 py-2 text-center">
              <span className="text-[10px] text-gray-500 font-semibold">№</span>
            </th>
            <th className="border-r border-gray-300 px-3 py-2.5 text-left align-top">
              <p className="text-xs text-gray-800 leading-snug">
                Наименование электроустановок, в которых необходимо
                произвести отключения и установить заземления
              </p>
              <span className="mt-1 inline-block text-[9px] text-gray-400 font-mono bg-gray-200 px-1 rounded">колонка 1</span>
            </th>
            <th className={`px-3 py-2.5 text-left align-top ${isEdit ? 'border-r border-gray-300' : ''}`}>
              <p className="text-xs text-gray-800 leading-snug">
                Что должно быть отключено и где должны
                быть установлены заземления
              </p>
              <span className="mt-1 inline-block text-[9px] text-gray-400 font-mono bg-gray-200 px-1 rounded">колонка 2</span>
            </th>
            {isEdit && <th />}
          </tr>
        </thead>

        {/* Rows */}
        <tbody>
          {rows.map((row, idx) => {
            const e1 = validated && !!row._errInstallation;
            const e2 = validated && !!row._errMeasures;
            return (
              <tr
                key={row.id}
                className="border-b border-gray-200 last:border-b-0 align-top group"
              >
                {/* № */}
                <td className="border-r border-gray-200 text-center py-2.5 bg-gray-50">
                  <span className="text-[11px] text-gray-400 font-mono">{idx + 1}</span>
                </td>

                {/* Колонка 1 */}
                <td className={`border-r border-gray-200 p-0 ${e1 ? 'bg-red-50' : 'bg-white'}`}>
                  <AutoTextarea
                    value={row.installation}
                    onChange={v => update(row.id, 'installation', v)}
                    placeholder="Введите наименование электроустановки"
                    hasError={e1}
                    readOnly={!isEdit}
                  />
                  {e1 && (
                    <p className="flex items-center gap-1 text-red-500 text-[10px] px-3 pb-1.5">
                      <AlertCircle size={9} /> {row._errInstallation}
                    </p>
                  )}
                </td>

                {/* Колонка 2 */}
                <td className={`p-0 ${isEdit ? 'border-r border-gray-200' : ''} ${e2 ? 'bg-red-50' : 'bg-white'}`}>
                  <AutoTextarea
                    value={row.measures}
                    onChange={v => update(row.id, 'measures', v)}
                    placeholder="Опишите отключения и заземления"
                    hasError={e2}
                    readOnly={!isEdit}
                  />
                  {e2 && (
                    <p className="flex items-center gap-1 text-red-500 text-[10px] px-3 pb-1.5">
                      <AlertCircle size={9} /> {row._errMeasures}
                    </p>
                  )}
                </td>

                {/* Delete */}
                {isEdit && (
                  <td className="text-center bg-gray-50 py-2.5">
                    <button
                      type="button"
                      onClick={() => deleteRow(row.id)}
                      title="Удалить строку"
                      className="p-1.5 rounded text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all
                        opacity-0 group-hover:opacity-100 focus:opacity-100"
                    >
                      <Trash2 size={13} />
                    </button>
                  </td>
                )}
              </tr>
            );
          })}

          {/* Empty state in view mode */}
          {rows.length === 0 && (
            <tr>
              <td colSpan={isEdit ? 4 : 3} className="py-8 text-center text-gray-400 text-sm italic">
                Меры не заполнены
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <div className={`border-t border-gray-300 flex items-center justify-between px-3 py-2 gap-2
        ${isEdit ? 'bg-gray-50' : 'bg-white'}`}
      >
        {/* Left: add button OR row count */}
        {isEdit ? (
          <button
            type="button"
            onClick={addRow}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-600
              border border-dashed border-gray-400 hover:border-gray-600 hover:text-gray-900
              hover:bg-white transition-all rounded"
          >
            <Plus size={12} />
            Добавить запись
          </button>
        ) : (
          <span className="text-[11px] text-gray-400">
            {rows.length} {rows.length === 1 ? 'запись' : rows.length < 5 ? 'записи' : 'записей'}
          </span>
        )}

        {/* Right: validation error count + mode toggle */}
        <div className="flex items-center gap-2">
          {errorCount > 0 && (
            <span className="flex items-center gap-1 text-[10px] text-red-600">
              <AlertCircle size={10} /> {errorCount} незаполн.
            </span>
          )}
          {!locked && !modeProp && (
            isEdit ? (
              <button
                type="button"
                onClick={handleSave}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-gray-800 text-white
                  hover:bg-black transition-colors rounded"
              >
                <CheckCircle2 size={11} />
                Сохранить
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setInternalMode('edit')}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-600
                  border border-gray-300 hover:bg-gray-50 transition-colors rounded"
              >
                <Edit3 size={11} />
                Редактировать
              </button>
            )
          )}
        </div>
      </div>
    </div>
  );
}
