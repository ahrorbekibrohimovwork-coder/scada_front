import React from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import StationColumn from './components/StationColumn';
import StationDetail from './components/StationDetail';
import ChatAssistant from './components/ChatAssistant';

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
  const [view, setView] = React.useState<'dashboard' | 'detail'>('dashboard');
  const [selectedStation, setSelectedStation] = React.useState(STATIONS_DATA[0]);
  const [detailMode, setDetailMode] = React.useState<'monitor' | 'schema'>('monitor');

  const handleStationClick = (station: typeof STATIONS_DATA[0]) => {
    setSelectedStation(station);
    setView('detail');
  };

  const handleBack = () => {
    setView('dashboard');
  };

  return (
    <div className="flex min-h-screen bg-[#0f172b] text-white font-sans overflow-x-hidden">
      <Sidebar />
      
      <div className="flex-1 ml-[269px] flex flex-col">
        <Header 
          breadcrumbStation={view === 'detail' ? selectedStation.name : undefined}
          onBack={handleBack}
        />
        
        <main className="mt-[90px] p-8">
          {view === 'dashboard' ? (
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
          ) : (
            <StationDetail 
              station={selectedStation} 
              mode={detailMode} 
              onModeChange={setDetailMode} 
            />
          )}
        </main>
      </div>
      
      {/* CHAT ASSISTANT */}
      <ChatAssistant />

      {/* Premium Background Glows */}
      <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-blue-600/5 blur-[120px] pointer-events-none" />
      <div className="fixed bottom-0 left-[269px] w-[300px] h-[300px] bg-indigo-600/5 blur-[100px] pointer-events-none" />
    </div>
  );
};

export default App;
