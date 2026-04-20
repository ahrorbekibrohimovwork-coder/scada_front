import React from 'react';
import Sidebar, { Page } from './components/Sidebar';
import Header from './components/Header';
import StationColumn from './components/StationColumn';
import StationDetail from './components/StationDetail';
import ChatAssistant from './components/ChatAssistant';
import VoiceButton from './components/VoiceButton';

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
        <div className="flex-1 flex flex-col overflow-auto">
          <div className="flex justify-end mb-3">
            <VoiceButton />
          </div>
          <div className="flex-1 flex items-center justify-center">
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
        <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-4 gap-8">
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
        <div className="flex-1 flex flex-col h-[calc(100vh-90px)]">
          <div className="mb-4 flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-sm text-slate-400">Прямая трансляция</span>
          </div>
          <div className="flex-1 rounded-2xl overflow-hidden border border-white/10 bg-[#141e31]">
            <iframe
              src="https://assure-trigger-breathing-acceptable.trycloudflare.com"
              className="w-full h-full"
              allow="autoplay; fullscreen"
              title="Видеоаналитика"
            />
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="flex min-h-screen bg-[#0f172b] text-white font-sans overflow-x-hidden">
      <Sidebar activePage={activePage} onNavigate={handleNavigate} />

      <div className="flex-1 ml-[269px] flex flex-col">
        <Header
          breadcrumbStation={activePage === 'asodu' && detailView === 'detail' ? selectedStation.name : undefined}
          onBack={handleBack}
        />

        <main className={`mt-[90px] ${activePage === 'dashboard' || activePage === 'video' ? 'p-4 h-[calc(100vh-90px)]' : 'p-8'} flex flex-col`}>
          {renderContent()}
        </main>
      </div>

      <ChatAssistant />

      <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-blue-600/5 blur-[120px] pointer-events-none" />
      <div className="fixed bottom-0 left-[269px] w-[300px] h-[300px] bg-indigo-600/5 blur-[100px] pointer-events-none" />
    </div>
  );
};

export default App;
