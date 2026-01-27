
import { MachineStatus, Material, ProductSKU, SensorReading, SalesRecord, PricePoint, User, PermissionSet, SupplierRating, OEEData, IndustryType, ClientDelivery, CalendarEvent, IncomingShipment, Customer, SalesOrder, WorkOrder, FinancialMetric, DocumentResource } from './types';

// --- Auth Mock Data ---

export const DEFAULT_PERMISSIONS: PermissionSet = {
  can_view_dashboard: true,
  can_run_forecasts: false,
  can_view_maintenance_model: false,
  can_view_price_forecast: false,
  can_view_stock_optimizer: false,
  can_edit_data: false,
  can_download_reports: false,
  can_manage_inventory: false,
  can_view_calendar: true,
  // New Modules
  can_view_crm: false,
  can_view_erp: false,
  can_view_quality: false,
  can_view_simulation: false,
  can_view_digital_twin: false,
  can_view_energy: false,
  can_view_work_orders: false,
  can_use_voice_assistant: false,
  can_view_documents: true,
  can_view_system_health: true,
};

export const MOCK_USERS: User[] = [
  {
    id: 'u-platform',
    name: 'Platform Super Admin',
    email: 'platform@nexus.ai',
    passwordHash: '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918', // 'admin'
    role: 'platform_super_admin',
    status: 'active',
    permissions: {
      ...DEFAULT_PERMISSIONS,
      can_view_dashboard: true // Actually has access to platform view
    }
  },
  {
    id: 'u-1',
    name: 'Master Admin',
    email: 'admin@nexus.ai',
    passwordHash: '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918', // 'admin'
    role: 'master_admin',
    status: 'active',
    permissions: {
      can_view_dashboard: true,
      can_run_forecasts: true,
      can_view_maintenance_model: true,
      can_view_price_forecast: true,
      can_view_stock_optimizer: true,
      can_edit_data: true,
      can_download_reports: true,
      can_manage_inventory: true,
      can_view_calendar: true,
      can_view_crm: true,
      can_view_erp: true,
      can_view_quality: true,
      can_view_simulation: true,
      can_view_digital_twin: true,
      can_view_energy: true,
      can_view_work_orders: true,
      can_use_voice_assistant: true,
      can_view_documents: true,
      can_view_system_health: true
    }
  },
  {
    id: 'u-ceo',
    name: 'Elena Director',
    email: 'ceo@nexus.ai',
    passwordHash: '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918', // 'admin'
    role: 'c_level',
    status: 'active',
    permissions: {
      ...DEFAULT_PERMISSIONS,
      can_view_dashboard: true,
      can_run_forecasts: true,
      can_view_maintenance_model: true,
      can_view_price_forecast: true,
      can_view_stock_optimizer: true,
      can_download_reports: true,
      can_view_crm: true,
      can_view_erp: true,
      can_view_quality: true,
      can_view_simulation: true,
      can_view_digital_twin: true,
      can_view_energy: true,
      can_view_work_orders: true,
      can_view_documents: true
    }
  },
  {
    id: 'u-2',
    name: 'Jane Maintenance',
    email: 'maintenance@nexus.ai',
    passwordHash: '04f8996da763b7a969b1028ee3007569eaf3a635486ddab211d512c85b9df8fb', // 'user'
    role: 'admin',
    status: 'active',
    permissions: {
      ...DEFAULT_PERMISSIONS,
      can_view_maintenance_model: true,
      can_run_forecasts: true,
      can_view_dashboard: true,
      can_view_calendar: true,
      can_download_reports: true,
      can_view_work_orders: true,
      can_view_digital_twin: true,
      can_view_energy: true,
      can_view_documents: true
    }
  },
  {
    id: 'u-3',
    name: 'Bob Purchasing',
    email: 'purchasing@nexus.ai',
    passwordHash: '04f8996da763b7a969b1028ee3007569eaf3a635486ddab211d512c85b9df8fb', // 'user'
    role: 'admin',
    status: 'active',
    permissions: {
      ...DEFAULT_PERMISSIONS,
      can_view_price_forecast: true,
      can_run_forecasts: true,
      can_view_dashboard: true,
      can_view_calendar: true,
      can_download_reports: true,
      can_view_erp: true,
      can_view_documents: true
    }
  },
  {
    id: 'u-4',
    name: 'Sarah Sales',
    email: 'sales@nexus.ai',
    passwordHash: '04f8996da763b7a969b1028ee3007569eaf3a635486ddab211d512c85b9df8fb', // 'user'
    role: 'sales',
    status: 'active',
    permissions: {
      ...DEFAULT_PERMISSIONS,
      can_view_stock_optimizer: true,
      can_view_dashboard: true,
      can_view_calendar: true,
      can_download_reports: true,
      can_view_crm: true,
      can_view_erp: true, // For invoicing
      can_view_documents: true
    }
  }
];


