
import React, { useState, useEffect } from 'react';
import { CalendarCheck, BarChart3, Package, AlertCircle, Sparkles, Lock, Gauge, Plus, Minus, Edit, X, Loader2 } from 'lucide-react';
import { MOCK_OEE } from '../constants';
import { ProductionInsight, ProductSKU, Language, InventoryAction } from '../types';
import { forecastProduction } from '../services/geminiService';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts';
import { authService } from '../services/authService';
import { dataService } from '../services/dataService';
import { emailService } from '../services/emailService';
import { getTranslation } from '../services/i18nService';

interface ProductionViewProps {
    lang?: Language;
}

const ProductionView: React.FC<ProductionViewProps> = ({ lang = 'en' }) => {
  const t = getTranslation(lang as Language).production;
  const [skus, setSkus] = useState<ProductSKU[]>([]);
  const [selectedSku, setSelectedSku] = useState<ProductSKU | null>(null);
  const [forecast, setForecast] = useState<ProductionInsight | null>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [loadingAI, setLoadingAI] = useState(false);
  const canRunForecasts = authService.hasPermission('can_run_forecasts');
  const canManageInventory = authService.hasPermission('can_manage_inventory');

  // Inventory Modal State
  const [isInventoryModalOpen, setIsInventoryModalOpen] = useState(false);
  const [invAction, setInvAction] = useState<InventoryAction>('ADD');
  const [invQty, setInvQty] = useState(0);
  const [invReason, setInvReason] = useState('');

  const refreshData = async () => {
      const data = await dataService.getSKUs();
      setSkus(data);
      if (data.length > 0 && (!selectedSku || !data.find(s => s.id === selectedSku.id))) {
          setSelectedSku(data[0]);
      } else if (selectedSku) {
          const updated = data.find(s => s.id === selectedSku.id);
          if (updated) setSelectedSku(updated);
      }
  };

  useEffect(() => {
    setLoadingData(true);
    refreshData().finally(() => setLoadingData(false));
  }, []);

  const handleForecast = async () => {
    if (!canRunForecasts || !selectedSku) return;
    setLoadingAI(true);
    try {
      const result = await forecastProduction(selectedSku);
      setForecast(result);
      
      const daysUntilStockout = Math.floor((new Date(result.expectedStockoutDate).getTime() - Date.now()) / 86400000);
      if (daysUntilStockout < 14) {
        emailService.sendAlertEmail(
            'admin',
            `Low Stock Alert: ${selectedSku.name}`,
            `SKU: ${selectedSku.id}<br/>Expected Stockout: ${result.expectedStockoutDate} (${daysUntilStockout} days)<br/>Recommended Start: ${result.recommendedStartDate}`
        );
      }
    } finally {
      setLoadingAI(false);
    }
  };

  const handleInventoryUpdate = async () => {
      if (!selectedSku || invQty <= 0) return;
      await dataService.updateInventory(selectedSku.id, invQty, invAction, invReason);
      await refreshData();
      setIsInventoryModalOpen(false);
      setInvQty(0);
      setInvReason('');
  };

  const OEEGauge = ({ value, label }: { value: number, label: string }) => {
    const data = [{ name: 'Value', value: value }, { name: 'Remaining', value: 100 - value }];
    const color = value > 85 ? '#10B981' : value > 70 ? '#F59E0B' : '#F43F5E';
    
    return (
        <div className="flex flex-col items-center justify-center relative">
             <div className="h-20 w-20 relative">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie data={data} cx="50%" cy="50%" innerRadius={25} outerRadius={35} startAngle={90} endAngle={-270} dataKey="value">
                            <Cell fill={color} />
                            <Cell fill="#1e293b" />
                        </Pie>
                    </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex items-center justify-center font-bold text-white text-sm">
                    {value}%
                </div>
             </div>
             <span className="text-xs text-slate-400 mt-1">{label}</span>
        </div>
    );
  };

  if (loadingData && !selectedSku) return <div className="h-full flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  if (!selectedSku) return <div>No SKUs found.</div>;

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-8rem)] relative">
       
       {/* Inventory Mgmt Modal */}
       {isInventoryModalOpen && (
           <div className="absolute inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-6">
               <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 w-full max-w-md shadow-2xl">
                   <div className="flex justify-between items-center mb-4">
                       <h3 className="text-lg font-bold text-white">{t.manageStock}: {selectedSku.name}</h3>
                       <button onClick={() => setIsInventoryModalOpen(false)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
                   </div>
                   
                   <div className="space-y-4">
                       <div className="flex gap-2 bg-slate-950 p-1 rounded-lg border border-slate-800">
                           {(['ADD', 'SUBTRACT', 'SET'] as const).map(action => (
                               <button 
                                   key={action}
                                   onClick={() => setInvAction(action)}
                                   className={`flex-1 py-2 text-xs font-bold rounded transition-all ${
                                       invAction === action 
                                       ? action === 'ADD' ? 'bg-emerald-600 text-white' : action === 'SUBTRACT' ? 'bg-rose-600 text-white' : 'bg-blue-600 text-white'
                                       : 'text-slate-500 hover:text-white hover:bg-slate-800'
                                   }`}
                               >
                                   {action === 'ADD' ? t.addStock : action === 'SUBTRACT' ? t.subStock : t.setStock}
                               </button>
                           ))}
                       </div>

                       <div>
                           <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">{t.quantity}</label>
                           <input 
                               type="number" 
                               min="1" 
                               value={invQty} 
                               onChange={(e) => setInvQty(parseInt(e.target.value))}
                               className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xl font-mono text-white focus:border-primary-500 outline-none" 
                           />
                       </div>

                       <div>
                           <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">{t.reason}</label>
                           <input 
                               type="text" 
                               value={invReason} 
                               onChange={(e) => setInvReason(e.target.value)}
                               placeholder="e.g. PO-1234, Damaged Goods, Audit..."
                               className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm text-white focus:border-primary-500 outline-none" 
                           />
                       </div>

                       <button 
                           onClick={handleInventoryUpdate}
                           disabled={invQty <= 0}
                           className="w-full py-3 bg-primary-600 hover:bg-primary-500 text-white rounded-lg font-bold transition-all mt-2"
                       >
                           Confirm Update
                       </button>
                   </div>
               </div>
           </div>
       )}

       {/* SKU List */}
       <div className="w-full lg:w-1/4 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex flex-col">
           <div className="p-4 border-b border-slate-800">
               <h3 className="font-semibold text-slate-200">{t.catalog}</h3>
           </div>
           <div className="flex-1 overflow-y-auto p-2 space-y-2">
               {skus.map(sku => (
                   <button
                       key={sku.id}
                       onClick={() => { setSelectedSku(sku); setForecast(null); }}
                       className={`w-full p-3 rounded-lg text-left border transition-all ${
                           selectedSku.id === sku.id
                           ? 'bg-slate-800 border-primary-500/50 ring-1 ring-primary-500/50'
                           : 'bg-slate-900/50 border-transparent hover:bg-slate-800'
                       }`}
                   >
                       <div className="flex justify-between items-start mb-1">
                           <span className="font-medium text-slate-200 text-sm truncate">{sku.name}</span>
                       </div>
                       <div className="flex justify-between text-xs text-slate-500">
                           <span>Stock: {sku.inventory.onHand}</span>
                           <span className={sku.inventory.onHand < sku.inventory.reorderPoint ? "text-rose-500" : "text-emerald-500"}>
                               {sku.inventory.onHand < sku.inventory.reorderPoint ? t.lowStock : t.healthy}
                           </span>
                       </div>
                   </button>
               ))}
           </div>
       </div>

       {/* Analysis Panel */}
       <div className="flex-1 flex flex-col gap-6 overflow-y-auto">
           
           {/* OEE Metrics Header */}
           <div className="grid grid-cols-4 bg-slate-900 border border-slate-800 rounded-xl p-4">
               <div className="col-span-4 mb-2 flex items-center gap-2 border-b border-slate-800 pb-2">
                   <Gauge className="w-5 h-5 text-primary-500" />
                   <h3 className="font-semibold text-white text-sm">{t.plantEff}</h3>
               </div>
               <OEEGauge value={MOCK_OEE.availability} label={t.availability} />
               <OEEGauge value={MOCK_OEE.performance} label={t.performance} />
               <OEEGauge value={MOCK_OEE.quality} label={t.quality} />
               <div className="flex flex-col items-center justify-center border-l border-slate-800">
                    <span className="text-2xl font-bold text-white">{MOCK_OEE.overall}%</span>
                    <span className="text-xs text-slate-400 uppercase tracking-wider">{t.overall}</span>
               </div>
           </div>

           <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
               {/* SKU Details Card */}
               <div className="lg:col-span-3 bg-slate-900 border border-slate-800 rounded-xl p-6">
                   <div className="flex justify-between items-start">
                       <div>
                           <h2 className="text-xl font-bold text-white mb-1">{selectedSku.name}</h2>
                           <p className="text-slate-400 text-sm">{selectedSku.category} • {t.leadTime}: {selectedSku.leadTimeDays} {t.days}</p>
                       </div>
                       <div className="flex gap-3">
                           {canManageInventory && (
                               <button 
                                   onClick={() => setIsInventoryModalOpen(true)}
                                   className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 rounded-lg font-medium text-sm flex items-center gap-2"
                               >
                                   <Edit className="w-4 h-4" /> {t.manageStock}
                               </button>
                           )}
                           <button 
                               onClick={handleForecast}
                               disabled={loadingAI || !canRunForecasts}
                               title={canRunForecasts ? "Run Forecast" : "Permission Required"}
                               className={`px-6 py-2 rounded-lg font-medium text-sm transition-all flex items-center gap-2 shadow-lg shadow-primary-900/20 ${
                                    loadingAI || !canRunForecasts 
                                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed' 
                                    : 'bg-primary-600 hover:bg-primary-500 text-white'
                               }`}
                           >
                               {loadingAI ? <Sparkles className="w-4 h-4 animate-spin" /> : canRunForecasts ? <CalendarCheck className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                               {canRunForecasts ? t.generateSchedule : t.restricted}
                           </button>
                       </div>
                   </div>

                   {/* Inventory Stats */}
                   <div className="grid grid-cols-3 gap-4 mt-6">
                       <div className="bg-slate-950 rounded-lg p-3 border border-slate-800">
                           <span className="text-xs text-slate-500 uppercase">{t.onHand}</span>
                           <div className="text-xl font-bold text-white">{selectedSku.inventory.onHand}</div>
                       </div>
                       <div className="bg-slate-950 rounded-lg p-3 border border-slate-800">
                           <span className="text-xs text-slate-500 uppercase">{t.reserved}</span>
                           <div className="text-xl font-bold text-indigo-400">{selectedSku.inventory.reserved}</div>
                       </div>
                       <div className="bg-slate-950 rounded-lg p-3 border border-slate-800">
                           <span className="text-xs text-slate-500 uppercase">{t.reorderPoint}</span>
                           <div className="text-xl font-bold text-amber-400">{selectedSku.inventory.reorderPoint}</div>
                       </div>
                   </div>
               </div>

               {/* AI Forecast Result */}
               {forecast && (
                   <>
                       <div className="lg:col-span-1 bg-gradient-to-br from-indigo-900/20 to-slate-900 border border-indigo-500/30 rounded-xl p-6 animate-in slide-in-from-bottom-4">
                           <h3 className="text-indigo-200 font-semibold mb-4 flex items-center gap-2">
                               <Package className="w-5 h-5" /> {t.productionPlan}
                           </h3>
                           <div className="space-y-6">
                               <div>
                                   <span className="text-xs text-slate-400 uppercase tracking-wider block mb-1">{t.recStart}</span>
                                   <div className="text-lg font-bold text-white bg-indigo-500/20 border border-indigo-500/40 px-3 py-2 rounded inline-block">
                                       {new Date(forecast.recommendedStartDate).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                                   </div>
                               </div>
                               <div>
                                   <span className="text-xs text-slate-400 uppercase tracking-wider block mb-1">{t.quantity}</span>
                                   <div className="text-2xl font-bold text-white">{forecast.suggestedQuantity} {t.units}</div>
                               </div>
                               <div>
                                   <span className="text-xs text-slate-400 uppercase tracking-wider block mb-1">{t.projStockout}</span>
                                   <div className="text-sm font-medium text-rose-400 flex items-center gap-1">
                                       <AlertCircle className="w-3 h-3" />
                                       {new Date(forecast.expectedStockoutDate).toLocaleDateString()}
                                   </div>
                               </div>
                           </div>
                       </div>

                       <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-6 animate-in slide-in-from-bottom-6">
                           <h3 className="text-slate-200 font-semibold mb-4">{t.demandCapacity}</h3>
                           <div className="h-64">
                               <ResponsiveContainer width="100%" height="100%">
                                   <BarChart data={[
                                       { name: 'Next 30', demand: forecast.forecastedDemand.next30 },
                                       { name: 'Next 60', demand: forecast.forecastedDemand.next60 },
                                       { name: 'Next 90', demand: forecast.forecastedDemand.next90 },
                                   ]}>
                                       <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                                       <XAxis dataKey="name" stroke="#64748b" />
                                       <YAxis stroke="#64748b" />
                                       <Tooltip cursor={{fill: '#1e293b', opacity: 0.4}} contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b' }} />
                                       <Bar dataKey="demand" fill="#3B82F6" radius={[4, 4, 0, 0]} name="Forecast Demand" />
                                   </BarChart>
                               </ResponsiveContainer>
                           </div>
                           <p className="mt-4 text-sm text-slate-400 italic">
                               "{forecast.reasoning}"
                           </p>
                       </div>
                   </>
               )}
           </div>
       </div>
    </div>
  );
};

export default ProductionView;
