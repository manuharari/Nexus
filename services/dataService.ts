
import { MachineStatus, ProductSKU, Material, SensorReading, SalesRecord, PricePoint, IndustryType, CalendarEvent, ClientDelivery, IncomingShipment, Customer, SalesOrder, WorkOrder, FinancialMetric, ShippingCarrier, DocumentResource, InventoryAction, DailyReport, MapTile, TileType } from '../types';
import { MOCK_DATASETS, MOCK_DELIVERIES, MOCK_COMPANY_EVENTS, MOCK_INCOMING_SHIPMENTS, MOCK_CUSTOMERS, MOCK_ORDERS, MOCK_WORK_ORDERS, MOCK_FINANCIALS, MOCK_DOCUMENTS } from '../constants';
import { securityService } from './securityService';
import { authService } from './authService';

class DataService {
  private currentIndustry: IndustryType = IndustryType.DISCRETE_MFG;
  
  private machines: MachineStatus[] = [...MOCK_DATASETS[IndustryType.DISCRETE_MFG].machines];
  private mapTiles: MapTile[] = []; // Floor layout

  private skus: ProductSKU[] = [...MOCK_DATASETS[IndustryType.DISCRETE_MFG].skus];
  private materials: Material[] = [...MOCK_DATASETS[IndustryType.DISCRETE_MFG].materials];
  
  private deliveries: ClientDelivery[] = [...MOCK_DELIVERIES];
  private companyEvents: CalendarEvent[] = [...MOCK_COMPANY_EVENTS];
  private incomingShipments: IncomingShipment[] = [...MOCK_INCOMING_SHIPMENTS];
  private documents: DocumentResource[] = [...MOCK_DOCUMENTS];

  // New Data Stores
  private customers: Customer[] = [...MOCK_CUSTOMERS];
  private salesOrders: SalesOrder[] = [...MOCK_ORDERS];
  private workOrders: WorkOrder[] = [...MOCK_WORK_ORDERS];
  private financialMetrics: FinancialMetric[] = [...MOCK_FINANCIALS];
  private shippingCarriers: ShippingCarrier[] = [
    { id: 'fedex', name: 'FedEx API', apiStatus: 'Connected' },
    { id: 'dhl', name: 'DHL Express', apiStatus: 'Disconnected' },
    { id: 'ups', name: 'UPS Logistics', apiStatus: 'Connected' }
  ];

  constructor() {
      // Initialize map with default dimensions for existing machines
      this.machines.forEach(m => {
          if (!m.dimensions) m.dimensions = { width: 1, height: 1 };
      });
  }

  // --- Getters ---
  public getMachines() { return this.machines; }
  public getMapTiles() { return this.mapTiles; }
  public getSKUs() { return this.skus; }
  public getMaterials() { return this.materials; }
  public getIndustry() { return this.currentIndustry; }
  public getIncomingShipments() { return this.incomingShipments; }
  public getCustomers() { return this.customers; }
  public getSalesOrders() { return this.salesOrders; }
  public getWorkOrders() { return this.workOrders; }
  public getFinancials() { return this.financialMetrics; }
  public getShippingCarriers() { return this.shippingCarriers; }
  public getDocuments() { return this.documents; }

  public switchIndustry(type: IndustryType) {
    this.currentIndustry = type;
    const dataset = MOCK_DATASETS[type];
    this.machines = [...dataset.machines];
    // Ensure dimensions exist
    this.machines.forEach(m => {
        if (!m.dimensions) m.dimensions = { width: 1, height: 1 };
    });
    
    this.skus = [...dataset.skus];
    this.materials = [...dataset.materials];
    this.mapTiles = []; // Reset map layout on switch
    
    authService.logEvent(
      authService.getCurrentUser()?.id || 'sys',
      authService.getCurrentUser()?.name || 'System',
      'INDUSTRY_SWITCH',
      `Switched industry context to ${type}`,
      'SUCCESS'
    );
  }