// --- MOCK DATASETS (Multi-Industry Support) ---

const generateSensorData = (points: number, baselineTemp: number, isFailing: boolean): SensorReading[] => {
  const data: SensorReading[] = [];
  const now = new Date();
  for (let i = points; i > 0; i--) {
    const time = new Date(now.getTime() - i * 60 * 60 * 1000); // Hourly
    const drift = isFailing ? (points - i) * 0.5 : 0; 
    data.push({
      timestamp: time.toISOString(),
      temperature: baselineTemp + (Math.random() * 5) + drift,
      vibration: (isFailing ? 4 : 2) + (Math.random() * 1) + (drift * 0.1),
      rpm: 1200 + (Math.random() * 50) - (drift * 2),
      electricCurrent: 15 + (Math.random() * 2) + (drift * 0.2),
      noiseLevel: 80 + (Math.random() * 5) + (drift * 0.5)
    });
  }
  return data;
};

const generateSalesHistory = (days: number): SalesRecord[] => {
  const history: SalesRecord[] = [];
  const now = new Date();
  for (let i = days; i > 0; i--) {
    const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
    history.push({
      date: date.toISOString().split('T')[0],
      unitsSold: isWeekend ? 0 : Math.floor(100 + Math.random() * 50),
      isPromotion: i % 30 === 0 
    });
  }
  return history;
};

const generatePriceHistory = (months: number, basePrice: number): PricePoint[] => {
  const history: PricePoint[] = [];
  const now = new Date();
  for (let i = months; i > 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    history.push({
      date: date.toISOString().split('T')[0],
      price: basePrice + (Math.random() * basePrice * 0.1) - (basePrice * 0.05),
      currency: 'USD',
      exchangeRate: 17.5 + (Math.random() * 1.5),
      supplier: 'Global Suppliers Inc'
    });
  }
  return history;
};

// --- INDUSTRY SPECIFIC DATA ---

// 1. DISCRETE MFG
const DISCRETE_MACHINES: MachineStatus[] = [
  {
    id: 'M-101', name: 'CNC Milling Center A', type: 'CNC', status: 'Running', healthScore: 96,
    runTimeHours: 450, lastMaintenance: '2023-10-15', errorCodes: [],
    maintenanceLogs: [{ date: '2023-10-15', type: 'Preventive', description: 'Scheduled oil change', partsReplaced: ['Filter'], downtimeMinutes: 60 }],
    readings: generateSensorData(48, 65, false),
    gridPosition: { x: 2, y: 2 }, energyUsageKwh: 45
  },
  {
    id: 'M-102', name: 'Hydraulic Press B', type: 'Press', status: 'Warning', healthScore: 62,
    runTimeHours: 1200, lastMaintenance: '2023-08-20', errorCodes: ['E-204 (Overheat)', 'E-301 (Pressure Drop)'],
    maintenanceLogs: [{ date: '2023-08-20', type: 'Corrective', description: 'Seal replacement', partsReplaced: ['Main Seal'], downtimeMinutes: 240 }],
    readings: generateSensorData(48, 85, true),
    gridPosition: { x: 5, y: 3 }, energyUsageKwh: 120
  },
  {
    id: 'M-103', name: 'Conveyor Motor Z', type: 'Motor', status: 'Running', healthScore: 98,
    runTimeHours: 100, lastMaintenance: '2023-11-01', errorCodes: [], maintenanceLogs: [], readings: generateSensorData(48, 50, false),
    gridPosition: { x: 8, y: 5 }, energyUsageKwh: 15
  }
];

