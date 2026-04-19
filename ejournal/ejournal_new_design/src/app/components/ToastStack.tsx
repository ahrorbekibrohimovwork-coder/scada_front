import React, { useEffect, useRef } from 'react';
import { CheckCircle2, XCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
  detail?: string;
}

interface ToastProps {
  item: ToastItem;
  onDismiss: (id: string) => void;
}

const TOAST_CFG = {
  success: {
    icon: CheckCircle2,
    bar: 'bg-emerald-500',
    iconColor: 'text-emerald-500',
    border: 'border-emerald-200',
  },
  error: {
    icon: XCircle,
    bar: 'bg-red-500',
    iconColor: 'text-red-500',
    border: 'border-red-200',
  },
  info: {
    icon: Info,
    bar: 'bg-blue-500',
    iconColor: 'text-blue-500',
    border: 'border-blue-200',
  },
};

const DURATION = 3800;

function Toast({ item, onDismiss }: ToastProps) {
  const cfg = TOAST_CFG[item.type];
  const Icon = cfg.icon;
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    timerRef.current = setTimeout(() => onDismiss(item.id), DURATION);
    return () => clearTimeout(timerRef.current);
  }, [item.id, onDismiss]);

  return (
    <div
      className={`relative bg-white border ${cfg.border} rounded-lg shadow-lg overflow-hidden
        w-[340px] flex items-start gap-3 px-4 py-3
        animate-[toast-in_0.25s_ease-out]`}
      style={{ animation: 'toast-in 0.22s cubic-bezier(0.16,1,0.3,1)' }}
    >
      {/* Progress bar */}
      <div
        ref={barRef}
        className={`absolute bottom-0 left-0 h-[2px] ${cfg.bar}`}
        style={{
          width: '100%',
          animation: `toast-bar ${DURATION}ms linear forwards`,
        }}
      />

      <Icon size={16} className={`${cfg.iconColor} flex-shrink-0 mt-0.5`} />

      <div className="flex-1 min-w-0">
        <p className="text-gray-900 text-sm leading-snug">{item.message}</p>
        {item.detail && (
          <p className="text-gray-500 text-xs mt-0.5 leading-snug">{item.detail}</p>
        )}
      </div>

      <button
        onClick={() => onDismiss(item.id)}
        className="text-gray-300 hover:text-gray-600 transition-colors flex-shrink-0 ml-1"
      >
        <X size={13} />
      </button>
    </div>
  );
}

interface StackProps {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}

export function ToastStack({ toasts, onDismiss }: StackProps) {
  return (
    <>
      {/* Keyframe styles injected once */}
      <style>{`
        @keyframes toast-in {
          from { opacity: 0; transform: translateX(32px) scale(0.95); }
          to   { opacity: 1; transform: translateX(0)   scale(1); }
        }
        @keyframes toast-bar {
          from { width: 100%; }
          to   { width: 0%; }
        }
      `}</style>

      <div
        className="fixed bottom-5 right-5 z-[300] flex flex-col gap-2 items-end pointer-events-none"
        aria-live="polite"
      >
        {toasts.map(t => (
          <div key={t.id} className="pointer-events-auto">
            <Toast item={t} onDismiss={onDismiss} />
          </div>
        ))}
      </div>
    </>
  );
}

/* ── Hook helper ──────────────────────────────────────────────────────────── */
let _toastId = 0;

export function useToast() {
  const [toasts, setToasts] = React.useState<ToastItem[]>([]);

  const push = React.useCallback((message: string, type: ToastType = 'success', detail?: string) => {
    const id = `toast_${++_toastId}`;
    setToasts(prev => [...prev, { id, message, type, detail }]);
  }, []);

  const dismiss = React.useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return { toasts, push, dismiss };
}
