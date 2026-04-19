import React, { useState, useEffect } from 'react';
import { X, Calendar, AlertTriangle, CheckCircle2, RefreshCw, Info } from 'lucide-react';

interface Props {
  currentEndDateTime: string;
  extensionCount: number;
  onClose: () => void;
  onExtend: (newEndDateTime: string) => void;
}

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' });

export function ExtendPermitModal({ currentEndDateTime, extensionCount, onClose, onExtend }: Props) {
  const [newEndDate, setNewEndDate] = useState('');
  const [error, setError] = useState('');

  // Calculate limits - максимум 15 дней от ТЕКУЩЕЙ даты
  const currentEnd = new Date(currentEndDateTime);
  const today = new Date();
  const maxEndDate = new Date(today);
  maxEndDate.setDate(maxEndDate.getDate() + 15);

  // Extension already used
  const alreadyExtended = extensionCount > 0;

  useEffect(() => {
    if (!alreadyExtended) {
      // Default to current date + 7 days
      const defaultDate = new Date(today);
      defaultDate.setDate(defaultDate.getDate() + 7);
      setNewEndDate(defaultDate.toISOString().slice(0, 16));
    }
  }, []);

  const validateAndExtend = () => {
    if (alreadyExtended) {
      setError('Продление уже использовано. Наряд можно продлить только один раз.');
      return;
    }

    if (!newEndDate) {
      setError('Укажите новую дату окончания');
      return;
    }

    const selectedDate = new Date(newEndDate);

    // Check if before today
    if (selectedDate <= today) {
      setError('Новая дата должна быть в будущем');
      return;
    }

    // Check 15-day limit from today
    if (selectedDate > maxEndDate) {
      setError(`Превышен лимит 15 дней от текущей даты. Максимальная дата: ${fmtDate(maxEndDate.toISOString())}`);
      return;
    }

    // All good
    onExtend(selectedDate.toISOString());
  };

  const extensionDays = newEndDate
    ? Math.ceil((new Date(newEndDate).getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-lg w-full border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 bg-orange-600 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <RefreshCw size={16} className="text-white" />
            <h3 className="text-white text-base font-semibold">Продление наряда-допуска</h3>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Current info */}
          <div className="bg-gray-50 border border-gray-200 rounded p-3 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500">Текущее окончание:</span>
              <span className="text-xs text-gray-900 font-mono font-semibold">{fmtDate(currentEndDateTime)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500">Продлений ранее:</span>
              <span className={`text-xs font-semibold ${alreadyExtended ? 'text-red-600' : 'text-gray-900'}`}>
                {extensionCount} {alreadyExtended && '(ЛИМИТ)'}
              </span>
            </div>
          </div>

          {/* Extension limit warning */}
          {alreadyExtended ? (
            <div className="bg-red-50 border border-red-200 rounded p-3 flex items-start gap-2">
              <AlertTriangle size={14} className="text-red-600 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-red-800">
                <p className="font-semibold mb-1">Продление уже использовано</p>
                <p>Наряд-допуск можно продлить только один раз. Для продолжения работ необходимо оформить новый наряд.</p>
              </div>
            </div>
          ) : (
            <div className="bg-amber-50 border border-amber-200 rounded p-3 flex items-start gap-2">
              <Info size={14} className="text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-amber-800">
                <p className="font-semibold mb-1">Ограничение: максимум 15 дней от текущей даты</p>
                <p className="mt-1">Максимальная дата продления: <span className="font-mono font-semibold">{fmtDate(maxEndDate.toISOString())}</span></p>
                <p className="mt-1 text-amber-700">⚠️ Наряд можно продлить только один раз</p>
              </div>
            </div>
          )}

          {/* Date input */}
          {!alreadyExtended && (
            <div>
              <label className="text-xs text-gray-600 font-semibold mb-2 block flex items-center gap-1.5">
                <Calendar size={12} />
                Новая дата и время окончания работ *
              </label>
              <input
                type="datetime-local"
                value={newEndDate}
                onChange={(e) => {
                  setNewEndDate(e.target.value);
                  setError('');
                }}
                min={new Date().toISOString().slice(0, 16)}
                max={maxEndDate.toISOString().slice(0, 16)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded text-sm font-mono focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>
          )}

          {/* Preview */}
          {newEndDate && !error && !alreadyExtended && (
            <div className="bg-blue-50 border border-blue-200 rounded p-3">
              <div className="flex items-center gap-2 mb-2">
                <Info size={12} className="text-blue-600" />
                <p className="text-xs font-semibold text-blue-800">Предварительный расчёт</p>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-blue-700">Новая дата окончания:</span>
                  <span className="text-xs text-blue-900 font-mono font-bold">{fmtDate(newEndDate)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-blue-700">Продление на:</span>
                  <span className="text-xs text-blue-900 font-bold">+{extensionDays} дн. от сегодня</span>
                </div>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded p-3 flex items-start gap-2">
              <AlertTriangle size={14} className="text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-red-700 font-medium">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              {alreadyExtended ? 'Закрыть' : 'Отмена'}
            </button>
            {!alreadyExtended && (
              <button
                onClick={validateAndExtend}
                disabled={!newEndDate || !!error}
                className="flex-1 px-4 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <CheckCircle2 size={14} />
                Продлить наряд
              </button>
            )}
          </div>

          {/* Info footer */}
          <div className="bg-gray-50 border border-gray-200 rounded p-2.5">
            <p className="text-[10px] text-gray-500 flex items-start gap-1.5">
              <Info size={10} className="flex-shrink-0 mt-0.5" />
              После продления потребуется подпись ЭЦП выдающего наряд-допуск
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