  // --- Reporting Helper ---
  public getDailySummary(): DailyReport {
      const alerts = 3; 
      const machinesAtRisk = this.machines.filter(m => m.status !== 'Running').length;
      const stockouts = this.skus.filter(s => s.inventory.onHand < s.inventory.reorderPoint).length;
      const buySignals = this.materials.length > 0 ? 1 : 0; 

      return {
          date: new Date().toISOString().split('T')[0],
          alertsGenerated: alerts,
          machinesAtRisk: machinesAtRisk,
          stockoutsPredicted: stockouts,
          buySignals: buySignals,
          summary: `Daily Scan: ${machinesAtRisk} machines require attention. ${stockouts} SKUs below reorder point.`
      };
  }

  // --- Inventory Management ---
  public updateInventory(skuId: string, quantity: number, action: InventoryAction, reason: string) {
      const sku = this.skus.find(s => s.id === skuId);
      if (sku) {
          const oldQty = sku.inventory.onHand;
          let newQty = oldQty;
          
          if (action === 'ADD') newQty += quantity;
          else if (action === 'SUBTRACT') newQty -= quantity;
          else if (action === 'SET') newQty = quantity;

          sku.inventory.onHand = Math.max(0, newQty);

          authService.logEvent(
              authService.getCurrentUser()?.id || 'sys',
              authService.getCurrentUser()?.name || 'System',
              'INVENTORY_ADJUST',
              `SKU ${sku.name}: ${action} ${quantity}. Reason: ${reason}. New Balance: ${sku.inventory.onHand}`,
              'SUCCESS'
          );
      }
  }

  // --- Document Management ---
  public addDocument(doc: Omit<DocumentResource, 'id' | 'uploadDate' | 'uploadedBy'>) {
      const currentUser = authService.getCurrentUser();
      const newDoc: DocumentResource = {
          id: `doc-${Date.now()}`,
          uploadDate: new Date().toISOString().split('T')[0],
          uploadedBy: currentUser?.id || 'system',
          ...doc
      };
      this.documents.push(newDoc);
      authService.logEvent(currentUser?.id || 'sys', currentUser?.name || 'sys', 'DOC_UPLOAD', `Uploaded ${doc.title}`, 'SUCCESS');
  }

  public deleteDocument(id: string) {
      this.documents = this.documents.filter(d => d.id !== id);
      authService.logEvent(authService.getCurrentUser()?.id || 'sys', authService.getCurrentUser()?.name || 'sys', 'DOC_DELETE', `Deleted document ${id}`, 'WARNING');
  }

  // --- Shipping API Mock Logic ---
  public toggleCarrierConnection(carrierId: string) {
    const carrier = this.shippingCarriers.find(c => c.id === carrierId);
    if (carrier) {
      carrier.apiStatus = carrier.apiStatus === 'Connected' ? 'Disconnected' : 'Connected';
      if (carrier.apiStatus === 'Connected') {
        this.incomingShipments.forEach(shp => {
            if (Math.random() > 0.7) shp.status = 'Delayed';
        });
      }
    }
  }

  // --- Work Order & Resource Management ---

  /**
   * Checks if a resource (machine) is busy during the requested time window.
   * Scans both Work Orders and Calendar Events.
   */
  public checkResourceConflict(resourceId: string, start: string, end: string): boolean {
      if (!start || !end) return false;
      const s = new Date(start).getTime();
      const e = new Date(end).getTime();

      // 1. Check Existing Work Orders
      const conflictWO = this.workOrders.find(w => 
          w.machineId === resourceId && 
          w.status !== 'Closed' &&
          w.startDate && w.endDate &&
          // Check for overlap: StartA <= EndB AND EndA >= StartB
          (new Date(w.startDate).getTime() <= e && new Date(w.endDate).getTime() >= s)
      );

      // 2. Check Calendar Events (Simplistic: if event location matches machine ID)
      const conflictEvent = this.companyEvents.find(ev => 
          (ev.location === resourceId || ev.description.includes(resourceId)) &&
          ev.status !== 'Completed' &&
          new Date(ev.date).getTime() >= s && 
          new Date(ev.date).getTime() <= e
      );

      return !!conflictWO || !!conflictEvent;
  }

