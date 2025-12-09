Here is a detailed **Technical Specification Document** focusing exclusively on the **Inventory Module** based on the video. This is ready to be shared with your developer.

***

# Module Specification: Inventory Management System

**Scope:** This document outlines the functional requirements for the "Inventory" module of the web application. This module handles the lifecycle of stock from entry (Inward) to distribution (Transfer) and final usage (Consumption).

## 1. Core Workflows (Logic for Developer)
* **Item Uniqueness:** The system must handle two types of inventory:
    1.  **Non-Serialized (Bulk):** Tracked by Quantity only (e.g., Fiber Cable, Patch Cords).
    2.  **Serialized:** Tracked by unique Serial Number & MAC ID (e.g., Routers, ONUs).
* **Stock Holding:** Inventory exists in two types of locations:
    1.  **Stock Areas:** Physical warehouses (e.g., "Central Stock", "Vagator Office").
    2.  **Person Stock:** Virtual stock held by individual employees/technicians.

---

## 2. Functional Requirements

### A. Inward Stock (Goods Receipt Note - GRN)
*Reference timestamp: 11:36*
**Goal:** Add new stock into the system against a Purchase Order.

* **Header Fields:**
    * **Date:** Date picker.
    * **Vehicle Number & Slip Number:** Text fields for logistics tracking.
    * **Party Name:** Dropdown (Link to Business Partners).
    * **Purchase Order (PO):** Dropdown. Selecting a PO should filter the items available for inward.
    * **Stock Area:** Dropdown (Where is this stock physically entering?).
    * **Invoice Number:** Text field.

* **Items Grid (Data Entry):**
    * **Add Material Button:** Opens a modal to select items.
    * **Grid Columns:** Material Name, Properties (Brand/Cap), Serial Number, MAC ID, Price, Quantity, UOM (Unit of Measure), Total Amount, GST%, Final Amount.
    * **Critical Feature - Bulk Upload:**
        * For Serialized items (like Routers), the user cannot type 100 serial numbers manually.
        * **Requirement:** An "Upload Excel" button that accepts a CSV/Excel file containing `Serial No` and `MAC ID` to populate the grid automatically.

### B. Inventory Stock Views
*Reference timestamp: 11:30*
**Goal:** View current stock levels. This must have two distinct tabs.

* **Tab 1: Inventory Stock (Warehouse View)**
    * **Filter:** "Select Stock Area" (e.g., Central Stock).
    * **Columns:** Material Name, Product Code, Material Type, Current Stock Quantity, UOM.
    * **Logic:** Shows aggregate quantity of items in that specific warehouse.

* **Tab 2: Person Wise Stock (Technician View)**
    * *Reference timestamp: 14:16*
    * **Columns:** Person Name, Group (e.g., North Tech), Team, Stock Count.
    * **Expandable Rows:** Clicking a person's row should expand to show exactly *what* items they are holding.

### C. Material Request (MR) & Allocation
*Reference timestamp: 15:35*
**Goal:** Technicians request stock from the warehouse.

* **1. Create Request (User Side):**
    * **Fields:** Request Date, Group, Team, From Stock Area (Where are they asking stock from?).
    * **Requested Items Tab:** User adds "Item Name" and "Quantity" needed.

* **2. Allocation (Store Keeper Side):**
    * *Reference timestamp: 19:50*
    * The Store Keeper opens the MR.
    * **Allocate Items Tab:** The system shows the requested quantity.
    * **Action:** The Store Keeper must select the *exact* Serial Numbers/MAC IDs from the available inventory to fulfill the request.
    * **Validation:** Cannot allocate more than the requested quantity or more than available stock.

* **3. MR Statuses:** `Requested` -> `Approved` -> `Allocated`.

### D. Stock Transfer
*Reference timestamp: 17:36*
**Goal:** Move stock between locations or assign allocated stock to a person.

* **Entry Types:**
    1.  **Material Request Transfer:** Linked to an approved MR. Pre-fills items based on the allocation done in step C.
    2.  **Reconciliation:** Manual adjustment or moving stock without a request.
* **Header Fields:** Date, Slip No, Transfer Type, From Stock Area, To Person (or To Area).
* **Details Grid:** Shows Item Name, Product Code, Properties, Serial No, Transferred Qty.

### E. Record Consumption
*Reference timestamp: 18:11*
**Goal:** Remove stock from a Person's inventory when used at a customer site.