const DISCRETE_SKUS: ProductSKU[] = [
  {
    id: 'SKU-500', name: 'Precision Gearbox V2', category: 'Assembly', leadTimeDays: 14, productionCycleDays: 5,
    inventory: { onHand: 450, reserved: 100, reorderPoint: 400, warehouseLocation: 'A-12' }, salesHistory: generateSalesHistory(90),
    cost: 150, price: 320
  },
  {
    id: 'SKU-501', name: 'Control Panel Chassis', category: 'Fabrication', leadTimeDays: 7, productionCycleDays: 2,
    inventory: { onHand: 1200, reserved: 50, reorderPoint: 300, warehouseLocation: 'B-05' }, salesHistory: generateSalesHistory(90),
    cost: 45, price: 120
  }
];

const DISCRETE_MATERIALS: Material[] = [
  {
    id: 'MAT-001', name: 'Industrial Steel (304)', category: 'Raw Metal', currentPrice: 2450, unit: 'USD/Ton', moq: 5,
    supplierLeadTime: 20, priceHistory: generatePriceHistory(24, 2400)
  },
  {
    id: 'MAT-002', name: 'Copper Wiring Spools', category: 'Electronics', currentPrice: 8900, unit: 'USD/Ton', moq: 1,
    supplierLeadTime: 10, priceHistory: generatePriceHistory(24, 8500)
  }
];

// 2. PROCESS MFG (Paint)
const PROCESS_MACHINES: MachineStatus[] = [
  {
    id: 'P-201', name: 'High Speed Disperser 1', type: 'Mixer', status: 'Running', healthScore: 94,
    runTimeHours: 320, lastMaintenance: '2023-11-05', errorCodes: [],
    maintenanceLogs: [{ date: '2023-11-05', type: 'Preventive', description: 'Blade alignment check', partsReplaced: [], downtimeMinutes: 45 }],
    readings: generateSensorData(48, 45, false),
    gridPosition: { x: 2, y: 2 }, energyUsageKwh: 60
  },
  {
    id: 'P-202', name: 'Bead Mill 500L', type: 'Mill', status: 'Critical', healthScore: 45,
    runTimeHours: 2100, lastMaintenance: '2023-06-10', errorCodes: ['E-505 (Seal Fail)', 'E-509 (Cooling Flow)'],
    maintenanceLogs: [], readings: generateSensorData(48, 90, true),
    gridPosition: { x: 5, y: 2 }, energyUsageKwh: 85
  },
  {
    id: 'P-203', name: 'Auto-Filling Line C', type: 'Filler', status: 'Running', healthScore: 89,
    runTimeHours: 600, lastMaintenance: '2023-10-01', errorCodes: [], maintenanceLogs: [], readings: generateSensorData(48, 30, false),
    gridPosition: { x: 8, y: 2 }, energyUsageKwh: 25
  }
];

const PROCESS_SKUS: ProductSKU[] = [
  {
    id: 'SKU-P10', name: 'Exterior Satin Latex (5gal)', category: 'Paint', leadTimeDays: 5, productionCycleDays: 1,
    inventory: { onHand: 5000, reserved: 1200, reorderPoint: 2000, warehouseLocation: 'Tank-01' }, salesHistory: generateSalesHistory(90),
    cost: 18, price: 45
  },
  {
    id: 'SKU-P11', name: 'Industrial Grey Primer', category: 'Coating', leadTimeDays: 10, productionCycleDays: 3,
    inventory: { onHand: 800, reserved: 400, reorderPoint: 1000, warehouseLocation: 'Shelf-D4' }, salesHistory: generateSalesHistory(90),
    cost: 25, price: 60
  }
];

