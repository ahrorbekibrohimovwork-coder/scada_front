import React from 'react';
import Sidebar, { Page } from './components/Sidebar';
import Header from './components/Header';
import StationColumn from './components/StationColumn';
import StationDetail from './components/StationDetail';
import ChatAssistant from './components/ChatAssistant';

// Вспомогательный компонент для карточек статистики
const MiniStatCard = ({ title, value, icon, color }: { title: string, value: string, icon: React.ReactNode, color: string }) => (
  <div className="bg-[#141e31] rounded-2xl border border-white/10 p-4 flex flex-col justify-between h-full">
    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
      {icon} {title}
    </div>
    <div className={`text-5xl 2xl:text-6xl font-semibold text-center py-1 ${color}`}>
      {value}
    </div>
  </div>
);

const STATIONS_DATA = [
  {
    name: "ГЭС-1",
    subName: "Бозсу",
    metrics: [
      { label: "Выработка", value: "1078.65", unit: "кВт", percentage: "3.9%" },
      { label: "Активная мощность", value: "1078.65", unit: "кВт•ч" },
      { label: "Реактивная мощность", value: "1078.65", unit: "кВАр•ч" },
      { label: "Уровень верхнего бъефа", value: "1078.65", unit: "м" },
      { label: "Уровень нижнего бъефа", value: "1078.65", unit: "м" },
    ]
  },
  {
    name: "ГЭС-21",
    subName: "Шайхонтохур",
    metrics: [
      { label: "Выработка", value: "0.00", unit: "кВт", percentage: "0%" },
      { label: "Активная мощность", value: "0.00", unit: "кВт•ч" },
      { label: "Реактивная мощность", value: "0.00", unit: "кВАр•ч" },
      { label: "Уровень верхнего бъефа", value: "0.00", unit: "м" },
      { label: "Уровень нижнего бъефа", value: "0.00", unit: "м" },
    ]
  },
  {
    name: "ГЭС-4",
    subName: "Бурджар",
    metrics: [
      { label: "Выработка", value: "0.00", unit: "кВт", percentage: "0%" },
      { label: "Активная мощность", value: "0.00", unit: "кВт•ч" },
      { label: "Реактивная мощность", value: "0.00", unit: "кВAр•ч" },
      { label: "Уровень верхнего бъефа", value: "0.00", unit: "м" },
      { label: "Уровень нижнего бъефа", value: "0.00", unit: "м" },
    ]
  },
  {
    name: "ГЭС-9",
    subName: "Актепа",
    metrics: [
      { label: "Выработка", value: "0.00", unit: "кВт", percentage: "0%" },
      { label: "Активная мощность", value: "0.00", unit: "кВт•ч" },
      { label: "Реактивная мощность", value: "0.00", unit: "кВAр•ч" },
      { label: "Уровень верхнего бъефа", value: "0.00", unit: "м" },
      { label: "Уровень нижнего бъефа", value: "0.00", unit: "м" },
    ]
  }
];

