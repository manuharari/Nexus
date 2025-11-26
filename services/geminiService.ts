
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { GEMINI_MODEL_FLASH } from "../constants";
import { configService } from "./configService";
import { securityService } from "./securityService";
import { telemetryService } from "./telemetryService";
import { 
  MaintenanceInsight, 
  ProductionInsight, 
  ProcurementInsight, 
  MachineStatus, 
  ProductSKU, 
  Material,
  SimulationParams,
  SimulationResult,
  QualityCheck
} from "../types";

// Initialize API Client
const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export const hasApiKey = () => !!apiKey;

// --- HELPER: Context Injection & Security Wrapper ---
const getModuleContext = () => {
    const enabled = configService.getEnabledModuleNames().join(', ');
    return `Current Client Config ENABLED MODULES: [${enabled}]. Do not suggest actions for disabled modules.`;
};

const wrapWithSecurityAndTelemetry = async <T>(
    serviceName: string, 
    operation: string, 
    fn: () => Promise<T>
): Promise<T> => {
    const clientId = configService.getClientConfig().clientId;
    
    // 1. Rate Limit Check
    if (!securityService.checkRateLimit(clientId)) {
        telemetryService.startSpan(serviceName, operation, { status: 'RATE_LIMITED', clientId });
        throw new Error("API Rate Limit Exceeded. Please upgrade your plan.");
    }

    // 2. Start Trace
    const traceId = telemetryService.startSpan(serviceName, operation, { clientId });
    const startTime = Date.now();

    try {
        // 3. Execute
        const result = await fn();
        
        // 4. Log Success
        telemetryService.logTrace({
            traceId,
            spanId: Math.random().toString(16).slice(2,10),
            timestamp: Date.now(),
            service: serviceName,
            operation: operation,
            durationMs: Date.now() - startTime,
            status: 'OK',
            meta: { size: JSON.stringify(result).length }
        });

        return result;
    } catch (error: any) {
        // 5. Log Error
        telemetryService.logTrace({
            traceId,
            spanId: Math.random().toString(16).slice(2,10),
            timestamp: Date.now(),
            service: serviceName,
            operation: operation,
            durationMs: Date.now() - startTime,
            status: 'ERROR',
            meta: { error: error.message }
        });
        throw error;
    }
};

// --- 1. Predictive Maintenance Service ---
const maintenanceSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    status: { type: Type.STRING, enum: ['Normal', 'Warning', 'Critical'] },
    failureProbability: { type: Type.NUMBER, description: "0.0 to 1.0" },
    predictedFailureWindow: { 
      type: Type.OBJECT,
      properties: {
        start: { type: Type.STRING, description: "ISO Date" },
        end: { type: Type.STRING, description: "ISO Date" }
      },
      nullable: true
    },
    confidenceLevel: { type: Type.NUMBER, description: "0-100" },
    recommendation: { type: Type.STRING, description: "Technical maintenance steps" },
    summary: { type: Type.STRING, description: "Plain language summary for managers" },
    downtimePrevented: { type: Type.NUMBER, description: "Minutes saved" }
  },
  required: ['status', 'failureProbability', 'confidenceLevel', 'recommendation', 'summary', 'downtimePrevented']
};

