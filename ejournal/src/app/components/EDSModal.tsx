import React, { useState } from 'react';
import { Shield, CheckCircle2, X } from 'lucide-react';
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

export function EDSModal({ user, title, description, extraFields, requireComment, commentLabel, commentPlaceholder, onSign, onCancel, signLabel = 'Подписать ЭЦП', danger }: Props) {
  const [comment, setComment] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const now = new Date();

  const canSign = !requireComment || comment.trim().length > 0;

  const handleSign = () => {
    if (!canSign || !confirmed) return;
    const sig: EDSSignature = {
      userId: user.id, userName: user.name,
      userPosition: user.position, userGroup: user.electricalGroup,
      timestamp: now.toISOString(),
    };
    onSign(sig, comment);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-md w-full border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className={`px-5 py-4 flex items-center justify-between ${danger ? 'bg-red-700' : 'bg-gray-900'}`}>
          <div className="flex items-center gap-3">
            <Shield size={16} className="text-white/70" />
            <div>
              <p className="text-white text-sm font-semibold">{title}</p>
              <p className="text-white/50 text-xs">Электронная цифровая подпись (ЭЦП)</p>
            </div>
          </div>
          <button onClick={onCancel} className="text-white/50 hover:text-white transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <p className="text-gray-600 text-sm leading-relaxed">{description}</p>

          {/* Signer */}
          <div className="bg-gray-50 border border-gray-200 rounded p-3">
            <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold mb-2">Подписант</p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'Ф.И.О.', value: user.name },
                { label: 'Должность', value: user.position },
                { label: 'Группа ЭБ', value: user.electricalGroup },
                { label: 'Дата и время', value: now.toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' }) },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p className="text-[10px] text-gray-400">{label}</p>
                  <p className="text-gray-800 text-xs font-medium">{value}</p>
                </div>
              ))}
            </div>
          </div>

          {extraFields}

          {(requireComment || commentLabel) && (
            <div>
              <label className="text-xs text-gray-600 mb-1 block">{commentLabel || 'Комментарий'}{requireComment && ' *'}</label>
              <textarea value={comment} onChange={e => setComment(e.target.value)}
                placeholder={commentPlaceholder || 'Введите комментарий...'}
                rows={3}
                className="w-full px-3 py-2 border border-gray-200 rounded text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-800 resize-none bg-gray-50" />
              {requireComment && !comment.trim() && <p className="text-red-500 text-xs mt-1">Обязательное поле</p>}
            </div>
          )}

          <label className="flex items-start gap-2.5 cursor-pointer select-none">
            <input type="checkbox" checked={confirmed} onChange={e => setConfirmed(e.target.checked)}
              className="mt-0.5 w-3.5 h-3.5 border-gray-300 rounded" />
            <span className="text-gray-500 text-xs leading-relaxed">
              Подтверждаю достоверность подписываемых данных и принимаю юридическую ответственность за подписанный документ
            </span>
          </label>

          <div className="flex gap-2 pt-1">
            <button onClick={onCancel}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-600 rounded text-sm hover:bg-gray-50 transition-colors">
              Отмена
            </button>
            <button onClick={handleSign} disabled={!confirmed || !canSign}
              className={`flex-1 px-4 py-2 text-white rounded text-sm transition-all flex items-center justify-center gap-2 ${
                !confirmed || !canSign ? 'bg-gray-300 cursor-not-allowed' : danger ? 'bg-red-700 hover:bg-red-800' : 'bg-gray-900 hover:bg-black'
              }`}>
              <CheckCircle2 size={14} />
              {signLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
