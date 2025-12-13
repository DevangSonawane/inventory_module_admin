# Inventory Management System - Flow Documentation

**Version:** 1.0  
**Date:** January 2025  
**Flow Diagram:** See [flowchartG.png](./flowchartG.png) for visual representation

---

## Overview

The Inventory Management System follows a **7-phase lifecycle** that tracks inventory from initial setup through purchase, receiving, fulfillment, and final consumption or return. The system handles both **bulk (non-serialized)** and **serialized** items, managing stock across **warehouse locations** and **person-level (technician)** inventories.

### Key Concepts

- **Bulk Items**: Tracked by quantity only (e.g., Fiber Cable, Patch Cords)
- **Serialized Items**: Tracked by unique Serial Number & MAC ID (e.g., Routers, ONUs)
- **Warehouse Stock**: Physical inventory in stock areas (e.g., "Central Stock", "Vagator Office")
- **Person Stock**: Virtual inventory held by technicians/employees, linked to tickets
- **Ticket/Work Order**: External system reference that links consumption to customer installations

---

## System Flow Phases

### Phase 1 & 2: SETUP & BUYING

#### Phase 1: Define Products, Warehouses & Suppliers

**Purpose**: Establish fundamental inventory data before any transactions can occur.

**Activities**:
1. **Define Products (Materials)**
   - Material Name, Product Code, Material Type
   - Properties (e.g., Brand: Nokia/Huawei, Capacity: Dual Band/Single Band)
   - UOM (Unit of Measure)
   - Classification: Bulk vs. Serialized

2. **Define Warehouses (Stock Areas)**
   - Stock Area Name (e.g., "Central Stock", "Vagator Office")
   - Physical Location
   - Store Keeper Assignment (User mapping)

3. **Define Suppliers (Business Partners)**
   - Supplier Name, Contact Details
   - Business Partner Type: Supplier

**Status**: ✅ **FULLY IMPLEMENTED**

---

#### Phase 2: Purchase Request (PR) & Purchase Order (PO)

**Purpose**: Formalize the purchasing process before receiving goods.

**Activities**:
1. **Create Purchase Request (PR)**
   - PR Number, PR Date
   - Requested Items (Material, Quantity)
   - Approval Workflow

2. **Create Purchase Order (PO) with Supplier**
   - Link to approved PR
   - PO Number, PO Date
   - Supplier Selection
   - Items from PR
   - Approval Status

**Status**: ✅ **FULLY IMPLEMENTED**

---

### Phase 3: RECEIVING (WAREHOUSE)

**Purpose**: Record goods received at the warehouse dock and add them to warehouse stock.

**Flow**:
```
Items Arrive at Dock?
    ↓ (Yes)
Create Inward Entry (GRN) Link to PO
    ↓
    ├─→ Bulk Item (e.g., Cable)
    │       ↓
    │   Enter Total Quantity
    │       ↓
    │   → WAREHOUSE STOCK
    │
    └─→ Serialized (e.g., Router)
            ↓
        Scan/Upload Unique Serial & MAC IDs
            ↓
        → WAREHOUSE STOCK
```

**Activities**:
1. **Create Inward Entry (GRN)**
   - Date, Invoice Number
   - Party Name (Supplier)
   - Purchase Order (linked to PO)
   - Stock Area
   - Vehicle Number, Slip Number (auto-generated)
   - Items: Material Selection, Quantity, Serial/MAC IDs

2. **Add to WAREHOUSE STOCK**
   - Items are added to the selected Stock Area
   - Serialized items tracked individually
   - Bulk items tracked by quantity

**Status**: ✅ **FULLY IMPLEMENTED**

---

### Phase 4: TICKETING STRATEGY

**Purpose**: Create work orders/tickets that require inventory fulfillment.

**Flow**:
```
Create Work Order (Ticket, e.g., TKT-55S)
    ↓
Assign to Technician
    ↓
→ Phase 5 & 6 (Fulfillment)
```

**Activities**:
1. **Create Work Order (Ticket)**
   - Ticket Number (e.g., TKT-55S)
   - Customer Information
   - Work Description
   - Status

2. **Assign to Technician**
   - Select Technician (User)
   - Assignment Date
   - Ticket Status: Assigned

**Status**: ✅ **IMPLEMENTED** (with ticket_id linking)

---

### Phase 5 & 6: FULFILLMENT

**Purpose**: Technicians request materials, which are allocated and transferred to them.

**Flow**:
```
Tech Creates Material Request (linked to Ticket)
    ↓
Tech Assesses Requirements for Ticket
    ↓
Store Keeper Allocation
    ↓
Create Stock Transfer to Technician
    ↓
WAREHOUSE STOCK → PERSON STOCK (linked to Ticket)
```

**Activities**:
1. **Tech Creates Material Request (linked to Ticket)**
   - Request Date
   - Ticket ID (from Phase 4)
   - Group, Team
   - From Stock Area
   - Requested Items (Material, Quantity)