export const analyzeMachineHealth = async (machine: MachineStatus): Promise<MaintenanceInsight> => {
  return wrapWithSecurityAndTelemetry('GeminiAI', 'analyzeMachineHealth', async () => {
      if (!configService.isModuleEnabled('predictive_maintenance')) throw new Error("Module Disabled");

      const recentReadings = machine.readings.slice(-24); 
      
      const prompt = `
        ${getModuleContext()}
        Act as a Senior Reliability Engineer. Perform Predictive Maintenance Analysis for: ${machine.name}.
        
        INPUT DATA:
        1. Sensor Telemetry (Last 24h): ${JSON.stringify(recentReadings)}.
        2. Machine Stats: Run Hours: ${machine.runTimeHours}, Health Score: ${machine.healthScore}.
        3. Recent Error Codes: ${JSON.stringify(machine.errorCodes)}.
        
        TASK:
        - Calculate failure probability.
        - Estimate downtime prevented.
      `;

      try {
        const response = await ai.models.generateContent({
          model: GEMINI_MODEL_FLASH,
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            responseSchema: maintenanceSchema,
            temperature: 0.2
          }
        });

        const text = response.text;
        if (!text) throw new Error("No response");
        return JSON.parse(text) as MaintenanceInsight;
      } catch (error) {
        // Fallback for demo stability
        return {
          status: machine.errorCodes.length > 0 ? 'Warning' : 'Normal',
          failureProbability: machine.errorCodes.length > 0 ? 0.65 : 0.1,
          predictedFailureWindow: null,
          confidenceLevel: 75,
          recommendation: "Manual inspection recommended (AI Service Fallback).",
          summary: "AI service momentarily unavailable. Analysis based on local heuristics.",
          downtimePrevented: 0
        };
      }
  });
};

// --- 2. Production Forecasting Service ---
const productionSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    skuId: { type: Type.STRING },
    forecastedDemand: {
      type: Type.OBJECT,
      properties: {
        next30: { type: Type.NUMBER },
        next60: { type: Type.NUMBER },
        next90: { type: Type.NUMBER }
      }
    },
    recommendedStartDate: { type: Type.STRING, description: "ISO Date" },
    expectedStockoutDate: { type: Type.STRING, description: "ISO Date" },
    suggestedQuantity: { type: Type.NUMBER },
    reasoning: { type: Type.STRING }
  },
  required: ['skuId', 'forecastedDemand', 'recommendedStartDate', 'expectedStockoutDate', 'suggestedQuantity', 'reasoning']
};

export const forecastProduction = async (sku: ProductSKU): Promise<ProductionInsight> => {
  return wrapWithSecurityAndTelemetry('GeminiAI', 'forecastProduction', async () => {
      const prompt = `
        ${getModuleContext()}
        Act as a Production Master Scheduler. Plan for SKU: ${sku.name}.
        INPUT: Sales History: ${JSON.stringify(sku.salesHistory.slice(0, 30))}. Inventory: ${sku.inventory.onHand}. Lead Time: ${sku.leadTimeDays}.
        TASK: Forecast demand 30/60/90. Recommend Start Date.
      `;

      try {
        const response = await ai.models.generateContent({
          model: GEMINI_MODEL_FLASH,
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            responseSchema: productionSchema,
            temperature: 0.3
          }
        });
        const text = response.text;
        if (!text) throw new Error("No response");
        return JSON.parse(text) as ProductionInsight;
      } catch (error) {
        const nextMonth = new Date(); nextMonth.setDate(nextMonth.getDate() + 14);
        return {
          skuId: sku.id,
          forecastedDemand: { next30: 500, next60: 1000, next90: 1500 },
          recommendedStartDate: new Date().toISOString(),
          expectedStockoutDate: nextMonth.toISOString(),
          suggestedQuantity: 500,
          reasoning: "Fallback: Check connectivity."
        };
      }
  });
};

// --- 3. Procurement Optimization Service ---
const procurementSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    action: { type: Type.STRING, enum: ['Buy Now', 'Wait'] },
    recommendedWindow: {
      type: Type.OBJECT,
      properties: {
        start: { type: Type.STRING },
        end: { type: Type.STRING }
      }
    },
    predictedPriceTrend: { type: Type.ARRAY, items: { type: Type.NUMBER } },
    costSavingsEstimate: { type: Type.STRING },
    confidenceInterval: { type: Type.NUMBER },
    explanation: { type: Type.STRING }
  },
  required: ['action', 'recommendedWindow', 'predictedPriceTrend', 'costSavingsEstimate', 'confidenceInterval', 'explanation']
};

