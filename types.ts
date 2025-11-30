
export enum AppView {
  AUTH = 'AUTH',
  DASHBOARD = 'DASHBOARD',
  MAINTENANCE = 'MAINTENANCE',
  PRODUCTION = 'PRODUCTION',
  PROCUREMENT = 'PROCUREMENT',
  REPORTS = 'REPORTS',
  USER_MANAGEMENT = 'USER_MANAGEMENT',
  CALENDAR = 'CALENDAR',
  CRM = 'CRM',
  ERP = 'ERP',
  QUALITY = 'QUALITY',
  SIMULATION = 'SIMULATION',
  DIGITAL_TWIN = 'DIGITAL_TWIN',
  ENERGY = 'ENERGY',
  WORK_ORDERS = 'WORK_ORDERS',
  DOCUMENTS = 'DOCUMENTS',
  PLATFORM_ADMIN = 'PLATFORM_ADMIN',
  SYSTEM_HEALTH = 'SYSTEM_HEALTH'
}

export type ModuleId = 
  | 'predictive_maintenance'
  | 'production_forecasting'
  | 'procurement_intel'
  | 'quality_control'
  | 'scenario_simulator'
  | 'digital_twin'
  | 'energy_management'
  | 'work_orders'
  | 'crm'
  | 'erp_lite'
  | 'voice_assistant'
  | 'documents';

export type ClientStatus = 'Active' | 'Pending' | 'Suspended';

export interface ClientConfiguration {
  clientId: string;
  clientName: string;
  contactEmail?: string;
  planTier: 'Basic' | 'Pro' | 'Enterprise';
  status: ClientStatus;
  renewalDate?: string;
  enabledModules: Record<ModuleId, boolean>;
  rateLimitPerMinute: number;
  edgeBufferSize: number;
  defaultIndustry?: IndustryType;
}

export enum IndustryType {
  DISCRETE_MFG = 'DISCRETE_MFG',
  PROCESS_PAINT = 'PROCESS_PAINT',
  AUTOMOTIVE = 'AUTOMOTIVE',
  PHARMA = 'PHARMA'
}

export type Language = 'en' | 'es';

export type UserRole = 'platform_super_admin' | 'master_admin' | 'c_level' | 'admin' | 'sales' | 'manager' | 'operator' | 'viewer';

export interface PermissionSet {
  can_view_dashboard: boolean;
  can_run_forecasts: boolean;
  can_view_maintenance_model: boolean;
  can_view_price_forecast: boolean;
  can_view_stock_optimizer: boolean;
  can_edit_data: boolean;
  can_download_reports: boolean;
  can_manage_inventory: boolean;
  can_view_calendar: boolean;
  can_view_crm: boolean;
  can_view_erp: boolean;
  can_view_quality: boolean;
  can_view_simulation: boolean;
  can_view_digital_twin: boolean;
  can_view_energy: boolean;
  can_view_work_orders: boolean;
  can_use_voice_assistant: boolean;
  can_view_documents: boolean;
  can_view_system_health: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  status: 'active' | 'inactive';
  permissions: PermissionSet;
  lastLogin?: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  action: string;
  details: string;
  ipAddress: string;
  status: 'SUCCESS' | 'FAILURE' | 'WARNING';
}

export interface TraceLog {
  traceId: string;
  spanId: string;
  timestamp: number;
  service: string;
  operation: string;
  durationMs: number;
  status: 'OK' | 'ERROR';
  meta: Record<string, any>;
}

export interface SystemMetric {
  timestamp: number;
  cpuLoad: number;
  memoryUsage: number;
  activeConnections: number;
  edgeBufferFillPct: number;
  apiLatencyP95: number;
  errorRate: number;
}

export interface SensorReading {
  timestamp: string;
  temperature: number;
  vibration: number;
  rpm: number;
  electricCurrent: number;
  noiseLevel: number;
}

export interface MaintenanceLog {
  date: string;
  type: 'Preventive' | 'Corrective';
  description: string;
  partsReplaced: string[];
  downtimeMinutes: number;
}

export interface MachineStatus {
  id: string;
  name: string;
  type: string;
  status: 'Running' | 'Warning' | 'Critical' | 'Stopped';
  healthScore: number;
  runTimeHours: number;
  lastMaintenance: string;
  currentDowntimeStart?: string;
  errorCodes: string[];
  maintenanceLogs: MaintenanceLog[];
  readings: SensorReading[];
  gridPosition?: { x: number, y: number };
  energyUsageKwh: number;
}

export interface MaintenanceInsight {
  status: 'Normal' | 'Warning' | 'Critical';
  failureProbability: number;
  predictedFailureWindow: {
    start: string;
    end: string;
  } | null;
  confidenceLevel: number;
  recommendation: string;
  summary: string;
  downtimePrevented: number;
}

export interface SensorGuide {
  sensorType: string;
  importance: 'Critical' | 'High Value' | 'Preventive' | 'Standard';
  description: string;
  targetComponent: string;
}

export interface SalesRecord {
  date: string;
  unitsSold: number;
  isPromotion: boolean;
}

export interface ProductSKU {
  id: string;
  name: string;
  category: string;
  leadTimeDays: number;
  productionCycleDays: number;
  inventory: {
    onHand: number;
    reserved: number;
    reorderPoint: number;
    warehouseLocation: string;
  };
  salesHistory: SalesRecord[];
  cost: number;
  price: number;
}

