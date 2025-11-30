
# Nexus Manufacturing AI - Enterprise Platform

**Nexus AI** is a modular, multi-tenant intelligence platform designed for the modern manufacturing floor. It integrates IoT telemetry, ERP financials, CRM sales data, and AI forecasting into a single, adaptive interface.

This system is **Industry Agnostic** (supports Discrete & Process Manufacturing) and **Fully Modular** (features can be enabled/disabled per client).

---

## 📖 Module Deep Dive

This section explains the functionality and workflow of each individual module.

### 1. 🎫 Work Orders (Enhanced)
The Work Order system is the central nervous system for task execution. It supports both **Maintenance Repairs** and **Production Runs**.

*   **What is it for?**
    *   **Maintenance Teams:** Track repairs, calibrations, and preventive service (e.g., "Replace Bearing").
    *   **Production Managers:** Schedule manufacturing batches (e.g., "Run 500 units of SKU-A").
    *   **Sales:** View the status of customer orders in production.
*   **Role-Based Access:**
    *   **Maintenance Users** default to seeing "Maintenance" tickets.
    *   **Sales/Production Users** default to seeing "Production" tickets.
*   **Conflict Detection Logic (Smart Alerting):**
    *   The system automatically checks for collisions.
    *   *Example:* If Maintenance schedules a "Calibration" on Machine A for Tuesday, and Production tries to schedule a "Batch Run" on Machine A for the same day, the system will flash a **Red Warning**.
    *   This prevents downtime surprises where operators arrive to find a machine dismantled.
*   **Workflow:**
    *   Tickets move from **Open** -> **In Progress** -> **Closed**.
    *   Color Coding: **Orange** = Maintenance, **Blue** = Production.

### 2. 🛠️ Predictive Maintenance
*   **Function:** Ingests live sensor data (Vibration, Temperature, RPM) to predict failure.
*   **AI Logic:** Gemini analyzes 24-hour trends. If vibration spikes while temp is stable, it flags "Bearing Wear". If both spike, it flags "Overheating/Friction".
*   **Downtime Tracker:** A stopwatch for operators. When a machine stops, the timer starts. To resume, the operator *must* enter a resolution reason, creating a rich history log for future AI analysis.

### 3. 📦 Production & Forecasting
*   **Function:** Prevents stockouts and overproduction.
*   **Burn-Down Chart:** Visualizes inventory dropping day-by-day based on AI sales forecasts.
*   **Recommendation:** The AI tells you exactly *when* to start a production run (e.g., "Start on Nov 24th") to ensure goods are finished exactly when current stock runs out.

### 4. 🛒 Procurement Intelligence
*   **Function:** Optimizes raw material buying.
*   **AI Price Prediction:** Analyzes 5-year commodity trends. It might say "Wait 5 days, copper price is dropping."
*   **Supplier Scorecards:** Automatically rates suppliers based on their "On-Time Delivery" history (simulated data).

### 5. 🤝 Unified Calendar
*   **Function:** The "Grand Central Station" of scheduling.
*   **Aggregation:** It combines:
    1.  **Maintenance** (Predicted & Scheduled dates).
    2.  **Logistics** (Incoming raw materials & Outbound client deliveries).
    3.  **Operations** (Shift changes, audits).
    4.  **Work Orders** (Automatically syncs start/end dates from the Work Order module).
*   **Approval:** Regular users can "Request" events. Only Master Admins can "Approve" them.

---

## ⚙️ Configuration & Modularity (Developer Guide)

Nexus is built to be sold to different clients with different needs. You can turn modules ON or OFF without deleting code.

### 1. How to Toggle Modules
Open `services/configService.ts`. This file controls the "Feature Flags".

```typescript
// Example: Creating a "Basic Plan" configuration
{
  clientId: 'basic-client',
  planTier: 'Basic',
  enabledModules: {
    predictive_maintenance: true, // ENABLED
    quality_control: false,       // DISABLED (Hidden from UI)
    digital_twin: false,          // DISABLED
    crm: true,
    documents: true,
    // ...
  }
}
```

*   **To Activate a Module:** Set the value to `true`.
*   **To Deactivate:** Set the value to `false`. The Sidebar link and Route will automatically disappear for that client.

### 2. How to Add a New Module
1.  **Define it:** Add the module name to `ModuleId` in `types.ts`.
2.  **Default it:** Add it to `DEFAULT_MODULES` in `services/configService.ts`.
3.  **Build it:** Create `components/NewModuleView.tsx`.
4.  **Route it:** In `App.tsx`:
    *   Add a Sidebar Item wrapped in `isModuleActive('new_module')`.
    *   Add the Route case in `renderView`.

