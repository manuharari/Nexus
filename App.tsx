
import React, { useState, useEffect, useRef } from 'react';
import { 
  LayoutDashboard, 
  Activity, 
  Factory, 
  ShoppingCart, 
  Bell, 
  Menu,
  Users,
  LogOut,
  ShieldAlert,
  Database,
  Lock,
  Calendar,
  Settings2,
  Globe,
  Briefcase,
  DollarSign,
  Camera,
  Sliders,
  Map,
  Zap,
  ClipboardList,
  Share2,
  Building,
  FileCode,
  ShieldCheck,
  Terminal
} from 'lucide-react';
import { AppView, Alert, User, IndustryType, Language } from './types';
import DashboardView from './components/DashboardView';
import MaintenanceView from './components/MaintenanceView';
import ProductionView from './components/ProductionView';
import ProcurementView from './components/ProcurementView';
import UserManagementView from './components/UserManagementView';
import ReportsView from './components/ReportsView';
import CalendarView from './components/CalendarView';
import LoginView from './components/LoginView';
import AlertsPanel from './components/AlertsPanel';
import ChatWidget from './components/ChatWidget';
import CRMView from './components/CRMView';
import ERPView from './components/ERPView';
import QualityView from './components/QualityView';
import SimulationView from './components/SimulationView';
import DigitalTwinView from './components/DigitalTwinView';
import EnergyView from './components/EnergyView';
import WorkOrderView from './components/WorkOrderView';
import DocumentsView from './components/DocumentsView';
import PlatformAdminView from './components/PlatformAdminView';
import SystemHealthView from './components/SystemHealthView';
import ShareModal from './components/ShareModal';
import { hasApiKey } from './services/geminiService';
import { authService } from './services/authService';
import { dataService } from './services/dataService';
import { configService } from './services/configService';
import { emailService } from './services/emailService';
import { getTranslation } from './services/i18nService';

const IDLE_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<AppView>(AppView.AUTH);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isAlertPanelOpen, setIsAlertPanelOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [apiKeyMissing, setApiKeyMissing] = useState(false);
  const [currentIndustry, setCurrentIndustry] = useState<IndustryType>(IndustryType.DISCRETE_MFG);
  const [language, setLanguage] = useState<Language>('en');
  
  // Config State for Re-rendering on hot-swap
  const [clientConfig, setClientConfig] = useState(configService.getClientConfig());
  
  // Session Timer Refs
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const t = getTranslation(language);

  useEffect(() => {
    if (!hasApiKey()) {
      setApiKeyMissing(true);
    }
    // Check if already logged in (simulate session)
    const user = authService.getCurrentUser();
    if (user) {
      setCurrentUser(user);
      if (user.role === 'platform_super_admin') {
          setCurrentView(AppView.PLATFORM_ADMIN);
      } else {
          setCurrentView(AppView.DASHBOARD);
      }
      resetIdleTimer();
    }

    const unsubscribe = configService.subscribe(() => {
        setClientConfig({...configService.getClientConfig()});
    });
    return () => unsubscribe();
  }, []);

  // --- AUTO-SWITCH INDUSTRY ON CLIENT CHANGE ---
  useEffect(() => {
      if (clientConfig.defaultIndustry) {
          setCurrentIndustry(clientConfig.defaultIndustry);
          dataService.switchIndustry(clientConfig.defaultIndustry);
      }
  }, [clientConfig]);

  // --- AUTOMATED DAILY REPORT SCHEDULER ---
  useEffect(() => {
      if (!currentUser) return;

      const today = new Date().toISOString().split('T')[0];
      const lastReportDate = localStorage.getItem('NEXUS_LAST_DAILY_REPORT');

      if (lastReportDate !== today && currentUser.role === 'master_admin') {
          // Generate Report
          const report = dataService.getDailySummary();
          
          // Send Email
          emailService.sendAlertEmail(
              'master_admin',
              `[AUTOMATED] Daily Executive Report - ${today}`,
              `System Status: ${report.machinesAtRisk > 0 ? 'Action Required' : 'Normal'}<br/>
               Machines at Risk: ${report.machinesAtRisk}<br/>
               Predicted Stockouts: ${report.stockoutsPredicted}<br/>
               Detailed CSV attached.`
          );

          // Notify UI
          addAlert({
              id: `rpt-${Date.now()}`,
              type: 'info',
              message: `Daily Report generated and emailed to ${currentUser.email}`,
              timestamp: new Date().toISOString(),
              severity: 'info'
          });

          // Mark as done for today
          localStorage.setItem('NEXUS_LAST_DAILY_REPORT', today);
      }
  }, [currentUser]);

  const resetIdleTimer = () => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    if (currentUser) {
        idleTimerRef.current = setTimeout(() => {
            handleLogout();
            alert("Session expired due to inactivity. Please log in again.");
        }, IDLE_TIMEOUT_MS);
    }
  };

  useEffect(() => {
      const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart'];
      const handler = () => resetIdleTimer();
      events.forEach(event => window.addEventListener(event, handler));
      return () => {
          events.forEach(event => window.removeEventListener(event, handler));
          if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      };
  }, [currentUser]);


  const handleLoginSuccess = () => {
    const user = authService.getCurrentUser();
    setCurrentUser(user);
    if (user?.role === 'platform_super_admin') {
        setCurrentView(AppView.PLATFORM_ADMIN);
    } else {
        setCurrentView(AppView.DASHBOARD);
    }
    resetIdleTimer();
  };

  const handleLogout = () => {
    authService.logout();
    setCurrentUser(null);
    setCurrentView(AppView.AUTH);
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
  };

  const addAlert = (alert: Alert) => {
    setAlerts(prev => [alert, ...prev]);
  };

  const handleIndustryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newIndustry = e.target.value as IndustryType;
    setCurrentIndustry(newIndustry);
    dataService.switchIndustry(newIndustry);
  };

  const handleClientChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      configService.setClient(e.target.value);
      setCurrentView(AppView.DASHBOARD);
  };

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'en' ? 'es' : 'en');
  };

  const isModuleActive = (moduleId: string, permissionId?: string) => {
      const enabledInConfig = configService.isModuleEnabled(moduleId as any);
      const hasPermission = permissionId ? authService.hasPermission(permissionId as any) : true;
      return enabledInConfig && hasPermission;
  };

  const renderView = () => {
    if (!currentUser) return null;

    const commonProps = { key: `${currentIndustry}-${language}-${clientConfig.clientId}`, lang: language };

    switch (currentView) {
      case AppView.DASHBOARD: return isModuleActive('predictive_maintenance', 'can_view_dashboard') ? <DashboardView {...commonProps} onChangeView={setCurrentView} /> : <AccessDenied />;
      case AppView.MAINTENANCE: return isModuleActive('predictive_maintenance', 'can_view_maintenance_model') ? <MaintenanceView {...commonProps} onAlert={addAlert} /> : <AccessDenied />;
      case AppView.PRODUCTION: return isModuleActive('production_forecasting', 'can_view_stock_optimizer') ? <ProductionView {...commonProps} /> : <AccessDenied />;
      case AppView.PROCUREMENT: return isModuleActive('procurement_intel', 'can_view_price_forecast') ? <ProcurementView {...commonProps} /> : <AccessDenied />;
      case AppView.CALENDAR: return authService.hasPermission('can_view_calendar') ? <CalendarView {...commonProps} /> : <AccessDenied />;
      case AppView.REPORTS: return authService.hasPermission('can_download_reports') ? <ReportsView {...commonProps} /> : <AccessDenied />;
      
      case AppView.CRM: return isModuleActive('crm', 'can_view_crm') ? <CRMView {...commonProps} /> : <AccessDenied />;
      case AppView.ERP: return isModuleActive('erp_lite', 'can_view_erp') ? <ERPView {...commonProps} /> : <AccessDenied />;
      case AppView.QUALITY: return isModuleActive('quality_control', 'can_view_quality') ? <QualityView {...commonProps} /> : <AccessDenied />;
      case AppView.SIMULATION: return isModuleActive('scenario_simulator', 'can_view_simulation') ? <SimulationView {...commonProps} /> : <AccessDenied />;
      case AppView.DIGITAL_TWIN: return isModuleActive('digital_twin', 'can_view_digital_twin') ? <DigitalTwinView {...commonProps} /> : <AccessDenied />;
      case AppView.ENERGY: return isModuleActive('energy_management', 'can_view_energy') ? <EnergyView {...commonProps} /> : <AccessDenied />;
      case AppView.WORK_ORDERS: return isModuleActive('work_orders', 'can_view_work_orders') ? <WorkOrderView {...commonProps} /> : <AccessDenied />;
      case AppView.DOCUMENTS: return authService.hasPermission('can_view_documents') ? <DocumentsView {...commonProps} /> : <AccessDenied />;
      
      case AppView.PLATFORM_ADMIN: 
        return currentUser.role === 'platform_super_admin' ? <PlatformAdminView {...commonProps} /> : <AccessDenied />;
      case AppView.SYSTEM_HEALTH:
        return <SystemHealthView />; // No props needed, connects directly to services

      case AppView.USER_MANAGEMENT:
        return currentUser.role === 'master_admin' ? <UserManagementView lang={language} /> : <AccessDenied />;
      default:
        return <DashboardView {...commonProps} onChangeView={setCurrentView} />;
    }
  };

  if (!currentUser || currentView === AppView.AUTH) {
    return <LoginView onLoginSuccess={handleLoginSuccess} lang={language} onToggleLang={toggleLanguage} />;
  }

  // Check if current client forces an industry context
  const isIndustryLocked = !!clientConfig.defaultIndustry;

  return (
    <div className="flex h-screen bg-slate-950 text-slate-200 overflow-hidden font-sans selection:bg-primary-500 selection:text-white">
      
      {!isSidebarOpen && (
        <div className="fixed inset-0 z-20 bg-black/50 lg:hidden" onClick={() => setIsSidebarOpen(true)} />
      )}

      <aside 
        className={`${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} 
        fixed lg:static inset-y-0 left-0 z-30 w-64 bg-slate-900 border-r border-slate-800 transition-transform duration-300 ease-in-out flex flex-col`}
      >
        <div className="h-16 flex items-center px-6 border-b border-slate-800 shrink-0">
          <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-accent-cyan rounded-lg flex items-center justify-center mr-3">
             <Activity className="text-white w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                Nexus AI
            </span>
            <span className="text-[10px] text-emerald-400 font-medium">{clientConfig.planTier}</span>
          </div>
        </div>

        <div className="px-3 py-4 space-y-3 bg-slate-950/30 shrink-0">
           <div className="bg-slate-950 rounded-lg p-2 border border-slate-800 space-y-1">
              <label className="text-[10px] text-slate-500 uppercase font-bold px-1">Client Profile</label>
              <div className="flex items-center gap-2 relative">
                <Building className="w-4 h-4 text-slate-400 absolute left-2" />
                <select 
                    value={clientConfig.clientId} 
                    onChange={handleClientChange}
                    className="w-full bg-slate-800 border border-slate-700 rounded text-xs font-medium text-white outline-none pl-8 py-2 appearance-none cursor-pointer hover:border-slate-500 transition-colors shadow-sm"
                >
                    {configService.getAvailableClients().map(c => (
                        <option key={c.clientId} value={c.clientId}>{c.clientName}</option>
                    ))}
                </select>
              </div>
           </div>

           <div className="bg-slate-950 rounded-lg p-2 border border-slate-800 space-y-1">
              <label className="text-[10px] text-slate-500 uppercase font-bold px-1">Data Context</label>
              <div className="flex items-center gap-2 relative">
                <Settings2 className={`w-4 h-4 absolute left-2 ${isIndustryLocked ? 'text-slate-600' : 'text-slate-400'}`} />
                <select 
                    value={currentIndustry} 
                    onChange={handleIndustryChange}
                    disabled={isIndustryLocked}
                    className={`w-full bg-slate-800 border border-slate-700 rounded text-xs font-medium text-white outline-none pl-8 py-2 appearance-none shadow-sm transition-colors
                        ${isIndustryLocked ? 'opacity-50 cursor-not-allowed bg-slate-900 border-slate-800 text-slate-500' : 'cursor-pointer hover:border-slate-500'}
                    `}
                >
                    <option value={IndustryType.DISCRETE_MFG}>{t.sidebar.industryDiscrete}</option>
                    <option value={IndustryType.PROCESS_PAINT}>{t.sidebar.industryPaint}</option>
                    <option value={IndustryType.AUTOMOTIVE}>Automotive (Robotics)</option>
                    <option value={IndustryType.PHARMA}>Pharma (Bio-Process)</option>
                </select>
              </div>
           </div>

           <button 
             onClick={toggleLanguage}
             className="w-full bg-slate-950 rounded-lg p-2 border border-slate-800 flex items-center gap-3 text-xs font-medium text-slate-300 hover:text-white transition-colors"
           >
              <Globe className="w-4 h-4 text-primary-500" />
              <span className="flex-1 text-left">Language / Idioma</span>
              <span className="bg-slate-800 px-1.5 py-0.5 rounded text-[10px] border border-slate-700 uppercase">{language}</span>
           </button>
        </div>

        <nav className="flex-1 px-3 space-y-1 overflow-y-auto py-2">
          
          {currentUser.role === 'platform_super_admin' && (
              <div className="mb-4">
                  <div className="text-[10px] font-bold text-accent-cyan uppercase tracking-widest px-3 mb-2">Platform Admin</div>
                  <SidebarItem icon={<ShieldCheck className="text-accent-cyan" />} label={t.sidebar.platformAdmin} active={currentView === AppView.PLATFORM_ADMIN} onClick={() => setCurrentView(AppView.PLATFORM_ADMIN)} />
                  <div className="my-2 border-t border-slate-800 mx-2" />
              </div>
          )}

          <div className="text-[10px] font-bold text-slate-600 uppercase tracking-widest px-3 mb-2 mt-2">Operations</div>
          {isModuleActive('predictive_maintenance', 'can_view_dashboard') && <SidebarItem icon={<LayoutDashboard />} label={t.sidebar.dashboard} active={currentView === AppView.DASHBOARD} onClick={() => setCurrentView(AppView.DASHBOARD)} />}
          {isModuleActive('digital_twin', 'can_view_digital_twin') && <SidebarItem icon={<Map />} label={t.sidebar.digitalTwin} active={currentView === AppView.DIGITAL_TWIN} onClick={() => setCurrentView(AppView.DIGITAL_TWIN)} />}
          {isModuleActive('predictive_maintenance', 'can_view_maintenance_model') && <SidebarItem icon={<Activity />} label={t.sidebar.maintenance} active={currentView === AppView.MAINTENANCE} onClick={() => setCurrentView(AppView.MAINTENANCE)} />}
          {isModuleActive('work_orders', 'can_view_work_orders') && <SidebarItem icon={<ClipboardList />} label={t.sidebar.workOrders} active={currentView === AppView.WORK_ORDERS} onClick={() => setCurrentView(AppView.WORK_ORDERS)} />}
          {isModuleActive('energy_management', 'can_view_energy') && <SidebarItem icon={<Zap />} label={t.sidebar.energy} active={currentView === AppView.ENERGY} onClick={() => setCurrentView(AppView.ENERGY)} />}

          <div className="text-[10px] font-bold text-slate-600 uppercase tracking-widest px-3 mb-2 mt-4">Business</div>
          {isModuleActive('production_forecasting', 'can_view_stock_optimizer') && <SidebarItem icon={<Factory />} label={t.sidebar.production} active={currentView === AppView.PRODUCTION} onClick={() => setCurrentView(AppView.PRODUCTION)} />}
          {isModuleActive('procurement_intel', 'can_view_price_forecast') && <SidebarItem icon={<ShoppingCart />} label={t.sidebar.procurement} active={currentView === AppView.PROCUREMENT} onClick={() => setCurrentView(AppView.PROCUREMENT)} />}
          {isModuleActive('crm', 'can_view_crm') && <SidebarItem icon={<Briefcase />} label={t.sidebar.crm} active={currentView === AppView.CRM} onClick={() => setCurrentView(AppView.CRM)} />}
          {isModuleActive('erp_lite', 'can_view_erp') && <SidebarItem icon={<DollarSign />} label={t.sidebar.erp} active={currentView === AppView.ERP} onClick={() => setCurrentView(AppView.ERP)} />}
          
          <div className="text-[10px] font-bold text-slate-600 uppercase tracking-widest px-3 mb-2 mt-4">Analysis & Docs</div>
          {isModuleActive('quality_control', 'can_view_quality') && <SidebarItem icon={<Camera />} label={t.sidebar.quality} active={currentView === AppView.QUALITY} onClick={() => setCurrentView(AppView.QUALITY)} />}
          {isModuleActive('scenario_simulator', 'can_view_simulation') && <SidebarItem icon={<Sliders />} label={t.sidebar.simulation} active={currentView === AppView.SIMULATION} onClick={() => setCurrentView(AppView.SIMULATION)} />}
          {authService.hasPermission('can_view_calendar') && <SidebarItem icon={<Calendar />} label={t.sidebar.schedule} active={currentView === AppView.CALENDAR} onClick={() => setCurrentView(AppView.CALENDAR)} />}
          {authService.hasPermission('can_download_reports') && <SidebarItem icon={<Database />} label={t.sidebar.reports} active={currentView === AppView.REPORTS} onClick={() => setCurrentView(AppView.REPORTS)} />}
          {authService.hasPermission('can_view_documents') && <SidebarItem icon={<FileCode />} label={t.sidebar.documents} active={currentView === AppView.DOCUMENTS} onClick={() => setCurrentView(AppView.DOCUMENTS)} />}
          
          <div className="my-4 border-t border-slate-800 mx-2" />
          <div className="text-[10px] font-bold text-slate-600 uppercase tracking-widest px-3 mb-2">Administration</div>
          
          {currentUser.role === 'master_admin' && (
               <SidebarItem icon={<Users />} label={t.sidebar.users} active={currentView === AppView.USER_MANAGEMENT} onClick={() => setCurrentView(AppView.USER_MANAGEMENT)} />
          )}
          <SidebarItem icon={<Terminal />} label="System Health (Console)" active={currentView === AppView.SYSTEM_HEALTH} onClick={() => setCurrentView(AppView.SYSTEM_HEALTH)} />

        </nav>

        <div className="p-4 border-t border-slate-800 space-y-4 shrink-0">
          <div className={`p-3 rounded-lg text-xs flex items-center gap-2 ${apiKeyMissing ? 'bg-red-900/20 text-red-400 border border-red-900/50' : 'bg-emerald-900/20 text-emerald-400 border border-emerald-900/50'}`}>
             {apiKeyMissing ? t.sidebar.missingKey : <><Lock className="w-3 h-3" /> {t.sidebar.secure}</>}
          </div>
          <button onClick={handleLogout} className="flex items-center gap-2 text-sm text-slate-400 hover:text-white w-full px-2 py-1 transition-colors">
            <LogOut className="w-4 h-4" /> {t.sidebar.signOut}
          </button>
        </div>
      </aside>

      <main className={`flex-1 flex flex-col transition-all duration-300 ${isSidebarOpen ? 'lg:ml-0' : 'lg:-ml-64'}`}>
        <header className="h-16 bg-slate-900/50 backdrop-blur-md border-b border-slate-800 flex items-center justify-between px-6 sticky top-0 z-10 shrink-0">
          <div className="flex items-center">
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 rounded-md hover:bg-slate-800 text-slate-400 hover:text-white transition-colors">
              <Menu className="w-5 h-5" />
            </button>
          </div>

          <div className="flex items-center gap-4">
            <button 
                onClick={() => setIsShareModalOpen(true)}
                className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-600 hover:bg-primary-500 text-white text-xs font-medium transition-colors shadow-lg shadow-primary-900/20"
            >
                <Share2 className="w-3 h-3" />
                Share
            </button>

            <button className="relative p-2 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors" onClick={() => setIsAlertPanelOpen(true)}>
              <Bell className="w-5 h-5" />
              {alerts.length > 0 && <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-accent-rose rounded-full ring-2 ring-slate-900 animate-pulse" />}
            </button>
            <div className="flex items-center gap-3">
              <div className="text-right hidden md:block">
                 <div className="text-sm font-medium text-white">{currentUser.name}</div>
                 <div className="text-xs text-slate-400 capitalize">{currentUser.role.replace('_', ' ')}</div>
              </div>
              <div className="w-8 h-8 rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center text-sm font-bold text-slate-300">
                 {currentUser.name.charAt(0)}
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 bg-slate-950 relative">
            {renderView()}
        </div>
      </main>

      {currentUser.role !== 'platform_super_admin' && <ChatWidget lang={language} />}
      <AlertsPanel isOpen={isAlertPanelOpen} onClose={() => setIsAlertPanelOpen(false)} alerts={alerts} lang={language} />
      <ShareModal isOpen={isShareModalOpen} onClose={() => setIsShareModalOpen(false)} lang={language} />
    </div>
  );
};

const SidebarItem: React.FC<{ icon: React.ReactNode; label: string; active: boolean; onClick: () => void }> = ({ icon, label, active, onClick }) => (
  <button onClick={onClick} className={`w-full flex items-center px-3 py-2 rounded-lg transition-all duration-200 group ${active ? 'bg-primary-600 text-white shadow-lg shadow-primary-900/20' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}>
    <span className={`mr-3 ${active ? 'text-white' : 'text-slate-500 group-hover:text-slate-300'}`}>{React.cloneElement(icon as React.ReactElement<any>, { size: 18 })}</span>
    <span className="font-medium text-xs">{label}</span>
  </button>
);

const AccessDenied: React.FC = () => (
  <div className="h-full flex flex-col items-center justify-center text-center max-w-lg mx-auto">
    <div className="p-4 bg-rose-500/10 rounded-full mb-6"><ShieldAlert className="w-16 h-16 text-rose-500" /></div>
    <h2 className="text-2xl font-bold text-white mb-2">Access Denied</h2>
    <p className="text-slate-400 mb-6">You do not have permission to access this module, or it is disabled for your client configuration.</p>
  </div>
);

export default App;