# Summary of the interaction
## Basic information
    Domain:Logistic & Delivery Operations
    Problem statement: WareHouse to LastMile Coordination Platform
    Date of interaction: 30th Jan 2026
    Mode of interaction: Video call
    Duration (in-minutes): Intial talk which wasnt recorded + this talk is 29 minutes 
    Publicly accessible Video link: https://drive.google.com/file/d/1JEFiAHysEJPFrmSXv-on-htG6Y0GUPks/view?usp=drive_link
## Domain Expert Details
    Role/ designation (Do not include personal or sensitive information): Propreator and Software Operator
    Experience in the domain (Brief description of responsibilities and years of experience in domain): 5 years
    Nature of work: Operational
## Domain Context and Terminology
- How would you describe the overall purpose of this problem statement in your daily work?
- **Ans:** The purpose of this problem statement is to coordinate and track shipments from warehouse initiation to final delivery using a single unified system.
- What are the primary goals or outcomes of this problem statement?
- **Ans:** The primary goals are to ensure end-to-end shipment visibility, accurate scan-based tracking, and efficient coordination between warehouse, transit hubs, delivery agencies, and customers.
- List key terms used by the domain expert and their meanings (Copy these to definition.yml)

| Term | Meaning as explained by the expert |
|---|---|
| Shipment | A package or set of items that is moved through the logistics network from the warehouse to the customer |
| Tracking ID | A unique identifier assigned to a shipment to track its movement and status across the system |
| Warehouse | A facility where shipments are created, packed, and dispatched into the logistics network |
| Transit Hub | An intermediate location where shipments are temporarily stored, sorted, and moved to the next destination |
| In-Scan | The scanning process used to confirm that a shipment has arrived at a specific location |
| Out-Scan | The scanning process used to confirm that a shipment has departed from a specific location |
| RTO (Return To Origin) | A shipment status indicating that the delivery failed and the shipment is being returned to the originating warehouse |
| Estimated Time of Arrival (ETA) | The expected time at which a shipment is predicted to reach the next destination or final delivery point |
| Expected Date of Delivery (EDD) | The planned date on which the shipment is expected to be delivered to the customer |
| Inbound | The movement of shipments entering a warehouse or transit hub |
| Outbound | The movement of shipments leaving a warehouse or transit hub |
| Pre-Alert | An advance notification sent to inform the next handling location about incoming shipments |

## Actors and Responsibilities

| Actor / Role | Responsibilities |
|---|---|
| **Warehouse Admin** | Initiates shipments based on orders received from respective order platforms, validates shipment details, assigns Tracking IDs, manages outbound inventory, and triggers customer notifications through the SMS Gateway. Also handles Return to Origin (RTO) information received from respective order platforms. |
| **Transit Hub Manager** | Manages inventory at transit hubs, performs in-scan when shipments arrive and out-scan when shipments depart, updates shipment movement status, and ensures accurate handover between hubs using pre-alert information. |
| **Local Delivery Agency** | Handles last-mile operations including in-scan and out-scan at local facilities, performs final delivery to customers, updates delivery status, and raises RTO requests when delivery fails due to customer unavailability, address issues, or refusal. |
| **Customer** | Tracks shipments using Tracking ID, views real-time shipment status and estimated delivery date (EDD), receives notifications, and interacts with customer care support for delivery-related issues. |

---

## Core Workflows

### Workflow 1: Shipment Initiation and Dispatch from Warehouse

**Trigger / Start Condition**  
A shipment initiation request is received from a respective order platform.

**Steps Involved**
1. Warehouse Admin logs into the system.
2. Incoming shipment request is validated (order details, address, serviceability).
3. A unique Tracking ID is generated for the shipment.
4. Shipment is added to warehouse outbound inventory.
5. Package is physically prepared and labeled.
6. Shipment status is updated as *Dispatched from Warehouse*.
7. Customer is notified via SMS with Tracking ID and Expected Delivery Date (EDD).

**Outcome / End Condition**  
Shipment leaves the warehouse and is marked ready for transit to the first hub.

---

### Workflow 2: Transit Hub Handling and Movement

**Trigger / Start Condition**  
Shipment arrives at a transit hub from the warehouse .

**Steps Involved**
1. Transit Hub Manager receives pre-alert from the previous node.
2. Shipment physically arrives at the hub.
3. In-scan is performed and inventory is updated as inbound.
4. Shipment is sorted based on destination.
5. Outbound batch is prepared for the local delivery agency.
6. Out-scan is performed.
7. Shipment movement status is updated in the system.

**Outcome / End Condition**  
Shipment successfully leaves the transit hub and moves closer to the destination hub.

---

### Workflow 3: Last-Mile Delivery and Completion / RTO

**Trigger / Start Condition**  
Shipment arrives at the local delivery agency facility.

**Steps Involved**
1. Local Delivery Agency performs in-scan at the local hub.
2. Shipment is assigned to a delivery executive.
3. Delivery attempt is made at the customer address.
4. If delivery succeeds:
   - Delivery is confirmed.
   - Status updated to *Delivered*.
5. If delivery fails:
   - Failure reason is recorded (customer unavailable, address issue, refusal).
   - RTO request is raised.

**Outcome / End Condition**  
Shipment is either successfully delivered or moved into RTO flow.

---

## Rules, Constraints, and Exceptions

### Mandatory Rules or Policies
- Every shipment must have a unique Tracking ID.
- In-scan and out-scan are mandatory at every physical handover point.
- Shipment status must be updated only after a successful scan.
- RTO can be raised only after a multiple failed delivery attempts.

### Constraints or Limitations
- Shipments cannot skip transit hubs without system updates.
- Delivery attempts are limited based on service policy.
- GPS tracking availability depends on delivery partner integration.

### Common Exceptions or Edge Cases
- Shipment reaches a hub without pre-alert.
- Scan mismatch between physical shipment and system record.
- Customer address is partially incorrect or unreachable.
- Delays caused by weather or operational disruptions.

### Situations Where Things Usually Go Wrong
- Missed scans leading to tracking gaps.
- Incorrect hub routing causing delivery delays.
- Late RTO initiation impacting reverse logistics.

---

## Current Challenges and Pain Points

- Maintaining scan accuracy across multiple independent stakeholders.
- Coordination issues between transit hubs and last-mile agencies.
- Handling RTO inventory without causing reconciliation issues.

---

## Assumptions & Clarifications

### Assumptions Confirmed
- Every physical movement of a shipment must be digitally recorded via scans.
- Transit hubs act as temporary sorting and holding points only.
- Customers rely primarily on Tracking ID for shipment visibility.

### Assumptions Corrected
- RTO is a controlled process, not an instant action after first failure.
- Inbound and outbound are node-specific concepts, not global shipment states.
- Pre-alert indicates intent, not confirmation of physical receipt.

### Open Questions Needing Follow-Up
- Number of delivery attempts allowed before automatic RTO.
 



