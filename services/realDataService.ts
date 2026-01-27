import { IDataService } from './interfaces';
import { IndustryType, MachineStatus, ProductSKU, Material, CalendarEvent, IncomingShipment, Customer, SalesOrder, WorkOrder, FinancialMetric, ShippingCarrier, DocumentResource, InventoryAction, DailyReport, MapTile, TileType } from '../types';

const API_BASE = 'http://localhost:3001/api';

/**
 * RealDataService: Communicates with your local MySQL Proxy.
 */
export class RealDataService implements IDataService {
    private async request(endpoint: string, method: string = 'GET', body?: any) {
        const response = await fetch(`${API_BASE}${endpoint}`, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: body ? JSON.stringify(body) : undefined
        });
        if (!response.ok) throw new Error(`API Error: ${response.statusText}`);
        return response.json();
    }

    async getMachines(): Promise<MachineStatus[]> {
        return this.request('/machines');
    }

    async getSKUs(): Promise<ProductSKU[]> {
        return this.request('/skus');
    }

    async updateMachineStatus(id: string, status: any, reason?: string) {
        return this.request(`/machines/${id}/status`, 'POST', { status, reason });
    }

    async createWorkOrder(wo: any) {
        const order = await this.request('/work-orders', 'POST', wo);
        return { order, conflict: false };
    }

    // Skeleton for remaining methods
    async getMapTiles() { return []; }
    async getMaterials() { return []; }
    async getIndustry() { return IndustryType.DISCRETE_MFG; }
    async getIncomingShipments() { return []; }
    async getCustomers() { return []; }
    async getSalesOrders() { return []; }
    async getWorkOrders() { return this.request('/work-orders'); }
    async getFinancials() { return []; }
    async getShippingCarriers() { return []; }
    async getDocuments() { return []; }
    async getCalendarEvents() { return []; }
    async switchIndustry(type: IndustryType) { }
    async updateMachinePosition(id: string, x: any, y: any) { }
    async addMachine(data: any) { return {} as any; }
    async setTileType(x: any, y: any, type: any) { }
    async resetFactoryMap() { }
    async updateInventory() { }
    async addDocument() { }
    async deleteDocument() { }
    async toggleCarrierConnection() { }
    async checkResourceConflict() { return false; }
    async addCalendarEvent() { return {} as any; }
    async approveCalendarEvent() { }
    async getDailySummary() { return {} as any; }
    async processUpload() { return { success: true, message: "OK" }; }
}