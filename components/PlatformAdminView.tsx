
import React, { useState, useEffect } from 'react';
import { Building2, ShieldCheck, ToggleLeft, ToggleRight, Settings, Plus, Trash2, Save, X, Search, CreditCard, Palette, Image as ImageIcon } from 'lucide-react';
import { configService } from '../services/configService';
import { ClientConfiguration, ModuleId, Language, ClientStatus } from '../types';
import { getTranslation } from '../services/i18nService';

interface PlatformAdminViewProps {
  lang?: Language;
}

const PlatformAdminView: React.FC<PlatformAdminViewProps> = ({ lang = 'en' }) => {
  const t = getTranslation(lang as Language).platformAdmin; // Assuming you'll add this to i18n
  const [clients, setClients] = useState<ClientConfiguration[]>([]);
  const [selectedClient, setSelectedClient] = useState<ClientConfiguration | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'modules' | 'branding'>('details');
  
  // Form State
  const [formData, setFormData] = useState<Partial<ClientConfiguration>>({});

  useEffect(() => {
    refreshClients();
    const unsubscribe = configService.subscribe(refreshClients);
    return () => unsubscribe();
  }, []);

  const refreshClients = () => {
    setClients([...configService.getAvailableClients()]);
  };

  const handleCreate = () => {
    setFormData({
        clientId: `client-${Date.now()}`,
        clientName: '',
        contactEmail: '',
        status: 'Pending',
        planTier: 'Basic',
        enabledModules: { ...configService.getClientConfig().enabledModules }, // Copy current or default
        branding: {} 
    });
    setEditMode(false);
    setActiveTab('details');
    setIsModalOpen(true);
  };

  const handleEdit = (client: ClientConfiguration) => {
    setFormData({ 
        ...client,
        branding: client.branding || {} 
    });
    setEditMode(true);
    setActiveTab('details');
    setIsModalOpen(true);
  };

  const handleDelete = (clientId: string) => {
    if (confirm('Are you sure you want to delete this tenant? This action cannot be undone.')) {
        configService.deleteClient(clientId);
    }
  };

  const handleSave = () => {
      if (!formData.clientName || !formData.clientId) return;

      const newClient = formData as ClientConfiguration;
      
      if (editMode) {
          configService.updateClient(newClient.clientId, newClient);
      } else {
          configService.addClient(newClient);
      }
      setIsModalOpen(false);
  };

  const toggleModule = (moduleId: ModuleId) => {
      if (!formData.enabledModules) return;
      setFormData({
          ...formData,
          enabledModules: {
              ...formData.enabledModules,
              [moduleId]: !formData.enabledModules[moduleId]
          }
      });
  };

  const getStatusColor = (status: ClientStatus) => {
      switch (status) {
          case 'Active': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50';
          case 'Pending': return 'bg-amber-500/20 text-amber-400 border-amber-500/50';
          case 'Suspended': return 'bg-rose-500/20 text-rose-400 border-rose-500/50';
      }
  };

  return (
    <div className="flex flex-col h-full gap-6">
       
       {/* Modal for Edit/Create */}
       {isModalOpen && (
           <div className="absolute inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-6">
               <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
                   <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-950/50 sticky top-0 z-10 shrink-0">
                       <h3 className="text-xl font-bold text-white flex items-center gap-2">
                           <Building2 className="w-6 h-6 text-primary-500" /> {editMode ? 'Edit Tenant' : 'New Tenant Onboarding'}
                       </h3>
                       <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
                   </div>
                   
                   {/* Tabs */}
                   <div className="flex border-b border-slate-800 bg-slate-900 px-6 pt-2">
                       <button onClick={() => setActiveTab('details')} className={`pb-3 px-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'details' ? 'border-primary-500 text-white' : 'border-transparent text-slate-400 hover:text-white'}`}>
                           Details
                       </button>
                       <button onClick={() => setActiveTab('modules')} className={`pb-3 px-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'modules' ? 'border-primary-500 text-white' : 'border-transparent text-slate-400 hover:text-white'}`}>
                           Modules
                       </button>
                       <button onClick={() => setActiveTab('branding')} className={`pb-3 px-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'branding' ? 'border-primary-500 text-white' : 'border-transparent text-slate-400 hover:text-white'}`}>
                           Branding (Whitelabel)
                       </button>
                   </div>

                   <div className="p-6 space-y-8 overflow-y-auto flex-1">
                       
                       {/* TAB 1: DETAILS */}
                       {activeTab === 'details' && (
                           <div>
                               <h4 className="text-sm font-bold text-primary-400 uppercase tracking-wider mb-4 border-b border-slate-800 pb-2">Account Information</h4>
                               <div className="grid grid-cols-2 gap-4">
                                   <div>
                                       <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Company Name</label>
                                       <input value={formData.clientName} onChange={e => setFormData({...formData, clientName: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white focus:border-primary-500 outline-none" />
                                   </div>
                                   <div>
                                       <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Tenant ID (Slug)</label>
                                       <input disabled={editMode} value={formData.clientId} onChange={e => setFormData({...formData, clientId: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white focus:border-primary-500 outline-none disabled:opacity-50" />
                                   </div>
                                   <div>
                                       <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Admin Contact Email</label>
                                       <input value={formData.contactEmail} onChange={e => setFormData({...formData, contactEmail: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white focus:border-primary-500 outline-none" />
                                   </div>
                                   <div className="grid grid-cols-2 gap-4">
                                       <div>
                                            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Status</label>
                                            <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as ClientStatus})} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white focus:border-primary-500 outline-none">
                                                <option value="Active">Active</option>
                                                <option value="Pending">Pending Payment</option>
                                                <option value="Suspended">Suspended</option>
                                            </select>
                                       </div>
                                       <div>
                                            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Tier</label>
                                            <select value={formData.planTier} onChange={e => setFormData({...formData, planTier: e.target.value as any})} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white focus:border-primary-500 outline-none">
                                                <option value="Basic">Basic</option>
                                                <option value="Pro">Pro</option>
                                                <option value="Enterprise">Enterprise</option>
                                            </select>
                                       </div>
                                   </div>
                               </div>
                           </div>
                       )}

                       {/* TAB 2: MODULES */}
                       {activeTab === 'modules' && (
                           <div>
                               <h4 className="text-sm font-bold text-accent-cyan uppercase tracking-wider mb-4 border-b border-slate-800 pb-2">Module Configuration (Feature Flags)</h4>
                               <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                   {configService.getAllModuleIds().map(moduleId => (
                                       <div 
                                          key={moduleId} 
                                          onClick={() => toggleModule(moduleId)}
                                          className={`p-3 rounded-lg border cursor-pointer transition-all flex items-center justify-between ${
                                              formData.enabledModules?.[moduleId] 
                                              ? 'bg-emerald-900/10 border-emerald-500/30 hover:bg-emerald-900/20' 
                                              : 'bg-slate-950 border-slate-800 opacity-60 hover:opacity-100'
                                          }`}
                                       >
                                           <span className="text-sm font-medium text-slate-300 capitalize">
                                               {moduleId.replace(/_/g, ' ')}
                                           </span>
                                           {formData.enabledModules?.[moduleId] ? (
                                               <ToggleRight className="w-6 h-6 text-emerald-500" />
                                           ) : (
                                               <ToggleLeft className="w-6 h-6 text-slate-600" />
                                           )}
                                       </div>
                                   ))}
                               </div>
                           </div>
                       )}

                       {/* TAB 3: BRANDING */}
                       {activeTab === 'branding' && (
                           <div>
                               <h4 className="text-sm font-bold text-indigo-400 uppercase tracking-wider mb-4 border-b border-slate-800 pb-2">Whitelabel Settings</h4>
                               <div className="space-y-6">
                                   <div>
                                       <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Company Name Override</label>
                                       <input 
                                            value={formData.branding?.companyNameOverride || ''} 
                                            onChange={e => setFormData({
                                                ...formData, 
                                                branding: { ...formData.branding, companyNameOverride: e.target.value }
                                            })} 
                                            placeholder="e.g. Acme Corp Analytics"
                                            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white focus:border-primary-500 outline-none" 
                                       />
                                       <p className="text-[10px] text-slate-500 mt-1">Replaces "Nexus Manufacturing AI" in the header title.</p>
                                   </div>

                                   <div>
                                       <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Logo URL (Public Image Link)</label>
                                       <div className="flex gap-2">
                                            <div className="relative flex-1">
                                                <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                                <input 
                                                        value={formData.branding?.logoUrl || ''} 
                                                        onChange={e => setFormData({
                                                            ...formData, 
                                                            branding: { ...formData.branding, logoUrl: e.target.value }
                                                        })} 
                                                        placeholder="https://example.com/logo.png"
                                                        className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-3 text-white focus:border-primary-500 outline-none" 
                                                />
                                            </div>
                                       </div>
                                       
                                   </div>

                                   {/* Preview Area */}
                                   <div className="p-6 bg-slate-950 border border-slate-800 rounded-xl flex flex-col items-center justify-center">
                                       <span className="text-xs text-slate-500 uppercase mb-4">Sidebar Preview</span>
                                       <div className="bg-slate-900 border border-slate-800 p-4 rounded-lg flex items-center gap-3 w-64">
                                            {/* Render Logo Logic inline for preview */}
                                            <div className="w-10 h-10 shrink-0">
                                                {formData.branding?.logoUrl ? (
                                                    <img src={formData.branding.logoUrl} className="w-full h-full object-contain" alt="Preview" />
                                                ) : (
                                                    <div className="w-full h-full bg-primary-600 rounded-full flex items-center justify-center text-xs text-white">Default</div>
                                                )}
                                            </div>
                                            <div>
                                                <div className="font-bold text-white text-xl">NEXUS</div>
                                                <div className="text-[0.6rem] text-accent-cyan tracking-widest uppercase">Manufacturing AI</div>
                                            </div>
                                       </div>
                                   </div>
                               </div>
                           </div>
                       )}
                   </div>

                   <div className="p-6 border-t border-slate-800 flex justify-end gap-3 bg-slate-950/50 sticky bottom-0 shrink-0">
                       <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-400 hover:text-white text-sm">Cancel</button>
                       <button onClick={handleSave} className="px-6 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-lg font-bold flex items-center gap-2">
                           <Save className="w-4 h-4" /> Save Configuration
                       </button>
                   </div>
               </div>
           </div>
       )}

       {/* Header */}
       <div className="flex justify-between items-end mb-4">
           <div>
               <h2 className="text-3xl font-bold text-white flex items-center gap-3">
                   <ShieldCheck className="w-8 h-8 text-primary-500" /> Platform Administration
               </h2>
               <p className="text-slate-400 mt-2">Manage tenants, subscription status, and global feature flags.</p>
           </div>
           <button 
                onClick={handleCreate}
                className="bg-primary-600 hover:bg-primary-500 text-white px-5 py-2.5 rounded-lg font-bold flex items-center gap-2 shadow-lg shadow-primary-900/20 transition-all"
           >
               <Plus className="w-5 h-5" /> Onboard New Tenant
           </button>
       </div>

       {/* KPI Strip */}
       <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
           <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
               <span className="text-xs text-slate-500 uppercase font-bold">Total Active Tenants</span>
               <div className="text-3xl font-bold text-white mt-1">{clients.filter(c => c.status === 'Active').length}</div>
           </div>
           <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
               <span className="text-xs text-slate-500 uppercase font-bold">Pending Payment</span>
               <div className="text-3xl font-bold text-amber-400 mt-1">{clients.filter(c => c.status === 'Pending').length}</div>
           </div>
           <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
               <span className="text-xs text-slate-500 uppercase font-bold">Enterprise Plans</span>
               <div className="text-3xl font-bold text-indigo-400 mt-1">{clients.filter(c => c.planTier === 'Enterprise').length}</div>
           </div>
           <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
               <span className="text-xs text-slate-500 uppercase font-bold">Total MRR (Est)</span>
               <div className="text-3xl font-bold text-emerald-400 mt-1">$45k</div>
           </div>
       </div>

       {/* Client List */}
       <div className="flex-1 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex flex-col">
           <div className="p-4 border-b border-slate-800 bg-slate-950/50 flex items-center gap-4">
               <Search className="w-5 h-5 text-slate-500" />
               <input type="text" placeholder="Search tenants..." className="bg-transparent outline-none text-white text-sm w-full" />
           </div>
           
           <div className="flex-1 overflow-y-auto">
               <table className="w-full text-left text-sm">
                   <thead className="bg-slate-950 text-xs uppercase text-slate-500 font-semibold sticky top-0 z-10">
                       <tr>
                           <th className="px-6 py-4">Company / Tenant</th>
                           <th className="px-6 py-4">Plan & Status</th>
                           <th className="px-6 py-4">Active Modules</th>
                           <th className="px-6 py-4">Renewal</th>
                           <th className="px-6 py-4 text-right">Actions</th>
                       </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-800">
                       {clients.map(client => (
                           <tr key={client.clientId} className="hover:bg-slate-800/50 transition-colors group">
                               <td className="px-6 py-4">
                                   <div className="flex items-center gap-3">
                                       <div className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center text-slate-400 font-bold border border-slate-700 overflow-hidden">
                                           {client.branding?.logoUrl ? (
                                               <img src={client.branding.logoUrl} alt="Logo" className="w-full h-full object-contain p-1" />
                                           ) : (
                                               client.clientName.charAt(0)
                                           )}
                                       </div>
                                       <div>
                                           <div className="font-bold text-white">{client.clientName}</div>
                                           <div className="text-xs text-slate-500 font-mono">{client.clientId}</div>
                                       </div>
                                   </div>
                               </td>
                               <td className="px-6 py-4">
                                   <div className="space-y-1">
                                       <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${getStatusColor(client.status)}`}>
                                           {client.status}
                                       </span>
                                       <div className="text-xs text-slate-400">{client.planTier} Plan</div>
                                   </div>
                               </td>
                               <td className="px-6 py-4">
                                   <div className="flex flex-wrap gap-1 max-w-xs">
                                       {Object.entries(client.enabledModules).filter(([k,v]) => v).slice(0, 4).map(([key]) => (
                                           <span key={key} className="px-1.5 py-0.5 bg-slate-800 rounded text-[10px] text-slate-300 border border-slate-700 capitalize">
                                               {key.replace('_',' ')}
                                           </span>
                                       ))}
                                       {Object.values(client.enabledModules).filter(v => v).length > 4 && (
                                           <span className="px-1.5 py-0.5 bg-slate-800 rounded text-[10px] text-slate-500 border border-slate-700">
                                               +{Object.values(client.enabledModules).filter(v => v).length - 4} more
                                           </span>
                                       )}
                                   </div>
                               </td>
                               <td className="px-6 py-4 text-slate-400 font-mono text-xs">
                                   {client.renewalDate || 'N/A'}
                               </td>
                               <td className="px-6 py-4 text-right">
                                   <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                       <button 
                                          onClick={() => handleEdit(client)}
                                          className="p-2 bg-slate-800 hover:bg-primary-600 hover:text-white rounded-lg text-slate-400 transition-colors" title="Configure Tenant"
                                       >
                                           <Settings className="w-4 h-4" />
                                       </button>
                                       <button 
                                          onClick={() => handleDelete(client.clientId)}
                                          className="p-2 bg-slate-800 hover:bg-rose-600 hover:text-white rounded-lg text-slate-400 transition-colors" title="Delete Tenant"
                                       >
                                           <Trash2 className="w-4 h-4" />
                                       </button>
                                   </div>
                               </td>
                           </tr>
                       ))}
                   </tbody>
               </table>
           </div>
       </div>
    </div>
  );
};

export default PlatformAdminView;
