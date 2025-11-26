import React from 'react';
import { dataService } from '../services/dataService';
import { Language } from '../types';
import { getTranslation } from '../services/i18nService';
import { Zap, AlertTriangle, CheckCircle, Info } from 'lucide-react';

interface DigitalTwinViewProps {
  lang?: Language;
}

const DigitalTwinView: React.FC<DigitalTwinViewProps> = ({ lang = 'en' }) => {
  const t = getTranslation(lang as Language).twin;
  const machines = dataService.getMachines();

  // 10x6 Grid
  const gridWidth = 10;
  const gridHeight = 6;

  const getMachineAt = (x: number, y: number) => {
    return machines.find(m => m.gridPosition?.x === x && m.gridPosition?.y === y);
  };

  return (
    <div className="h-full flex flex-col">
       <div className="mb-6 flex justify-between items-end">
         <div>
            <h2 className="text-2xl font-bold text-white">{t.factoryMap}</h2>
            <p className="text-slate-400 mt-1">Real-time spatial visualization of machine status and energy draw.</p>
         </div>
         <div className="flex gap-4 text-sm">
             <div className="flex items-center gap-2"><span className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></span> {t.running}</div>
             <div className="flex items-center gap-2"><span className="w-3 h-3 bg-rose-500 rounded-full"></span> {t.stopped}</div>
         </div>
       </div>

       <div className="flex-1 bg-slate-900 border border-slate-800 rounded-xl p-6 overflow-hidden relative">
          {/* Floor Grid */}
          <div className="grid grid-cols-10 grid-rows-6 gap-4 h-full w-full">
             {Array.from({ length: gridHeight }).map((_, y) => (
                 Array.from({ length: gridWidth }).map((_, x) => {
                     const machine = getMachineAt(x, y);
                     return (
                         <div 
                            key={`${x}-${y}`} 
                            className={`rounded-lg border relative group transition-all duration-300 ${
                                machine 
                                ? machine.status === 'Running' ? 'bg-emerald-900/20 border-emerald-500/50 hover:bg-emerald-900/40 cursor-pointer' 
                                : machine.status === 'Warning' ? 'bg-amber-900/20 border-amber-500/50 hover:bg-amber-900/40 cursor-pointer'
                                : 'bg-rose-900/20 border-rose-500/50 hover:bg-rose-900/40 cursor-pointer animate-pulse'
                                : 'bg-slate-950/30 border-slate-800/50'
                            }`}
                         >
                             {machine && (
                                 <div className="absolute inset-0 flex flex-col items-center justify-center p-2 text-center">
                                     <span className="text-xs font-bold text-white mb-1 truncate w-full">{machine.name}</span>
                                     <div className="flex items-center gap-1 text-[10px] text-slate-400">
                                         <Zap className="w-3 h-3 text-yellow-400" /> {machine.energyUsageKwh} kWh
                                     </div>
                                     
                                     {/* Tooltip */}
                                     <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-slate-800 border border-slate-700 p-3 rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                                         <h4 className="font-bold text-white text-sm">{machine.name}</h4>
                                         <p className="text-xs text-slate-400">Status: {machine.status}</p>
                                         <p className="text-xs text-slate-400">Health: {machine.healthScore}%</p>
                                         <p className="text-xs text-slate-400">Temp: {machine.readings[machine.readings.length-1]?.temperature.toFixed(1)}°C</p>
                                     </div>
                                 </div>
                             )}
                             
                             {/* Floor Markers */}
                             {!machine && (x === 0 || y === 0 || x === 9 || y === 5) && (
                                 <div className="absolute inset-0 flex items-center justify-center text-slate-700 text-[10px] font-mono">
                                     {x},{y}
                                 </div>
                             )}
                         </div>
                     );
                 })
             ))}
          </div>
       </div>
    </div>
  );
};

export default DigitalTwinView;