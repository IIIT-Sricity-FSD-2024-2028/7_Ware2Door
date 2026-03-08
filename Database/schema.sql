-- ======================================
-- CREATE DATABASE
-- ======================================
CREATE DATABASE Ware2Door;
USE Ware2Door;

-- ======================================
-- WAREHOUSE
-- ======================================
CREATE TABLE Warehouse (
    warehouse_id INT AUTO_INCREMENT PRIMARY KEY,
    warehouse_name VARCHAR(100),
    warehouse_address TEXT,
    city VARCHAR(50),
    state VARCHAR(50),
    pincode VARCHAR(10),
    manager_name VARCHAR(100),
    manager_phone VARCHAR(15),
    manager_email VARCHAR(100),
    password VARCHAR(255)
);

-- ======================================
-- TRANSIT HUB
-- ======================================
CREATE TABLE TransitHub (
    hub_id INT AUTO_INCREMENT PRIMARY KEY,
    hub_name VARCHAR(100),
    hub_address TEXT,
    city VARCHAR(50),
    state VARCHAR(50),
    pincode VARCHAR(10),
    manager_name VARCHAR(100),
    manager_phone VARCHAR(15),
    manager_email VARCHAR(100),
    password VARCHAR(255)
);

-- ======================================
-- LOCAL AGENCY
-- ======================================
CREATE TABLE LocalAgency (
    agency_id INT AUTO_INCREMENT PRIMARY KEY,
    agency_name VARCHAR(100),
    agency_address TEXT,
    city VARCHAR(50),
    state VARCHAR(50),
    pincode VARCHAR(10),
    password VARCHAR(255)
);

-- ======================================
-- LOCAL DELIVERY AGENT
-- ======================================
CREATE TABLE Local_Delivery_Agent (
    agent_id INT AUTO_INCREMENT PRIMARY KEY,
    agent_name VARCHAR(100),
    agent_phone VARCHAR(15),
    agent_email VARCHAR(100),
    agency_id INT,
    
    FOREIGN KEY (agency_id)
    REFERENCES LocalAgency(agency_id)
);

-- ======================================
-- ORDERS
-- ======================================
CREATE TABLE Orders (
    order_id INT AUTO_INCREMENT PRIMARY KEY,
    platform_name VARCHAR(100),
    assigned_warehouse_id INT,
    customer_name VARCHAR(100),
    customer_phone VARCHAR(15),
    customer_address TEXT,
    customer_pincode VARCHAR(10),
    order_status VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (assigned_warehouse_id)
    REFERENCES Warehouse(warehouse_id)
);

-- ======================================
-- SHIPMENT
-- ======================================
CREATE TABLE Shipment (
    tracking_id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT,
    origin_warehouse_id INT,
    hub_id INT,
    agency_id INT,
    otp_code VARCHAR(10),
    remarks TEXT,
    issue TEXT,
    edd DATE,
    eta TIME,
    attempts INT DEFAULT 0,

    FOREIGN KEY (order_id)
    REFERENCES Orders(order_id),

    FOREIGN KEY (origin_warehouse_id)
    REFERENCES Warehouse(warehouse_id),

    FOREIGN KEY (hub_id)
    REFERENCES TransitHub(hub_id),

    FOREIGN KEY (agency_id)
    REFERENCES LocalAgency(agency_id)
);

-- ======================================
-- MOVEMENT (WEAK ENTITY)
-- ======================================
CREATE TABLE Movement (
    tracking_id INT,
    timeStamp TIMESTAMP,
    location_code VARCHAR(50),
    latitude DECIMAL(9,6),
    longitude DECIMAL(9,6),

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
    ),

    PRIMARY KEY (tracking_id, timeStamp),

    FOREIGN KEY (tracking_id)
    REFERENCES Shipment(tracking_id)
);
