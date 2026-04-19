import React from 'react';
import MetricCard from './MetricCard';
import StatusSwitch from './StatusSwitch';

const MonitorView: React.FC = () => {
  return (
    <div className="grid grid-cols-3 gap-6 animate-in fade-in duration-700">
      {/* Column 1: Station Primary Metrics */}
      <div className="flex flex-col gap-4">
        <MetricCard label="Выработка" value="1078.65" unit="кВт" percentage="3.9%" />
        <MetricCard label="Активная мощность" value="1078.65" unit="кВт•ч" />
        <MetricCard label="Реактивная мощность" value="1078.65" unit="кВАр•ч" />
        <MetricCard label="Уровень верхнего бъефа" value="1078.65" unit="м" />
        <MetricCard label="Уровень нижнего бъефа" value="1078.65" unit="м" />
        
        <div className="glass p-4 rounded-xl flex flex-col gap-4">
          <div className="flex items-center gap-2 px-2">
            <div className="w-5 h-5 rounded-full border border-white/20 flex items-center justify-center text-[10px] text-[#586872]">!</div>
            <span className="text-[#586872] text-sm">Состояние работы генератора</span>
          </div>
          <div className="flex gap-3">
             <StatusSwitch label="G-1" initialActive={true} />
             <StatusSwitch label="G-2" initialActive={true} />
          </div>
        </div>
      </div>

      {/* Column 2: Secondary Metrics */}
      <div className="flex flex-col gap-4">
        <MetricCard label="Активная мощность" value="1078.65" unit="кВт•ч" />
        <MetricCard label="Реактивная мощность" value="1078.65" unit="кВАр•ч" />
        <div className="h-full flex flex-col gap-4 justify-between">
           <MetricCard label="Активная мощность" value="1078.65" unit="кВт•ч" />
           <MetricCard label="Реактивная мощность" value="1078.65" unit="кВАр•ч" />
        </div>
      </div>

      {/* Column 3: PS Sections */}
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-3">
          <div className="flex justify-between items-center mb-1">
            <h3 className="text-[#333f4e] text-2xl font-light">ПС "Ботаническая-1"</h3>
            <span className="text-[#586872] text-xl font-light">35кВ</span>
          </div>
          <MetricCard label="Коэффициент мощности" value="1078.65" unit="cos φ" />
          <MetricCard label="Расход воды" value="1078.65" unit="м³/ч" />
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex justify-between items-center mb-1">
            <h3 className="text-[#333f4e] text-2xl font-light">ПС "Ботаническая-2"</h3>
            <span className="text-[#586872] text-xl font-light">35кВ</span>
          </div>
          <MetricCard label="Коэффициент мощности" value="1078.65" unit="cos φ" />
          <MetricCard label="Расход воды" value="1078.65" unit="м³/ч" />
        </div>
      </div>
    </div>
  );
};

export default MonitorView;