export const App = (): JSX.Element => {
  const [activePage, setActivePage] = React.useState<Page>('asodu');
  const [detailView, setDetailView] = React.useState<'list' | 'detail'>('list');
  const [selectedStation, setSelectedStation] = React.useState(STATIONS_DATA[0]);
  const [detailMode, setDetailMode] = React.useState<'monitor' | 'schema'>('monitor');

  const handleNavigate = (page: Page) => {
    setActivePage(page);
    if (page === 'asodu') setDetailView('list');
  };

  const handleStationClick = (station: typeof STATIONS_DATA[0]) => {
    setSelectedStation(station);
    setDetailView('detail');
  };

  const handleBack = () => {
    setDetailView('list');
  };

  const renderContent = () => {
    if (activePage === 'dashboard') {
      return (
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          <div className="flex-1 flex items-center justify-center overflow-hidden">
            <img
              src="/svg_files/Main.svg"
              alt="Дашборд"
              className="max-w-full max-h-full object-contain"
            />
          </div>
        </div>
      );
    }

    if (activePage === 'asodu') {
      if (detailView === 'detail') {
        return (
          <StationDetail
            station={selectedStation}
            mode={detailMode}
            onModeChange={setDetailMode}
          />
        );
      }
      return (
        <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-4 gap-8 overflow-y-auto pr-2">
          {STATIONS_DATA.map((station, index) => (
            <div key={index} onClick={() => handleStationClick(station)} className="cursor-pointer">
              <StationColumn
                name={station.name}
                subName={station.subName}
                metrics={station.metrics}
              />
            </div>
          ))}
        </div>
      );
    }

    if (activePage === 'video') {
  return (
    <div className="h-full grid grid-rows-[65%_35%] gap-5 overflow-hidden text-slate-200">

      {/* ВЕРХ: видео + история */}
      <div className="grid grid-cols-[1fr_360px] gap-5 min-h-0">

        {/* Видеоплеер */}
        <div className="bg-[#141e31] rounded-3xl border border-white/10 p-5 flex flex-col min-h-0">
          
          <div className="flex justify-between items-center mb-3">
            <div>
              <h2 className="text-xl font-semibold tracking-tight">ГЭС-1</h2>
              <p className="text-slate-500 text-xs">Camera-4</p>
            </div>
            <div className="flex items-center gap-2 bg-black/30 px-3 py-1 rounded-full border border-white/5">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-green-500">
                Live
              </span>
            </div>
          </div>

          <div className="flex-1 rounded-2xl overflow-hidden bg-black border border-white/5 min-h-0">
            <iframe
              src="https://assure-trigger-breathing-acceptable.trycloudflare.com"
              className="w-full h-full border-none block"
              allow="autoplay; fullscreen"
              title="Видеоаналитика"
            />
          </div>
        </div>

        {/* История */}
        <div className="bg-[#141e31] rounded-3xl border border-white/10 flex flex-col overflow-hidden min-h-0">
          
          <div className="p-4 border-b border-white/5 flex items-center gap-3">
            <span className="text-blue-500">📊</span>
            <h3 className="font-bold text-sm tracking-wide">История нарушений</h3>
          </div>

          <div className="p-3 bg-slate-900/50 mx-4 mt-3 rounded-xl border border-white/5">
            <select className="bg-transparent w-full outline-none text-xs font-medium text-slate-300">
              <option className="bg-[#141e31]">ГЭС-1 "Бозсу"</option>
            </select>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-5 custom-scrollbar">
            {[1, 2, 3].map((id) => (
              <div key={id} className="group cursor-pointer">
                <div className="flex justify-between items-center mb-1.5 px-1">
                  <span className="text-[10px] font-bold text-blue-400 uppercase">
                    Отсутствие каски
                  </span>
                  <span className="text-[10px] text-slate-500">
                    09.04.2026
                  </span>
                </div>

                <div className="aspect-video rounded-xl overflow-hidden border border-white/10 bg-slate-800">
                  <img
                    src={`/violations/${id}.jpg`}
                    className="w-full h-full object-cover"
                    alt="violation"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* НИЗ: график + счетчики */}
      <div className="grid grid-cols-[2fr_1fr] gap-5 min-h-0">

        {/* График */}
        <div className="bg-[#141e31] rounded-3xl border border-white/10 p-5 flex flex-col min-h-0">
          <div className="text-[10px] font-bold text-blue-400 uppercase mb-4">
            ⚠️ Нарушение ТБ
          </div>

          <div className="flex-1 flex items-end gap-3 min-h-0">
            {[30, 80, 75, 60, 110, 90, 90].map((h, i) => (
              <div key={i} className="flex-1 flex flex-col items-center justify-end">
                <div
                  className="w-full bg-blue-500 rounded-t-md"
                  style={{ height: `${(h / 120) * 100}%` }}
                />
                <span className="text-[9px] text-slate-500 mt-1">
                  {2019 + i}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Счетчики */}
        <div className="grid grid-cols-2 gap-4 min-h-0">
          
          <div className="bg-[#141e31] rounded-2xl border p-4 flex flex-col justify-center items-center">
            <div className="text-4xl">1</div>
            <div className="text-xs text-slate-400">Авария</div>
          </div>

          <div className="bg-[#141e31] rounded-2xl border p-4 flex flex-col justify-center items-center">
            <div className="text-4xl">2</div>
            <div className="text-xs text-slate-400">Несчастный</div>
          </div>

          <div className="bg-[#141e31] rounded-2xl border p-4 flex flex-col justify-center items-center">
            <div className="text-4xl">6</div>
            <div className="text-xs text-slate-400">Инцидент</div>
          </div>

          <div className="bg-[#141e31] rounded-2xl border p-4 flex flex-col justify-center items-center">
            <div className="text-4xl">54</div>
            <div className="text-xs text-slate-400">2026</div>
          </div>

        </div>
      </div>
    </div>
  );
}

    return null;
  };

  return (
    <div className="flex h-screen bg-[#0f172b] text-white font-sans overflow-hidden">
      <Sidebar activePage={activePage} onNavigate={handleNavigate} />

      <div className="flex-1 ml-[269px] flex flex-col h-full overflow-hidden">
        <Header
          activePage={activePage}
          breadcrumbStation={activePage === 'asodu' && detailView === 'detail' ? selectedStation.name : undefined}
          onBack={handleBack}
        />

        <main className="mt-[90px] p-6 flex-1 overflow-hidden">
          {renderContent()}
        </main>
      </div>

      <ChatAssistant />

      {/* Background Decor */}
      <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-blue-600/5 blur-[120px] pointer-events-none z-0" />
      <div className="fixed bottom-0 left-[269px] w-[300px] h-[300px] bg-indigo-600/5 blur-[100px] pointer-events-none z-0" />
    </div>
  );
};

export default App;