
import { configService } from './configService';

const ENCRYPTION_KEY = "NEXUS_SECURE_KEY_V1";

// Access the global CryptoJS variable loaded via index.html script tag
declare const CryptoJS: any;

class SecurityService {
  private tokenBuckets: Record<string, { tokens: number; lastRefill: number }> = {};

  /**
   * Hashes a password using SHA-256.
   */
  hashPassword(password: string): string {
    return CryptoJS.SHA256(password).toString();
  }

  /**
   * Encrypts sensitive data (like an object) into a string.
   */
  encryptData(data: any): string {
    const json = JSON.stringify(data);
    return CryptoJS.AES.encrypt(json, ENCRYPTION_KEY).toString();
  }

  /**
   * Decrypts data back into an object.
   */
  decryptData(ciphertext: string): any {
    try {
      const bytes = CryptoJS.AES.decrypt(ciphertext, ENCRYPTION_KEY);
      const decryptedData = bytes.toString(CryptoJS.enc.Utf8);
      return JSON.parse(decryptedData);
    } catch (e) {
      console.error("Decryption failed");
      return null;
    }
  }

  generateSessionToken(): string {
    return CryptoJS.lib.WordArray.random(32).toString();
  }

  sanitizeInput(input: string): string {
    if (!input) return '';
    return input
      .replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gm, "")
      .replace(/on\w+="[^"]*"/g, "")
      .replace(/javascript:/g, "");
  }

  // --- NEW: Rate Limiting (Token Bucket Algorithm) ---
  
  /**
   * Checks if a tenant has enough API tokens.
   * Refills tokens based on time elapsed.
   */
  checkRateLimit(tenantId: string): boolean {
    const config = configService.getClientConfig();
    const maxTokens = config.rateLimitPerMinute || 60;
    const refillRate = maxTokens / 60; // Tokens per second

    const now = Date.now();
    
    if (!this.tokenBuckets[tenantId]) {
        this.tokenBuckets[tenantId] = { tokens: maxTokens, lastRefill: now };
    }

    const bucket = this.tokenBuckets[tenantId];
    const elapsedSeconds = (now - bucket.lastRefill) / 1000;
    
    // Refill
    bucket.tokens = Math.min(maxTokens, bucket.tokens + (elapsedSeconds * refillRate));
    bucket.lastRefill = now;

    if (bucket.tokens >= 1) {
        bucket.tokens -= 1;
        return true;
    }
    
    console.warn(`Rate limit exceeded for tenant: ${tenantId}`);
    return false;
  }

  getRateLimitStatus(tenantId: string) {
      // Ensure bucket exists
      if (!this.tokenBuckets[tenantId]) this.checkRateLimit(tenantId);
      return this.tokenBuckets[tenantId];
  }

  // --- NEW: Row Level Security (RLS) Simulation ---

  /**
   * Simulates applying a Row-Level Security policy.
   * Ensures data being accessed belongs to the current tenant context.
   */
  applyRLS<T>(data: T[], tenantId: string, ownerField: keyof T = 'tenantId' as keyof T): T[] {
      // In this mock, most data isn't actually tagged with tenantId in constants.ts
      // But this function demonstrates the architectural pattern.
      // If we had multi-tenant data in one array, we would filter here.
      
      // For simulation, we'll just return the data, but log the "Security Scan"
      // console.debug(`[RLS] Scanning ${data.length} records for tenant ${tenantId}`);
      return data;
  }
}

export const securityService = new SecurityService();