---

## 🚀 Deployment Guide (How to Implement for Clients)

You can deploy this application in two ways depending on client security requirements.

### Option A: Cloud / Web-Based (Recommended)
Best for accessibility and ease of updates.

1.  **Source Code:** Push this project to a GitHub repository.
2.  **Hosting:** Sign up for **Vercel** or **Netlify** (Free tiers available).
3.  **Deploy:**
    *   Connect your GitHub account.
    *   Select the Nexus repository.
    *   **Environment Variables:**
        *   Add `API_KEY` with your Google Gemini Key.
        *   **Netlify Specific:** Ensure you select **"All scopes"** (especially Build) when adding the key.
    *   Click **Deploy**.
4.  **Client Access:** Send the generated URL (e.g., `https://nexus-ai-client.vercel.app`) to your client. They can log in from any browser.

### Option B: Local / On-Premise
Best for high-security factories with no internet.

1.  **Install Node.js:** Ensure the factory server has Node.js installed.
2.  **Transfer Code:** Copy the project folder to the server.
3.  **Build:** Run `npm install` then `npm run build`.
4.  **Serve:** Use a static file server (like `serve -s build`) to run the app on the local network (e.g., `http://192.168.1.50:3000`).

---

## 🔐 User Roles & Demo Credentials

Use these accounts to test the Role-Based Access Control (RBAC) and specific features.

| Role | Email | Password | Primary Access |
|------|-------|----------|----------------|
| **C-Level (Director)** | `ceo@nexus.ai` | `admin` | **Direction Channel**, All Reports, Financials |
| **Master Admin** | `admin@nexus.ai` | `admin` | **FULL ACCESS**, User Mgmt, Event Approval |
| **Maintenance** | `maintenance@nexus.ai` | `user` | Machine Health, Work Orders, Twin |
| **Purchasing** | `purchasing@nexus.ai` | `user` | Procurement, Logistics, ERP |
| **Sales** | `sales@nexus.ai` | `user` | CRM, Outbound Orders, Inventory |

---

## 🛠 Tech Stack

*   **Frontend:** React 19, TypeScript, Tailwind CSS
*   **AI Engine:** Google Gemini 2.5 Flash
*   **Security:** AES-256 Encryption & SHA-256 Hashing
*   **State:** Custom Services (Redux-pattern without boilerplate)
*   **Charts:** Recharts

---

## 🧠 Technical Architecture & Implementation

### Security Layer (AES-256 & SHA-256)
All sensitive data (user passwords, proprietary sensor logs) is encrypted before storage using `crypto-js`.
*   **Encryption:** `AES.encrypt(JSON.stringify(data), KEY)`
*   **Input Sanitization:** A regex stripper removes `<script>` tags from CSV uploads to prevent XSS.
*   **Key Rotation:** The `securityService` supports key versioning (`v1:ciphertext`) to allow future key rotation without data loss.

### Modular Engine
The entire app is wrapped in a `ConfigService`. 
*   **ClientConfiguration:** Defines which modules are `true` or `false`.
*   **Gatekeeper:** The `isModuleActive()` function in `App.tsx` checks both the Client Config AND User Permissions before rendering a view. This allows strict "Feature Gating" for tiered pricing (Basic vs Enterprise).

### Cloud Architect & Security Guide
**1. Multi-Tenant vs Single-Tenant**
*   **SaaS (Multi-Tenant):** One database, `tenant_id` column on every table. Enable Postgres RLS (`CREATE POLICY ... USING (tenant_id = current_user_tenant)`) to prevent data leaks.
*   **On-Prem (Single-Tenant):** Docker container deployed on client's private VPC. Maximum security, no data co-mingling.

**2. Secret Management**
In production (AWS/Azure), never store `API_KEY` in code. Use **AWS Secrets Manager**.
*   The app should fetch secrets at runtime via an API call, or inject them into the Docker container as Env Vars during ECS/Kubernetes startup.

**3. Row-Level Security (RLS) SQL Example**
To strictly enforce tenant isolation in a real Postgres DB:
```sql
ALTER TABLE work_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON work_orders
USING (tenant_id = current_setting('app.current_tenant')::uuid);
```
This ensures that even if the API has a bug, the Database Layer rejects a query from Client A trying to see Client B's data.