const PROCESS_MATERIALS: Material[] = [
  {
    id: 'MAT-P01', name: 'Titanium Dioxide (TiO2)', category: 'Pigment', currentPrice: 3200, unit: 'USD/Ton', moq: 10,
    supplierLeadTime: 30, priceHistory: generatePriceHistory(24, 3100)
  },
  {
    id: 'MAT-P02', name: 'Acrylic Resin Emulsion', category: 'Binder', currentPrice: 1800, unit: 'USD/Ton', moq: 5,
    supplierLeadTime: 15, priceHistory: generatePriceHistory(24, 1750)
  }
];

// 3. AUTOMOTIVE (Robotics)
const AUTO_MACHINES: MachineStatus[] = [
    {
      id: 'R-301', name: 'Kuka Welding Robot #4', type: 'Robot Arm', status: 'Running', healthScore: 99,
      runTimeHours: 5000, lastMaintenance: '2023-11-10', errorCodes: [],
      maintenanceLogs: [], readings: generateSensorData(48, 60, false),
      gridPosition: { x: 3, y: 3 }, energyUsageKwh: 220
    },
    {
      id: 'R-302', name: 'Paint Shop Conveyor', type: 'Conveyor', status: 'Running', healthScore: 88,
      runTimeHours: 12000, lastMaintenance: '2023-09-15', errorCodes: [],
      maintenanceLogs: [], readings: generateSensorData(48, 55, false),
      gridPosition: { x: 6, y: 3 }, energyUsageKwh: 300
    }
];
const AUTO_SKUS: ProductSKU[] = [
    { id: 'SKU-A01', name: 'Model S Chassis', category: 'Body', leadTimeDays: 2, productionCycleDays: 1, inventory: { onHand: 50, reserved: 45, reorderPoint: 20, warehouseLocation: 'Z-1' }, salesHistory: generateSalesHistory(90), cost: 5000, price: 12000 },
    { id: 'SKU-A02', name: 'EV Battery Pack (85kWh)', category: 'Powertrain', leadTimeDays: 15, productionCycleDays: 3, inventory: { onHand: 100, reserved: 80, reorderPoint: 50, warehouseLocation: 'B-Safe' }, salesHistory: generateSalesHistory(90), cost: 8000, price: 15000 }
];
const AUTO_MATERIALS: Material[] = [
    { id: 'MAT-A01', name: 'Aluminum Sheets (6000 series)', category: 'Metal', currentPrice: 2800, unit: 'USD/Ton', moq: 20, supplierLeadTime: 25, priceHistory: generatePriceHistory(24, 2700) },
    { id: 'MAT-A02', name: 'Lithium Carbonate', category: 'Chemical', currentPrice: 35000, unit: 'USD/Ton', moq: 1, supplierLeadTime: 45, priceHistory: generatePriceHistory(24, 34000) }
];

// 4. PHARMA (Bio-Process)
const PHARMA_MACHINES: MachineStatus[] = [
    {
      id: 'BIO-401', name: 'Bioreactor 2000L', type: 'Bioreactor', status: 'Running', healthScore: 98,
      runTimeHours: 300, lastMaintenance: '2023-11-20', errorCodes: [],
      maintenanceLogs: [], readings: generateSensorData(48, 37, false), // 37C body temp
      gridPosition: { x: 4, y: 4 }, energyUsageKwh: 150
    },
    {
      id: 'BIO-402', name: 'Centrifuge C-10', type: 'Centrifuge', status: 'Warning', healthScore: 75,
      runTimeHours: 800, lastMaintenance: '2023-10-05', errorCodes: ['E-BAL (Imbalance)'],
      maintenanceLogs: [], readings: generateSensorData(48, 20, true),
      gridPosition: { x: 7, y: 4 }, energyUsageKwh: 90
    }
];
const PHARMA_SKUS: ProductSKU[] = [
    { id: 'SKU-PH1', name: 'Insulin Vial (10ml)', category: 'Injectable', leadTimeDays: 30, productionCycleDays: 14, inventory: { onHand: 50000, reserved: 10000, reorderPoint: 25000, warehouseLocation: 'Cold-A' }, salesHistory: generateSalesHistory(90), cost: 5, price: 45 },
    { id: 'SKU-PH2', name: 'Antibiotic Tabs (500mg)', category: 'Oral Solid', leadTimeDays: 10, productionCycleDays: 5, inventory: { onHand: 1000000, reserved: 200000, reorderPoint: 500000, warehouseLocation: 'Dry-B' }, salesHistory: generateSalesHistory(90), cost: 0.10, price: 1.50 }
];
const PHARMA_MATERIALS: Material[] = [
    { id: 'MAT-PH1', name: 'Glucose Media Grade A', category: 'Growth Media', currentPrice: 500, unit: 'USD/Kg', moq: 50, supplierLeadTime: 10, priceHistory: generatePriceHistory(24, 480) },
    { id: 'MAT-PH2', name: 'Sterile Glass Vials', category: 'Packaging', currentPrice: 0.50, unit: 'USD/Unit', moq: 10000, supplierLeadTime: 60, priceHistory: generatePriceHistory(24, 0.45) }
];


