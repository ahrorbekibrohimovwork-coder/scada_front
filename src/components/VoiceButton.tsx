import React from 'react';
import { apiFetch } from '../config';

const DASHBOARD_TEXT =
  'Ключевые данные. ' +
  'Выработка за сутки и план: 0,074 миллиона киловатт-часов, план выполнен на 101,8 процента. ' +
  'Состояние агрегатов: Г-1 работает, Г-2 в ремонте. ' +
  'Температура и условия: плюс 22 градуса, условия благоприятные. ' +
  'План и выполнение: плюс 0,22 миллиона киловатт-часов сверх плана. ' +
  'Сверка с 2025 годом: приток воды плюс 37 процентов, годовой показатель плюс 0,6 процента.';

type State = 'idle' | 'loading' | 'playing';

const VoiceButton: React.FC = () => {
  const [state, setState] = React.useState<State>('idle');
  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  const handleClick = async () => {
    if (state === 'playing') {
      audioRef.current?.pause();
      if (audioRef.current) {
        URL.revokeObjectURL(audioRef.current.src);
        audioRef.current = null;
      }
      setState('idle');
      return;
    }

    setState('loading');
    try {
      const res = await apiFetch(
        `/api/tts?text=${encodeURIComponent(DASHBOARD_TEXT)}`
      );
      if (!res.ok) throw new Error('TTS error');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.play();
      setState('playing');
      audio.onended = () => {
        URL.revokeObjectURL(url);
        audioRef.current = null;
        setState('idle');
      };
    } catch {
      setState('idle');
    }
  };

  const icons: Record<State, React.ReactNode> = {
    idle: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
        <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
        <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
      </svg>
    ),
    loading: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5 animate-spin">
        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
      </svg>
    ),
    playing: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <rect x="6" y="4" width="4" height="16" rx="1" />
        <rect x="14" y="4" width="4" height="16" rx="1" />
      </svg>
    ),
  };

  const labels: Record<State, string> = {
    idle: 'Озвучить',
    loading: 'Загрузка...',
    playing: 'Стоп',
  };

  return (
    <button
      onClick={handleClick}
      disabled={state === 'loading'}
      className={`
        flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all
        ${state === 'playing'
          ? 'bg-red-500/20 border border-red-500/50 text-red-300 hover:bg-red-500/30'
          : 'bg-blue-600/20 border border-blue-500/40 text-blue-300 hover:bg-blue-600/30'}
        disabled:opacity-50 disabled:cursor-not-allowed
      `}
    >
      {icons[state]}
      {labels[state]}
      {state === 'playing' && (
        <span className="flex gap-[3px] items-end h-4">
          {[0, 1, 2].map(i => (
            <span
              key={i}
              className="w-[3px] bg-blue-400 rounded-full animate-pulse"
              style={{ height: `${[60, 100, 70][i]}%`, animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </span>
      )}
    </button>
  );
};

export default VoiceButton;
