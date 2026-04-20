import React from 'react';
import Sidebar, { Page } from './components/Sidebar';
import Header from './components/Header';
import StationColumn from './components/StationColumn';
import StationDetail from './components/StationDetail';
import ChatAssistant from './components/ChatAssistant';
import VoiceButton from './components/VoiceButton';

// Мини карточка
const MiniStatCard = ({
  title,
  value,
  icon,
  color,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  color: string;
}) => (
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
    ],
  },
];

export const App = (): JSX.Element => {
  const [activePage, setActivePage] = React.useState<Page>('video');

  const renderContent = () => {
    if (activePage === 'video') {
      return (
        <div className="h-full grid grid-rows-[2fr_1fr] gap-5 overflow-hidden text-slate-200">

          {/* TOP */}
          <div className="grid grid-cols-[1fr_360px] gap-5 min-h-0">

            {/* VIDEO */}
            <div className="bg-[#141e31] rounded-3xl border border-white/10 p-5 flex flex-col min-h-0">
              
              <div className="flex justify-between items-center mb-3">
                <div>
                  <h2 className="text-xl font-semibold">ГЭС-1</h2>
                  <p className="text-slate-500 text-xs">Camera-4</p>
                </div>
                <div className="flex items-center gap-2 bg-black/30 px-3 py-1 rounded-full">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-xs text-green-400">Live</span>
                </div>
              </div>

              <div className="flex-1 rounded-2xl overflow-hidden bg-black min-h-0">
                <iframe
                  src="https://assure-trigger-breathing-acceptable.trycloudflare.com"
                  className="w-full h-full block border-none"
                />
              </div>
            </div>

            {/* HISTORY */}
            <div className="bg-[#141e31] rounded-3xl border border-white/10 flex flex-col min-h-0">
              
              <div className="p-4 border-b border-white/10">
                История нарушений
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {[1, 2, 3].map((id) => (
                  <div key={id}>
                    <div className="text-xs text-slate-400 mb-1">
                      Отсутствие каски
                    </div>
                    <div className="aspect-video bg-slate-700 rounded-lg" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* BOTTOM */}
          <div className="grid grid-cols-[2fr_1fr] gap-5 min-h-0">

            {/* GRAPH */}
            <div className="bg-[#141e31] rounded-3xl border border-white/10 p-5 flex flex-col min-h-0">
              <div className="text-xs text-blue-400 mb-4">
                Нарушения
              </div>

              <div className="flex-1 flex items-end gap-2">
                {[30, 80, 75, 60, 110].map((h, i) => (
                  <div key={i} className="flex-1">
                    <div
                      className="bg-blue-500 w-full"
                      style={{ height: `${h}px` }}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* STATS */}
            <div className="grid grid-cols-2 gap-4">
              <MiniStatCard title="Авария" value="1" icon="⚡" color="text-white" />
              <MiniStatCard title="Инцидент" value="6" icon="⚠️" color="text-white" />
              <MiniStatCard title="Люди" value="2" icon="👤" color="text-white" />
              <MiniStatCard title="Год" value="2026" icon="📅" color="text-white" />
            </div>

          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="flex h-screen bg-[#0f172b] text-white overflow-hidden">
      
      <Sidebar activePage={activePage} onNavigate={setActivePage} />

      <div className="flex-1 ml-[269px] flex flex-col overflow-hidden">
        
        <Header />

        <main className="pt-[90px] p-6 flex-1 overflow-hidden box-border">
          {renderContent()}
        </main>

      </div>

      <ChatAssistant />
    </div>
  );
};

export default App;