export const MOCK_DATASETS = {
  [IndustryType.DISCRETE_MFG]: {
    machines: DISCRETE_MACHINES,
    skus: DISCRETE_SKUS,
    materials: DISCRETE_MATERIALS
  },
  [IndustryType.PROCESS_PAINT]: {
    machines: PROCESS_MACHINES,
    skus: PROCESS_SKUS,
    materials: PROCESS_MATERIALS
  },
  [IndustryType.AUTOMOTIVE]: {
    machines: AUTO_MACHINES,
    skus: AUTO_SKUS,
    materials: AUTO_MATERIALS
  },
  [IndustryType.PHARMA]: {
    machines: PHARMA_MACHINES,
    skus: PHARMA_SKUS,
    materials: PHARMA_MATERIALS
  }
};

export const MOCK_SALES = [
  { month: 'Jan', unitsSold: 4200 },
  { month: 'Feb', unitsSold: 3800 },
  { month: 'Mar', unitsSold: 5100 },
  { month: 'Apr', unitsSold: 4800 },
  { month: 'May', unitsSold: 5900 },
  { month: 'Jun', unitsSold: 6300 },
];

export const MOCK_OEE: OEEData = {
  availability: 92,
  performance: 88,
  quality: 95,
  overall: 77 
};

export const MOCK_SUPPLIERS: SupplierRating[] = [
  {
    id: 'SUP-01', name: 'Global Metals Inc', materialCategory: 'Raw Metals', onTimeDelivery: 96, qualityScore: 9.2, priceCompetitiveness: 'Medium'
  },
  {
    id: 'SUP-02', name: 'TechParts Logistics', materialCategory: 'Electronics', onTimeDelivery: 88, qualityScore: 8.5, priceCompetitiveness: 'High'
  },
  {
    id: 'SUP-03', name: 'HydraForce Solutions', materialCategory: 'Hydraulics', onTimeDelivery: 99, qualityScore: 9.8, priceCompetitiveness: 'Low'
  }
];

// --- CRM MOCK DATA ---
export const MOCK_CUSTOMERS: Customer[] = [
  { id: 'C-001', name: 'Tesla Motors', contactEmail: 'supply@tesla.com', segment: 'Industrial', totalOrders: 15, lifetimeValue: 450000, lastInteraction: '2023-11-20', predictedChurnRisk: 'Low' },
  { id: 'C-002', name: 'Home Depot', contactEmail: 'vendor@homedepot.com', segment: 'Retail', totalOrders: 45, lifetimeValue: 120000, lastInteraction: '2023-11-15', predictedChurnRisk: 'Medium' },
];

export const MOCK_ORDERS: SalesOrder[] = [
  { id: 'ORD-1001', customerId: 'C-001', customerName: 'Tesla Motors', date: '2023-11-22', status: 'In Production', totalAmount: 54000, items: [{ skuId: 'SKU-500', quantity: 120 }] },
  { id: 'ORD-1002', customerId: 'C-002', customerName: 'Home Depot', date: '2023-11-24', status: 'Pending', totalAmount: 12500, items: [{ skuId: 'SKU-501', quantity: 300 }] },
  { id: 'ORD-1003', customerId: 'C-001', customerName: 'Tesla Motors', date: '2023-11-20', status: 'Shipped', totalAmount: 32000, items: [{ skuId: 'SKU-501', quantity: 100 }] },
];

