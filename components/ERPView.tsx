
import React, { useState, useEffect } from 'react';
import { dataService } from '../services/dataService';
import { Language, FinancialMetric } from '../types';
import { getTranslation } from '../services/i18nService';
import { DollarSign, PieChart, TrendingUp, Loader2 } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface ERPViewProps {
  lang?: Language;
}

const ERPView: React.FC<ERPViewProps> = ({ lang = 'en' }) => {
  const t = getTranslation(lang as Language).erp;
  const [financials, setFinancials] = useState<FinancialMetric[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
      dataService.getFinancials().then(setFinancials).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="h-full flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin" /></div>;

  return (
    <div className="flex flex-col h-full gap-6">
       <h2 className="text-2xl font-bold text-white flex items-center gap-2">
           <DollarSign className="w-6 h-6 text-emerald-500" /> ERP & Finance
       </h2>

       <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
           <div className="p-6 bg-slate-900 border border-slate-800 rounded-xl">
               <span className="text-xs text-slate-500 uppercase">{t.revenue} (QTD)</span>
               <div className="text-3xl font-bold text-white mt-2">$1.35M</div>
           </div>
           <div className="p-6 bg-slate-900 border border-slate-800 rounded-xl">
               <span className="text-xs text-slate-500 uppercase">{t.margin}</span>
               <div className="text-3xl font-bold text-emerald-400 mt-2">47.4%</div>
           </div>
           <div className="p-6 bg-slate-900 border border-slate-800 rounded-xl">
               <span className="text-xs text-slate-500 uppercase">{t.netProfit}</span>
               <div className="text-3xl font-bold text-indigo-400 mt-2">$320k</div>
           </div>
       </div>

       <div className="flex-1 bg-slate-900 border border-slate-800 rounded-xl p-6">
            <h3 className="font-bold text-white mb-6">Financial Performance Trend</h3>
            <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={financials}>
                        <defs>
                            <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                        <XAxis dataKey="period" stroke="#64748b" />
                        <YAxis stroke="#64748b" />
                        <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b' }} />
                        <Area type="monotone" dataKey="revenue" stroke="#10B981" fillOpacity={1} fill="url(#colorRev)" />
                        <Area type="monotone" dataKey="netProfit" stroke="#6366f1" fillOpacity={0.5} fill="#6366f1" />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
       </div>
    </div>
  );
};

export default ERPView;
