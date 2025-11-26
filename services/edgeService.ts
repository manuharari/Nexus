
import { telemetryService } from "./telemetryService";

/**
 * Simulates an Edge Gateway Device.
 * Implements a Ring Buffer to handle high-frequency sensor data and 
 * handles "network backpressure" by dropping packets if the buffer is full.
 */
class EdgeService {
  private bufferSize: number = 1000;
  private buffer: any[] = [];
  private isConnected: boolean = true;
  private droppedPackets: number = 0;

  constructor() {
    // Simulate periodic flushing to cloud
    setInterval(() => this.flushBuffer(), 2000);
  }

  /**
   * Ingests data into the Edge Buffer.
   * Returns false if packet was dropped due to backpressure.
   */
  public ingestReading(machineId: string, reading: any): boolean {
    if (this.buffer.length >= this.bufferSize) {
        this.droppedPackets++;
        return false; // Backpressure: Drop packet
    }

    this.buffer.push({
        machineId,
        ...reading,
        ingestTimestamp: Date.now()
    });
    return true;
  }

  /**
   * Flushes buffered data to the "Cloud" (DataService).
   */
  private async flushBuffer() {
    if (this.buffer.length === 0 || !this.isConnected) return;

    const batch = this.buffer.splice(0, 50); // Process 50 at a time
    
    // Simulate network latency
    await new Promise(resolve => setTimeout(resolve, 100));

    telemetryService.startSpan('edge-gateway', 'flush_batch', {
        batchSize: batch.length,
        bufferRemaining: this.buffer.length,
        droppedTotal: this.droppedPackets
    });
  }

  public getBufferStatus() {
      return {
          size: this.bufferSize,
          used: this.buffer.length,
          dropped: this.droppedPackets,
          isConnected: this.isConnected
      };
  }

  public toggleConnection() {
      this.isConnected = !this.isConnected;
  }
}

export const edgeService = new EdgeService();
