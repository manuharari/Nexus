
# 🚀 Nexus Manufacturing AI: Production Roadmap

This document outlines the strategic plan to migrate **Nexus** from a Client-Side Simulation (Golden Master) to a **Production-Grade Enterprise SaaS**.

---

## 🏗️ Phase 1: Cloud Infrastructure (Backend-as-a-Service)

To move fast without managing servers, we will use **Supabase** (PostgreSQL + Auth + Realtime). It is the industry standard for modern SaaS and supports the strict security requirements of manufacturing.

### 1.1 Tech Stack Selection
*   **Database:** PostgreSQL 15+ (via Supabase).
*   **Authentication:** Supabase Auth (supports Email, Magic Links, and Enterprise SSO like Okta/Azure AD).
*   **Storage:** Supabase Storage (for Document Library & Quality Control Images).
*   **Edge Functions:** Deno/Node.js functions for sensitive logic (e.g., securely calling Gemini API without exposing keys on client).

### 1.2 Environment Setup
1.  **Create Supabase Project:** Region: `us-east-1` (or closest to clients).
2.  **Define Secrets:** Store `GOOGLE_GEMINI_KEY` in Supabase Vault, not in the frontend code.

---

## 💾 Phase 2: Database Migration (Schema Design)

We must translate the TypeScript interfaces (`types.ts`) into a robust SQL Schema with Multi-Tenancy.

### 2.1 The "Tenant" Architecture
Every single table **MUST** have a `tenant_id` column. This is non-negotiable for security.

### 2.2 SQL Migration Script (Draft)

```sql
-- 1. Tenants Table (The "Companies")
create table tenants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  plan_tier text check (plan_tier in ('Basic', 'Pro', 'Enterprise')),
  status text default 'Active',
  api_key_encrypted text, -- For BYOK (Bring Your Own Key)
  created_at timestamptz default now()
);

-- 2. Users Table (Linked to Auth)
create table user_profiles (
  id uuid references auth.users not null primary key,
  tenant_id uuid references tenants(id) not null,
  role text check (role in ('master_admin', 'maintenance', 'sales', 'c_level')),
  full_name text,
  permissions jsonb -- Storing the PermissionSet JSON here
);

-- 3. Machines (Assets)
create table machines (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references tenants(id) not null,
  name text not null,
  type text,
  status text,
  health_score numeric,
  grid_position_x int,
  grid_position_y int,
  metadata jsonb -- Stores flexible data like dimensions/specs
);

-- 4. Telemetry (Time-Series Data)
-- Ideally use TimescaleDB extension for this, but standard table works for start
create table telemetry (
  id bigint generated always as identity primary key,
  tenant_id uuid references tenants(id) not null,
  machine_id uuid references machines(id) not null,
  timestamp timestamptz default now(),
  vibration numeric,
  temperature numeric,
  rpm numeric,
  power_kwh numeric
);

-- Enable Row Level Security (RLS) on ALL tables
alter table tenants enable row level security;
alter table user_profiles enable row level security;
alter table machines enable row level security;
alter table telemetry enable row level security;
```

---

## 🛡️ Phase 3: Security Hardening (RLS & Encryption)

### 3.1 Row Level Security (RLS) Policies
This is how we guarantee safety. Even if the Frontend code is hacked, the Database blocks access.

**Policy Example:**
```sql
-- "Users can only see machines that belong to their Tenant"
create policy "Tenant Isolation" on machines
for select
using (
  tenant_id = (select tenant_id from user_profiles where id = auth.uid())
);
```

### 3.2 "Bring Your Own Key" (BYOK) Strategy
For Enterprise clients (Tesla, etc.), they may want to use *their* Google Cloud billing.
1.  **Client enters Key:** In Admin Panel.
2.  **Encryption:** Frontend encrypts it with a Master Public Key before sending.
3.  **Storage:** Saved in `tenants.api_key_encrypted`.
4.  **Usage:** Edge Function decrypts it on-the-fly to make the Gemini call.

---

## 🔌 Phase 4: Refactoring the Frontend

We need to swap the "Engine" without painting over the "Car".

### 4.1 Update `dataService.ts`
Currently, it writes to `localStorage`. We will create a `SupabaseDataService` that implements the exact same methods but calls the API.

**Before:**
```typescript
getMachines() { return JSON.parse(localStorage.getItem('machines')); }
```

**After:**
```typescript
async getMachines() { 
  const { data, error } = await supabase.from('machines').select('*');
  return data;
}
```

### 4.2 Offline Sync (Edge Mode)
To keep the "fast" feel:
1.  Use `TanStack Query` (React Query) for caching.
2.  Keep the `edgeService.ts` ring buffer. When internet cuts, buffer writes to IndexedDB. When online, flush to Supabase.

---

## 📈 Phase 5: Go-To-Market & Onboarding

### 5.1 The "Super Admin" Dashboard
*   We already built `PlatformAdminView.tsx`.
*   We connect this to the `tenants` table.
*   **Action:** "Create Tenant" button -> Inserts row in SQL -> Sends Invite Email to client admin.

### 5.2 Whitelabeling
*   The `branding` column in SQL stores the Logo URL and Primary Color hex.
*   The Frontend fetches this on load (`App.tsx`) and injects it into Tailwind config dynamically.

---

## ✅ Immediate Next Steps

1.  **Sign up for Supabase** (Free Tier is sufficient for dev).
2.  **Run the SQL Migration** (I can generate the full finalized script when ready).
3.  **Install Client:** `npm install @supabase/supabase-js`.
4.  **Refactor:** Create `services/supabaseService.ts` and verify connection.
