import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, DollarSign, Search, ShoppingCart, Calendar, Lock, Truck, Award, Package, BarChart2, Globe, Link2 } from 'lucide-react';
import { MOCK_SUPPLIERS } from '../constants';
import { ProcurementInsight, Material, IncomingShipment, Language } from '../types';
import { optimizeProcurement } from '../services/geminiService';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { authService } from '../services/authService';
import { dataService } from '../services/dataService';
import { emailService } from '../services/emailService';
import { getTranslation } from '../services/i18nService';

interface ProcurementViewProps {
    lang?: Language;
}

const ProcurementView: React.FC<ProcurementViewProps> = ({ lang = 'en' }) => {
  const t = getTranslation(lang as Language).procurement;
  const [activeTab, setActiveTab] = useState<'market' | 'logistics'>('market');
  const [materials, setMaterials] = useState<Material[]>([]);
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
  const [insight, setInsight] = useState<ProcurementInsight | null>(null);
  const [loading, setLoading] = useState(false);
  const [shipments, setShipments] = useState<IncomingShipment[]>([]);
  const [carriers, setCarriers] = useState(dataService.getShippingCarriers());

  const canRunForecasts = authService.hasPermission('can_run_forecasts');

  useEffect(() => {
    const data = dataService.getMaterials();
    setMaterials(data);
    setShipments(dataService.getIncomingShipments());
    if (data.length > 0 && !selectedMaterial) {
        setSelectedMaterial(data[0]);
    }
  }, []);

  useEffect(() => {
    const updatedMaterials = dataService.getMaterials();
    setMaterials(updatedMaterials);
    if (selectedMaterial) {
        const updatedSelected = updatedMaterials.find(m => m.id === selectedMaterial.id);
        if (updatedSelected) setSelectedMaterial(updatedSelected);
    }
  }, [selectedMaterial?.id]);

  const handleAnalyze = async () => {
    if (!canRunForecasts || !selectedMaterial) return;
    setLoading(true);
    try {
      const result = await optimizeProcurement(selectedMaterial);
      setInsight(result);

      // AUTOMATED EMAIL TRIGGER
      if (result.action === 'Buy Now') {
        emailService.sendAlertEmail(
            'procurement_team',
            `BUY SIGNAL: ${selectedMaterial.name}`,
            `Material: ${selectedMaterial.name}<br/>Recommendation: BUY NOW<br/>Est Savings: ${result.costSavingsEstimate}<br/>Valid Until: ${new Date(result.recommendedWindow.end).toLocaleDateString()}`
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleCarrier = (id: string) => {
      dataService.toggleCarrierConnection(id);
      setCarriers([...dataService.getShippingCarriers()]);
  };

  if (!selectedMaterial) return <div>Loading...</div>;

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      
      {/* View Switcher Tabs */}
      <div className="flex gap-4 mb-6">
          <button 
              onClick={() => setActiveTab('market')}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 font-medium text-sm transition-all ${activeTab === 'market' ? 'bg-primary-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
          >
              <BarChart2 className="w-4 h-4" /> {t.marketIntel}
          </button>
          <button 
              onClick={() => setActiveTab('logistics')}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 font-medium text-sm transition-all ${activeTab === 'logistics' ? 'bg-primary-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
          >
              <Truck className="w-4 h-4" /> {t.inboundLogistics}
          </button>
      </div>

      {activeTab === 'market' ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 overflow-hidden">
            {/* Sidebar List */}
            <div className="lg:col-span-3 bg-slate-900 border border-slate-800 rounded-xl flex flex-col overflow-hidden h-full">
                <div className="p-4 border-b border-slate-800">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <input 
                            type="text" 
                            placeholder={t.searchPlaceholder} 
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:border-primary-500"
                        />
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-2">
                    {materials.map(mat => (
                        <button 
                            key={mat.id}
                            onClick={() => {
                                setSelectedMaterial(mat);
                                setInsight(null);
                            }}
                            className={`w-full p-3 rounded-lg text-left border transition-all ${
                                selectedMaterial.id === mat.id 
                                ? 'bg-slate-800 border-primary-500/50 ring-1 ring-primary-500/50' 
                                : 'bg-slate-900/50 border-transparent hover:bg-slate-800'
                            }`}
                        >
                            <div className="flex justify-between items-start">
                                <span className="font-medium text-slate-200 text-sm">{mat.name}</span>
                                <span className="text-xs text-slate-500 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">{t.moq}: {mat.moq}</span>
                            </div>
                            <div className="mt-2 font-mono text-slate-300 flex justify-between items-end">
                                <span>${mat.currentPrice.toLocaleString()}</span>
                                <span className="text-[10px] text-slate-500">{mat.unit}</span>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-9 flex flex-col gap-6 overflow-y-auto h-full pr-2">
                {/* Supplier Scorecard */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {MOCK_SUPPLIERS.map(supplier => (
                        <div key={supplier.id} className="bg-slate-900 border border-slate-800 p-4 rounded-lg">
                        <div className="flex justify-between items-start mb-2">
                            <h4 className="font-semibold text-slate-200 text-sm">{supplier.name}</h4>
                            <div className={`px-2 py-0.5 rounded text-[10px] ${supplier.qualityScore >= 9 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                                {t.grade} {supplier.qualityScore >= 9 ? 'A' : 'B'}
                            </div>
                        </div>
                        <div className="text-xs text-slate-400 mb-2">{supplier.materialCategory}</div>
                        <div className="flex justify-between items-center text-xs border-t border-slate-800 pt-2">
                            <div className="flex items-center gap-1 text-slate-300">
                                <Truck className="w-3 h-3" /> {supplier.onTimeDelivery}% {t.onTime}
                            </div>
                            <div className="text-slate-500">{t.price}: {supplier.priceCompetitiveness}</div>
                        </div>
                        </div>
                    ))}
                </div>

                {/* Chart Header */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 min-h-[350px] flex flex-col">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <h2 className="text-2xl font-bold text-white">{selectedMaterial.name}</h2>
                            <p className="text-slate-400 text-sm mt-1">{t.globalIndex} • Lead Time: {selectedMaterial.supplierLeadTime} days</p>
                        </div>
                        <button 
                            onClick={handleAnalyze}
                            disabled={loading || !canRunForecasts}
                            title={canRunForecasts ? t.predictPrice : "Permission Required"}
                            className={`px-6 py-2 rounded-lg font-medium text-sm transition-all shadow-lg shadow-emerald-900/20 flex items-center gap-2 ${
                                loading || !canRunForecasts 
                                ? 'bg-slate-800 text-slate-500 cursor-not-allowed' 
                                : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                            }`}
                        >
                            {loading ? t.analyzing : canRunForecasts ? t.predictPrice : 'Restricted'}
                            {!loading && canRunForecasts && <DollarSign className="w-4 h-4" />}
                            {!canRunForecasts && <Lock className="w-4 h-4" />}
                        </button>
                    </div>

                    <div className="flex-1 relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={selectedMaterial.priceHistory}>
                                <defs>
                                    <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                                <XAxis dataKey="date" stroke="#64748b" tickFormatter={(str) => new Date(str).toLocaleDateString(undefined, {month:'short', year: '2-digit'})} />
                                <YAxis domain={['auto', 'auto']} stroke="#64748b" tickFormatter={(val) => `$${val}`} />
                                <Tooltip 
                                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f1f5f9' }}
                                    formatter={(value: number) => [`$${value.toFixed(2)}`, 'Price']}
                                />
                                <Area type="monotone" dataKey="price" stroke="#10B981" strokeWidth={3} fill="url(#colorPrice)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* AI Advice */}
                {insight && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in slide-in-from-bottom-4 duration-500 pb-6">
                        <div className={`p-6 rounded-xl border flex flex-col justify-center items-center text-center ${
                            insight.action === 'Buy Now' ? 'bg-emerald-900/20 border-emerald-500/30' :
                            'bg-amber-900/20 border-amber-500/30'
                        }`}>
                            <span className="text-sm text-slate-400 uppercase tracking-wider mb-2">{t.aiRec}</span>
                            <div className={`text-3xl font-bold flex items-center gap-2 ${
                                insight.action === 'Buy Now' ? 'text-emerald-400' : 'text-amber-400'
                            }`}>
                                {insight.action === 'Buy Now' ? <ShoppingCart className="w-6 h-6" /> : <Calendar className="w-6 h-6" />}
                                {insight.action}
                            </div>
                        </div>

                        <div className="p-6 rounded-xl bg-slate-900 border border-slate-800">
                            <h4 className="font-medium text-slate-300 mb-4 flex items-center gap-2">
                                <DollarSign className="w-4 h-4 text-emerald-500" /> {t.financialImpact}
                            </h4>
                            <div className="space-y-3">
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500">{t.estSavings}</span>
                                    <span className="text-emerald-400 font-bold">{insight.costSavingsEstimate}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500">{t.confidence}</span>
                                    <span className="text-white">{insight.confidenceInterval}%</span>
                                </div>
                                <div className="flex justify-between text-sm border-t border-slate-800 pt-2 mt-2">
                                    <span className="text-slate-500">{t.buyWindow}</span>
                                    <span className="text-white text-right">
                                        {new Date(insight.recommendedWindow.start).toLocaleDateString()} - <br/>
                                        {new Date(insight.recommendedWindow.end).toLocaleDateString()}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 md:col-span-1">
                            <div className="flex items-start gap-2">
                                <div className="mt-1">
                                    {insight.action === 'Buy Now' ? <TrendingDown className="w-5 h-5 text-emerald-500" /> : <TrendingUp className="w-5 h-5 text-amber-500" />}
                                </div>
                                <div>
                                    <h4 className="font-medium text-slate-200 mb-2">{t.marketAnalysis}</h4>
                                    <p className="text-sm text-slate-400 leading-relaxed">
                                        {insight.explanation}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
          </div>
      ) : (
          /* Inbound Logistics Tab with Shipping Integration */
          <div className="flex-1 flex gap-6">
            <div className="flex-1 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex flex-col">
                <div className="p-6 border-b border-slate-800 bg-slate-950/50 flex justify-between items-center">
                    <div>
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            <Package className="w-5 h-5 text-primary-500" /> {t.incomingShipments}
                        </h3>
                        <p className="text-sm text-slate-400">{t.trackDeliveries}</p>
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="text-xs uppercase text-slate-500 bg-slate-950 font-semibold">
                            <tr>
                                <th className="px-6 py-4">{t.status}</th>
                                <th className="px-6 py-4">{t.material}</th>
                                <th className="px-6 py-4">{t.supplier}</th>
                                <th className="px-6 py-4">{t.quantity}</th>
                                <th className="px-6 py-4">{t.transport}</th>
                                <th className="px-6 py-4">{t.estArrival}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                            {shipments.map(shp => (
                                <tr key={shp.id} className="hover:bg-slate-800/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                                            shp.status === 'Delayed' ? 'bg-rose-900/30 text-rose-400' :
                                            shp.status === 'Customs' ? 'bg-amber-900/30 text-amber-400' :
                                            shp.status === 'In Transit' ? 'bg-blue-900/30 text-blue-400' :
                                            'bg-slate-800 text-slate-400'
                                        }`}>
                                            {shp.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 font-medium text-white">{shp.materialName}</td>
                                    <td className="px-6 py-4 text-slate-400">{shp.supplier}</td>
                                    <td className="px-6 py-4 text-white font-mono">{shp.quantity} {shp.unit}</td>
                                    <td className="px-6 py-4 text-slate-400 flex items-center gap-2">
                                        {shp.transportMethod === 'Ship' ? <Truck className="w-4 h-4" /> : shp.transportMethod === 'Air' ? <TrendingUp className="w-4 h-4" /> : <Truck className="w-4 h-4" />}
                                        {shp.transportMethod}
                                    </td>
                                    <td className="px-6 py-4 text-emerald-400 font-medium">{new Date(shp.estimatedArrival).toLocaleDateString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Shipping Integrations Panel */}
            <div className="w-80 bg-slate-900 border border-slate-800 rounded-xl flex flex-col overflow-hidden">
                <div className="p-6 border-b border-slate-800 bg-slate-950/50">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <Globe className="w-5 h-5 text-accent-cyan" /> Integrations
                    </h3>
                    <p className="text-sm text-slate-400 mt-1">Connect shipping carriers.</p>
                </div>
                <div className="p-4 space-y-4">
                    {carriers.map(carrier => (
                         <div key={carrier.id} className="border border-slate-800 rounded-lg p-4 flex items-center justify-between bg-slate-950/50">
                             <div>
                                 <div className="font-bold text-slate-200">{carrier.name}</div>
                                 <div className={`text-xs flex items-center gap-1 mt-1 ${carrier.apiStatus === 'Connected' ? 'text-emerald-400' : 'text-slate-500'}`}>
                                     <span className={`w-2 h-2 rounded-full ${carrier.apiStatus === 'Connected' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-600'}`}></span>
                                     {carrier.apiStatus}
                                 </div>
                             </div>
                             <button 
                                onClick={() => toggleCarrier(carrier.id)}
                                className={`p-2 rounded-lg transition-colors ${
                                    carrier.apiStatus === 'Connected' 
                                    ? 'bg-rose-900/20 text-rose-400 hover:bg-rose-900/40' 
                                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                                }`}
                             >
                                 <Link2 className="w-4 h-4" />
                             </button>
                         </div>
                    ))}
                </div>
            </div>
          </div>
      )}
    </div>
  );
};

export default ProcurementView;