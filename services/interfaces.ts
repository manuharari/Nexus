import { MachineStatus, ProductSKU, Material, CalendarEvent, IncomingShipment, Customer, SalesOrder, WorkOrder, FinancialMetric, ShippingCarrier, DocumentResource, DailyReport, InventoryAction, TileType, MapTile, IndustryType } from '../types';

export interface IDataService {
    // Queries
    getMachines(): Promise<MachineStatus[]>;
    getMapTiles(): Promise<MapTile[]>;
    getSKUs(): Promise<ProductSKU[]>;
    getMaterials(): Promise<Material[]>;
    getIndustry(): Promise<IndustryType>;
    getIncomingShipments(): Promise<IncomingShipment[]>;
    getCustomers(): Promise<Customer[]>;
    getSalesOrders(): Promise<SalesOrder[]>;
    getWorkOrders(): Promise<WorkOrder[]>;
    getFinancials(): Promise<FinancialMetric[]>;
    getShippingCarriers(): Promise<ShippingCarrier[]>;
    getDocuments(): Promise<DocumentResource[]>;
    getCalendarEvents(): Promise<CalendarEvent[]>;
    
    // Actions
    switchIndustry(type: IndustryType): Promise<void>;
    updateMachineStatus(machineId: string, newStatus: MachineStatus['status'], reason?: string): Promise<MachineStatus | undefined>;
    updateMachinePosition(machineId: string, x: number | undefined, y: number | undefined): Promise<void>;
    addMachine(data: { name: string, type: string, width?: number, height?: number }): Promise<MachineStatus>;
    setTileType(x: number, y: number, type: TileType): Promise<void>;
    resetFactoryMap(): Promise<void>;
    
    updateInventory(skuId: string, quantity: number, action: InventoryAction, reason: string): Promise<void>;
    addDocument(doc: Omit<DocumentResource, 'id' | 'uploadDate' | 'uploadedBy'>): Promise<void>;
    deleteDocument(id: string): Promise<void>;
    toggleCarrierConnection(carrierId: string): Promise<void>;
    createWorkOrder(wo: Omit<WorkOrder, 'id' | 'createdDate'>): Promise<{ order: WorkOrder, conflict: boolean }>;
    checkResourceConflict(resourceId: string, start: string, end: string): Promise<boolean>;
    addCalendarEvent(event: Omit<CalendarEvent, 'id' | 'isApproved'>): Promise<CalendarEvent>;
    approveCalendarEvent(eventId: string): Promise<void>;
    getDailySummary(): Promise<DailyReport>;
    processUpload(type: 'maintenance' | 'production' | 'procurement', rawCsvText: string): Promise<{ success: boolean, message: string }>;
}