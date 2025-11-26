
import React, { useState } from 'react';
import { Activity, Lock, User as UserIcon, Globe, Building2, ShieldCheck, Briefcase, DollarSign, Wrench, Factory } from 'lucide-react';
import { authService } from '../services/authService';
import { configService } from '../services/configService';
import { Language } from '../types';
import { getTranslation } from '../services/i18nService';

interface LoginViewProps {
  onLoginSuccess: () => void;
  lang: Language;
  onToggleLang: () => void;
}

const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess, lang, onToggleLang }) => {
  const t = getTranslation(lang).login;
  const [email, setEmail] = useState('admin@nexus.ai');
  const [password, setPassword] = useState('admin');
  const [selectedClient, setSelectedClient] = useState('enterprise-01');
  const [error, setError] = useState('');

  const clients = configService.getAvailableClients();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check Tenant Status first
    const clientConfig = clients.find(c => c.clientId === selectedClient);
    if (clientConfig?.status === 'Suspended') {
        setError("Account Suspended. Please contact Platform Support for payment.");
        return;
    }

    // Apply selected client configuration
    configService.setClient(selectedClient);
    
    const user = authService.login(email, password);
    if (user) {
      onLoginSuccess();
    } else {
      setError(t.error);
    }
  };

  // Helper to select super admin
  const fillSuperAdmin = () => {
      setEmail('platform@nexus.ai');
      setPassword('admin');
  };

  const fillCreds = (e: string, p: string) => {
      setEmail(e);
      setPassword(p);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-primary-600/20 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-accent-cyan/10 rounded-full blur-[120px]" />
      
      {/* Language Toggle */}
      <button onClick={onToggleLang} className="absolute top-6 right-6 text-slate-400 hover:text-white flex items-center gap-2 px-3 py-2 rounded-full bg-slate-900/50 border border-slate-800 z-20">
          <Globe className="w-4 h-4" />
          <span className="text-xs font-bold uppercase">{lang}</span>
      </button>

      <div className="w-full max-w-md relative z-10 px-6">
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 p-8 rounded-2xl shadow-2xl">
          <div className="flex flex-col items-center mb-8">
            <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-accent-cyan rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-primary-500/20">
              <Activity className="text-white w-7 h-7" />
            </div>
            <h1 className="text-2xl font-bold text-white">Nexus AI</h1>
            <p className="text-slate-400 text-sm mt-1">{t.title}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm p-3 rounded-lg text-center">
                {error}
              </div>
            )}
            
            {/* Tenant Selector for Demo */}
            <div className="space-y-1">
               <label className="text-xs font-medium text-slate-400 uppercase tracking-wider ml-1">Client Profile (Simulated)</label>
               <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <select 
                    value={selectedClient}
                    onChange={(e) => setSelectedClient(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-3 text-slate-200 focus:outline-none focus:border-primary-500 transition-all appearance-none"
                  >
                      {clients.map(c => (
                          <option key={c.clientId} value={c.clientId}>
                              {c.clientName} {c.status !== 'Active' ? `(${c.status})` : ''}
                          </option>
                      ))}
                  </select>
               </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-400 uppercase tracking-wider ml-1">{t.email}</label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input 
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-3 text-slate-200 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all"
                  placeholder="name@company.com"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-400 uppercase tracking-wider ml-1">{t.password}</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input 
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-3 text-slate-200 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button 
              type="submit"
              className="w-full bg-primary-600 hover:bg-primary-500 text-white font-medium py-3 rounded-lg shadow-lg shadow-primary-600/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              {t.signIn}
            </button>

            <div className="pt-4 text-center">
                <p className="text-xs text-slate-500 mb-3 uppercase tracking-widest font-bold">Quick Demo Login</p>
                <div className="flex flex-wrap justify-center gap-2">
                    
                    <button type="button" onClick={fillSuperAdmin} className="group relative flex items-center gap-1.5 bg-slate-800/80 hover:bg-slate-700 border border-slate-700 hover:border-accent-cyan px-2.5 py-1.5 rounded-lg text-xs text-slate-300 transition-all">
                        <ShieldCheck className="w-3 h-3 text-accent-cyan" />
                        <span>Platform</span>
                    </button>

                    <button type="button" onClick={() => fillCreds('ceo@nexus.ai', 'admin')} className="group flex items-center gap-1.5 bg-slate-800/80 hover:bg-slate-700 border border-slate-700 hover:border-indigo-500 px-2.5 py-1.5 rounded-lg text-xs text-slate-300 transition-all">
                        <Briefcase className="w-3 h-3 text-indigo-500" />
                        <span>Director</span>
                    </button>
                    
                    <button type="button" onClick={() => fillCreds('admin@nexus.ai', 'admin')} className="group flex items-center gap-1.5 bg-slate-800/80 hover:bg-slate-700 border border-slate-700 hover:border-primary-500 px-2.5 py-1.5 rounded-lg text-xs text-slate-300 transition-all">
                        <Lock className="w-3 h-3 text-primary-500" />
                        <span>Master</span>
                    </button>

                    <button type="button" onClick={() => fillCreds('sales@nexus.ai', 'user')} className="group flex items-center gap-1.5 bg-slate-800/80 hover:bg-slate-700 border border-slate-700 hover:border-emerald-500 px-2.5 py-1.5 rounded-lg text-xs text-slate-300 transition-all">
                        <DollarSign className="w-3 h-3 text-emerald-500" />
                        <span>Sales</span>
                    </button>

                    <button type="button" onClick={() => fillCreds('maintenance@nexus.ai', 'user')} className="group flex items-center gap-1.5 bg-slate-800/80 hover:bg-slate-700 border border-slate-700 hover:border-amber-500 px-2.5 py-1.5 rounded-lg text-xs text-slate-300 transition-all">
                        <Wrench className="w-3 h-3 text-amber-500" />
                        <span>Maint.</span>
                    </button>

                    <button type="button" onClick={() => fillCreds('purchasing@nexus.ai', 'user')} className="group flex items-center gap-1.5 bg-slate-800/80 hover:bg-slate-700 border border-slate-700 hover:border-blue-400 px-2.5 py-1.5 rounded-lg text-xs text-slate-300 transition-all">
                        <Factory className="w-3 h-3 text-blue-400" />
                        <span>Purchasing</span>
                    </button>

                </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginView;
