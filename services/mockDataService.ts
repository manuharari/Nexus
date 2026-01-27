
import { IDataService } from './interfaces';
import { MachineStatus, ProductSKU, Material, IndustryType, CalendarEvent, ClientDelivery, IncomingShipment, Customer, SalesOrder, WorkOrder, FinancialMetric, ShippingCarrier, DocumentResource, InventoryAction, DailyReport, MapTile, TileType } from '../types';
import { MOCK_DATASETS, MOCK_DELIVERIES, MOCK_COMPANY_EVENTS, MOCK_INCOMING_SHIPMENTS, MOCK_CUSTOMERS, MOCK_ORDERS, MOCK_WORK_ORDERS, MOCK_FINANCIALS, MOCK_DOCUMENTS } from '../constants';
import { securityService } from './securityService';
import { authService } from './authService';

const STORAGE_KEY = 'NEXUS_DATA_STORE_V1';

export class MockDataService implements IDataService {
  private currentIndustry: IndustryType = IndustryType.DISCRETE_MFG;
  private machines: MachineStatus[] = [];
  private mapTiles: MapTile[] = []; 
  private skus: ProductSKU[] = [];
  private materials: Material[] = [];
  private deliveries: ClientDelivery[] = [];
  private companyEvents: CalendarEvent[] = [];
  private incomingShipments: IncomingShipment[] = [];
  private documents: DocumentResource[] = [];
  private customers: Customer[] = [];
  private salesOrders: SalesOrder[] = [];
  private workOrders: WorkOrder[] = [];
  private financialMetrics: FinancialMetric[] = [];
  private shippingCarriers: ShippingCarrier[] = [];

  constructor() {
      this.loadFromStorage();
  }

  // --- Persistence ---
  private save() {
      try {
          const state = {
              currentIndustry: this.currentIndustry,
              machines: this.machines,
              mapTiles: this.mapTiles,
              skus: this.skus,
              materials: this.materials,
              deliveries: this.deliveries,
              companyEvents: this.companyEvents,
              incomingShipments: this.incomingShipments,
              documents: this.documents,
              customers: this.customers,
              salesOrders: this.salesOrders,
              workOrders: this.workOrders,
              financialMetrics: this.financialMetrics,
              shippingCarriers: this.shippingCarriers
          };
          localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      } catch (e) {
          console.error("Failed to save state", e);
      }
  }

  private loadFromStorage() {
      try {
          const saved = localStorage.getItem(STORAGE_KEY);
          if (saved) {
              const parsed = JSON.parse(saved);
              this.currentIndustry = parsed.currentIndustry || IndustryType.DISCRETE_MFG;
              this.machines = parsed.machines || [];
              this.mapTiles = parsed.mapTiles || [];
              this.skus = parsed.skus || [];
              this.materials = parsed.materials || [];
              this.deliveries = parsed.deliveries || [];
              this.companyEvents = parsed.companyEvents || [];
              this.incomingShipments = parsed.incomingShipments || [];
              this.documents = parsed.documents || [];
              this.customers = parsed.customers || [];
              this.salesOrders = parsed.salesOrders || [];
              this.workOrders = parsed.workOrders || [];
              this.financialMetrics = parsed.financialMetrics || [];
              this.shippingCarriers = parsed.shippingCarriers || [];
          } else {
              this.resetToMocks(IndustryType.DISCRETE_MFG);
          }
      } catch (e) {
          this.resetToMocks(IndustryType.DISCRETE_MFG);
      }
  }

  private resetToMocks(industry: IndustryType) {
      this.currentIndustry = industry;
      const dataset = MOCK_DATASETS[industry];
      this.machines = [...dataset.machines];
      this.machines.forEach(m => {
          if (!m.dimensions) m.dimensions = { width: 1, height: 1 };
      });
      this.skus = [...dataset.skus];
      this.materials = [...dataset.materials];
      this.mapTiles = [];
      this.deliveries = [...MOCK_DELIVERIES];
      this.companyEvents = [...MOCK_COMPANY_EVENTS];
      this.incomingShipments = [...MOCK_INCOMING_SHIPMENTS];
      this.documents = [...MOCK_DOCUMENTS];
      this.customers = [...MOCK_CUSTOMERS];
      this.salesOrders = [...MOCK_ORDERS];
      this.workOrders = [...MOCK_WORK_ORDERS];
      this.financialMetrics = [...MOCK_FINANCIALS];
      this.shippingCarriers = [
        { id: 'fedex', name: 'FedEx API', apiStatus: 'Connected' },
        { id: 'dhl', name: 'DHL Express', apiStatus: 'Disconnected' },
        { id: 'ups', name: 'UPS Logistics', apiStatus: 'Connected' }
      ];
      this.save();
  }

  // --- Async Wrappers for Interface Compliance ---
  async getMachines() { return [...this.machines]; }
  async getMapTiles() { return [...this.mapTiles]; }
  async getSKUs() { return [...this.skus]; }
  async getMaterials() { return [...this.materials]; }
  async getIndustry() { return this.currentIndustry; }
  async getIncomingShipments() { return [...this.incomingShipments]; }
  async getCustomers() { return [...this.customers]; }
  async getSalesOrders() { return [...this.salesOrders]; }
  async getWorkOrders() { return [...this.workOrders]; }
  async getFinancials() { return [...this.financialMetrics]; }
  async getShippingCarriers() { return [...this.shippingCarriers]; }
  async getDocuments() { return [...this.documents]; }

  async switchIndustry(type: IndustryType) {
    if (this.currentIndustry === type) return;
    this.resetToMocks(type);
    authService.logEvent('sys', 'System', 'INDUSTRY_SWITCH', `Switched to ${type}`, 'SUCCESS');
  }

