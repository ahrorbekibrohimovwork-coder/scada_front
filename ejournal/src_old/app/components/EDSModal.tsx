import React, { useState } from 'react';
import { Shield, CheckCircle2, X, Clock } from 'lucide-react';
import type { User, EDSSignature } from '../types';

interface Props {
  user: User;
  title: string;
  description: string;
  extraFields?: React.ReactNode;
  requireComment?: boolean;
  commentLabel?: string;
  commentPlaceholder?: string;
  onSign: (sig: EDSSignature, comment: string) => void;
  onCancel: () => void;
  signLabel?: string;
  danger?: boolean;
}

export function EDSModal({
  user, title, description, extraFields,
  requireComment, commentLabel, commentPlaceholder,
  onSign, onCancel, signLabel = 'Подписать ЭЦП', danger,
}: Props) {
  const [comment, setComment] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const now = new Date();

  const canSign = !requireComment || comment.trim().length > 0;

  const handleSign = () => {
    if (!canSign) return;
    const sig: EDSSignature = {
      userId: user.id,
      userName: user.name,
      userPosition: user.position,
      userGroup: user.electricalGroup,
      timestamp: now.toISOString(),
    };
    onSign(sig, comment);
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className={`px-6 py-4 flex items-start justify-between gap-3 ${danger ? 'bg-red-600' : 'bg-slate-800'}`}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0">
              <Shield size={18} className="text-white" />
            </div>
            <div>
              <h3 className="text-white text-sm font-semibold">{title}</h3>
              <p className="text-white/70 text-xs">Электронная цифровая подпись</p>
            </div>
          </div>
          <button onClick={onCancel} className="text-white/60 hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Description */}
          <p className="text-slate-600 text-sm">{description}</p>

          {/* Signer info */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wide mb-3">Сведения о подписанте</p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2">
              {[
                { label: 'Ф.И.О.', value: user.name },
                { label: 'Должность', value: user.position },
                { label: 'Группа ЭБ', value: user.electricalGroup },
                { label: 'Подразделение', value: user.department },
                {
                  label: 'Дата и время',
                  value: now.toLocaleString('ru-RU', {
                    day: '2-digit', month: '2-digit', year: '2-digit',
                    hour: '2-digit', minute: '2-digit',
                  }),
                },
              ].map(({ label, value }) => (
                <div key={label} className="col-span-2 sm:col-span-1">
                  <p className="text-slate-400 text-xs">{label}</p>
                  <p className="text-slate-800 text-sm font-medium">{value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Extra fields slot */}
          {extraFields}

          {/* Comment */}
          {(requireComment || commentLabel) && (
            <div>
              <label className="text-sm text-slate-700 mb-1.5 block">
                {commentLabel || 'Комментарий'}{requireComment && ' *'}
              </label>
              <textarea
                value={comment}
                onChange={e => setComment(e.target.value)}
                placeholder={commentPlaceholder || 'Введите комментарий...'}
                rows={3}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
              {requireComment && !comment.trim() && (
                <p className="text-red-500 text-xs mt-1">Комментарий обязателен</p>
              )}
            </div>
          )}

          {/* Confirm checkbox */}
          <label className="flex items-start gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={e => setConfirmed(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded border-slate-300 text-blue-600 cursor-pointer"
            />
            <span className="text-slate-600 text-xs">
              Подтверждаю достоверность подписываемых данных и принимаю юридическую ответственность за подписанный документ
            </span>
          </label>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-2.5 border border-slate-300 text-slate-700 rounded-lg text-sm hover:bg-slate-50 transition-colors"
            >
              Отмена
            </button>
            <button
              onClick={handleSign}
              disabled={!confirmed || !canSign}
              className={`flex-1 px-4 py-2.5 text-white rounded-lg text-sm transition-all flex items-center justify-center gap-2 ${
                !confirmed || !canSign
                  ? 'bg-slate-300 cursor-not-allowed'
                  : danger
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-slate-800 hover:bg-slate-900'
              }`}
            >
              <CheckCircle2 size={15} />
              {signLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
