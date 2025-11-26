
import { MachineStatus, ProductSKU, Material, SensorReading, SalesRecord, PricePoint, IndustryType, CalendarEvent, ClientDelivery, IncomingShipment, Customer, SalesOrder, WorkOrder, FinancialMetric, ShippingCarrier, DocumentResource, InventoryAction } from '../types';
import { MOCK_DATASETS, MOCK_DELIVERIES, MOCK_COMPANY_EVENTS, MOCK_INCOMING_SHIPMENTS, MOCK_CUSTOMERS, MOCK_ORDERS, MOCK_WORK_ORDERS, MOCK_FINANCIALS, MOCK_DOCUMENTS } from '../constants';
import { securityService } from './securityService';
import { authService } from './authService';

class DataService {
  private currentIndustry: IndustryType = IndustryType.DISCRETE_MFG;
  
  private machines: MachineStatus[] = [...MOCK_DATASETS[IndustryType.DISCRETE_MFG].machines];
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

  // --- Getters ---
  public getMachines() { return this.machines; }
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
    this.skus = [...dataset.skus];
    this.materials = [...dataset.materials];
    
    authService.logEvent(
      authService.getCurrentUser()?.id || 'sys',
      authService.getCurrentUser()?.name || 'System',
      'INDUSTRY_SWITCH',
      `Switched industry context to ${type}`,
      'SUCCESS'
    );
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
      // Mock update incoming shipment statuses if connected
      if (carrier.apiStatus === 'Connected') {
        this.incomingShipments.forEach(shp => {
            if (Math.random() > 0.7) shp.status = 'Delayed';
        });
      }
    }
  }

  // --- Work Order Management ---
  public createWorkOrder(wo: Omit<WorkOrder, 'id' | 'createdDate'>): WorkOrder {
      const newWo: WorkOrder = {
          id: `WO-${Date.now()}`,
          createdDate: new Date().toISOString().split('T')[0],
          ...wo
      };
      this.workOrders.push(newWo);
      return newWo;
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
                isApproved: true // System generated is auto-approved
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
  
  public updateMachineStatus(machineId: string, newStatus: MachineStatus['status'], reason: string = 'Manual Status Change') {
    this.machines = this.machines.map(m => {
      if (m.id !== machineId) return m;

      const isCurrentlyDown = m.status === 'Stopped' || m.status === 'Warning' || m.status === 'Critical';
      const willBeDown = newStatus === 'Stopped' || newStatus === 'Warning' || newStatus === 'Critical';
      
      const updatedMachine = { ...m, status: newStatus };

      // Case 1: Machine was down, now back to Running (STOP -> RUN)
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

      // Case 2: Machine was Running, now Stopped/Warning (RUN -> STOP)
      else if (!isCurrentlyDown && willBeDown) {
        updatedMachine.currentDowntimeStart = new Date().toISOString();
        // AUTO-TICKET CREATION
        if (newStatus === 'Critical') {
            this.createWorkOrder({
                machineId: m.id,
                machineName: m.name,
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

  // --- CSV Parsing & Ingestion ---

  public processUpload(type: 'maintenance' | 'production' | 'procurement', rawCsvText: string): { success: boolean, message: string } {
    try {
      // SECURITY: Sanitize Input before processing
      const csvText = securityService.sanitizeInput(rawCsvText);
      
      const lines = csvText.trim().split('\n');
      if (lines.length < 2) return { success: false, message: "CSV is empty or missing headers." };
      
      const currentUser = authService.getCurrentUser();
      authService.logEvent(
        currentUser?.id || 'unknown', 
        currentUser?.name || 'unknown', 
        'DATA_UPLOAD_ATTEMPT', 
        `Uploading ${type} data. Size: ${csvText.length} bytes`, 
        'SUCCESS'
      );

      // Remove headers
      const headers = lines[0].split(',');
      const dataRows = lines.slice(1);

      if (type === 'maintenance') {
        return this.ingestMaintenanceData(dataRows);
      } else if (type === 'production') {
        return this.ingestProductionData(dataRows);
      } else if (type === 'procurement') {
        return this.ingestProcurementData(dataRows);
      }

      return { success: false, message: "Invalid upload type." };
    } catch (error: any) {
      console.error("Upload Error", error);
      authService.logEvent('SYSTEM', 'SYSTEM', 'DATA_UPLOAD_ERROR', `Failed to process ${type} upload: ${error.message}`, 'FAILURE');
      return { success: false, message: `Parsing Error: ${error.message}` };
    }
  }

  private ingestMaintenanceData(rows: string[]) {
    const machineUpdates: Record<string, SensorReading[]> = {};
    const machineMetadata: Record<string, any> = {};

    rows.forEach(row => {
      const cols = row.split(',');
      if (cols.length < 8) return;
      
      const date = cols[0];
      const id = cols[1];
      const runHours = parseFloat(cols[3]);
      const temp = parseFloat(cols[4]);
      const vib = parseFloat(cols[5]);
      const rpm = parseFloat(cols[6]);
      const current = parseFloat(cols[7]);

      if (!machineUpdates[id]) {
        machineUpdates[id] = [];
        machineMetadata[id] = { runHours, lastDate: date };
      }

      // Update Metadata
      if (runHours > machineMetadata[id].runHours) machineMetadata[id].runHours = runHours;
      if (new Date(date) > new Date(machineMetadata[id].lastDate)) machineMetadata[id].lastDate = date;

      // Add reading
      machineUpdates[id].push({
        timestamp: new Date(date).toISOString(),
        temperature: temp,
        vibration: vib,
        rpm: rpm,
        electricCurrent: current,
        noiseLevel: 80 // Default or inferred
      });
    });

    let updateCount = 0;
    this.machines = this.machines.map(m => {
      if (machineUpdates[m.id]) {
        updateCount++;
        const newReadings = machineUpdates[m.id].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        const last = newReadings[newReadings.length - 1];
        let health = 100;
        if (last.vibration > 5) health -= 30;
        if (last.temperature > 90) health -= 20;

        return {
          ...m,
          runTimeHours: machineMetadata[m.id].runHours,
          readings: newReadings.slice(-100), // Keep last 100
          healthScore: Math.max(0, health),
          status: health < 60 ? 'Critical' : health < 85 ? 'Warning' : 'Running'
        };
      }
      return m;
    });

    return { success: true, message: `Successfully updated telemetry for ${updateCount} machines.` };
  }

  private ingestProductionData(rows: string[]) {
    const skuSales: Record<string, SalesRecord[]> = {};
    const skuInventory: Record<string, number> = {};
    const productionAdjustments: Record<string, number> = {};

    rows.forEach(row => {
      const cols = row.split(',');
      if (cols.length < 6) return;

      const date = cols[0];
      const id = cols[1];
      const sold = parseInt(cols[3]);
      const produced = parseInt(cols[4]) || 0;
      const inventory = parseInt(cols[5]);
      const isPromo = cols[6]?.toLowerCase() === 'true';

      if (!skuSales[id]) skuSales[id] = [];
      if (!productionAdjustments[id]) productionAdjustments[id] = 0;
      
      skuSales[id].push({
        date: date,
        unitsSold: sold,
        isPromotion: isPromo
      });

      // Logic: Update Inventory based on Sales (subtract) and Production (add) from the report
      skuInventory[id] = inventory; // If report provides absolute inventory, use it
      
      // Alternatively, track deltas if we want to be additive
      productionAdjustments[id] += produced;
    });

    let updateCount = 0;
    this.skus = this.skus.map(s => {
      if (skuSales[s.id]) {
        updateCount++;
        return {
          ...s,
          // Update inventory to the latest reported value
          inventory: { ...s.inventory, onHand: skuInventory[s.id] || s.inventory.onHand },
          salesHistory: skuSales[s.id].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        };
      }
      return s;
    });

    return { success: true, message: `Updated sales history & adjusted inventory for ${updateCount} SKUs.` };
  }

  private ingestProcurementData(rows: string[]) {
    const matPrices: Record<string, PricePoint[]> = {};

    rows.forEach(row => {
      const cols = row.split(',');
      if (cols.length < 8) return;

      const date = cols[0];
      const id = cols[1];
      const price = parseFloat(cols[4]);
      const exchange = parseFloat(cols[6]);

      if (!matPrices[id]) matPrices[id] = [];

      matPrices[id].push({
        date: date,
        price: price,
        currency: 'USD',
        exchangeRate: exchange,
        supplier: cols[3] || 'Unknown'
      });
    });

    let updateCount = 0;
    this.materials = this.materials.map(m => {
      if (matPrices[m.id]) {
        updateCount++;
        const newHistory = matPrices[m.id].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        return {
          ...m,
          currentPrice: newHistory[newHistory.length - 1].price, 
          priceHistory: newHistory
        };
      }
      return m;
    });

    return { success: true, message: `Updated price history for ${updateCount} materials.` };
  }
}

export const dataService = new DataService();