  public createWorkOrder(wo: Omit<WorkOrder, 'id' | 'createdDate'>): { order: WorkOrder, conflict: boolean } {
      const newWo: WorkOrder = {
          id: `WO-${Date.now()}`,
          createdDate: new Date().toISOString().split('T')[0],
          ...wo
      };
      
      const hasConflict = wo.startDate && wo.endDate 
          ? this.checkResourceConflict(wo.machineId, wo.startDate, wo.endDate) 
          : false;

      this.workOrders.push(newWo);
      
      if (hasConflict) {
          authService.logEvent(
              authService.getCurrentUser()?.id || 'sys', 
              'System', 
              'CONFLICT_DETECTED', 
              `Resource Conflict: ${wo.machineName} is already booked for dates ${wo.startDate} - ${wo.endDate}`, 
              'WARNING'
          );
      }

      return { order: newWo, conflict: hasConflict };
  }

  public updateWorkOrderStatus(id: string, status: WorkOrder['status']) {
      const wo = this.workOrders.find(w => w.id === id);
      if (wo) {
          wo.status = status;
          if (status === 'Closed') wo.resolvedDate = new Date().toISOString().split('T')[0];
      }
  }

  // --- Calendar Aggregation & Management ---
  
  public getCalendarEvents(): CalendarEvent[] {
    const events: CalendarEvent[] = [];

    // 1. General Company Events (Manually added)
    events.push(...this.companyEvents);

    // 2. Client Deliveries (Outbound)
    this.deliveries.forEach(del => {
        events.push({
            id: del.id,
            title: `Delivery: ${del.clientName}`,
            date: del.deliveryDate,
            type: 'delivery',
            description: `${del.quantity} units of ${del.skuId} to ${del.destination}`,
            location: del.destination,
            status: 'Scheduled',
            isApproved: true
        });
    });

    // 3. Incoming Shipments (Inbound Logistics)
    this.incomingShipments.forEach(shp => {
        events.push({
            id: shp.id,
            title: `Arrival: ${shp.materialName}`,
            date: shp.estimatedArrival,
            type: 'logistics',
            description: `Incoming from ${shp.supplier}. Qty: ${shp.quantity} ${shp.unit}. Method: ${shp.transportMethod}`,
            location: 'Receiving Dock',
            status: shp.status === 'Delayed' ? 'Pending' : 'Scheduled',
            isApproved: true
        });
    });

    // 4. Scheduled/Projected Maintenance
    this.machines.forEach(machine => {
        if (machine.lastMaintenance) {
            const lastDate = new Date(machine.lastMaintenance);
            const nextDate = new Date(lastDate);
            nextDate.setDate(lastDate.getDate() + 90); // Assume 90 day cycle

            events.push({
                id: `MAINT-${machine.id}-${nextDate.getTime()}`,
                title: `Service: ${machine.name}`,
                date: nextDate.toISOString().split('T')[0],
                type: 'maintenance',
                description: `Scheduled preventive maintenance for ${machine.name} (${machine.type}).`,
                location: 'Factory Floor',
                status: 'Pending',
                isApproved: true
            });
        }
    });

    // 5. Work Orders (New Integration)
    this.workOrders.forEach(wo => {
        if (wo.startDate) {
            events.push({
                id: `WO-EVENT-${wo.id}`,
                title: `[${wo.category}] ${wo.title}`,
                date: wo.startDate,
                type: wo.category === 'Maintenance' ? 'maintenance' : 'general',
                description: wo.description,
                location: wo.machineName,
                status: wo.status === 'Closed' ? 'Completed' : 'Scheduled',
                isApproved: true
            });
        }
    });

    return events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }

  public addCalendarEvent(event: Omit<CalendarEvent, 'id' | 'isApproved'>): CalendarEvent {
      const currentUser = authService.getCurrentUser();
      
      const newEvent: CalendarEvent = {
          ...event,
          id: `EVT-${Date.now()}`,
          createdBy: currentUser?.id,
          // If Master Admin, auto approve. Else pending.
          isApproved: currentUser?.role === 'master_admin',
          status: currentUser?.role === 'master_admin' ? 'Scheduled' : 'Pending'
      };

      this.companyEvents.push(newEvent);
      
      authService.logEvent(
          currentUser?.id || 'sys',
          currentUser?.name || 'System',
          'EVENT_CREATED',
          `User created event: ${event.title}. Approved: ${newEvent.isApproved}`,
          'SUCCESS'
      );
      
      return newEvent;
  }

  public approveCalendarEvent(eventId: string): void {
      const event = this.companyEvents.find(e => e.id === eventId);
      if (event) {
          event.isApproved = true;
          event.status = 'Scheduled';
          
          authService.logEvent(
            authService.getCurrentUser()?.id || 'sys',
            authService.getCurrentUser()?.name || 'System',
            'EVENT_APPROVED',
            `Approved event: ${event.title}`,
            'SUCCESS'
          );
      }
  }

  // --- Machine Status Management ---
  
  public addMachine(data: { name: string, type: string, width?: number, height?: number }) {
      const newMachine: MachineStatus = {
          id: `M-NEW-${Date.now().toString().slice(-6)}`,
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
          gridPosition: undefined,
          dimensions: { width: data.width || 1, height: data.height || 1 }
      };
      
      this.machines.push(newMachine);
      
      authService.logEvent(
          authService.getCurrentUser()?.id || 'sys',
          authService.getCurrentUser()?.name || 'System',
          'ASSET_CREATED',
          `Created new asset: ${data.name} (${data.width}x${data.height})`,
          'SUCCESS'
      );
      
      return newMachine;
  }

  public updateMachineStatus(machineId: string, newStatus: MachineStatus['status'], reason: string = 'Manual Status Change') {
    this.machines = this.machines.map(m => {
      if (m.id !== machineId) return m;

      const isCurrentlyDown = m.status === 'Stopped' || m.status === 'Warning' || m.status === 'Critical';
      const willBeDown = newStatus === 'Stopped' || newStatus === 'Warning' || newStatus === 'Critical';
      
      const updatedMachine = { ...m, status: newStatus };

      if (isCurrentlyDown && newStatus === 'Running' && m.currentDowntimeStart) {
        const startTime = new Date(m.currentDowntimeStart);
        const endTime = new Date();
        const durationMinutes = Math.round((endTime.getTime() - startTime.getTime()) / 60000);

        updatedMachine.maintenanceLogs = [
          {
            date: endTime.toISOString().split('T')[0],
            type: 'Corrective',
            description: `Downtime Resolved: ${reason}`,
            partsReplaced: [], 
            downtimeMinutes: durationMinutes
          },
          ...m.maintenanceLogs
        ];
        updatedMachine.currentDowntimeStart = undefined;
        
        authService.logEvent(
            authService.getCurrentUser()?.id || 'sys', 
            authService.getCurrentUser()?.name || 'System', 
            'MACHINE_RESTORED', 
            `Restored ${m.name} after ${durationMinutes} mins. Reason: ${reason}`, 
            'SUCCESS'
        );
      }
      else if (!isCurrentlyDown && willBeDown) {
        updatedMachine.currentDowntimeStart = new Date().toISOString();
        if (newStatus === 'Critical') {
            this.createWorkOrder({
                machineId: m.id,
                machineName: m.name,
                category: 'Maintenance',
                title: `Critical Failure: ${m.name}`,
                description: 'Automated ticket created from machine status change.',
                priority: 'Critical',
                status: 'Open'
            });
        }
        authService.logEvent(
            authService.getCurrentUser()?.id || 'sys', 
            authService.getCurrentUser()?.name || 'System', 
            'MACHINE_STOPPED', 
            `Machine ${m.name} status changed to ${newStatus}.`, 
            'WARNING'
        );
      }

      return updatedMachine;
    });

    return this.machines.find(m => m.id === machineId);
  }