* **Integration Point:** This screen links inventory to a Support Ticket/Installation.
* **Header Fields:**
    * **External System Ref ID (Ticket No):** A search bar. Entering a Ticket ID should fetch customer details.
    * **Customer Name / Mobile:** Auto-populated based on Ticket search.
    * **Remark:** (e.g., "Installation done").
* **Consumption Logic:**
    * **Search By:** Asset ID or Serial Number.
    * The user scans or types the Serial Number of the router they just installed.
    * **Result:** The item is removed from the "Person Wise Stock" and marked as "Consumed".

---

## 3. Database Schema Recommendations (For Inventory)

To support the features in the video, the developer needs a structure similar to this:

**1. `tbl_inventory_master`** (The current status of every single item)
* `id`
* `material_id` (Link to Product)
* `serial_number` (Unique)
* `mac_id` (Unique)
* `current_location_type` (Enum: 'WAREHOUSE', 'PERSON', 'CONSUMED')
* `location_id` (ID of the Stock Area or User)
* `status` (Available, Faulty, Allocated)

**2. `tbl_inward_stock` (GRN Header)**
* `id`, `po_id`, `invoice_no`, `date`, `stock_area_id`

**3. `tbl_material_request` (MR Header)**
* `id`, `requester_id`, `from_stock_area_id`, `status`

**4. `tbl_material_request_items` (What was asked)**
* `mr_id`, `material_id`, `requested_qty`

**5. `tbl_material_allocation` (What was given)**
* `mr_id`, `material_id`, `inventory_master_id` (Links to specific Serial No)

**6. `tbl_consumption`**
* `id`, `ticket_number`, `customer_name`, `technician_id`, `date`

**7. `tbl_consumption_items`**
* `consumption_id`, `inventory_master_id` (The specific item used)

---

## 4. Key Developer Notes (Avoid these common mistakes)

1.  **Strict Serial Validation:** Ensure the "Inward" process checks for duplicate Serial Numbers. The same serial number cannot be entered twice.
2.  **FIFO/Allocation:** When allocating stock, ensure the system only allows selecting items that are currently `Available` in the `From Stock Area`. Do not show items that are already with a technician.
3.  **Excel Template:** Provide a downloadable CSV template for the "Inward Stock" bulk upload feature so users know which format to use (Serial No, MAC ID columns).

based on the reference video, you must also include these three specific functionalities to make the system complete.
1. The "Setup" Phase (Masters Module)
Before we can do any inventory work, we need a place to define what we are stocking and where.
 * Product Properties: A product isn't just a name. In the video (02:30), products have Properties.
   * Example: If I add a "Router", I need to define properties like "Brand" (Nokia/Huawei) and "Capacity" (Dual Band/Single Band).
   * Requirement: The "Add Material" screen needs a dynamic way to add these attributes.
 * Store Keeper Mapping: In the video (03:30), when we create a "Stock Area" (Warehouse), we assign a specific User (Store Keeper) to it.
   * Logic: Only the user assigned to "Main Office" should be able to approve requests coming from that office.
2. The "Buying" Workflow (Pre-Inventory)
Reference video: 05:00 - 10:00
You cannot just "Inward" stock out of thin air. It must be linked to a purchase.
 * The Flow: Purchase Request (PR) \rightarrow Approval \rightarrow Purchase Order (PO).
 * The Link: On the Inward Stock screen (11:40), there is a dropdown for "Purchase Order". The system must fetch the items from that approved PO so the Store Keeper knows exactly what to expect.
3. Returns Logic (The "Oops" Scenario)
Reference video: 29:30
In the "Record Consumption" screen, there is a second tab called "Return Stock".
 * Scenario: A technician takes a router to a client's house, but the client cancels, or the device is faulty. The technician brings it back.
 * Requirement: You need a workflow where a Technician can "Return" an item from their "Person Stock" back to the "Warehouse Stock". This status might change to Faulty or Available.
Updated Data Flow Summary
 * Configuration: Define Products & Properties.
 * Buying: PR \rightarrow PO.
 * Inward: PO \rightarrow Warehouse Stock (Upload Excel for Serials).
 * Distribution: Request \rightarrow Allocate \rightarrow Transfer to Person.
 * Usage: Person \rightarrow Install (Consumption).
 * Reverse: Person \rightarrow Return to Warehouse.