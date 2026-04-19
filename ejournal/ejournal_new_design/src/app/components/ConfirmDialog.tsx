import React, { useEffect, useCallback } from 'react';
import { X, AlertTriangle, Shield, CheckCircle2 } from 'lucide-react';

export type ConfirmDialogType = 'confirm' | 'danger' | 'signature';

export interface ConfirmDialogProps {
  open: boolean;
  type?: ConfirmDialogType;
  /** Заголовок окна, по умолчанию "Подтверждение действия" */
  title?: string;
  /** Основной текст */
  message: string;
  /** Дополнительная строка (мелкий красный текст для danger) */
  detail?: string;
  /** Номер наряда для отображения в окне */
  permitNumber?: string;
  /** Текст кнопки подтверждения */
  confirmLabel?: string;
  /** Текст кнопки отмены */
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const TYPE_CFG = {
  confirm: {
    icon: CheckCircle2,
    iconColor: 'text-blue-600',
    iconBg: 'bg-blue-50',
    headerBg: 'bg-gray-900',
    btnClass: 'bg-blue-700 hover:bg-blue-800 text-white',
    defaultLabel: 'Подтвердить',
  },
  danger: {
    icon: AlertTriangle,
    iconColor: 'text-red-600',
    iconBg: 'bg-red-50',
    headerBg: 'bg-red-700',
    btnClass: 'bg-red-700 hover:bg-red-800 text-white',
    defaultLabel: 'Подтвердить',
  },
  signature: {
    icon: Shield,
    iconColor: 'text-gray-700',
    iconBg: 'bg-gray-100',
    headerBg: 'bg-gray-900',
    btnClass: 'bg-gray-900 hover:bg-black text-white',
    defaultLabel: 'Подтвердить',
  },
} as const;

export function ConfirmDialog({
  open,
  type = 'confirm',
  title,
  message,
  detail,
  permitNumber,
  confirmLabel,
  cancelLabel = 'Отмена',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const cfg = TYPE_CFG[type];
  const Icon = cfg.icon;

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    },
    [onCancel],
  );

  useEffect(() => {
    if (!open) return;
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, handleKeyDown]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      aria-modal="true"
      role="dialog"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"
        onClick={onCancel}
      />

      {/* Dialog */}
      <div className="relative bg-white rounded-lg shadow-2xl w-full max-w-[420px] border border-gray-200 overflow-hidden">

        {/* Header */}
        <div className={`${cfg.headerBg} px-5 py-3.5 flex items-center justify-between`}>
          <div className="flex items-center gap-2.5">
            <Icon size={15} className="text-white/70" />
            <div>
              <p className="text-white text-sm">
                {title ?? 'Подтверждение действия'}
              </p>
              {permitNumber && (
                <p className="text-white/40 text-[10px] mt-0.5 font-mono">
                  Наряд-допуск НД-{permitNumber}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onCancel}
            className="text-white/40 hover:text-white transition-colors p-0.5 rounded"
          >
            <X size={15} />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-5">
          {/* Icon + message */}
          <div className="flex items-start gap-4 mb-5">
            <div className={`w-10 h-10 rounded-full ${cfg.iconBg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
              <Icon size={18} className={cfg.iconColor} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-gray-900 text-sm leading-relaxed">{message}</p>
              {detail && (
                <p className={`text-xs mt-2 leading-relaxed ${type === 'danger' ? 'text-red-600' : 'text-gray-500'}`}>
                  {detail}
                </p>
              )}
            </div>
          </div>

          {/* Warning banner for danger */}
          {type === 'danger' && (
            <div className="flex items-start gap-2.5 px-3 py-2.5 bg-red-50 border border-red-200 rounded mb-5">
              <AlertTriangle size={13} className="text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-red-700 text-xs leading-relaxed">
                Убедитесь, что вы понимаете последствия данного действия. Операцию нельзя отменить.
              </p>
            </div>
          )}

          {/* Signature info banner */}
          {type === 'signature' && (
            <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded mb-5">
              <Shield size={12} className="text-gray-500 flex-shrink-0" />
              <p className="text-gray-600 text-xs">
                После подтверждения потребуется ввод электронной цифровой подписи (ЭЦП)
              </p>
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-2.5">
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-600 text-sm rounded hover:bg-gray-50 transition-colors"
            >
              {cancelLabel}
            </button>
            <button
              onClick={onConfirm}
              className={`flex-1 px-4 py-2.5 text-sm rounded transition-colors flex items-center justify-center gap-2 ${cfg.btnClass}`}
            >
              <Icon size={13} />
              {confirmLabel ?? cfg.defaultLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}