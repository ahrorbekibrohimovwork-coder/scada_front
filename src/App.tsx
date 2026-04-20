import React from 'react';
import Sidebar, { Page } from './components/Sidebar';
import Header from './components/Header';
import StationColumn from './components/StationColumn';
import StationDetail from './components/StationDetail';
import ChatAssistant from './components/ChatAssistant';
import VoiceButton from './components/VoiceButton';

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
      { label: "Выработка", value: "1078.65", unit: "кВт", percentage: "3.9%" },
      { label: "Активная мощность", value: "1078.65", unit: "кВт•ч" },
      { label: "Реактивная мощность", value: "1078.65", unit: "кВАр•ч" },
      { label: "Уровень верхнего бъефа", value: "1078.65", unit: "м" },
      { label: "Уровень нижнего бъефа", value: "1078.65", unit: "м" },
    ]
  },
  {
    name: "ГЭС-4",
    subName: "Бурджар",
    metrics: [
      { label: "Выработка", value: "1078.65", unit: "кВт", percentage: "3.9%" },
      { label: "Активная мощность", value: "1078.65", unit: "кВт•ч" },
      { label: "Реактивная мощность", value: "1078.65", unit: "кВAr•ч" },
      { label: "Уровень верхнего бъефа", value: "1078.65", unit: "м" },
      { label: "Уровень нижнего бъефа", value: "1078.65", unit: "м" },
    ]
  },
  {
    name: "ГЭС-9",
    subName: "Актепа",
    metrics: [
      { label: "Выработка", value: "1078.65", unit: "кВт", percentage: "3.9%" },
      { label: "Активная мощность", value: "1078.65", unit: "кВт•ч" },
      { label: "Реактивная мощность", value: "1078.65", unit: "кВAр•ч" },
      { label: "Уровень верхнего бъефа", value: "1078.65", unit: "м" },
      { label: "Уровень нижнего бъефа", value: "1078.65", unit: "м" },
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
          <div className="flex justify-end mb-3">
            <VoiceButton />
          </div>
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
        <div className="flex flex-col gap-5 h-full max-h-[calc(100vh-140px)] text-slate-200">
          
          {/* ВЕРХНЯЯ СЕКЦИЯ: Плеер + История */}
          <div className="flex gap-5 h-[65%] min-h-0">
            
            {/* Видеоплеер */}
            <div className="flex-[3] bg-[#141e31] rounded-3xl border border-white/10 p-5 flex flex-col relative min-h-0">
              <div className="flex justify-between items-center mb-3">
                <div>
                  <h2 className="text-xl font-semibold tracking-tight">ГЭС-1</h2>
                  <p className="text-slate-500 text-xs">Camera-4</p>
                </div>
                <div className="flex items-center gap-2 bg-black/30 px-3 py-1 rounded-full border border-white/5">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-green-500">Live</span>
                </div>
              </div>
              
              <div className="flex-1 rounded-2xl overflow-hidden bg-black border border-white/5">
                <iframe
                  src="https://assure-trigger-breathing-acceptable.trycloudflare.com"
                  className="w-full h-full border-none"
                  allow="autoplay; fullscreen"
                  title="Видеоаналитика"
                />
              </div>
            </div>

            {/* Правая колонка: История нарушений */}
            <div className="w-[340px] 2xl:w-[380px] bg-[#141e31] rounded-3xl border border-white/10 flex flex-col overflow-hidden min-h-0">
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
                {[
                  { id: 1, title: 'Отсутствие каски', date: '09.04.2026', fileName: '1.jpg' },
                  { id: 2, title: 'Отсутствие каски', date: '06.04.2026', fileName: '2.jpg' },
                  { id: 3, title: 'Отсутствие каски', date: '11.04.2026', fileName: '3.jpg' },
                ].map((item) => (
                  <div key={item.id} className="group cursor-pointer">
                    <div className="flex justify-between items-center mb-1.5 px-1">
                      <span className="text-[10px] font-bold text-blue-400 uppercase tracking-tighter">{item.title}</span>
                      <span className="text-[10px] text-slate-500">{item.date}</span>
                    </div>
                    <div className="aspect-video rounded-xl overflow-hidden border border-white/10 group-hover:border-blue-500/50 transition-colors bg-slate-800">
                      <img 
                        src={`/violations/${item.fileName}`} 
                        className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity" 
                        alt="violation"
                        onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300x169/141e31/475569?text=No+Image'; }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* НИЖНЯЯ СЕКЦИЯ: График и Счетчики */}
          <div className="h-[35%] min-h-0 flex gap-5">
            
            {/* График нарушений ТБ */}
            <div className="flex-[2] bg-[#141e31] rounded-3xl border border-white/10 p-5 flex flex-col min-h-0">
              <div className="flex items-center gap-2 text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-4">
                <span className="text-sm">⚠️</span> Нарушение ТБ
              </div>
              <div className="flex-1 flex items-end justify-between gap-3 px-2 pb-1 min-h-0">
                {[30, 80, 75, 60, 110, 90, 90].map((h, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                    <div 
                      className="w-full bg-gradient-to-t from-blue-700/80 to-blue-400 rounded-t-md transition-all hover:brightness-110 cursor-help" 
                      style={{ height: `${(h/120)*100}%` }}
                    />
                    <span className="text-[9px] text-slate-500 font-medium">{2019 + i}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Счётчики */}
            <div className="flex-1 grid grid-cols-2 gap-4 min-h-0">
              <div className="flex flex-col gap-4">
                <MiniStatCard title="Авария" value="1" color="text-white" icon="🌊" />
                <MiniStatCard title="Несчастный" value="2" color="text-white" icon="👤" />
              </div>
              <div className="flex flex-col gap-4">
                <MiniStatCard title="Инцидент" value="6" color="text-white" icon="⚡" />
                <div className="bg-[#141e31] rounded-2xl border border-white/10 p-4 flex flex-col items-center justify-center h-full relative overflow-hidden">
                   <div className="text-5xl 2xl:text-6xl font-bold text-slate-100 z-10">54</div>
                   <div className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter mt-1 z-10">2026 ГОД</div>
                   <div className="absolute w-24 h-24 bg-blue-500/5 rounded-full -right-5 -bottom-5" />
                </div>
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