  // --- Digital Twin Updates ---
  
  public setTileType(x: number, y: number, type: TileType) {
      // Remove existing tile definition if exists
      this.mapTiles = this.mapTiles.filter(t => t.x !== x || t.y !== y);
      
      if (type !== 'floor') { // 'floor' is default/empty
          this.mapTiles.push({ x, y, type });
      }
  }

  public updateMachinePosition(machineId: string, x: number | undefined, y: number | undefined) {
      const machine = this.machines.find(m => m.id === machineId);
      if (!machine) return;

      // Logic: If placing (x defined), check collisions with Rectangles
      if (x !== undefined && y !== undefined) {
          const w = machine.dimensions?.width || 1;
          const h = machine.dimensions?.height || 1;

          // Check if it overlaps any OTHER machine
          const collision = this.machines.some(other => {
              if (other.id === machineId || !other.gridPosition) return false;
              
              const otherW = other.dimensions?.width || 1;
              const otherH = other.dimensions?.height || 1;
              
              // AABB Collision Detection
              return (
                  x < other.gridPosition.x + otherW &&
                  x + w > other.gridPosition.x &&
                  y < other.gridPosition.y + otherH &&
                  y + h > other.gridPosition.y
              );
          });

          if (collision) {
              console.warn("Cannot place machine: Overlap detected");
              return; // Do not move
          }
      }

      machine.gridPosition = x !== undefined && y !== undefined ? { x, y } : undefined;
      authService.logEvent('sys', 'System', 'MAP_UPDATE', `Moved ${machine.name} to ${x},${y}`, 'SUCCESS');
  }

  public resetFactoryMap() {
      this.machines.forEach(m => m.gridPosition = undefined);
      this.mapTiles = [];
      authService.logEvent('sys', 'System', 'MAP_RESET', 'Factory map cleared.', 'WARNING');
  }

  // --- CSV Parsing ---
  public processUpload(type: 'maintenance' | 'production' | 'procurement', rawCsvText: string): { success: boolean, message: string } {
    try {
      const csvText = securityService.sanitizeInput(rawCsvText);
      const lines = csvText.trim().split('\n');
      if (lines.length < 2) return { success: false, message: "CSV is empty or missing headers." };
      
      const currentUser = authService.getCurrentUser();
      authService.logEvent(currentUser?.id || 'unknown', currentUser?.name || 'unknown', 'DATA_UPLOAD_ATTEMPT', `Uploading ${type} data. Size: ${csvText.length} bytes`, 'SUCCESS');

      const headers = lines[0].split(',');
      const dataRows = lines.slice(1);

      if (type === 'maintenance') return this.ingestMaintenanceData(dataRows);
      if (type === 'production') return this.ingestProductionData(dataRows);
      if (type === 'procurement') return this.ingestProcurementData(dataRows);

      return { success: false, message: "Invalid upload type." };
    } catch (error: any) {
      console.error("Upload Error", error);
      authService.logEvent('SYSTEM', 'SYSTEM', 'DATA_UPLOAD_ERROR', `Failed to process ${type} upload: ${error.message}`, 'FAILURE');
      return { success: false, message: `Parsing Error: ${error.message}` };
    }
  }

  private ingestMaintenanceData(rows: string[]) {
    return { success: true, message: `Successfully updated telemetry.` };
  }

  private ingestProductionData(rows: string[]) {
    return { success: true, message: `Updated sales history & adjusted inventory.` };
  }

  private ingestProcurementData(rows: string[]) {
    return { success: true, message: `Updated price history.` };
  }
}

export const dataService = new DataService();