  async getDailySummary(): Promise<DailyReport> {
      const machinesAtRisk = this.machines.filter(m => m.status !== 'Running').length;
      const stockouts = this.skus.filter(s => s.inventory.onHand < s.inventory.reorderPoint).length;
      return {
          date: new Date().toISOString().split('T')[0],
          alertsGenerated: 3,
          machinesAtRisk,
          stockoutsPredicted: stockouts,
          buySignals: this.materials.length > 0 ? 1 : 0,
          summary: `Daily Scan: ${machinesAtRisk} risks.`
      };
  }

  async updateInventory(skuId: string, quantity: number, action: InventoryAction, reason: string) {
      const sku = this.skus.find(s => s.id === skuId);
      if (sku) {
          let newQty = sku.inventory.onHand;
          if (action === 'ADD') newQty += quantity;
          else if (action === 'SUBTRACT') newQty -= quantity;
          else if (action === 'SET') newQty = quantity;
          sku.inventory.onHand = Math.max(0, newQty);
          this.save();
          authService.logEvent('sys', 'System', 'INVENTORY_ADJUST', `${skuId}: ${action} ${quantity}`, 'SUCCESS');
      }
  }

  async addDocument(doc: any) {
      const newDoc: DocumentResource = {
          id: `doc-${Date.now()}`,
          uploadDate: new Date().toISOString().split('T')[0],
          uploadedBy: 'user',
          ...doc
      };
      this.documents.push(newDoc);
      this.save();
  }

  async deleteDocument(id: string) {
      this.documents = this.documents.filter(d => d.id !== id);
      this.save();
  }

  async toggleCarrierConnection(carrierId: string) {
    const carrier = this.shippingCarriers.find(c => c.id === carrierId);
    if (carrier) {
      carrier.apiStatus = carrier.apiStatus === 'Connected' ? 'Disconnected' : 'Connected';
      this.save();
    }
  }

  async checkResourceConflict(resourceId: string, start: string, end: string): Promise<boolean> {
      if (!start || !end) return false;
      const s = new Date(start).getTime();
      const e = new Date(end).getTime();

      const conflictWO = this.workOrders.find(w => 
          w.machineId === resourceId && 
          w.status !== 'Closed' &&
          w.startDate && w.endDate &&
          (new Date(w.startDate).getTime() <= e && new Date(w.endDate).getTime() >= s)
      );
      return !!conflictWO;
  }

  async createWorkOrder(wo: any): Promise<{ order: WorkOrder, conflict: boolean }> {
      const newWo: WorkOrder = {
          id: `WO-${Date.now()}`,
          createdDate: new Date().toISOString().split('T')[0],
          ...wo
      };
      const hasConflict = wo.startDate ? await this.checkResourceConflict(wo.machineId, wo.startDate, wo.endDate) : false;
      this.workOrders.push(newWo);
      this.save();
      return { order: newWo, conflict: hasConflict };
  }

  async updateMachineStatus(machineId: string, newStatus: MachineStatus['status'], reason: string) {
    const m = this.machines.find(m => m.id === machineId);
    if (m) {
        m.status = newStatus;
        if (newStatus === 'Running' && m.currentDowntimeStart) {
             // Log downtime resolution logic here similar to original
             m.currentDowntimeStart = undefined;
        } else if (newStatus !== 'Running') {
             m.currentDowntimeStart = new Date().toISOString();
        }
        this.save();
        return m;
    }
    return undefined;
  }

  async updateMachinePosition(machineId: string, x: number | undefined, y: number | undefined) {
      const m = this.machines.find(m => m.id === machineId);
      if (m) {
          m.gridPosition = x !== undefined && y !== undefined ? { x, y } : undefined;
          this.save();
      }
  }

  async addMachine(data: any) {
      const m: MachineStatus = {
          id: `M-NEW-${Date.now()}`,
          name: data.name,
          type: data.type,
          status: 'Stopped',
          healthScore: 100,
          runTimeHours: 0,
          lastMaintenance: new Date().toISOString().split('T')[0],
          errorCodes: [],
          maintenanceLogs: [],
          readings: [],
          energyUsageKwh: 0,
          dimensions: { width: data.width || 1, height: data.height || 1 }
      };
      this.machines.push(m);
      this.save();
      return m;
  }

  async setTileType(x: number, y: number, type: TileType) {
      this.mapTiles = this.mapTiles.filter(t => t.x !== x || t.y !== y);
      if (type !== 'floor') this.mapTiles.push({ x, y, type });
      this.save();
  }

  async resetFactoryMap() {
      this.machines.forEach(m => m.gridPosition = undefined);
      this.mapTiles = [];
      this.save();
  }

  async getCalendarEvents(): Promise<CalendarEvent[]> {
      // Aggregation logic from original dataService
      const events = [...this.companyEvents];
      // Add machine maintenance, delivery logic here (omitted for brevity, copying conceptually)
      return events;
  }

  async addCalendarEvent(event: any) {
      const e = { ...event, id: `EVT-${Date.now()}`, isApproved: true };
      this.companyEvents.push(e);
      this.save();
      return e;
  }

  async approveCalendarEvent(eventId: string) {
      const e = this.companyEvents.find(ev => ev.id === eventId);
      if (e) { e.isApproved = true; this.save(); }
  }

  async processUpload(type: any, rawCsvText: string) {
      const csvText = securityService.sanitizeInput(rawCsvText);
      return { success: true, message: "Upload processed (Simulated)" };
  }
}
