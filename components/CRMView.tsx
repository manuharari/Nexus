
import React, { useState } from 'react';
import { dataService } from '../services/dataService';
import { Language } from '../types';
import { getTranslation } from '../services/i18nService';
import { Users, Briefcase, TrendingUp, Truck, PackageCheck, Clock } from 'lucide-react';

interface CRMViewProps {
  lang?: Language;
}

const CRMView: React.FC<CRMViewProps> = ({ lang = 'en' }) => {
  const t = getTranslation(lang as Language).crm;
  const customers = dataService.getCustomers();
  const orders = dataService.getSalesOrders();
  const [activeTab, setActiveTab] = useState<'overview' | 'logistics'>('overview');

  return (
    <div className="flex flex-col h-full gap-6">
       <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <Briefcase className="w-6 h-6 text-primary-500" /> CRM & Sales
            </h2>
            <div className="flex bg-slate-900 rounded-lg p-1 border border-slate-800">
                <button 
                    onClick={() => setActiveTab('overview')}
                    className={`px-4 py-1.5 text-xs font-medium rounded-md transition-all ${activeTab === 'overview' ? 'bg-slate-800 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                >
                    {t.overview}
                </button>
                <button 
                    onClick={() => setActiveTab('logistics')}
                    className={`px-4 py-1.5 text-xs font-medium rounded-md transition-all ${activeTab === 'logistics' ? 'bg-slate-800 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                >
                    {t.outboundOrders}
                </button>
            </div>
       </div>

       {activeTab === 'overview' ? (
           <>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Pipeline Stats */}
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col">
                        <h3 className="text-slate-400 text-sm uppercase font-bold mb-4">{t.pipeline}</h3>
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-bold text-white">$66,500</span>
                            <span className="text-sm text-emerald-400 flex items-center"><TrendingUp className="w-3 h-3" /> +12%</span>
                        </div>
                        <div className="mt-4 space-y-2">
                            <div className="flex justify-between text-sm text-slate-400">
                                <span>Pending</span>
                                <span>2 Orders</span>
                            </div>
                            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                                <div className="bg-blue-500 w-[20%] h-full" />
                            </div>
                        </div>
                    </div>
                    
                    {/* Churn Risk */}
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                        <h3 className="text-slate-400 text-sm uppercase font-bold mb-4">{t.churnRisk}</h3>
                        {customers.filter(c => c.predictedChurnRisk !== 'Low').map(c => (
                            <div key={c.id} className="flex items-center justify-between p-3 bg-slate-950 border border-slate-800 rounded-lg mb-2">
                                <div>
                                    <div className="font-bold text-slate-200">{c.name}</div>
                                    <div className="text-xs text-slate-500">Last Contact: {c.lastInteraction}</div>
                                </div>
                                <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                                    c.predictedChurnRisk === 'High' ? 'bg-rose-900/30 text-rose-400' : 'bg-amber-900/30 text-amber-400'
                                }`}>
                                    {c.predictedChurnRisk} Risk
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Customer Table */}
                <div className="flex-1 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex flex-col">
                        <div className="p-4 border-b border-slate-800 bg-slate-950/50">
                            <h3 className="font-bold text-white">{t.customers}</h3>
                        </div>
                        <div className="flex-1 overflow-y-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="text-xs uppercase text-slate-500 bg-slate-950">
                                    <tr>
                                        <th className="px-6 py-3">Name</th>
                                        <th className="px-6 py-3">Segment</th>
                                        <th className="px-6 py-3">Total Orders</th>
                                        <th className="px-6 py-3">LTV</th>
                                        <th className="px-6 py-3">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800">
                                    {customers.map(c => (
                                        <tr key={c.id} className="hover:bg-slate-800/50">
                                            <td className="px-6 py-4 font-medium text-white">{c.name}</td>
                                            <td className="px-6 py-4 text-slate-400">{c.segment}</td>
                                            <td className="px-6 py-4 text-slate-300">{c.totalOrders}</td>
                                            <td className="px-6 py-4 text-emerald-400 font-mono">${c.lifetimeValue.toLocaleString()}</td>
                                            <td className="px-6 py-4">
                                                <button className="text-primary-400 hover:text-white text-xs underline">View Orders</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                </div>
           </>
       ) : (
           /* Outbound Logistics Tab */
           <div className="flex-1 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex flex-col animate-in slide-in-from-right-4">
               <div className="p-4 border-b border-slate-800 bg-slate-950/50 flex justify-between items-center">
                   <h3 className="font-bold text-white flex items-center gap-2"><Truck className="w-5 h-5 text-accent-amber" /> Outbound Logistics</h3>
               </div>
               <div className="flex-1 overflow-y-auto">
                   <table className="w-full text-left text-sm">
                       <thead className="text-xs uppercase text-slate-500 bg-slate-950">
                           <tr>
                               <th className="px-6 py-3">Order ID</th>
                               <th className="px-6 py-3">Customer</th>
                               <th className="px-6 py-3">Status</th>
                               <th className="px-6 py-3">Order Date</th>
                               <th className="px-6 py-3">Total Value</th>
                               <th className="px-6 py-3">Items</th>
                           </tr>
                       </thead>
                       <tbody className="divide-y divide-slate-800">
                           {orders.map(order => (
                               <tr key={order.id} className="hover:bg-slate-800/50">
                                   <td className="px-6 py-4 font-mono text-slate-400 text-xs">{order.id}</td>
                                   <td className="px-6 py-4 font-bold text-white">{order.customerName}</td>
                                   <td className="px-6 py-4">
                                       <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase flex items-center w-fit gap-1 ${
                                           order.status === 'Delivered' ? 'bg-emerald-900/30 text-emerald-400 border border-emerald-900' :
                                           order.status === 'Shipped' ? 'bg-blue-900/30 text-blue-400 border border-blue-900' :
                                           order.status === 'In Production' ? 'bg-amber-900/30 text-amber-400 border border-amber-900' :
                                           'bg-slate-800 text-slate-400'
                                       }`}>
                                           {order.status === 'Shipped' && <Truck className="w-3 h-3" />}
                                           {order.status === 'Delivered' && <PackageCheck className="w-3 h-3" />}
                                           {order.status === 'Pending' && <Clock className="w-3 h-3" />}
                                           {order.status}
                                       </span>
                                   </td>
                                   <td className="px-6 py-4 text-slate-400">{new Date(order.date).toLocaleDateString()}</td>
                                   <td className="px-6 py-4 text-emerald-400 font-mono font-bold">${order.totalAmount.toLocaleString()}</td>
                                   <td className="px-6 py-4 text-xs text-slate-500">
                                       {order.items.map((item, i) => (
                                           <div key={i}>{item.quantity}x {item.skuId}</div>
                                       ))}
                                   </td>
                               </tr>
                           ))}
                       </tbody>
                   </table>
               </div>
           </div>
       )}
    </div>
  );
};

export default CRMView;
