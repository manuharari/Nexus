import { IDataService } from './interfaces';
import { MockDataService } from './mockDataService';
import { RealDataService } from './realDataService';

/**
 * Toggle this to 'true' once your local Node.js + MySQL proxy is running.
 */
const USE_REAL_API = false;

class DataServiceProxy implements IDataService {
    private mock: MockDataService;
    private real: RealDataService;

    constructor() {
        this.mock = new MockDataService();
        this.real = new RealDataService();
        
        if (USE_REAL_API) {
            console.log("🚀 NEXUS: Real API Mode (Connecting to Local MySQL Proxy)");
        } else {
            console.log("🧪 NEXUS: Mock Mode (Browser Storage)");
        }
    }

    private get engine(): IDataService {
        return USE_REAL_API ? this.real : this.mock;
    }

    // --- Proxy Methods (Async) ---
    async getMachines() { return this.engine.getMachines(); }
    async getMapTiles() { return this.engine.getMapTiles(); }
    async getSKUs() { return this.engine.getSKUs(); }
    async getMaterials() { return this.engine.getMaterials(); }
    async getIndustry() { return this.engine.getIndustry(); }
    async getIncomingShipments() { return this.engine.getIncomingShipments(); }
    async getCustomers() { return this.engine.getCustomers(); }
    async getSalesOrders() { return this.engine.getSalesOrders(); }
    async getWorkOrders() { return this.engine.getWorkOrders(); }
    async getFinancials() { return this.engine.getFinancials(); }
    async getShippingCarriers() { return this.engine.getShippingCarriers(); }
    async getDocuments() { return this.engine.getDocuments(); }
    async getCalendarEvents() { return this.engine.getCalendarEvents(); }

    async switchIndustry(type: any) { return this.engine.switchIndustry(type); }
    async updateMachineStatus(id: string, s: any, r?: string) { return this.engine.updateMachineStatus(id, s, r); }
    async updateMachinePosition(id: string, x: any, y: any) { return this.engine.updateMachinePosition(id, x, y); }
    async addMachine(data: any) { return this.engine.addMachine(data); }
    async setTileType(x: any, y: any, type: any) { return this.engine.setTileType(x, y, type); }
    async resetFactoryMap() { return this.engine.resetFactoryMap(); }
    async updateInventory(id: string, q: number, a: any, r: string) { return this.engine.updateInventory(id, q, a, r); }
    async addDocument(doc: any) { return this.engine.addDocument(doc); }
    async deleteDocument(id: string) { return this.engine.deleteDocument(id); }
    async toggleCarrierConnection(id: string) { return this.engine.toggleCarrierConnection(id); }
    async createWorkOrder(wo: any) { return this.engine.createWorkOrder(wo); }
    async checkResourceConflict(id: string, s: string, e: string) { return this.engine.checkResourceConflict(id, s, e); }
    async addCalendarEvent(ev: any) { return this.engine.addCalendarEvent(ev); }
    async approveCalendarEvent(id: string) { return this.engine.approveCalendarEvent(id); }
    async getDailySummary() { return this.engine.getDailySummary(); }
    async processUpload(type: any, csv: string) { return this.engine.processUpload(type, csv); }
}

export const dataService = new DataServiceProxy();