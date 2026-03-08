-- Create Database
CREATE DATABASE Ware2Door;

-- Use Database
USE Ware2Door;

----------------------------------------------------
-- 1. Warehouse Table
----------------------------------------------------
CREATE TABLE Warehouse (
    warehouse_id INT PRIMARY KEY,
    warehouse_name VARCHAR(100),
    warehouse_address TEXT,
    city VARCHAR(50),
    state VARCHAR(50),
    pincode VARCHAR(10),
    manager_name VARCHAR(100),
    manager_phone VARCHAR(15),
    manager_email VARCHAR(100)
);

----------------------------------------------------
-- 2. TransitHub Table
----------------------------------------------------
CREATE TABLE TransitHub (
    hub_id INT PRIMARY KEY,
    hub_name VARCHAR(100),
    hub_address TEXT,
    city VARCHAR(50),
    state VARCHAR(50),
    pincode VARCHAR(10),
    manager_name VARCHAR(100),
    manager_phone VARCHAR(15),
    manager_email VARCHAR(100)
);

----------------------------------------------------
-- 3. LocalAgency Table
----------------------------------------------------
CREATE TABLE LocalAgency (
    agency_id INT PRIMARY KEY,
    agency_name VARCHAR(100),
    agency_address TEXT,
    city VARCHAR(50),
    state VARCHAR(50),
    pincode VARCHAR(10)
);

----------------------------------------------------
-- 4. Local Delivery Agent Table
----------------------------------------------------
CREATE TABLE Local_Delivery_Agent (
    agent_id INT PRIMARY KEY,
    agent_name VARCHAR(100),
    agent_phone VARCHAR(15),
    agent_email VARCHAR(100),
    agency_id INT,
    FOREIGN KEY (agency_id) REFERENCES LocalAgency(agency_id)
);

----------------------------------------------------
-- 5. Orders Table
----------------------------------------------------
CREATE TABLE Orders (
    order_id INT PRIMARY KEY,
    platform_name VARCHAR(100),
    assigned_warehouse_id INT,
    customer_name VARCHAR(100),
    customer_phone VARCHAR(15),
    customer_address TEXT,
    customer_pincode VARCHAR(10),
    order_status VARCHAR(50),
    created_at TIMESTAMP,
    FOREIGN KEY (assigned_warehouse_id) REFERENCES Warehouse(warehouse_id)
);

----------------------------------------------------
-- 6. Shipment Table
----------------------------------------------------
CREATE TABLE Shipment (
    tracking_id INT PRIMARY KEY,
    order_id INT,
    origin_warehouse_id INT,
    hub_id INT,
    agency_id INT,
    otp_code VARCHAR(10),
    remarks TEXT,
    issue TEXT,
    
    FOREIGN KEY (order_id) REFERENCES Orders(order_id),
    FOREIGN KEY (origin_warehouse_id) REFERENCES Warehouse(warehouse_id),
    FOREIGN KEY (hub_id) REFERENCES TransitHub(hub_id),
    FOREIGN KEY (agency_id) REFERENCES LocalAgency(agency_id)
);

----------------------------------------------------
-- 7. Movement Table (Weak Entity)
----------------------------------------------------
CREATE TABLE Movement (
    tracking_id INT,
    timeStamp TIMESTAMP,
    location_code VARCHAR(50),
    latitude DECIMAL(9,6),
    longitude DECIMAL(9,6),
    status VARCHAR(50),

    PRIMARY KEY (tracking_id, timeStamp),

    FOREIGN KEY (tracking_id) REFERENCES Shipment(tracking_id)
);
