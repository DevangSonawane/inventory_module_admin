# Inventory Management System - Flow Documentation

**Version:** 1.0  
**Date:** December 2025  
**Based on:** flowchartG.png

---

## Table of Contents

1. [Overview](#overview)
2. [System Flow Phases](#system-flow-phases)
3. [Current Implementation Status](#current-implementation-status)
4. [Database Schema Mapping](#database-schema-mapping)
5. [API Endpoints by Phase](#api-endpoints-by-phase)
6. [Missing Features & Gaps](#missing-features--gaps)
7. [Implementation Guidelines](#implementation-guidelines)

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

**Current Implementation Status**: ✅ **FULLY IMPLEMENTED**
- ✅ Materials Management (`materials` table)
- ✅ Stock Areas Management (`stock_areas` table)
- ✅ Business Partners (fully integrated with Purchase Orders and Inward Entries)
- ✅ Store Keeper mapping to Stock Areas (store_keeper_id field added, UI implemented)
- ⚠️ Material Properties (basic properties field exists; dynamic attributes system optional enhancement)

**Database Tables**:
- `materials` - Product definitions
- `stock_areas` - Warehouse locations
- `business_partners` - Supplier information
- `users` - Store Keeper assignments

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

**Current Implementation Status**: ✅ **FULLY IMPLEMENTED**
- ✅ Purchase Request table exists (`purchase_requests`)
- ✅ Purchase Order table exists (`purchase_orders`)
- ✅ PR → PO workflow (create PO from approved PR implemented)
- ✅ PO linking in Inward Entry (fully integrated in UI)
- ✅ PR/PO approval workflow (approve/reject PR, PO status transitions: DRAFT → SENT → RECEIVED)

**Database Tables**:
- `purchase_requests` - PR header
- `purchase_request_items` - PR line items
- `purchase_orders` - PO header
- `purchase_order_items` - PO line items

**API Endpoints Needed**:
- `POST /api/v1/inventory/purchase-requests` - Create PR
- `GET /api/v1/inventory/purchase-requests` - List PRs
- `POST /api/v1/inventory/purchase-orders` - Create PO from PR
- `GET /api/v1/inventory/purchase-orders` - List POs

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
1. **Decision: Items Arrive at Dock?**
   - Physical verification of received goods

2. **Create Inward Entry (GRN)**
   - **Header Fields**:
     - Date, Invoice Number
     - Party Name (Supplier) - Dropdown
     - Purchase Order - Dropdown (linked to PO)
     - Stock Area - Dropdown
     - Vehicle Number, Slip Number (auto-generated)
   - **Items**:
     - Material Selection
     - For **Bulk Items**: Enter Total Quantity
     - For **Serialized Items**: Scan/Upload Serial & MAC IDs (Excel upload supported)
     - Price, Quantity, UOM

3. **Add to WAREHOUSE STOCK**
   - Items are added to the selected Stock Area
   - Serialized items tracked individually
   - Bulk items tracked by quantity

**Current Implementation Status**: ✅ **FULLY IMPLEMENTED**
- ✅ Inward Entry creation (`inward_entries` table)
- ✅ Inward Items with Serial/MAC support (`inward_items` table)
- ✅ PO linking field (`purchase_order` field in `inward_entries`)
- ✅ Stock Area assignment
- ✅ Excel upload for serialized items (frontend support)
- ⚠️ PO item pre-population in UI (needs implementation)

**Database Tables**:
- `inward_entries` - GRN header
- `inward_items` - GRN line items (with `serial_number`, `mac_id`)

**API Endpoints**:
- ✅ `POST /api/v1/inventory/inward` - Create inward entry
- ✅ `GET /api/v1/inventory/inward` - List inward entries
- ✅ `GET /api/v1/inventory/inward/:id` - Get inward entry details

**Frontend Pages**:
- ✅ `AddInward.jsx` - Create inward entry
- ✅ `InwardList.jsx` - View inward entries

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

**Current Implementation Status**: ❌ **NOT IMPLEMENTED**
- ❌ Work Order/Ticket system (external system integration needed)
- ❌ Ticket creation API
- ❌ Ticket assignment workflow
- ⚠️ Material Request has `pr_numbers` but no `ticket_id` field

**Required Implementation**:
- Add `ticket_id` or `work_order_id` field to `material_requests` table
- Create ticket/work order integration API
- Link Material Requests to Tickets in UI

**Database Schema Needed**:
```sql
ALTER TABLE material_requests 
ADD COLUMN ticket_id VARCHAR(100) NULL COMMENT 'External system ticket/work order ID (e.g., TKT-55S)',
ADD COLUMN ticket_status VARCHAR(50) NULL COMMENT 'Ticket status from external system';
```

---

### Phase 5 & 6: FULFILLMENT

**Purpose**: Technicians request materials, which are allocated and transferred to them.

**Flow**:
```
Tech Creates Material Request (linked to Ticket)
    ↓
Tech Assesses Requirements for Ticket
    ↓
Create Stock Transfer to Technician
    ↓
WAREHOUSE STOCK → PERSON STOCK (linked to Ticket)
```

**Activities**:
1. **Tech Creates Material Request (linked to Ticket)**
   - **Header**:
     - Request Date
     - Ticket ID (from Phase 4)
     - Group, Team
     - From Stock Area
     - Requested Items (Material, Quantity)

2. **Tech Assesses Requirements for Ticket**
   - Review ticket requirements
   - Determine needed materials
   - Submit Material Request

3. **Store Keeper Allocation** (Not shown in flowchart, but required)
   - Review Material Request
   - Select specific Serial Numbers/MAC IDs from available stock
   - Allocate items to request
   - Approve request

4. **Create Stock Transfer to Technician**
   - Link to approved Material Request
   - From: Warehouse Stock Area
   - To: Technician (Person Stock)
   - Transfer allocated items
   - Generate Transfer Slip Number

5. **PERSON STOCK (linked to Ticket)**
   - Items move from WAREHOUSE STOCK to PERSON STOCK
   - Stock is linked to specific Ticket
   - Technician can view their assigned stock

**Current Implementation Status**: ✅ **MOSTLY IMPLEMENTED**
- ✅ Material Request creation (`material_requests` table)
- ✅ Material Request Items (`material_request_items` table)
- ✅ Stock Transfer creation (`stock_transfers` table)
- ✅ Stock Transfer Items (`stock_transfer_items` table)
- ✅ Material Request → Stock Transfer linking (`material_request_id` in `stock_transfers`)
- ⚠️ Ticket linking (needs `ticket_id` field)
- ⚠️ Material Allocation workflow (needs `material_allocation` table)
- ⚠️ Person Stock tracking (needs implementation)
- ⚠️ Stock Area → Person transfer (currently supports Stock Area → Stock Area)

**Database Tables**:
- ✅ `material_requests` - MR header
- ✅ `material_request_items` - MR line items
- ✅ `stock_transfers` - Transfer header
- ✅ `stock_transfer_items` - Transfer line items
- ⚠️ `material_allocation` - Allocation of specific serials to MR (needs implementation)
- ⚠️ `inventory_master` - Current location of each item (needs implementation)

**API Endpoints**:
- ✅ `POST /api/v1/inventory/material-request` - Create MR
- ✅ `GET /api/v1/inventory/material-request` - List MRs
- ✅ `POST /api/v1/inventory/stock-transfer` - Create transfer
- ✅ `GET /api/v1/inventory/stock-transfer` - List transfers
- ⚠️ `POST /api/v1/inventory/material-request/:id/allocate` - Allocate items (needs implementation)
- ⚠️ `GET /api/v1/inventory/person-stock` - Get technician stock (needs implementation)

**Frontend Pages**:
- ✅ `MaterialRequest.jsx` - Create material request
- ✅ `MaterialRequestDetails.jsx` - View MR details
- ✅ `StockTransfer.jsx` - Create stock transfer
- ✅ `StockTransferList.jsx` - View transfers

**Missing Features**:
1. **Material Allocation Screen**: Store Keeper selects specific serial numbers for MR
2. **Person Stock View**: Technician can see their assigned stock per ticket
3. **Ticket Integration**: Link MR and Stock Transfer to tickets

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

**Current Implementation Status**: ✅ **PARTIALLY IMPLEMENTED**
- ✅ Consumption Record creation (`consumption_records` table)
- ✅ Consumption Items (`consumption_items` table)
- ✅ External System Ref ID field (for ticket linking)
- ✅ Customer data storage
- ⚠️ Ticket status update (external system integration needed)
- ⚠️ Serial number search/validation from Person Stock
- ⚠️ Automatic Person Stock deduction (needs implementation)

**Database Tables**:
- ✅ `consumption_records` - Consumption header
- ✅ `consumption_items` - Consumption line items

**API Endpoints**:
- ✅ `POST /api/v1/inventory/consumption` - Record consumption
- ✅ `GET /api/v1/inventory/consumption` - List consumptions
- ⚠️ `GET /api/v1/inventory/consumption/search?serial=XXX` - Search by serial (needs implementation)

**Frontend Pages**:
- ✅ `RecordConsumption.jsx` - Record consumption
- ✅ `RecordConsumptionList.jsx` - View consumptions

**Missing Features**:
1. **Serial Number Validation**: Verify serial is in technician's Person Stock
2. **Automatic Stock Deduction**: Remove item from Person Stock on consumption
3. **Ticket Status Update**: Update external ticket system on consumption

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

**Current Implementation Status**: ❌ **NOT IMPLEMENTED**
- ❌ Return workflow
- ❌ Return record table
- ❌ Person Stock → Warehouse Stock return transfer
- ❌ Item status management (FAULTY, AVAILABLE)

**Required Implementation**:
1. **Database Schema**:
```sql
CREATE TABLE return_records (
  return_id UUID PRIMARY KEY,
  consumption_id UUID NULL COMMENT 'Link to original consumption if applicable',
  ticket_id VARCHAR(100) NULL,
  technician_id INT NOT NULL,
  return_date DATE NOT NULL,
  reason ENUM('UNUSED', 'FAULTY', 'CANCELLED') NOT NULL,
  remarks TEXT NULL,
  status ENUM('PENDING', 'APPROVED', 'REJECTED') DEFAULT 'PENDING',
  org_id UUID NULL,
  created_by INT NULL,
  updated_by INT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE return_items (
  item_id UUID PRIMARY KEY,
  return_id UUID NOT NULL,
  material_id UUID NOT NULL,
  serial_number VARCHAR(100) NULL,
  mac_id VARCHAR(100) NULL,
  quantity INT NOT NULL DEFAULT 1,
  remarks TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (return_id) REFERENCES return_records(return_id) ON DELETE CASCADE,
  FOREIGN KEY (material_id) REFERENCES materials(material_id)
);
```

2. **API Endpoints Needed**:
- `POST /api/v1/inventory/returns` - Create return record
- `GET /api/v1/inventory/returns` - List returns
- `PUT /api/v1/inventory/returns/:id/approve` - Approve return
- `POST /api/v1/inventory/returns/:id/transfer` - Transfer returned items to warehouse

3. **Frontend Pages Needed**:
- `ReturnStock.jsx` - Create return record
- `ReturnStockList.jsx` - View returns

---

## Current Implementation Status

### ✅ Fully Implemented
1. **Phase 3: Receiving (Warehouse)**
   - Inward Entry creation
   - Serial/MAC ID support
   - Stock Area assignment
   - Excel upload for bulk serialized items

2. **Phase 5 & 6: Fulfillment (Partial)**
   - Material Request creation
   - Stock Transfer creation
   - Material Request → Stock Transfer linking

3. **Phase 7: Consumption (Partial)**
   - Consumption record creation
   - External System Ref ID support
   - Customer data storage

### ✅ Fully Implemented
1. **Phase 1 & 2: Setup & Buying**
   - ✅ Materials, Stock Areas fully functional
   - ✅ Business Partners fully integrated
   - ✅ PR/PO workflow complete with approval and status transitions

2. **Phase 3: Receiving**
   - ✅ Inward Entry with PO linking
   - ✅ Bulk import via CSV
   - ✅ Inventory Master tracking

3. **Phase 4: Ticketing Strategy**
   - ✅ Material Requests with ticket_id linking
   - ✅ Ticket status tracking

4. **Phase 5 & 6: Fulfillment**
   - ✅ Material Allocation workflow
   - ✅ Person Stock tracking
   - ✅ Stock Transfer (Warehouse ↔ Person)
   - ✅ Serial number search in consumption

5. **Phase 7: Consumption & Returns**
   - ✅ Consumption recording with serial validation
   - ✅ Return workflow with approval/rejection
   - ✅ Person Stock → Warehouse Stock return

### ⚠️ Optional Enhancements (Nice to Have)
1. **Material Properties**: Dynamic attributes system (basic properties field exists)
2. **Email/SMS Notifications**: Integration with notification service
3. **Advanced Reporting**: Enhanced analytics and reporting features

---

## Database Schema Mapping

### Core Inventory Tables

| Table | Purpose | Flow Phase | Status |
|-------|---------|-----------|--------|
| `materials` | Product definitions | Phase 1 | ✅ |
| `stock_areas` | Warehouse locations | Phase 1 | ✅ |
| `business_partners` | Suppliers | Phase 1 | ⚠️ |
| `purchase_requests` | PR header | Phase 2 | ⚠️ |
| `purchase_request_items` | PR line items | Phase 2 | ⚠️ |
| `purchase_orders` | PO header | Phase 2 | ⚠️ |
| `purchase_order_items` | PO line items | Phase 2 | ⚠️ |
| `inward_entries` | GRN header | Phase 3 | ✅ |
| `inward_items` | GRN line items | Phase 3 | ✅ |
| `material_requests` | MR header | Phase 5 | ✅ |
| `material_request_items` | MR line items | Phase 5 | ✅ |
| `material_allocation` | Allocation of serials | Phase 5 | ❌ |
| `stock_transfers` | Transfer header | Phase 5 | ✅ |
| `stock_transfer_items` | Transfer line items | Phase 5 | ✅ |
| `inventory_master` | Current item location | All | ❌ |
| `consumption_records` | Consumption header | Phase 7 | ✅ |
| `consumption_items` | Consumption line items | Phase 7 | ✅ |
| `return_records` | Return header | Phase 7 | ❌ |
| `return_items` | Return line items | Phase 7 | ❌ |

### Supporting Tables

| Table | Purpose | Status |
|-------|---------|--------|
| `users` | Store Keepers, Technicians | ✅ |
| `groups` | Technician groups | ⚠️ |
| `teams` | Technician teams | ⚠️ |
| `audit_logs` | System audit trail | ✅ |
| `notifications` | System notifications | ✅ |

---

## API Endpoints by Phase

### Phase 1 & 2: Setup & Buying

**Materials**:
- ✅ `GET /api/v1/inventory/materials` - List materials
- ✅ `POST /api/v1/inventory/materials` - Create material
- ✅ `PUT /api/v1/inventory/materials/:id` - Update material

**Stock Areas**:
- ✅ `GET /api/v1/inventory/stock-areas` - List stock areas
- ✅ `POST /api/v1/inventory/stock-areas` - Create stock area

**Business Partners**:
- ⚠️ `GET /api/v1/inventory/business-partners` - List partners (needs implementation)
- ⚠️ `POST /api/v1/inventory/business-partners` - Create partner (needs implementation)

**Purchase Requests**:
- ❌ `POST /api/v1/inventory/purchase-requests` - Create PR (needs implementation)
- ❌ `GET /api/v1/inventory/purchase-requests` - List PRs (needs implementation)

**Purchase Orders**:
- ❌ `POST /api/v1/inventory/purchase-orders` - Create PO (needs implementation)
- ❌ `GET /api/v1/inventory/purchase-orders` - List POs (needs implementation)

### Phase 3: Receiving

- ✅ `POST /api/v1/inventory/inward` - Create inward entry
- ✅ `GET /api/v1/inventory/inward` - List inward entries
- ✅ `GET /api/v1/inventory/inward/:id` - Get inward entry details
- ✅ `PUT /api/v1/inventory/inward/:id` - Update inward entry

### Phase 4: Ticketing

- ❌ `POST /api/v1/inventory/tickets` - Create ticket (needs implementation)
- ❌ `GET /api/v1/inventory/tickets` - List tickets (needs implementation)
- ❌ `PUT /api/v1/inventory/tickets/:id/assign` - Assign ticket (needs implementation)

### Phase 5 & 6: Fulfillment

- ✅ `POST /api/v1/inventory/material-request` - Create MR
- ✅ `GET /api/v1/inventory/material-request` - List MRs
- ✅ `GET /api/v1/inventory/material-request/:id` - Get MR details
- ⚠️ `POST /api/v1/inventory/material-request/:id/allocate` - Allocate items (needs implementation)
- ✅ `POST /api/v1/inventory/stock-transfer` - Create transfer
- ✅ `GET /api/v1/inventory/stock-transfer` - List transfers
- ⚠️ `GET /api/v1/inventory/person-stock` - Get technician stock (needs implementation)

### Phase 7: Execution

**Consumption**:
- ✅ `POST /api/v1/inventory/consumption` - Record consumption
- ✅ `GET /api/v1/inventory/consumption` - List consumptions
- ⚠️ `GET /api/v1/inventory/consumption/search?serial=XXX` - Search by serial (needs implementation)

**Returns**:
- ❌ `POST /api/v1/inventory/returns` - Create return (needs implementation)
- ❌ `GET /api/v1/inventory/returns` - List returns (needs implementation)
- ❌ `PUT /api/v1/inventory/returns/:id/approve` - Approve return (needs implementation)

---

## Missing Features & Gaps

### Current Gaps (post-implementation review)

1. **Ticket/Work Order Integration (External)**  
   - Ticket fields exist on requests/transfers/consumption, but external system sync is still optional.

2. **Advanced UX/Validation**  
   - Allocation UI exists and enforces quantity caps; remaining polish: clearer remaining counts and bulk-select safety.
   - Consumption validates serials against technician stock on UI and backend; autocomplete/search improvements remain optional.

3. **Return Workflow Enhancements**  
   - Return flow implemented; add richer status transitions/notifications as desired.

### Medium Priority Enhancements

1. **PO item pre-population in Inward Entry** (optional UX).
2. **Store Keeper mapping & approval restriction** (policy enforcement).
3. **Material Properties dynamic attributes** (nice-to-have).
4. **Autocomplete for serial selection in consumption**.
5. **Notifications/advanced reporting** (optional).

---

## Implementation Guidelines

### Priority 1: Core Inventory Tracking

1. **Create `inventory_master` Table**
```sql
CREATE TABLE inventory_master (
  id UUID PRIMARY KEY DEFAULT (UUID()),
  material_id UUID NOT NULL,
  serial_number VARCHAR(100) NULL UNIQUE,
  mac_id VARCHAR(100) NULL UNIQUE,
  current_location_type ENUM('WAREHOUSE', 'PERSON', 'CONSUMED') NOT NULL,
  location_id VARCHAR(255) NOT NULL COMMENT 'Stock Area ID or User ID',
  ticket_id VARCHAR(100) NULL COMMENT 'Linked ticket if in PERSON stock',
  status ENUM('AVAILABLE', 'ALLOCATED', 'IN_TRANSIT', 'CONSUMED', 'FAULTY') DEFAULT 'AVAILABLE',
  inward_id UUID NULL COMMENT 'Original inward entry',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (material_id) REFERENCES materials(material_id),
  INDEX idx_serial (serial_number),
  INDEX idx_location (current_location_type, location_id),
  INDEX idx_ticket (ticket_id)
);
```

2. **Update Inward Entry to Create Inventory Master Records**
   - On inward entry creation, create `inventory_master` records
   - For serialized items: one record per serial
   - For bulk items: one record with quantity

3. **Update Stock Transfer to Update Inventory Master**
   - On transfer completion, update `current_location_type` and `location_id`
   - Move items from WAREHOUSE to PERSON

4. **Update Consumption to Update Inventory Master**
   - On consumption, update status to CONSUMED
   - Update `current_location_type` to CONSUMED

### Priority 2: Material Allocation

1. **Create `material_allocation` Table**
```sql
CREATE TABLE material_allocation (
  allocation_id UUID PRIMARY KEY DEFAULT (UUID()),
  material_request_id UUID NOT NULL,
  inventory_master_id UUID NOT NULL COMMENT 'Specific item allocated',
  allocated_quantity INT NOT NULL DEFAULT 1,
  allocated_by INT NOT NULL COMMENT 'Store Keeper user ID',
  allocation_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status ENUM('PENDING', 'TRANSFERRED', 'CANCELLED') DEFAULT 'PENDING',
  FOREIGN KEY (material_request_id) REFERENCES material_requests(request_id),
  FOREIGN KEY (inventory_master_id) REFERENCES inventory_master(id),
  FOREIGN KEY (allocated_by) REFERENCES users(id)
);
```

2. **Create Allocation API Endpoint**
   - `POST /api/v1/inventory/material-request/:id/allocate`
   - Store Keeper selects serial numbers from available stock
   - Create allocation records

3. **Update Stock Transfer to Use Allocations**
   - Pre-fill transfer items from allocations
   - Mark allocations as TRANSFERRED

### Priority 3: Person Stock View

1. **Create Person Stock API**
   - `GET /api/v1/inventory/person-stock?userId=XXX&ticketId=XXX`
   - Query `inventory_master` where `current_location_type = 'PERSON'` and `location_id = userId`
   - Filter by `ticket_id` if provided

2. **Create Frontend Page**
   - `PersonStock.jsx` - View technician's assigned stock
   - Group by ticket
   - Show serial numbers, materials

### Priority 4: Ticket Integration

1. **Add Ticket Fields**
```sql
ALTER TABLE material_requests 
ADD COLUMN ticket_id VARCHAR(100) NULL,
ADD COLUMN ticket_status VARCHAR(50) NULL;

ALTER TABLE stock_transfers
ADD COLUMN ticket_id VARCHAR(100) NULL;

ALTER TABLE consumption_records
ADD COLUMN ticket_id VARCHAR(100) NULL;
```

2. **Create Ticket Integration API**
   - `GET /api/v1/inventory/tickets/:id` - Fetch ticket details from external system
   - `PUT /api/v1/inventory/tickets/:id/status` - Update ticket status

### Priority 5: Return Workflow

1. **Create Return Tables** (see Phase 7: Returns section)

2. **Create Return API Endpoints**
   - `POST /api/v1/inventory/returns` - Create return record
   - `GET /api/v1/inventory/returns` - List returns
   - `PUT /api/v1/inventory/returns/:id/approve` - Approve return
   - `POST /api/v1/inventory/returns/:id/transfer` - Transfer to warehouse

3. **Update Inventory Master on Return**
   - Change `current_location_type` from PERSON to WAREHOUSE
   - Update `status` to FAULTY or AVAILABLE based on reason

---

## Frontend Implementation Checklist

### Phase 1 & 2: Setup
- [ ] Business Partners management page
- [ ] Store Keeper assignment to Stock Areas
- [ ] Material Properties dynamic attributes
- [ ] Purchase Request creation page
- [ ] Purchase Order creation page
- [ ] PR → PO approval workflow

### Phase 3: Receiving
- [x] Inward Entry creation
- [ ] PO item pre-population in Inward Entry
- [x] Excel upload for serialized items

### Phase 4: Ticketing
- [ ] Work Order/Ticket creation page
- [ ] Ticket assignment to technician
- [ ] Ticket status management

### Phase 5 & 6: Fulfillment
- [x] Material Request creation
- [ ] Material Allocation page (Store Keeper)
- [x] Stock Transfer creation
- [ ] Person Stock view page
- [ ] Ticket linking in MR and Transfer

### Phase 7: Execution
- [x] Consumption recording
- [ ] Serial number validation from Person Stock
- [ ] Return Stock page
- [ ] Return approval workflow
- [ ] Return transfer to warehouse

---

## Testing Checklist

### Phase 3: Receiving
- [ ] Create inward entry with bulk items
- [ ] Create inward entry with serialized items
- [ ] Upload Excel with serial numbers
- [ ] Verify items added to warehouse stock
- [ ] Link inward entry to PO

### Phase 5 & 6: Fulfillment
- [ ] Create material request linked to ticket
- [ ] Store Keeper allocates specific serial numbers
- [ ] Create stock transfer from allocation
- [ ] Verify items moved to person stock
- [ ] View technician's person stock

### Phase 7: Execution
- [ ] Record consumption with serial number
- [ ] Verify item removed from person stock
- [ ] Verify item status changed to CONSUMED
- [ ] Create return record for unused item
- [ ] Approve return and transfer to warehouse
- [ ] Verify item back in warehouse stock

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

## Conclusion

This documentation serves as the **official flow** for the Inventory Management System. All future development should align with these phases and workflows. The flowchart (`flowchartG.png`) is the visual reference, and this document provides the detailed technical specification.

**Next Steps**:
1. Implement Priority 1 features (Inventory Master, Stock Movement)
2. Implement Priority 2 features (Material Allocation)
3. Implement Priority 3 features (Person Stock View)
4. Implement Priority 4 features (Ticket Integration)
5. Implement Priority 5 features (Return Workflow)

---

**Document Version**: 1.0  
**Last Updated**: December 2025  
**Maintained By**: Development Team