2. **Store Keeper Allocation**
   - Review Material Request
   - Select specific Serial Numbers/MAC IDs from available stock
   - Allocate items to request
   - Approve request

3. **Create Stock Transfer to Technician**
   - Link to approved Material Request
   - From: Warehouse Stock Area
   - To: Technician (Person Stock)
   - Transfer allocated items
   - Generate Transfer Slip Number

4. **PERSON STOCK (linked to Ticket)**
   - Items move from WAREHOUSE STOCK to PERSON STOCK
   - Stock is linked to specific Ticket
   - Technician can view their assigned stock

**Status**: ✅ **FULLY IMPLEMENTED**

---

### Phase 7: EXECUTION

**Purpose**: Technician uses materials at customer site or returns unused/faulty items.

**Flow**:
```
Action in Field?
    ├─→ INSTALL AT CUSTOMER (Consumption)
    │       ↓
    │   Open Ticket & Confirm Use of Pre-allocated Item
    │       ↓
    │   CONSUMED (Ticket Closed)
    │
    └─→ UNUSED / FAULTY (Return)
            ↓
        Select Item & Reason for Return
            ↓
        Returns to Warehouse
            ↓
        → WAREHOUSE STOCK
```

#### Path A: INSTALL AT CUSTOMER (Consumption)

**Activities**:
1. **Open Ticket & Confirm Use of Pre-allocated Item**
   - Search by Ticket ID or Serial Number
   - System fetches customer details from external system
   - Technician confirms item installation
   - Record consumption details

2. **CONSUMED (Ticket Closed)**
   - Item removed from PERSON STOCK
   - Status: CONSUMED
   - Ticket marked as closed
   - Consumption record created

**Status**: ✅ **FULLY IMPLEMENTED**

#### Path B: UNUSED / FAULTY (Return)

**Activities**:
1. **Select Item & Reason for Return**
   - Technician selects item from their Person Stock
   - Select reason: UNUSED, FAULTY, CANCELLED
   - Add remarks

2. **Returns to Warehouse**
   - Item moved from PERSON STOCK back to WAREHOUSE STOCK
   - Status updated: FAULTY or AVAILABLE
   - Return record created

**Status**: ✅ **FULLY IMPLEMENTED**

---

## Database Schema Overview

### Core Inventory Tables

| Table | Purpose | Flow Phase |
|-------|---------|-----------|
| `materials` | Product definitions | Phase 1 |
| `stock_areas` | Warehouse locations | Phase 1 |
| `business_partners` | Suppliers | Phase 1 |
| `purchase_requests` | PR header | Phase 2 |
| `purchase_request_items` | PR line items | Phase 2 |
| `purchase_orders` | PO header | Phase 2 |
| `purchase_order_items` | PO line items | Phase 2 |
| `inward_entries` | GRN header | Phase 3 |
| `inward_items` | GRN line items | Phase 3 |
| `material_requests` | MR header | Phase 5 |
| `material_request_items` | MR line items | Phase 5 |
| `material_allocation` | Allocation of serials | Phase 5 |
| `stock_transfers` | Transfer header | Phase 5 |
| `stock_transfer_items` | Transfer line items | Phase 5 |
| `inventory_master` | Current item location | All |
| `consumption_records` | Consumption header | Phase 7 |
| `consumption_items` | Consumption line items | Phase 7 |
| `return_records` | Return header | Phase 7 |
| `return_items` | Return line items | Phase 7 |

---

## Key Features

### ✅ Implemented Features

1. **Materials Management** - Define and manage inventory materials
2. **Stock Areas** - Warehouse and storage location management
3. **Purchase Requests & Orders** - Complete PR/PO workflow
4. **Inward Entry** - Goods receipt with file uploads
5. **Material Requests** - Request materials with approval workflow
6. **Stock Transfers** - Warehouse-to-warehouse and warehouse-to-person transfers
7. **Person Stock** - Track technician/employee inventory
8. **Consumption** - Record material consumption
9. **Returns** - Return stock workflow with approval
10. **Business Partners** - Supplier and vendor management
11. **Reports & Analytics** - Various inventory reports
12. **Audit Trail** - Complete audit logging
13. **File Management** - Document upload and management

---

## Notes for Developers

1. **Serial Number Uniqueness**: Always validate serial numbers are unique across the system
2. **Stock Movement**: Always update `inventory_master` when items move between locations
3. **Transaction Safety**: Use database transactions for all stock movement operations
4. **Audit Trail**: Log all stock movements in `audit_logs` table
5. **External System Integration**: Ticket system integration should be configurable (REST API, webhook, etc.)
6. **Bulk vs Serialized**: Handle both item types correctly - bulk items use quantity, serialized use individual records
7. **Person Stock**: Always link person stock to a ticket for traceability
8. **Return Reasons**: Track return reasons (UNUSED, FAULTY, CANCELLED) for analytics

---

**Document Version**: 1.0  
**Last Updated**: December 2025