export const optimizeProcurement = async (material: Material): Promise<ProcurementInsight> => {
  return wrapWithSecurityAndTelemetry('GeminiAI', 'optimizeProcurement', async () => {
      const prompt = `
        ${getModuleContext()}
        Analyze purchasing for: ${material.name}. Price History: ${JSON.stringify(material.priceHistory.slice(-10))}.
        TASK: Buy Now or Wait?
      `;

      try {
        const response = await ai.models.generateContent({
          model: GEMINI_MODEL_FLASH,
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            responseSchema: procurementSchema,
            temperature: 0.3
          }
        });
        const text = response.text;
        if (!text) throw new Error("No response");
        return JSON.parse(text) as ProcurementInsight;
      } catch (error) {
        return {
          action: 'Wait',
          recommendedWindow: { start: new Date().toISOString(), end: new Date().toISOString() },
          predictedPriceTrend: [],
          costSavingsEstimate: "Unknown",
          confidenceInterval: 0,
          explanation: "Analysis failed."
        };
      }
  });
};

// --- 4. What-If Simulator ---
const simulationSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    projectedMargin: { type: Type.NUMBER },
    deliveryDelayDays: { type: Type.NUMBER },
    cashFlowImpact: { type: Type.NUMBER },
    recommendations: { type: Type.ARRAY, items: { type: Type.STRING } }
  },
  required: ['projectedMargin', 'deliveryDelayDays', 'cashFlowImpact', 'recommendations']
};

export const runSimulation = async (params: SimulationParams): Promise<SimulationResult> => {
  return wrapWithSecurityAndTelemetry('GeminiAI', 'runSimulation', async () => {
      if (!configService.isModuleEnabled('scenario_simulator')) return { projectedMargin: 0, deliveryDelayDays: 0, cashFlowImpact: 0, recommendations: ["Module Disabled"]};

      const prompt = `
        Run 'What-If' simulation. Params: Material Cost ${params.materialCostChange}%, Demand ${params.demandSpike}%.
        Output JSON.
      `;

      try {
        const response = await ai.models.generateContent({
            model: GEMINI_MODEL_FLASH,
            contents: prompt,
            config: { responseMimeType: "application/json", responseSchema: simulationSchema }
        });
        const text = response.text;
        if (!text) throw new Error("No response");
        return JSON.parse(text) as SimulationResult;
      } catch (error) {
        return { projectedMargin: 40, deliveryDelayDays: 5, cashFlowImpact: -100, recommendations: ["Error in sim"]};
      }
  });
};

// --- 5. Visual Quality Control ---
export const analyzeImageQuality = async (imageBase64: string): Promise<Omit<QualityCheck, 'id' | 'date' | 'batchId' | 'skuId'>> => {
    return wrapWithSecurityAndTelemetry('ComputerVision', 'analyzeImage', async () => {
        if (!configService.isModuleEnabled('quality_control')) throw new Error("QC Module Disabled");
        
        // Simulating processing delay
        return new Promise((resolve) => {
            setTimeout(() => {
                const rand = Math.random();
                if (rand > 0.7) {
                    resolve({ detectedDefects: ['Scratch'], score: 82, grade: 'B', status: 'Pass' });
                } else {
                    resolve({ detectedDefects: [], score: 98, grade: 'A', status: 'Pass' });
                }
            }, 1500);
        });
    });
};

// --- 6. Voice Assistant ---
export const processVoiceCommand = async (transcript: string): Promise<string> => {
    return wrapWithSecurityAndTelemetry('GeminiAI', 'voiceCommand', async () => {
        if (!configService.isModuleEnabled('voice_assistant')) return "Voice Module Disabled";
        const prompt = `User asked: "${transcript}". Answer concisely.`;
        const response = await ai.models.generateContent({ model: GEMINI_MODEL_FLASH, contents: prompt });
        return response.text || "I didn't catch that.";
    });
};
