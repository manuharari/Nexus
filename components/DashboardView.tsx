import React from 'react';
import { ArrowUpRight, AlertTriangle, CheckCircle, Calendar, TrendingDown, Factory } from 'lucide-react';
import { AppView, Language } from '../types';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { MOCK_SALES } from '../constants';
import { dataService } from '../services/dataService';
import { getTranslation } from '../services/i18nService';

interface DashboardViewProps {
  onChangeView: (view: AppView) => void;
  lang?: Language;
}

const DashboardView: React.FC<DashboardViewProps> = ({ onChangeView, lang = 'en' }) => {
  const t = getTranslation(lang as Language).dashboard;
  const sidebarT = getTranslation(lang as Language).sidebar;

  // Get real status from data service
  const machines = dataService.getMachines();
  const activeIndustry = dataService.getIndustry();
  const warningCount = machines.filter(m => m.status === 'Warning' || m.status === 'Critical').length;
  const healthAvg = machines.reduce((acc, m) => acc + m.healthScore, 0) / machines.length;

  return (
    <div className="space-y-6">
      {/* Industry Header */}
      <div className="flex items-center justify-between bg-slate-900/50 border border-slate-800 p-4 rounded-lg">
         <div>
           <p className="text-xs text-slate-400 uppercase tracking-wider">{t.activeIndustry}</p>
           <h2 className="text-lg font-bold text-white flex items-center gap-2">
             <Factory className="w-5 h-5 text-primary-500" /> 
             {activeIndustry === 'DISCRETE_MFG' ? sidebarT.industryDiscrete : sidebarT.industryPaint}
           </h2>
         </div>
         <div className="text-right">
           <p className="text-xs text-slate-500">{t.systemStatus}</p>
           <span className="text-emerald-400 text-sm font-medium flex items-center gap-1 justify-end">
             <span className="relative flex h-2 w-2">
               <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
               <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
             </span>
             {t.operational}
           </span>
         </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div onClick={() => onChangeView(AppView.MAINTENANCE)} className="bg-slate-900 border border-slate-800 p-6 rounded-xl hover:border-primary-500/50 transition-colors cursor-pointer group">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 rounded-lg bg-accent-rose/10 text-accent-rose">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <span className="text-xs font-medium bg-slate-800 text-slate-400 px-2 py-1 rounded">{t.realTime}</span>
          </div>
          <h3 className="text-slate-400 text-sm font-medium mb-1">{t.machineHealth}</h3>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-white">{healthAvg.toFixed(1)}%</span>
            <span className="text-sm text-accent-emerald flex items-center"><ArrowUpRight className="w-3 h-3 mr-1" /> +2.1%</span>
          </div>
          <p className="text-xs text-slate-500 mt-2 group-hover:text-primary-400 transition-colors">
             {warningCount > 0 ? `${warningCount} ${t.issuesDetected}` : t.allNominal}
          </p>
        </div>

        <div onClick={() => onChangeView(AppView.PRODUCTION)} className="bg-slate-900 border border-slate-800 p-6 rounded-xl hover:border-primary-500/50 transition-colors cursor-pointer group">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 rounded-lg bg-primary-500/10 text-primary-500">
              <Calendar className="w-6 h-6" />
            </div>
            <span className="text-xs font-medium bg-slate-800 text-slate-400 px-2 py-1 rounded">{t.forecast}</span>
          </div>
          <h3 className="text-slate-400 text-sm font-medium mb-1">{t.predictedDemand}</h3>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-white">6,200</span>
            <span className="text-sm text-slate-400">{t.units}</span>
          </div>
          <p className="text-xs text-slate-500 mt-2 group-hover:text-primary-400 transition-colors">{t.optimizationAvailable}</p>
        </div>

        <div onClick={() => onChangeView(AppView.PROCUREMENT)} className="bg-slate-900 border border-slate-800 p-6 rounded-xl hover:border-primary-500/50 transition-colors cursor-pointer group">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 rounded-lg bg-accent-emerald/10 text-accent-emerald">
              <TrendingDown className="w-6 h-6" />
            </div>
            <span className="text-xs font-medium bg-slate-800 text-slate-400 px-2 py-1 rounded">{t.market}</span>
          </div>
          <h3 className="text-slate-400 text-sm font-medium mb-1">{t.materialCosts}</h3>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-white">-4.5%</span>
            <span className="text-sm text-accent-emerald">{t.vsLastMonth}</span>
          </div>
          <p className="text-xs text-slate-500 mt-2 group-hover:text-primary-400 transition-colors">{t.buySignal}</p>
        </div>
      </div>

      {/* Main Chart Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-lg font-semibold text-white">{t.productionEff}</h2>
            <p className="text-sm text-slate-400">{t.plantMetrics}</p>
          </div>
          <select className="bg-slate-800 border border-slate-700 text-slate-300 text-sm rounded-lg px-3 py-2 outline-none focus:border-primary-500">
            <option>{t.last6Months}</option>
            <option>Last 12 Months</option>
          </select>
        </div>
        
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={MOCK_SALES}>
              <defs>
                <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="month" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `${val/1000}k`} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f1f5f9' }}
                itemStyle={{ color: '#3B82F6' }}
              />
              <Area 
                type="monotone" 
                dataKey="unitsSold" 
                stroke="#3B82F6" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorSales)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-slate-900 to-slate-900 border border-slate-800 rounded-xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
                <Factory className="w-32 h-32 text-primary-500" />
            </div>
            <h3 className="text-white font-semibold mb-2 relative z-10">{t.startBatch}</h3>
            <p className="text-slate-400 text-sm mb-4 relative z-10 max-w-xs">{t.startBatchDesc}</p>
            <button onClick={() => onChangeView(AppView.PRODUCTION)} className="relative z-10 bg-white text-slate-950 hover:bg-slate-200 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                {t.viewSchedule}
            </button>
        </div>

        <div className="bg-gradient-to-br from-slate-900 to-slate-900 border border-slate-800 rounded-xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
                <CheckCircle className="w-32 h-32 text-accent-emerald" />
            </div>
            <h3 className="text-white font-semibold mb-2 relative z-10">{t.aiStatus}</h3>
            <p className="text-slate-400 text-sm mb-4 relative z-10 max-w-xs">{t.aiStatusDesc}</p>
            <div className="flex gap-2 relative z-10">
                <span className="px-2 py-1 rounded bg-emerald-500/10 text-emerald-500 text-xs border border-emerald-500/20">Gemini 2.5 Flash</span>
                <span className="px-2 py-1 rounded bg-slate-800 text-slate-400 text-xs border border-slate-700">{t.latency}: 45ms</span>
            </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardView;