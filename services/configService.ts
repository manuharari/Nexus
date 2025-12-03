
import { ClientConfiguration, ModuleId, IndustryType } from '../types';

const DEFAULT_MODULES: Record<ModuleId, boolean> = {
  predictive_maintenance: true,
  production_forecasting: true,
  procurement_intel: true,
  quality_control: true,
  scenario_simulator: true,
  digital_twin: true,
  energy_management: true,
  work_orders: true,
  crm: true,
  erp_lite: true,
  voice_assistant: false,
  documents: true
};

const INITIAL_CLIENTS: ClientConfiguration[] = [
  {
    clientId: 'enterprise-01',
    clientName: 'Nexus Enterprise (Full)',
    contactEmail: 'admin@nexus-demo.com',
    status: 'Active',
    planTier: 'Enterprise',
    renewalDate: '2024-12-31',
    enabledModules: { ...DEFAULT_MODULES },
    rateLimitPerMinute: 1000,
    edgeBufferSize: 5000,
    // Demo account remains unlocked to show versatility
    defaultIndustry: undefined,
    branding: {
        companyNameOverride: 'Nexus Manufacturing AI'
    }
  },
  {
    clientId: 'tech-auto',
    clientName: 'Tesla Gigafactory (High-Tech)',
    contactEmail: 'elon@tesla.com',
    status: 'Active',
    planTier: 'Enterprise',
    renewalDate: '2025-06-30',
    enabledModules: {
        ...DEFAULT_MODULES,
        erp_lite: false, 
        crm: false 
    },
    rateLimitPerMinute: 5000,
    edgeBufferSize: 10000,
    defaultIndustry: IndustryType.AUTOMOTIVE,
    branding: {
        logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/e/e8/Tesla_logo.png' // Public mock URL for demo
    }
  },
  {
    clientId: 'mid-mfg',
    clientName: 'MidWest Machining (Standard)',
    contactEmail: 'ops@midwest.com',
    status: 'Active',
    planTier: 'Pro',
    renewalDate: '2024-09-15',
    enabledModules: {
      predictive_maintenance: true,
      production_forecasting: true,
      procurement_intel: true,
      quality_control: false,
      scenario_simulator: false,
      digital_twin: false,
      energy_management: true,
      work_orders: true,
      crm: true,
      erp_lite: true,
      voice_assistant: false,
      documents: true
    },
    rateLimitPerMinute: 100,
    edgeBufferSize: 1000,
    defaultIndustry: IndustryType.DISCRETE_MFG
  },
  {
    clientId: 'basic-01',
    clientName: 'Mom & Pop Shop (Basic)',
    contactEmail: 'owner@mompop.com',
    status: 'Pending',
    planTier: 'Basic',
    renewalDate: '2024-08-01',
    enabledModules: {
      predictive_maintenance: true,
      production_forecasting: true,
      procurement_intel: false,
      quality_control: false,
      scenario_simulator: false,
      digital_twin: false,
      energy_management: false,
      work_orders: true,
      crm: false,
      erp_lite: false,
      voice_assistant: false,
      documents: true
    },
    rateLimitPerMinute: 20,
    edgeBufferSize: 100,
    defaultIndustry: IndustryType.DISCRETE_MFG
  }
];

class ConfigService {
  private currentConfig: ClientConfiguration = INITIAL_CLIENTS[0];
  private clients: ClientConfiguration[] = [...INITIAL_CLIENTS];
  private listeners: (() => void)[] = [];

  public getAvailableClients() { return this.clients; }
  public getClientConfig(): ClientConfiguration { return this.currentConfig; }

  public setClient(clientId: string) {
    const config = this.clients.find(c => c.clientId === clientId);
    if (config) {
      this.currentConfig = config;
      this.notifyListeners();
    }
  }

  public addClient(client: ClientConfiguration) {
    this.clients.push(client);
    this.notifyListeners();
  }

  public updateClient(clientId: string, updates: Partial<ClientConfiguration>) {
      this.clients = this.clients.map(c => c.clientId === clientId ? { ...c, ...updates } : c);
      if (this.currentConfig.clientId === clientId) {
          this.currentConfig = { ...this.currentConfig, ...updates };
      }
      this.notifyListeners();
  }

  public deleteClient(clientId: string) {
      this.clients = this.clients.filter(c => c.clientId !== clientId);
      this.notifyListeners();
  }

  // --- Hierarchical Feature Flag Logic ---
  public isModuleEnabled(moduleId: ModuleId): boolean {
    // 1. Check Tenant Level
    if (!this.currentConfig.enabledModules[moduleId]) return false;
    
    // 2. (Architecture Placeholder) Check User Role Level override
    // const userRole = authService.getCurrentUser()?.role;
    // if (ROLE_OVERRIDES[userRole][moduleId] === false) return false;

    return true;
  }

  public getEnabledModuleNames(): string[] {
    return Object.entries(this.currentConfig.enabledModules).filter(([_, e]) => e).map(([k]) => k);
  }

  public getAllModuleIds(): ModuleId[] {
      return Object.keys(DEFAULT_MODULES) as ModuleId[];
  }

  public subscribe(listener: () => void) {
    this.listeners.push(listener);
    return () => { this.listeners = this.listeners.filter(l => l !== listener); };
  }

  private notifyListeners() { this.listeners.forEach(l => l()); }
}

export const configService = new ConfigService();
