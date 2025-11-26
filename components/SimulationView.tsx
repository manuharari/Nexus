import React, { useState } from 'react';
import { runSimulation } from '../services/geminiService';
import { Language, SimulationResult } from '../types';
import { getTranslation } from '../services/i18nService';
import { Sliders, Play, RefreshCw } from 'lucide-react';

interface SimulationViewProps {
  lang?: Language;
}

const SimulationView: React.FC<SimulationViewProps> = ({ lang = 'en' }) => {
  const t = getTranslation(lang as Language).simulation;
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SimulationResult | null>(null);
  
  // Params
  const [materialCost, setMaterialCost] = useState(0);
  const [laborCost, setLaborCost] = useState(0);
  const [demand, setDemand] = useState(0);
  const [downtime, setDowntime] = useState(0);

  const handleRun = async () => {
      setLoading(true);
      try {
          const res = await runSimulation({
              materialCostChange: materialCost,
              laborCostChange: laborCost,
              demandSpike: demand,
              downtimeDays: downtime
          });
          setResult(res);
      } finally {
          setLoading(false);
      }
  };

  return (
    <div className="flex flex-col h-full gap-6">
       <h2 className="text-2xl font-bold text-white flex items-center gap-2">
           <Sliders className="w-6 h-6 text-primary-500" /> {t.title}
       </h2>

       <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           {/* Controls */}
           <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6">
               <h3 className="font-bold text-white mb-4">{t.parameters}</h3>
               
               <div>
                   <label className="block text-xs text-slate-400 uppercase mb-2">Material Cost Change ({materialCost}%)</label>
                   <input type="range" min="-50" max="50" value={materialCost} onChange={e => setMaterialCost(Number(e.target.value))} className="w-full accent-primary-500" />
               </div>
               <div>
                   <label className="block text-xs text-slate-400 uppercase mb-2">Labor Cost Change ({laborCost}%)</label>
                   <input type="range" min="-20" max="20" value={laborCost} onChange={e => setLaborCost(Number(e.target.value))} className="w-full accent-primary-500" />
               </div>
               <div>
                   <label className="block text-xs text-slate-400 uppercase mb-2">Demand Spike ({demand}%)</label>
                   <input type="range" min="-50" max="100" value={demand} onChange={e => setDemand(Number(e.target.value))} className="w-full accent-primary-500" />
               </div>
               <div>
                   <label className="block text-xs text-slate-400 uppercase mb-2">Machine Downtime ({downtime} days)</label>
                   <input type="range" min="0" max="30" value={downtime} onChange={e => setDowntime(Number(e.target.value))} className="w-full accent-primary-500" />
               </div>

               <button 
                   onClick={handleRun} 
                   disabled={loading}
                   className="w-full py-3 bg-primary-600 hover:bg-primary-500 text-white rounded-lg font-bold flex items-center justify-center gap-2 transition-all"
               >
                   {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                   {t.runSim}
               </button>
           </div>

           {/* Results */}
           <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col justify-center">
               {result ? (
                   <div className="space-y-8 animate-in slide-in-from-right-4">
                       <div className="grid grid-cols-3 gap-4">
                           <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
                               <span className="text-xs text-slate-500 uppercase">Projected Margin</span>
                               <div className={`text-3xl font-bold ${result.projectedMargin < 30 ? 'text-rose-500' : 'text-emerald-500'}`}>
                                   {result.projectedMargin}%
                               </div>
                           </div>
                           <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
                               <span className="text-xs text-slate-500 uppercase">Delivery Delay</span>
                               <div className={`text-3xl font-bold ${result.deliveryDelayDays > 3 ? 'text-rose-500' : 'text-white'}`}>
                                   {result.deliveryDelayDays} days
                               </div>
                           </div>
                           <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
                               <span className="text-xs text-slate-500 uppercase">Cash Flow Hit</span>
                               <div className={`text-3xl font-bold ${result.cashFlowImpact < 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                                   ${result.cashFlowImpact.toLocaleString()}
                               </div>
                           </div>
                       </div>

                       <div className="bg-slate-950/50 p-6 rounded-xl border border-slate-800">
                           <h4 className="text-primary-400 font-bold mb-4">AI Recommendations</h4>
                           <ul className="space-y-2">
                               {result.recommendations.map((rec, i) => (
                                   <li key={i} className="flex items-start gap-2 text-slate-300 text-sm">
                                       <span className="text-primary-500 font-bold">•</span> {rec}
                                   </li>
                               ))}
                           </ul>
                       </div>
                   </div>
               ) : (
                   <div className="text-center text-slate-500 opacity-50">
                       Adjust parameters and run simulation to see impact.
                   </div>
               )}
           </div>
       </div>
    </div>
  );
};

export default SimulationView;