export type InventoryAction = 'ADD' | 'SUBTRACT' | 'SET';

export interface ProductionInsight {
  skuId: string;
  forecastedDemand: {
    next30: number;
    next60: number;
    next90: number;
  };
  recommendedStartDate: string;
  expectedStockoutDate: string;
  suggestedQuantity: number;
  reasoning: string;
}

export interface OEEData {
  availability: number;
  performance: number;
  quality: number;
  overall: number;
}

export interface PricePoint {
  date: string;
  price: number;
  currency: 'USD' | 'MXN';
  exchangeRate: number;
  supplier: string;
}

export interface Material {
  id: string;
  name: string;
  category: string;
  currentPrice: number;
  unit: string;
  moq: number;
  supplierLeadTime: number;
  priceHistory: PricePoint[];
}

export interface ProcurementInsight {
  action: 'Buy Now' | 'Wait';
  recommendedWindow: {
    start: string;
    end: string;
  };
  predictedPriceTrend: number[];
  costSavingsEstimate: string;
  confidenceInterval: number;
  explanation: string;
}

export interface SupplierRating {
  id: string;
  name: string;
  materialCategory: string;
  onTimeDelivery: number;
  qualityScore: number;
  priceCompetitiveness: 'High' | 'Medium' | 'Low';
}

export interface IncomingShipment {
  id: string;
  materialId: string;
  materialName: string;
  supplier: string;
  quantity: number;
  unit: string;
  orderDate: string;
  estimatedArrival: string;
  status: 'In Transit' | 'Customs' | 'Scheduled' | 'Delayed';
  transportMethod: 'Truck' | 'Ship' | 'Air';
  carrier?: string;
  trackingNumber?: string;
}

export interface ShippingCarrier {
  id: string;
  name: string;
  apiStatus: 'Connected' | 'Disconnected' | 'Error';
}

export type CalendarEventType = 'maintenance' | 'delivery' | 'general' | 'logistics';

export interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  type: CalendarEventType;
  description: string;
  location?: string;
  status?: 'Scheduled' | 'Completed' | 'Pending';
  isApproved?: boolean;
  createdBy?: string;
}

export interface ClientDelivery {
  id: string;
  clientName: string;
  destination: string;
  skuId: string;
  quantity: number;
  deliveryDate: string;
}

export interface Customer {
  id: string;
  name: string;
  contactEmail: string;
  segment: 'Retail' | 'Wholesale' | 'Industrial';
  totalOrders: number;
  lifetimeValue: number;
  lastInteraction: string;
  predictedChurnRisk: 'Low' | 'Medium' | 'High';
}

export interface SalesOrder {
  id: string;
  customerId: string;
  customerName: string;
  date: string;
  status: 'Pending' | 'In Production' | 'QA' | 'Shipped' | 'Delivered';
  totalAmount: number;
  items: { skuId: string; quantity: number }[];
}

export interface PurchaseOrder {
  id: string;
  supplierId: string;
  date: string;
  status: 'Draft' | 'Sent' | 'Received' | 'Paid';
  totalAmount: number;
  items: { materialId: string; quantity: number; price: number }[];
}

export interface FinancialMetric {
  period: string;
  revenue: number;
  cogs: number;
  grossMargin: number;
  operatingExpenses: number;
  netProfit: number;
}

export interface QualityCheck {
  id: string;
  date: string;
  batchId: string;
  skuId: string;
  imageUrl?: string;
  detectedDefects: string[];
  score: number;
  grade: 'A' | 'B' | 'C' | 'D';
  status: 'Pass' | 'Fail' | 'Rework';
}

export type WorkOrderCategory = 'Maintenance' | 'Production';

export interface WorkOrder {
  id: string;
  machineId: string;
  machineName: string;
  category: WorkOrderCategory;
  title: string;
  description: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  status: 'Open' | 'In Progress' | 'Paused' | 'Closed';
  assignedTechnician?: string;
  createdDate: string;
  startDate?: string;
  endDate?: string;
  resolvedDate?: string;
}

export interface EnergyReading {
  machineId: string;
  timestamp: string;
  kwh: number;
  cost: number;
}

export interface SimulationParams {
  materialCostChange: number;
  laborCostChange: number;
  demandSpike: number;
  downtimeDays: number;
}

export interface SimulationResult {
  projectedMargin: number;
  deliveryDelayDays: number;
  cashFlowImpact: number;
  recommendations: string[];
}

export interface DocumentResource {
  id: string;
  title: string;
  category: 'Manual' | 'Spec' | 'Report' | 'Presentation';
  fileType: 'PDF' | 'PPT' | 'DOC';
  size: string;
  uploadDate: string;
  uploadedBy: string;
}

export interface Alert {
  id: string;
  type: 'failure' | 'stock' | 'price' | 'info';
  message: string;
  timestamp: string;
  severity: 'info' | 'warning' | 'critical';
}

export type ChatChannel = 'General' | 'Direction' | 'Maintenance' | 'Operations';

export interface ChatMessage {
  id: string;
  channel?: ChatChannel;
  recipientId?: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: string;
}

export interface EmailLog {
  id: string;
  recipientRole: string;
  subject: string;
  timestamp: string;
  status: 'Sent' | 'Failed';
}

export interface DailyReport {
  date: string;
  alertsGenerated: number;
  machinesAtRisk: number;
  stockoutsPredicted: number;
  buySignals: number;
  summary: string;
}
