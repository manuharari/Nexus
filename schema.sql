-- Nexus Manufacturing AI - FULL ENTERPRISE MySQL Schema (v2.0)
-- This schema supports all 13 modules including IAM, Collaboration, and Strategic Analysis.

CREATE DATABASE IF NOT EXISTS nexus_db;
USE nexus_db;

-- 1. Tenants & IAM (Identity and Access Management)
CREATE TABLE tenants (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    plan_tier ENUM('Basic', 'Pro', 'Enterprise') DEFAULT 'Basic',
    status ENUM('Active', 'Pending', 'Suspended') DEFAULT 'Active',
    logo_url TEXT,
    primary_color VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE users (
    id VARCHAR(50) PRIMARY KEY,
    tenant_id VARCHAR(50),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('platform_super_admin', 'master_admin', 'c_level', 'admin', 'sales', 'manager', 'operator', 'viewer'),
    status ENUM('active', 'inactive') DEFAULT 'active',
    last_login DATETIME,
    permissions JSON, -- Stores PermissionSet object
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

-- 2. Infrastructure & Digital Twin
CREATE TABLE map_tiles (
    tenant_id VARCHAR(50),
    x INT,
    y INT,
    type ENUM('floor', 'walkway', 'restricted', 'wall') DEFAULT 'floor',
    PRIMARY KEY (tenant_id, x, y),
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

CREATE TABLE machines (
    id VARCHAR(50) PRIMARY KEY,
    tenant_id VARCHAR(50),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(100),
    status ENUM('Running', 'Warning', 'Critical', 'Stopped') DEFAULT 'Stopped',
    health_score INT DEFAULT 100,
    runtime_hours DECIMAL(15,2) DEFAULT 0,
    energy_usage_kwh DECIMAL(15,2) DEFAULT 0,
    grid_x INT,
    grid_y INT,
    dim_w INT DEFAULT 1,
    dim_h INT DEFAULT 1,
    last_maintenance DATE,
    current_downtime_start DATETIME NULL,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    INDEX (tenant_id, status)
);

-- 3. Telemetry & Sustainability
CREATE TABLE sensor_readings (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    machine_id VARCHAR(50),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    temperature DECIMAL(8,2),
    vibration DECIMAL(8,2),
    rpm INT,
    amps DECIMAL(8,2),
    noise_level DECIMAL(8,2),
    FOREIGN KEY (machine_id) REFERENCES machines(id) ON DELETE CASCADE
);

CREATE TABLE energy_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(50),
    machine_id VARCHAR(50),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    kwh_reading DECIMAL(15,4),
    cost_at_time DECIMAL(10,4),
    FOREIGN KEY (tenant_id) REFERENCES tenants(id),
    FOREIGN KEY (machine_id) REFERENCES machines(id)
);

-- 4. Business Operations (CRM/ERP/Procurement)
CREATE TABLE product_skus (
    id VARCHAR(50) PRIMARY KEY,
    tenant_id VARCHAR(50),
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    on_hand INT DEFAULT 0,
    reserved INT DEFAULT 0,
    reorder_point INT DEFAULT 10,
    cost DECIMAL(15,2),
    price DECIMAL(15,2),
    lead_time_days INT,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

CREATE TABLE customers (
    id VARCHAR(50) PRIMARY KEY,
    tenant_id VARCHAR(50),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    segment ENUM('Retail', 'Wholesale', 'Industrial'),
    churn_risk ENUM('Low', 'Medium', 'High') DEFAULT 'Low',
    lifetime_value DECIMAL(15,2) DEFAULT 0,
    last_interaction DATE,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

CREATE TABLE sales_orders (
    id VARCHAR(50) PRIMARY KEY,
    tenant_id VARCHAR(50),
    customer_id VARCHAR(50),
    status ENUM('Pending', 'In Production', 'QA', 'Shipped', 'Delivered') DEFAULT 'Pending',
    total_amount DECIMAL(15,2),
    order_date DATE,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
);

CREATE TABLE raw_materials (
    id VARCHAR(50) PRIMARY KEY,
    tenant_id VARCHAR(50),
    name VARCHAR(255) NOT NULL,
    unit VARCHAR(20),
    current_price DECIMAL(15,2),
    moq INT,
    lead_time_days INT,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

-- 5. Execution & Planning (Work Orders/Calendar)
CREATE TABLE work_orders (
    id VARCHAR(50) PRIMARY KEY,
    tenant_id VARCHAR(50),
    machine_id VARCHAR(50),
    category ENUM('Maintenance', 'Production') NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    priority ENUM('Low', 'Medium', 'High', 'Critical') DEFAULT 'Medium',
    status ENUM('Open', 'In Progress', 'Paused', 'Closed') DEFAULT 'Open',
    start_date DATE,
    end_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (machine_id) REFERENCES machines(id) ON DELETE SET NULL
);

CREATE TABLE calendar_events (
    id VARCHAR(50) PRIMARY KEY,
    tenant_id VARCHAR(50),
    title VARCHAR(255),
    event_date DATE,
    type ENUM('maintenance', 'delivery', 'general', 'logistics'),
    is_approved BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

-- 6. Quality & Intelligence Analysis
CREATE TABLE quality_checks (
    id VARCHAR(50) PRIMARY KEY,
    tenant_id VARCHAR(50),
    sku_id VARCHAR(50),
    check_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    score INT,
    grade CHAR(1),
    status ENUM('Pass', 'Fail', 'Rework'),
    image_url TEXT,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (sku_id) REFERENCES product_skus(id) ON DELETE CASCADE
);

CREATE TABLE simulation_scenarios (
    id VARCHAR(50) PRIMARY KEY,
    tenant_id VARCHAR(50),
    user_id VARCHAR(50),
    name VARCHAR(255),
    params JSON, -- The input sliders
    results JSON, -- The AI output
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 7. Communication, Alerts & Governance
CREATE TABLE chat_messages (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(50),
    sender_id VARCHAR(50),
    recipient_id VARCHAR(50) NULL, -- NULL if channel message
    channel ENUM('General', 'Direction', 'Maintenance', 'Operations') NULL,
    content TEXT NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id),
    FOREIGN KEY (sender_id) REFERENCES users(id)
);

CREATE TABLE alerts (
    id VARCHAR(50) PRIMARY KEY,
    tenant_id VARCHAR(50),
    type ENUM('failure', 'stock', 'price', 'info'),
    message TEXT,
    severity ENUM('info', 'warning', 'critical'),
    is_resolved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

CREATE TABLE audit_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(50),
    user_id VARCHAR(50),
    action VARCHAR(100),
    details TEXT,
    ip_address VARCHAR(45),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

CREATE TABLE financial_metrics (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(50),
    period VARCHAR(20),
    revenue DECIMAL(18,2),
    cogs DECIMAL(18,2),
    operating_expenses DECIMAL(18,2),
    net_profit DECIMAL(18,2),
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

CREATE TABLE documents (
    id VARCHAR(50) PRIMARY KEY,
    tenant_id VARCHAR(50),
    title VARCHAR(255),
    category ENUM('Manual', 'Spec', 'Report', 'Presentation'),
    file_type VARCHAR(10),
    file_size VARCHAR(20),
    upload_date DATE,
    uploaded_by VARCHAR(50),
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

-- Seed Initial Admin
INSERT INTO tenants (id, name, plan_tier, status) VALUES ('enterprise-01', 'Nexus Demo Corp', 'Enterprise', 'Active');
INSERT INTO users (id, tenant_id, name, email, password_hash, role, status) 
VALUES ('u-1', 'enterprise-01', 'Master Admin', 'admin@nexus.ai', '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918', 'master_admin', 'active');
