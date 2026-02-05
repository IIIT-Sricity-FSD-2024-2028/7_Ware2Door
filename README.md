# 📦 Warehouse to Last-Mile Coordination Platform

## Problem Statement

The Warehouse to Last-Mile Coordination Platform is designed to support and coordinate logistics operations from shipment initiation at the warehouse through transit handling and final delivery to the customer.

The system enables different stakeholders—warehouse administrators (external warehouse partners who are given authorized access to the platform and operate shipments directly within the system), transit hub managers, local delivery agencies, and customers—to interact with shipment-related processes such as inventory management, scanning operations, delivery execution, exception handling (RTO), tracking, and customer support within a single platform.

---

## Identified Actors

1. Warehouse Admin  
2. Transit Hub Manager  
3. Local Delivery Agency  
4. Customer  

**External Systems:**
- SMS Gateway System  
- GPS Tracking System  
- LangChain  

---

## Use Cases & Planned Features

### Warehouse Admin

**Use Cases:**
- Shipment Initiation  
- Manage Inventory  
- Handle RTO Requests
 
**Planned Features:**
- Receive shipment initiation requests from respective order platforms 
- Validate and process shipment initiation 
- Trigger shipment notifications via SMS Gateway  
- Manage warehouse inventory related to outgoing shipments and Raise Pre-Alert to Transit Hub
- Receive RTO information from respective order platforms

---

### Transit Hub Manager

**Use Cases:**
- Manage Inventory  
- In/Out Scan Operations  

**Planned Features:**
- Perform in-scan when shipments arrive at the hub  
- Perform out-scan when shipments leave the hub
-  Manage inventory at the transit hub  and Raise Pre-Alert to Local Delivery Agency
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

## External System Integrations

### SMS Gateway System
- Sends notifications during shipment initiation  

### Third-Party Ordering Platform
- Acts as the external source for customer orders and triggers shipment initiation in the system.
- 
### GPS Tracking System
- Provides real-time location data for shipment tracking  

### LangChain
- Enables AI-based customer care support  

---
