import React from 'react';
import SchemaDataBox from './schema/SchemaDataBox';
import schemaBg from '../assets/schema-bg.svg';

const SchemaView: React.FC = () => {
  // Common styles for the data blocks to match the standard layout
  // Note: Coordinates are translated from the SVG's 1651x1080 coordinate system
  // to percentages for responsiveness within the 1651px container.

  return (
    <div className="relative w-full max-w-[1651px] mx-auto aspect-[1651/1080] glass rounded-3xl overflow-hidden animate-in zoom-in duration-700 shadow-2xl">
      {/* 1. READY-MADE SVG BACKGROUND */}
      <img
        src={schemaBg}
        alt="SCADA Plant Schema"
        className="absolute inset-0 w-full h-full object-contain pointer-events-none opacity-90"
      />

      {/* 2. DYNAMIC DATA OVERLAYS */}
      {/* These boxes are positioned to align with the underlying SVG elements */}

      {/* PBT №1 Section */}
      {/* <div className="absolute top-[17%] left-[13%]">
         <SchemaDataBox 
           title="PBT №1" 
           metrics={[
             { label: "Uab", value: "137.00", unit: "kV" },
             { label: "Ubc", value: "137.00", unit: "kV" },
             { label: "Uca", value: "137.00", unit: "kV" },
             { label: "Частота", value: "0.97", unit: "Hz" },
             { label: "Ток", value: "137.00", unit: "A" },
             { label: "Активная", value: "0.97", unit: "kW", color: "text-blue-400" },
           ]} 
           columns={2} 
           className="w-[180px] bg-transparent border-none shadow-none" 
         />
      </div> */}

      {/* Generator 1 Section */}
      {/* <div className="absolute top-[59%] left-[14.5%]">
        <SchemaDataBox
          title="Генератор №1"
          metrics={[
            { label: "Активная", value: "0.97", unit: "kW", color: "text-blue-400" },
            { label: "Реактивная", value: "0.97", unit: "kVAr", color: "text-amber-500" },
            { label: "Ток", value: "137.00", unit: "A" },
            { label: "Uab", value: "137.00", unit: "kV" },
            { label: "Ubc", value: "157.00", unit: "kV" },
            { label: "Uca", value: "147.00", unit: "kV" },
            { label: "Частота", value: "0.97", unit: "Hz" },
            { label: "cos φ", value: "0.97", unit: "" },
          ]}
          columns={2}
          className="w-[200px] bg-transparent border-none shadow-none"
        />
      </div> */}

      {/* Right side symmetrical blocks would be placed similarly */}

      {/* PBT №2 Section */}
      {/* <div className="absolute top-[17%] right-[11%]">
        <SchemaDataBox
          title="PBT №2"
          metrics={[
            { label: "Uab", value: "137.00", unit: "kV" },
            { label: "Ток", value: "137.00", unit: "A" },
            { label: "Частота", value: "0.97", unit: "Hz" },
            { label: "Активная", value: "0.97", unit: "kW", color: "text-blue-400" },
          ]}
          columns={2}
          className="w-[180px] bg-transparent border-none shadow-none"
        />
      </div> */}

      {/* Generator 2 Section */}
      {/* <div className="absolute top-[59%] right-[12%]">
        <SchemaDataBox
          title="Генератор №2"
          metrics={[
            { label: "Активная", value: "0.97", unit: "kW", color: "text-blue-400" },
            { label: "Реактивная", value: "0.97", unit: "kVAr", color: "text-amber-500" },
            { label: "Ток", value: "137.00", unit: "A" },
            { label: "Uab", value: "137.00", unit: "kV" },
          ]}
          columns={2}
          className="w-[200px] bg-transparent border-none shadow-none"
        />
      </div> */}

      {/* Central TP Section */}
      <div className="absolute top-[52%] left-1/2 -translate-x-1/2">
        <SchemaDataBox
          title="Шина Тр."
          metrics={[
            { label: "Активная", value: "0.97", unit: "kW", color: "text-blue-400" },
            { label: "Ток A", value: "137.00", unit: "A" },
            { label: "Ток B", value: "157.00", unit: "A" },
            { label: "Ток C", value: "147.00", unit: "A" },
          ]}
          columns={1}
          className="w-[120px] bg-transparent border-none shadow-none"
        />
      </div>

    </div>
  );
};

export default SchemaView;
