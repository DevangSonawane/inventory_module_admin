1) GST / SGST Configuration
Provide two selectable tax options (GST and SGST) during transaction processing for accurate tax handling. (this in material management when adding new material, this shoudl not be hard coded but the user should be able to type this)

3) Additional Assets in Material Type
Allow more asset types to be added and managed within the Materials module. (make a new module for this for material type, it should be in management)

4) Shipping Address Dropdown
Implement a dropdown list for Shipping Address, sourced from master data, to avoid manual entry errors.(this should be in purcahse requrest when adding a item, and after clikcing on a any drop down options from the warehouse, it is properly fetched from the stock area management, like the address given from there)

5) Edit Option in Create Purchase order
Disable an Edit option while creating a Purchase order, before final submission.(remove the safe as draft option, it should be directly submit for approval). Also in purchase order there should not be a edit option there should only be a delete option.

6) Edit Access for Saved Drafts
Purchase Requests saved as Draft should have a full Edit option until they are submitted for approval.

7) Invoice Option in Purchase Order (Email)
Add an option to generate and send the invoice via email directly from the Purchase Order module. (after creating a purchase order, after selecting the drop down from vendor the mail should be sent to the respective vendor's email)


9) in business partner, adding business partner remove the 'customer' dropdown and add 'franchise'


11) TAN Number / Card Field
Add fields for TAN Number / Card, marked as optional (not mandatory). (in business partner, adding business partner)

12) Billing Address from Masters (Auto-populated)
Billing Address should be auto-populated from the Master data instead of manual entry.
(in purchase request, adding a new pr, then adding item, when clikcing on warehouse drop down and selecting 1, the other fields should be fetched from warehouse table and should be in grey i.e. not editable but visible)

13) No Edit/Delete in Add Inward
Once an Inward Entry is added, Edit and Delete options should be disabled to maintain data integrity.

14) Status Naming Correction
Replace “Approval” with “Approved” for Material Requests to reflect the correct status.(in )

15) No Edit After Stock Transfer
After a Stock Transfer is completed, the record should be locked with no Edit option available.(remove the view/edit option)

16) HSN Code Master
Introduce an HSN Code Master with dropdown selection across relevant transaction screens.
(add a new module for this, this should be in admin, and there should be a drop down in mareiral management -> add new -> hsn code (for now just put test 1,test2,test3,test4))


after submitting for apporval in purcahse rrequest, and then when an admin sees that from the approval center, it shows 0 items total amoutn is also 0 so make sure that is fixed


in stock area management, when adding a new warehouse, the fields should , Warehouse Name, Comapany Name(if applicable),Stree Number & Name Apartment/Unit, Locality/District(if needed), City,State/Province, Postal Code, Country(in all Caps)


in inventory, material request it should this in logs 
{
    "success": false,
    "message": "Unknown column 'group.group_id' in 'field list'",
    "code": "INTERNAL_ERROR",
    "timestamp": "2026-01-01T07:34:18.890Z",
    "stack": "Error\n    at Query.run (/Users/devangsonawane/inventory_module-main/Ethernet-CRM-pr-executive-management/server/node_modules/sequelize/lib/dialects/mysql/query.js:52:25)\n    at /Users/devangsonawane/inventory_module-main/Ethernet-CRM-pr-executive-management/server/node_modules/sequelize/lib/sequelize.js:315:28\n    at async MySQLQueryInterface.select (/Users/devangsonawane/inventory_module-main/Ethernet-CRM-pr-executive-management/server/node_modules/sequelize/lib/dialects/abstract/query-interface.js:407:12)\n    at async material_request.findAll (/Users/devangsonawane/inventory_module-main/Ethernet-CRM-pr-executive-management/server/node_modules/sequelize/lib/model.js:1140:21)\n    at async Promise.all (index 1)\n    at async material_request.findAndCountAll (/Users/devangsonawane/inventory_module-main/Ethernet-CRM-pr-executive-management/server/node_modules/sequelize/lib/model.js:1322:27)\n    at async getAllMaterialRequests (file:///Users/devangsonawane/inventory_module-main/Ethernet-CRM-pr-executive-management/server/src/controllers/materialRequestController.js:270:39)",
    "error": "SequelizeDatabaseError"
}