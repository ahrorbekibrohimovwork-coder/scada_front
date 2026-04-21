import React from 'react';
import { apiFetch } from '../config';

const SchemaView: React.FC = () => {
  const [svgContent, setSvgContent] = React.useState<string>('');
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(false);
  const [lastUpdate, setLastUpdate] = React.useState<Date | null>(null);

  const fetchSvg = React.useCallback((showLoader = false) => {
    if (showLoader) setLoading(true);
    setError(false);
    apiFetch('/api/schema/svg')
      .then(res => {
        if (!res.ok) throw new Error('Failed');
        const ct = res.headers.get('content-type') || '';
        if (!ct.includes('svg') && !ct.includes('xml')) throw new Error('Not SVG');
        return res.text();
      })
      .then(svg => {
        setSvgContent(svg);
        setLastUpdate(new Date());
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }, []);

  React.useEffect(() => {
    fetchSvg(true);
    const id = setInterval(() => fetchSvg(false), 5000);
    return () => clearInterval(id);
  }, [fetchSvg]);

  const fmt = (d: Date) =>
    d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-blue-400">
        <div className="animate-spin w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full mr-3" />
        <span className="text-sm">Загрузка схемы...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-red-400 gap-4">
        <p className="text-sm">Не удалось загрузить схему. Проверьте что бэкенд запущен.</p>
        <button
          onClick={() => fetchSvg(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
        >
          Повторить
        </button>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full flex flex-col">
      {/* Status bar */}
      <div className="flex items-center justify-between mb-2 px-1">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-[11px] text-slate-400">Данные в реальном времени</span>
          {lastUpdate && (
            <span className="text-[11px] text-slate-500">· обновлено {fmt(lastUpdate)}</span>
          )}
        </div>
        <button
          onClick={() => fetchSvg(true)}
          className="flex items-center gap-1.5 px-3 py-1 bg-blue-600/20 hover:bg-blue-600/40 text-blue-300 rounded-lg text-xs transition-colors border border-blue-500/30"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3 h-3">
            <path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
          </svg>
          Обновить
        </button>
      </div>

      {/* SVG */}
      <div
        className="flex-1 w-full overflow-auto rounded-xl"
        dangerouslySetInnerHTML={{ __html: svgContent }}
      />
    </div>
  );
};

export default SchemaView;