// --- WORK ORDER MOCK DATA ---
export const MOCK_WORK_ORDERS: WorkOrder[] = [
  { id: 'WO-505', machineId: 'M-102', machineName: 'Hydraulic Press B', category: 'Maintenance', title: 'Hydraulic Leak Repair', description: 'Seal failure on main piston.', priority: 'High', status: 'In Progress', assignedTechnician: 'Mike R.', createdDate: '2023-11-24' },
  { id: 'WO-506', machineId: 'M-101', machineName: 'CNC Milling Center A', category: 'Maintenance', title: 'Routine Calibration', description: 'Quarterly axis calibration.', priority: 'Low', status: 'Open', createdDate: '2023-11-25' },
];

export const MOCK_FINANCIALS: FinancialMetric[] = [
  { period: '2023-Q1', revenue: 1200000, cogs: 650000, grossMargin: 45.8, operatingExpenses: 300000, netProfit: 250000 },
  { period: '2023-Q2', revenue: 1350000, cogs: 710000, grossMargin: 47.4, operatingExpenses: 320000, netProfit: 320000 },
  { period: '2023-Q3', revenue: 1150000, cogs: 680000, grossMargin: 40.8, operatingExpenses: 310000, netProfit: 160000 },
];

export const MOCK_DOCUMENTS: DocumentResource[] = [
    { id: 'doc-1', title: 'Safety Protocol 2024', category: 'Manual', fileType: 'PDF', size: '2.4 MB', uploadDate: '2023-11-01', uploadedBy: 'u-1' },
    { id: 'doc-2', title: 'Machine A Specs', category: 'Spec', fileType: 'PDF', size: '1.1 MB', uploadDate: '2023-10-15', uploadedBy: 'u-2' },
    { id: 'doc-3', title: 'Q3 Sales Report', category: 'Report', fileType: 'PPT', size: '4.5 MB', uploadDate: '2023-11-10', uploadedBy: 'u-4' },
];

export const MOCK_DELIVERIES: ClientDelivery[] = [
  { id: 'DEL-001', clientName: 'Tesla Motors', destination: 'Austin, TX', skuId: 'SKU-500', quantity: 50, deliveryDate: '2023-11-30' },
  { id: 'DEL-002', clientName: 'Ford', destination: 'Detroit, MI', skuId: 'SKU-501', quantity: 200, deliveryDate: '2023-12-05' }
];

export const MOCK_COMPANY_EVENTS: CalendarEvent[] = [
  { id: 'EVT-101', title: 'Q4 Strategy Meeting', date: '2023-11-28', type: 'general', description: 'Executive review of Q4 targets.', status: 'Scheduled', isApproved: true },
  { id: 'EVT-102', title: 'Safety Inspection', date: '2023-12-15', type: 'maintenance', description: 'Annual facility safety audit.', status: 'Scheduled', isApproved: true }
];

export const MOCK_INCOMING_SHIPMENTS: IncomingShipment[] = [
  { id: 'INC-201', materialId: 'MAT-001', materialName: 'Industrial Steel', supplier: 'Global Metals Inc', quantity: 10, unit: 'Ton', orderDate: '2023-11-01', estimatedArrival: '2023-11-29', status: 'In Transit', transportMethod: 'Ship' },
  { id: 'INC-202', materialId: 'MAT-002', materialName: 'Copper Wire', supplier: 'TechParts Logistics', quantity: 5, unit: 'Ton', orderDate: '2023-11-15', estimatedArrival: '2023-11-25', status: 'Customs', transportMethod: 'Air' }
];

// Using gemini-3-flash-preview for text tasks as per guidelines
export const GEMINI_MODEL_FLASH = 'gemini-3-flash-preview';
