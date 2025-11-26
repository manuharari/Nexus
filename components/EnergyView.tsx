import React from 'react';
import { Zap, TrendingDown } from 'lucide-react';
import { Language } from '../types';
import { getTranslation } from '../services/i18nService';
import { dataService } from '../services/dataService';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface EnergyViewProps {
  lang?: Language;
}

const EnergyView: React.FC<EnergyViewProps> = ({ lang = 'en' }) => {
  const t = getTranslation(lang as Language).energy;
  const machines = dataService.getMachines();
  
  const totalUsage = machines.reduce((acc, m) => acc + m.energyUsageKwh, 0);
  
  const chartData = machines.map(m => ({
      name: m.name.split(' ')[0] + ' ' + m.name.split(' ')[1], // Short name
      kwh: m.energyUsageKwh
  }));

  return (
    <div className="flex flex-col h-full gap-6">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
           <Zap className="w-6 h-6 text-yellow-400" /> {t.consumption}
       </h2>

       <div className="grid grid-cols-3 gap-6">
           <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
               <h3 className="text-xs text-slate-500 uppercase">Total Load</h3>
               <div className="text-3xl font-bold text-white mt-2">{totalUsage} kWh</div>
           </div>
           <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
               <h3 className="text-xs text-slate-500 uppercase">Est. Daily Cost</h3>
               <div className="text-3xl font-bold text-white mt-2">${(totalUsage * 0.12).toFixed(2)}</div>
           </div>
           <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
               <h3 className="text-xs text-slate-500 uppercase">Efficiency</h3>
               <div className="text-3xl font-bold text-emerald-400 mt-2 flex items-center gap-2">
                   94% <TrendingDown className="w-5 h-5" />
               </div>
           </div>
       </div>

       <div className="flex-1 bg-slate-900 border border-slate-800 rounded-xl p-6">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
                    <YAxis stroke="#64748b" />
                    <Tooltip cursor={{fill: '#1e293b', opacity: 0.4}} contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b' }} />
                    <Bar dataKey="kwh" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
       </div>
    </div>
  );
};

export default EnergyView;