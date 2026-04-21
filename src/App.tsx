import React from 'react';
import Sidebar, { Page } from './components/Sidebar';
import Header from './components/Header';
import ChatAssistant from './components/ChatAssistant';
import { API_BASE_URL } from './config';

function KaskadSvg() {
  const [svg, setSvg] = React.useState('');
  React.useEffect(() => {
    const load = () =>
      fetch(`${API_BASE_URL}/api/schema/kaskad`, {
        headers: { 'ngrok-skip-browser-warning': '1' },
      })
        .then(r => r.text())
        .then(setSvg)
        .catch(() => {});
    load();
    const id = setInterval(load, 5000);
    return () => clearInterval(id);
  }, []);
  return (
    <div
      className="flex-1 flex items-center justify-center overflow-hidden w-full h-full"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}


export const App = (): JSX.Element => {
  const [activePage, setActivePage] = React.useState<Page>('asodu');
  const handleNavigate = (page: Page) => {
    setActivePage(page);
  };

  const handleBack = () => {};

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
      return (
        <div className="flex-1 flex items-center justify-center overflow-hidden">
          <KaskadSvg />
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
              src="https://ferrari-built-finder-plant.trycloudflare.com/"
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
          breadcrumbStation={undefined}
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