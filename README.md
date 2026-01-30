# 📦 Warehouse to Last-Mile Coordination Platform

## 1)Problem Statement

The **Warehouse to Last-Mile Coordination Platform** is designed to support and coordinate logistics operations from shipment initiation at the warehouse through transit handling and final delivery to the customer.

The system enables different stakeholders—warehouse administrators, transit hub managers, local delivery agencies, and customers—to interact with shipment-related processes such as inventory management, scanning operations, delivery execution, exception handling (RTO), tracking, and customer support within a single platform.

---

## 2) Identified Actors

1. Warehouse Admin  
2. Transit Hub Manager  
3. Local Delivery Agency  
4. Customer  

**External Systems:**
- SMS Gateway System  
- GPS Tracking System  
- LangChain  

---

## 3) Use Cases & Planned Features

### Warehouse Admin

**Use Cases:**
- Shipment Initiation  
- Manage Inventory  

**Planned Features:**
- Initiate shipments in the system  
- Trigger shipment notifications via SMS Gateway  
- Manage warehouse inventory related to outgoing shipments  
- Ensure inventory availability before dispatch  

---

### Transit Hub Manager

**Use Cases:**
- Manage Inventory  
- In/Out Scan Operations  

**Planned Features:**
- Manage inventory at the transit hub  
- Perform in-scan when shipments arrive at the hub  
- Perform out-scan when shipments leave the hub  
- Update shipment movement status during transit  

---

### Local Delivery Agency

**Use Cases:**
- In/Out Scan Operations  
- Delivery Shipments  
- Raise RTO Requests *(extends Delivery Shipments)*  

**Planned Features:**
- Perform scanning operations during last-mile handling  
- Deliver shipments to customers  
- Update delivery status  
- Raise Return to Origin (RTO) requests in case of delivery failure  

---

### Customer

**Use Cases:**
- Track Shipments  
- Customer Care Support  

**Planned Features:**
- Track shipment location using GPS Tracking  
- View real-time shipment status  
- Access customer care support through LangChain  
- Receive assistance related to shipment issues  

---

## 🔗 External System Integrations

### SMS Gateway System
- Sends notifications during shipment initiation  

### GPS Tracking System
- Provides real-time location data for shipment tracking  

### LangChain
- Enables AI-based customer care support  

---
