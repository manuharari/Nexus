
import { TraceLog, SystemMetric } from '../types';

/**
 * Simulates an OpenTelemetry-compatible Observability Layer.
 * Tracks distributed traces, span IDs, and aggregates system health metrics.
 */
class TelemetryService {
  private traces: TraceLog[] = [];
  private metrics: SystemMetric[] = [];
  private listeners: (() => void)[] = [];

  constructor() {
    // Start background metric collection
    setInterval(() => this.collectSystemMetrics(), 3000);
  }

  // --- Distributed Tracing ---

  public startSpan(service: string, operation: string, meta: Record<string, any> = {}): string {
    const spanId = Math.random().toString(16).slice(2, 10);
    // In a real system, traceId would be propagated from headers. Here we generate a new one if root.
    const traceId = meta.traceId || Math.random().toString(16).slice(2, 18) + Math.random().toString(16).slice(2, 18);
    
    // Store partial log (will be completed in endSpan)
    // For simplicity in this demo, we just log the start and assume immediate completion for visualization
    this.logTrace({
        traceId,
        spanId,
        timestamp: Date.now(),
        service,
        operation,
        durationMs: Math.floor(Math.random() * 200) + 20, // Simulated duration
        status: 'OK',
        meta
    });

    return traceId;
  }

  public logTrace(trace: TraceLog) {
    this.traces.unshift(trace);
    if (this.traces.length > 200) this.traces.pop();
    this.notifyListeners();
  }

  public getRecentTraces(): TraceLog[] {
    return this.traces;
  }

  // --- SLO & Metric Aggregation ---

  private collectSystemMetrics() {
    // Simulate collecting stats from the "Backend"
    const lastTrace = this.traces[0];
    const errorCount = this.traces.slice(0, 50).filter(t => t.status === 'ERROR').length;
    
    const metric: SystemMetric = {
        timestamp: Date.now(),
        cpuLoad: 20 + Math.random() * 15, // %
        memoryUsage: 45 + Math.random() * 10, // %
        activeConnections: 120 + Math.floor(Math.random() * 30),
        edgeBufferFillPct: (Math.sin(Date.now() / 10000) + 1) * 40, // Simulated oscillation
        apiLatencyP95: lastTrace ? lastTrace.durationMs * 1.5 : 150,
        errorRate: (errorCount / 50) * 100
    };

    this.metrics.push(metric);
    if (this.metrics.length > 60) this.metrics.shift(); // Keep 3 minutes history
    this.notifyListeners();
  }

  public getMetrics(): SystemMetric[] {
    return this.metrics;
  }

  // --- Subscription ---
  public subscribe(listener: () => void) {
    this.listeners.push(listener);
    return () => {
        this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners() {
      this.listeners.forEach(l => l());
  }
}

export const telemetryService = new TelemetryService();
