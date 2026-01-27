# Nexus AI: Full Enterprise Data Dictionary (v2.1)

This document is the technical source of truth for the Nexus Manufacturing AI database architecture. 

---

## 1. Core Platform & Identity (IAM)

### Table: `tenants`
*Purpose: Isolates data for different companies in a SaaS environment.*

| Column | Data Type | Constraints | Description / Logic |
| :--- | :--- | :--- | :--- |
| `id` | VARCHAR(50) | PRIMARY KEY | Unique identifier (slug or UUID). |
| `name` | VARCHAR(255) | NOT NULL | Official company name used in headers. |
| `plan_tier` | ENUM | ('Basic', 'Pro', 'Enterprise') | Controls feature access and rate limits. |
| `status` | ENUM | ('Active', 'Pending', 'Suspended') | Suspended tenants are blocked from login. |
| `logo_url` | TEXT | NULLABLE | URL to the custom whitelabel logo image. |
| `primary_color`| VARCHAR(20) | NULLABLE | Hex code (e.g., #3B82F6) for UI theme customization. |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Record creation date. |

### Table: `users`
*Purpose: Authenticated users with Role-Based Access Control (RBAC).*

| Column | Data Type | Constraints | Description / Logic |
| :--- | :--- | :--- | :--- |
| `id` | VARCHAR(50) | PRIMARY KEY | Unique user ID. |
| `tenant_id` | VARCHAR(50) | FOREIGN KEY | Links to `tenants.id`. CASCADE on delete. |
| `name` | VARCHAR(255) | NOT NULL | Display name of the user. |
| `email` | VARCHAR(255) | UNIQUE, NOT NULL | Login credential. |
| `password_hash`| VARCHAR(255) | NOT NULL | SHA-256 hashed password. |
| `role` | ENUM | (8 Roles) | platform_super_admin, master_admin, c_level, etc. |
| `status` | ENUM | ('active', 'inactive') | Prevents login for former employees. |
| `last_login` | DATETIME | NULLABLE | Tracks session activity. |
| `permissions` | JSON | NULLABLE | Granular permission flags (e.g., `can_run_forecasts: true`). |

---

## 2. Infrastructure & Digital Twin

### Table: `map_tiles`
*Purpose: Stores the physical layout of the factory floor.*

| Column | Data Type | Constraints | Description / Logic |
| :--- | :--- | :--- | :--- |
| `tenant_id` | VARCHAR(50) | PK, FK | Multi-tenant ID. |
| `x`, `y` | INT | PK | Coordinates on the 2D factory grid. |
| `type` | ENUM | ('floor', 'walkway', 'restricted', 'wall') | Controls the visual rendering and pathfinding. |

### Table: `machines`
*Purpose: Physical assets tracked by the system.*

| Column | Data Type | Constraints | Description / Logic |
| :--- | :--- | :--- | :--- |
| `id` | VARCHAR(50) | PRIMARY KEY | Unique asset ID (e.g., 'CNC-01'). |
| `tenant_id` | VARCHAR(50) | FK | Links to `tenants.id`. |
| `name` | VARCHAR(255) | NOT NULL | Display name. |
| `type` | VARCHAR(100) | NULLABLE | Category (e.g., 'Robot Arm', 'Hydraulic Press'). |
| `status` | ENUM | (4 States) | Running, Warning, Critical, Stopped. |
| `health_score` | INT | DEFAULT 100 | AI-calculated score (0-100). |
| `runtime_hours`| DECIMAL(15,2)| DEFAULT 0 | Cumulative engine hours for maintenance triggers. |
| `energy_usage_kwh`| DECIMAL(15,2)| DEFAULT 0 | Real-time power draw for dashboard KPIs. |
| `grid_x`, `grid_y`| INT | NULLABLE | Center position on the Digital Twin map. |
| `dim_w`, `dim_h` | INT | DEFAULT 1 | Size of the asset in grid units. |
| `last_maintenance`| DATE | NULLABLE | Date of the last preventive service. |
| `current_downtime_start`| DATETIME | NULLABLE | If NOT NULL, machine is currently down. |

---

## 3. IoT Telemetry & Sustainability (Big Data)

### Table: `sensor_readings`
*Purpose: High-frequency time-series data for Predictive AI analysis.*

| Column | Data Type | Constraints | Description / Logic |
| :--- | :--- | :--- | :--- |
| `id` | BIGINT | PK, AUTO_INC | Unique reading identifier. |
| `machine_id` | VARCHAR(50) | FK | Links to `machines.id`. |
| `timestamp` | TIMESTAMP | INDEX | Time of capture. Indexed for fast time-series queries. |
| `temperature` | DECIMAL(8,2) | NULLABLE | Thermal reading in Celsius. |
| `vibration` | DECIMAL(8,2) | NULLABLE | RMS vibration levels. |
| `rpm` | INT | NULLABLE | Rotational speed. |
| `amps` | DECIMAL(8,2) | NULLABLE | Electric load. Used to detect friction/stall. |
| `noise_level` | DECIMAL(8,2) | NULLABLE | Decibel level for acoustic anomaly detection. |

### Table: `energy_logs`
*Purpose: Historical power consumption for ESG and cost reporting.*

| Column | Data Type | Constraints | Description / Logic |
| :--- | :--- | :--- | :--- |
| `id` | BIGINT | PRIMARY KEY | |
| `tenant_id` | VARCHAR(50) | FK | |
| `machine_id` | VARCHAR(50) | FK | |
| `kwh_reading` | DECIMAL(15,4)| NOT NULL | Total power consumed in a specific interval. |
| `cost_at_time` | DECIMAL(10,4)| NOT NULL | Utility rate at time of consumption. |

---

## 4. Business Operations (CRM / ERP / Logistics)

### Table: `product_skus` (Inventory)
| Column | Data Type | Constraints | Description / Logic |
| :--- | :--- | :--- | :--- |
| `id` | VARCHAR(50) | PRIMARY KEY | Part number or internal ID. |
| `name` | VARCHAR(255) | NOT NULL | Finished product name. |
| `on_hand` | INT | DEFAULT 0 | Current physical stock count. |
| `reserved` | INT | DEFAULT 0 | Units committed to pending orders. |
| `reorder_point`| INT | DEFAULT 10 | Level that triggers AI restock alerts. |
| `cost`, `price` | DECIMAL(15,2)| NOT NULL | Financial values for margin calculation. |

### Table: `sales_orders` (CRM Pipeline)
| Column | Data Type | Constraints | Description / Logic |
| :--- | :--- | :--- | :--- |
| `status` | ENUM | (5 States) | Pending, In Production, QA, Shipped, Delivered. |
| `total_amount` | DECIMAL(15,2)| NOT NULL | Total order revenue. |
| `order_date` | DATE | INDEX | Used for demand forecasting logic. |

---

## 5. Strategic Intelligence & Governance

### Table: `simulation_scenarios`
*Purpose: Stores results of "What-If" AI simulations.*

| Column | Data Type | Constraints | Description / Logic |
| :--- | :--- | :--- | :--- |
| `params` | JSON | NOT NULL | Stores input sliders (e.g. `{"materialCost": +10%}`). |
| `results` | JSON | NOT NULL | Stores AI output (e.g. `{"margin": 42%, "delay": 5}`). |

### Table: `audit_logs`
*Purpose: Immutable record of system activity for ISO compliance.*

| Column | Data Type | Constraints | Description / Logic |
| :--- | :--- | :--- | :--- |
| `action` | VARCHAR(100) | NOT NULL | e.g., 'LOGIN_SUCCESS', 'INVENTORY_REDUCE'. |
| `details` | TEXT | NULLABLE | Detailed description of the event. |
| `ip_address` | VARCHAR(45) | NOT NULL | IPv4 or IPv6 of the actor. |

---

## 6. Communication & Alerts

### Table: `chat_messages`
| Column | Data Type | Constraints | Description / Logic |
| :--- | :--- | :--- | :--- |
| `channel` | ENUM | (4 Channels) | General, Direction, Maintenance, Operations. |
| `content` | TEXT | NOT NULL | Message body (Sanitized). |

### Table: `alerts`
| Column | Data Type | Constraints | Description / Logic |
| :--- | :--- | :--- | :--- |
| `severity` | ENUM | (3 Levels) | info, warning, critical. |
| `is_resolved` | BOOLEAN | DEFAULT FALSE| Tracks if operator has acknowledged the risk. |

---

## Database Indexing Strategy
To ensure the system stays fast with millions of IoT records:
1.  **Composite Index:** `(tenant_id, machine_id, timestamp)` on `sensor_readings`.
2.  **Date Index:** `order_date` on `sales_orders` for AI time-series forecasting.
3.  **FK Indices:** All Foreign Keys are indexed by default to optimize JOIN performance between `users` and `tenants`.
