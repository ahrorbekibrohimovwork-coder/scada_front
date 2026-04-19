import React from 'react';
import { CheckCircle2, Clock } from 'lucide-react';
import type { EDSSignature } from '../../types';

interface Props {
  sig?: EDSSignature;
  pendingLabel?: string;
  compact?: boolean;
}

const fmtDT = (iso: string) =>
  new Date(iso).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' });

export function SignatureCell({ sig, pendingLabel = 'Ожидается', compact }: Props) {
  if (!sig) {
    const isNotRequired = pendingLabel === 'Не требуется';
    return (
      <div className={`flex items-center gap-1.5 ${isNotRequired ? 'text-gray-300' : 'text-amber-500'}`}>
        {isNotRequired
          ? <span className="text-xs text-gray-300">Не требуется</span>
          : <><Clock size={12} className="flex-shrink-0" /><span className="text-xs">{pendingLabel}</span></>
        }
      </div>
    );
  }

  if (compact) {
    return (
      <div>
        <div className="flex items-center gap-1.5">
          <CheckCircle2 size={11} className="text-emerald-600 flex-shrink-0" />
          <span className="text-xs text-gray-700 font-medium">{sig.userName.split(' ').slice(0, 2).join(' ')}</span>
        </div>
        <p className="text-[10px] text-gray-400 mt-0.5 pl-4">{fmtDT(sig.timestamp)}</p>
      </div>
    );
  }

  return (
    <div className="border border-emerald-200 bg-emerald-50 rounded p-2">
      <div className="flex items-center gap-1.5 mb-1">
        <CheckCircle2 size={12} className="text-emerald-600 flex-shrink-0" />
        <span className="text-xs font-semibold text-emerald-800">Подписано ЭЦП</span>
      </div>
      <p className="text-gray-700 text-xs font-medium">{sig.userName}</p>
      <p className="text-gray-500 text-[10px]">{sig.userPosition} · Гр.{sig.userGroup}</p>
      <p className="text-gray-400 text-[10px] mt-0.5 font-mono">{fmtDT(sig.timestamp)}</p>
    </div>
  );
}
