import React from 'react';
import { API_BASE_URL, apiFetch } from '../config';

type LiveValues = Record<string, string>;

const fmt = (raw: string | number): string => {
  const n = typeof raw === 'string' ? parseFloat(raw) : raw;
  if (isNaN(n)) return String(raw);
  return new Intl.NumberFormat('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
};

const METRICS: { signal: string; label: string; unit: string; gen: () => string; derived?: (live: LiveValues) => string | null }[] = [
  { signal: 'bozsu.plc1.ai.active_power',   label: 'Активная мощность (Г1)',   unit: 'кВт',  gen: () => fmt(Math.random() * 3000 + 500) },
  { signal: 'bozsu.plc2.ai.active_power',   label: 'Активная мощность (Г2)',   unit: 'кВт',  gen: () => fmt(Math.random() * 3000 + 500) },
  { signal: 'bozsu.plc1.ai.reactive_power', label: 'Реактивная мощность (Г1)', unit: 'кВАр', gen: () => fmt(Math.random() * 1200 + 200) },
  { signal: 'bozsu.plc2.ai.reactive_power', label: 'Реактивная мощность (Г2)', unit: 'кВАр', gen: () => fmt(Math.random() * 1200 + 200) },
  { signal: 'bozsu.plc1.ai.frequency',      label: 'Частота (Г1)',             unit: 'Гц',   gen: () => fmt(49.9 + Math.random() * 0.2) },
  { signal: 'bozsu.plc2.ai.frequency',      label: 'Частота (Г2)',             unit: 'Гц',   gen: () => fmt(49.9 + Math.random() * 0.2) },
  { signal: 'bozsu.plc1.ai.cosphi',         label: 'Cos φ (Г1)',               unit: '',     gen: () => fmt(0.85 + Math.random() * 0.1) },
  { signal: 'bozsu.plc2.ai.cosphi',         label: 'Cos φ (Г2)',               unit: '',     gen: () => fmt(0.85 + Math.random() * 0.1) },
  { signal: 'bozsu.plc1.ai.current_a',      label: 'Ток A (Г1)',               unit: 'А',    gen: () => fmt(150 + Math.random() * 50) },
  { signal: 'bozsu.plc2.ai.current_a',      label: 'Ток A (Г2)',               unit: 'А',    gen: () => fmt(100 + Math.random() * 50) },
  { signal: 'bozsu.rht1.ai.active_power',   label: 'Активная мощность (РВТ1)', unit: 'кВт',  gen: () => fmt(Math.random() * 5000 + 1000) },
  { signal: 'bozsu.rht2.ai.active_power',   label: 'Активная мощность (РВТ2)', unit: 'кВт',  gen: () => fmt(Math.random() * 5000 + 1000) },
  {
    signal: '__water_g1',
    label: 'Расход воды (Г1)',
    unit: 'м³/с',
    gen: () => fmt((Math.random() * 3000 + 500) / 100),
    derived: (live) => {
      const p = live['bozsu.plc1.ai.active_power'];
      return p !== undefined ? fmt(parseFloat(p) / 100) : null;
    },
  },
  {
    signal: '__water_g2',
    label: 'Расход воды (Г2)',
    unit: 'м³/с',
    gen: () => fmt((Math.random() * 3000 + 500) / 100),
    derived: (live) => {
      const p = live['bozsu.plc2.ai.active_power'];
      return p !== undefined ? fmt(parseFloat(p) / 100) : null;
    },
  },
];

const MetricRow: React.FC<{ label: string; value: string; unit: string; live: boolean }> = ({ label, value, unit, live }) => (
  <div className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
    <span className="text-xs text-slate-400">{label}</span>
    <div className="flex items-center gap-1.5">
      <span className={`text-sm font-mono font-semibold ${live ? 'text-blue-300' : 'text-slate-300'}`}>{value}</span>
      {unit && <span className="text-[10px] text-slate-500">{unit}</span>}
      {live && <div className="w-1 h-1 rounded-full bg-green-400" />}
    </div>
  </div>
);

const MonitorView: React.FC = () => {
  const [svg, setSvg] = React.useState('');
  const [live, setLive] = React.useState<LiveValues>({});
  const [hasLive, setHasLive] = React.useState(false);

  const loadData = React.useCallback(() => {
    // Fetch SVG
    fetch(`${API_BASE_URL}/api/schema/bozsuv`, { headers: { 'ngrok-skip-browser-warning': '1' } })
      .then(r => r.text()).then(setSvg).catch(() => {});

    // Fetch live values
    apiFetch('/api/debug/values')
      .then(r => r.json())
      .then((data: LiveValues) => {
        setLive(data);
        setHasLive(Object.keys(data).length > 0);
      })
      .catch(() => {});
  }, []);

  React.useEffect(() => {
    loadData();
    const id = setInterval(loadData, 5000);
    return () => clearInterval(id);
  }, [loadData]);

  const getValue = (m: typeof METRICS[number]) => {
    if (hasLive) {
      if (m.derived) {
        const v = m.derived(live);
        if (v !== null) return { value: v, isLive: true };
      } else if (live[m.signal] !== undefined) {
        return { value: fmt(live[m.signal]), isLive: true };
      }
    }
    return { value: m.gen(), isLive: false };
  };

  return (
    <div className="h-full flex gap-4 min-h-0">
      {/* SVG Panel */}
      <div className="flex-1 min-w-0 min-h-0 flex flex-col">
        <div className="flex items-center gap-2 mb-2 flex-shrink-0">
          <div className={`w-1.5 h-1.5 rounded-full ${hasLive ? 'bg-green-400 animate-pulse' : 'bg-slate-500'}`} />
          <span className="text-[11px] text-slate-400">{hasLive ? 'Данные в реальном времени' : 'Демо-режим (нет связи с ПЛК)'}</span>
        </div>
        <div
          className="flex-1 min-h-0"
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          dangerouslySetInnerHTML={{ __html: svg || '<div style="color:#475569;font-size:13px">Загрузка схемы...</div>' }}
        />
      </div>

      {/* Metrics Panel */}
      <div className="w-72 flex-shrink-0 flex flex-col gap-2 overflow-y-auto">
        <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold flex-shrink-0">
          Параметры
        </p>
        <div className="bg-[#0f172b]/60 rounded-xl border border-white/5 px-3 py-1 flex-shrink-0">
          {METRICS.map(m => {
            const { value, isLive } = getValue(m);
            return <MetricRow key={m.signal} label={m.label} value={value} unit={m.unit} live={isLive} />;
          })}
        </div>
      </div>
    </div>
  );
};

export default MonitorView;
