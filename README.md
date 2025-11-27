# Nexus Manufacturing AI - Enterprise Platform

**Nexus AI** is a modular, multi-tenant intelligence platform designed for the modern manufacturing floor. It integrates IoT telemetry, ERP financials, CRM sales data, and AI forecasting into a single, adaptive interface.

This system is **Industry Agnostic** (supports Discrete & Process Manufacturing) and **Fully Modular** (features can be enabled/disabled per client).

---

## 🌟 Comprehensive Feature Suite

### 🏭 Operations & Shop Floor
1.  **Predictive Maintenance:** 
    *   AI analyzes vibration/temp sensors to predict failure 7-14 days in advance.
    *   **Downtime Tracker:** Logs stoppage duration and resolution reasons.
    *   **Sensor Guide:** Built-in knowledge base for hardware installation.
2.  **Digital Twin (Factory Map):** 
    *   Live 2D map of the factory floor showing machine status (Green/Red) and energy draw.
3.  **Work Orders:** 
    *   Kanban-style board for tracking maintenance tickets (Open -> Closed).
4.  **Energy Management:** 
    *   Tracks kWh consumption and efficiency trends per machine.

### 📦 Production & Supply Chain
5.  **Production Forecasting:** 
    *   AI predicts sales demand (30/60/90 days).
    *   **Inventory Control:** Manual Stock Adjustments (Add/Subtract/Set) + Automated CSV Ingestion.
6.  **Procurement & Logistics:** 
    *   **Price Prediction:** AI forecasts material costs (e.g., Copper, Steel) to recommend "Buy Windows".
    *   **Inbound Logistics:** Tracks raw material shipments and API carrier integration.
    *   **Supplier Scorecards:** Rates vendors on quality and timeliness.
7.  **Visual Quality Control:** 
    *   AI Computer Vision (Simulated) analyzes uploaded images for defects.

### 💼 Business & Sales
8.  **CRM & Sales:** 
    *   **Pipeline:** Track customer LTV and Churn Risk.
    *   **Outbound Logistics:** Dedicated tab to track finished goods shipments to clients.
9.  **ERP-Lite:** 
    *   Financial dashboard tracking Revenue, COGS, and Net Profit margins.
10. **What-If Simulator:** 
    *   Adjust sliders (Labor Cost, Demand Spikes) to simulate financial impact on margins.

### 🤝 Collaboration & Resources
11. **Team Chat & Direction:** 
    *   **Channels:** General, Maintenance, Operations.
    *   **Direction Channel:** Restricted high-level channel for C-Level/Managers.
    *   **Direct Messages:** Private 1-on-1 messaging between users.
12. **Resource Library (Documents):** 
    *   Upload/Download PDFs, Manuals, and Presentations for the team.
13. **Unified Calendar:** 
    *   Aggregates Maintenance, Deliveries, and Company Events. 
    *   Includes an **Approval Workflow** for new events.

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

## 🧪 How to Test Data Injection
1.  Go to **Reports & Data Center**.
2.  Click **Download Template** (e.g., for Sales).
3.  Open the CSV and change values (e.g., increase Sales for a specific day).
4.  Upload the CSV back to the system.
5.  Go to **Production View** -> The Inventory and Charts will update instantly.