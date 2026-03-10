-- =========================================
-- Ware2Door Logistics Database
-- =========================================

CREATE DATABASE IF NOT EXISTS Ware2Door;
USE Ware2Door;

-- =========================================
-- Warehouse
-- =========================================
CREATE TABLE Warehouse (
    warehouse_id INT PRIMARY KEY,
    warehouse_name VARCHAR(100) NOT NULL,
    warehouse_address TEXT NOT NULL,
    address TEXT NOT NULL,
    latitude DECIMAL(10,6) NOT NULL,
    longitude DECIMAL(10,6) NOT NULL,
    manager_name VARCHAR(100) NOT NULL,
    manager_phone VARCHAR(20) NOT NULL,
    manager_email VARCHAR(100) NOT NULL,
    password VARCHAR(255) NOT NULL
);

-- =========================================
-- Transit Hub
-- =========================================
CREATE TABLE TransitHub (
    hub_id INT PRIMARY KEY,
    hub_name VARCHAR(100) NOT NULL,
    hub_address TEXT NOT NULL,
    latitude DECIMAL(10,6) NOT NULL,
    longitude DECIMAL(10,6) NOT NULL,
    manager_name VARCHAR(100) NOT NULL,
    manager_phone VARCHAR(20) NOT NULL,
    manager_email VARCHAR(100) NOT NULL,
    password VARCHAR(255) NOT NULL
);

-- =========================================
-- Local Agency
-- =========================================
CREATE TABLE LocalAgency (
    agency_id INT PRIMARY KEY,
    agency_name VARCHAR(100) NOT NULL,
    agency_address TEXT NOT NULL,
    latitude DECIMAL(10,6) NOT NULL,
    longitude DECIMAL(10,6) NOT NULL,
    password VARCHAR(255) NOT NULL
);

-- =========================================
-- Delivery Agents
-- =========================================
CREATE TABLE Delivery_Agents (
    agent_id INT PRIMARY KEY,
    agent_name VARCHAR(100) NOT NULL,
    agent_phone VARCHAR(20) NOT NULL,
    agent_email VARCHAR(100) NOT NULL,
    agency_id INT NOT NULL,
    FOREIGN KEY (agency_id) REFERENCES LocalAgency(agency_id)
);

-- =========================================
-- Orders
-- =========================================
CREATE TABLE Orders (
    order_id INT PRIMARY KEY,
    platform_name VARCHAR(100) NOT NULL,
    assigned_warehouse_id INT NOT NULL,
    customer_name VARCHAR(100) NOT NULL,
    customer_phone VARCHAR(20) NOT NULL,
    customer_address TEXT NOT NULL,
    customer_pincode VARCHAR(10) NOT NULL,
    order_status VARCHAR(50) NOT NULL,
    created_at TIMESTAMP NOT NULL,
    priority VARCHAR(20) NOT NULL,
    FOREIGN KEY (assigned_warehouse_id) REFERENCES Warehouse(warehouse_id)
);

-- =========================================
-- Shipments
-- =========================================
CREATE TABLE Shipments (
    tracking_id VARCHAR(50) PRIMARY KEY,
    order_id INT NOT NULL,
    origin_warehouse_id INT NOT NULL,
    hub_id INT NOT NULL,
    agency_id INT NOT NULL,
    otp_code VARCHAR(10) NOT NULL,
    remarks TEXT NOT NULL,
    edd DATE NOT NULL,
    eta TIMESTAMP NULL,
    attempts INT NULL,
    status ENUM(
        'READY_FOR_DISPATCH',
        'DISPATCHED',
        'INSCAN_AT_HUB',
        'OUTSCAN_AT_HUB',
        'INSCAN_AT_LOCAL_AGENCY',
        'OUT_FOR_DELIVERY',
        'DELIVERED',
        'DELIVERY_FAILED',
        'RTO_REQUESTED',
        'RTO_IN_TRANSIT',
        'RTO_RECEIVED_AT_WAREHOUSE'
    ) NOT NULL,
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
    dispatch_time TIMESTAMP NOT NULL,
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
    inscanned_time TIMESTAMP NOT NULL,
    outscanned_time TIMESTAMP NULL,
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
    inscanned_time TIMESTAMP NOT NULL,
    outscanned_time TIMESTAMP NULL,
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
    tracking_id VARCHAR(50) NOT NULL,
    created_date DATE NOT NULL,
    issue_desc TEXT NOT NULL,
    status VARCHAR(50) NOT NULL,
    priority VARCHAR(20) NOT NULL,
    FOREIGN KEY (tracking_id) REFERENCES Shipments(tracking_id)
);

-- =========================================
-- RTO
-- =========================================
CREATE TABLE RTO (
    tracking_id VARCHAR(50) PRIMARY KEY,
    date_of_raised DATE NOT NULL,
    issue TEXT NOT NULL,
    FOREIGN KEY (tracking_id) REFERENCES Shipments(tracking_id)
);
