-- =========================================
-- Ware2Door Logistics Database
-- =========================================

-- Create Database
CREATE DATABASE IF NOT EXISTS Ware2Door;
USE Ware2Door;

-- =========================================
-- Warehouse
-- =========================================

CREATE TABLE Warehouse (
    warehouse_id INT PRIMARY KEY,
    warehouse_name VARCHAR(100),
    warehouse_address TEXT,
    address TEXT,
    latitude DECIMAL(10,6),
    longitude DECIMAL(10,6),
    manager_name VARCHAR(100),
    manager_phone VARCHAR(20),
    manager_email VARCHAR(100),
    password VARCHAR(255)
);

-- =========================================
-- Transit Hub
-- =========================================

CREATE TABLE TransitHub (
    hub_id INT PRIMARY KEY,
    hub_name VARCHAR(100),
    hub_address TEXT,
    latitude DECIMAL(10,6),
    longitude DECIMAL(10,6),
    manager_name VARCHAR(100),
    manager_phone VARCHAR(20),
    manager_email VARCHAR(100),
    password VARCHAR(255)
);

-- =========================================
-- Local Agency
-- =========================================

CREATE TABLE LocalAgency (
    agency_id INT PRIMARY KEY,
    agency_name VARCHAR(100),
    agency_address TEXT,
    latitude DECIMAL(10,6),
    longitude DECIMAL(10,6),
    password VARCHAR(255)
);

-- =========================================
-- Delivery Agents
-- =========================================

CREATE TABLE Delivery_Agents (
    agent_id INT PRIMARY KEY,
    agent_name VARCHAR(100),
    agent_phone VARCHAR(20),
    agent_email VARCHAR(100),
    agency_id INT,
    FOREIGN KEY (agency_id) REFERENCES LocalAgency(agency_id)
);

-- =========================================
-- Orders
-- =========================================

CREATE TABLE Orders (
    order_id INT PRIMARY KEY,
    platform_name VARCHAR(100),
    assigned_warehouse_id INT,
    customer_name VARCHAR(100),
    customer_phone VARCHAR(20),
    customer_address TEXT,
    customer_pincode VARCHAR(10),
    order_status VARCHAR(50),
    created_at TIMESTAMP,
    priority VARCHAR(20),
    FOREIGN KEY (assigned_warehouse_id) REFERENCES Warehouse(warehouse_id)
);

-- =========================================
-- Shipments
-- =========================================

CREATE TABLE Shipments (
    tracking_id VARCHAR(50) PRIMARY KEY,
    order_id INT,
    origin_warehouse_id INT,
    hub_id INT,
    agency_id INT,
    otp_code VARCHAR(10),
    remarks TEXT,
    edd DATE,
    edta TIMESTAMP,
    attempts INT,
    status VARCHAR(50),
    count INT,
    FOREIGN KEY (order_id) REFERENCES Orders(order_id),
    FOREIGN KEY (origin_warehouse_id) REFERENCES Warehouse(warehouse_id),
    FOREIGN KEY (hub_id) REFERENCES TransitHub(hub_id),
    FOREIGN KEY (agency_id) REFERENCES LocalAgency(agency_id)
);

-- =========================================
-- Warehouse Inventory
-- =========================================

CREATE TABLE Warehouse_Inventory (
    warehouse_id INT,
    tracking_id VARCHAR(50),
    outscanned_time TIMESTAMP,
    PRIMARY KEY (warehouse_id, tracking_id),
    FOREIGN KEY (warehouse_id) REFERENCES Warehouse(warehouse_id),
    FOREIGN KEY (tracking_id) REFERENCES Shipments(tracking_id)
);

-- =========================================
-- Transit Inventory
-- =========================================

CREATE TABLE Transit_Inventory (
    hub_id INT,
    tracking_id VARCHAR(50),
    inscanned_time TIMESTAMP,
    outscanned_time TIMESTAMP,
    PRIMARY KEY (hub_id, tracking_id),
    FOREIGN KEY (hub_id) REFERENCES TransitHub(hub_id),
    FOREIGN KEY (tracking_id) REFERENCES Shipments(tracking_id)
);

-- =========================================
-- Local Agency Inventory
-- =========================================

CREATE TABLE LocalAgency_Inventory (
    agency_id INT,
    tracking_id VARCHAR(50),
    inscanned_time TIMESTAMP,
    outscanned_time TIMESTAMP,
    PRIMARY KEY (agency_id, tracking_id),
    FOREIGN KEY (agency_id) REFERENCES LocalAgency(agency_id),
    FOREIGN KEY (tracking_id) REFERENCES Shipments(tracking_id)
);

-- =========================================
-- Assigned Shipments
-- =========================================

CREATE TABLE Assigned_Shipments (
    agent_id INT,
    tracking_id VARCHAR(50),
    PRIMARY KEY (agent_id, tracking_id),
    FOREIGN KEY (agent_id) REFERENCES Delivery_Agents(agent_id),
    FOREIGN KEY (tracking_id) REFERENCES Shipments(tracking_id)
);

-- =========================================
-- Tickets
-- =========================================

CREATE TABLE Tickets (
    ticket_id INT PRIMARY KEY,
    tracking_id VARCHAR(50),
    created_date DATE,
    issue_desc TEXT,
    status VARCHAR(50),
    priority VARCHAR(20),
    FOREIGN KEY (tracking_id) REFERENCES Shipments(tracking_id)
);

-- =========================================
-- RTO
-- =========================================

CREATE TABLE RTO (
    tracking_id VARCHAR(50) PRIMARY KEY,
    date_of_raised DATE,
    issue TEXT,
    FOREIGN KEY (tracking_id) REFERENCES Shipments(tracking_id)
);
