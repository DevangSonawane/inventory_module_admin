import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Plus, Trash2, Loader2, ArrowLeft, Upload, X, FileText, Send, Edit2 } from 'lucide-react'
import { toast } from 'react-toastify'
import Button from '../components/common/Button'
import Input from '../components/common/Input'
import Dropdown from '../components/common/Dropdown'
import Modal from '../components/common/Modal'
import Table from '../components/common/Table'
import { purchaseOrderService } from '../services/purchaseOrderService.js'
import { purchaseRequestService } from '../services/purchaseRequestService.js'
import { businessPartnerService } from '../services/businessPartnerService.js'
import { materialService } from '../services/materialService.js'
import { fileService } from '../services/fileService.js'

const PurchaseOrderDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEditMode = id && id !== 'new'
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [materials, setMaterials] = useState([])
  const [vendors, setVendors] = useState([])
  const [purchaseRequests, setPurchaseRequests] = useState([])
  const [selectedPR, setSelectedPR] = useState(null)
  const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false)
  const [isEditItemModalOpen, setIsEditItemModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [uploadedFiles, setUploadedFiles] = useState([])
  const [existingDocuments, setExistingDocuments] = useState([])

  const [formData, setFormData] = useState({
    poNumber: '',
    poDate: new Date().toISOString().split('T')[0],
    vendorId: '',
    prId: '',
    remarks: '',
  })

  const [orderItems, setOrderItems] = useState([])
  
  const [itemForm, setItemForm] = useState({
    materialId: '',
    quantity: '',
    unitPrice: '',
    remarks: '',
  })

  const getOrgId = () => {
    const storedUser = localStorage.getItem('user')
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser)
        return (
          parsed?.org_id ||
          parsed?.orgId ||
          parsed?.organization_id ||
          parsed?.organizationId ||
          null
        )
      } catch (error) {
        console.error('Failed to parse user for orgId', error)
      }
    }
    return localStorage.getItem('orgId') || null
  }

  useEffect(() => {
    fetchMaterials()
    fetchVendors()
    fetchPurchaseRequests()
    if (isEditMode) {
      fetchPurchaseOrder()
    }
  }, [id])

  const fetchMaterials = async () => {
    try {
      const response = await materialService.getAll({ limit: 1000 })
      if (response.success) {
        setMaterials(response.data?.materials || response.data?.data || [])
      }
    } catch (error) {
      console.error('Error fetching materials:', error)
      setMaterials([])
    }
  }

  const fetchVendors = async () => {
    try {
      const response = await businessPartnerService.getAll({ partnerType: 'SUPPLIER', limit: 1000 })
      if (response.success) {
        setVendors(response.data?.businessPartners || response.data?.data || [])
      }
    } catch (error) {
      console.error('Error fetching vendors:', error)
      setVendors([])
    }
  }

  const fetchPurchaseRequests = async () => {
    try {
      const response = await purchaseRequestService.getAll({ limit: 1000, status: 'APPROVED' })
      if (response.success) {
        setPurchaseRequests(response.data?.purchaseRequests || response.data?.data || [])
      }
    } catch (error) {
      console.error('Error fetching purchase requests:', error)
      setPurchaseRequests([])
    }
  }

  const handlePRSelection = async (prId) => {
    if (!prId) {
      setSelectedPR(null)
      setFormData(prev => ({ ...prev, prId: '', poNumber: '' }))
      setOrderItems([])
      return
    }

    try {
      setLoading(true)
      const response = await purchaseRequestService.getById(prId)
      if (response.success) {
        const pr = response.data?.purchaseRequest || response.data?.data
        if (pr) {
          setSelectedPR(pr)
          
          // Generate PO number based on PR number
          const prNumber = pr.pr_number || ''
          const poNumber = prNumber ? `PO-${prNumber.replace('PR-', '')}` : ''
          
          // Fetch PR items and populate order items
          const items = (pr.items || []).map((item, index) => ({
            id: Date.now() + index,
            materialId: item.material_id,
            itemName: item.material?.material_name || item.pr_name || '-',
            productCode: item.material?.product_code || '-',
            quantity: item.requested_quantity || 1,
            unitPrice: '',
            uom: item.material?.uom || 'PIECE(S)',
            remarks: item.remarks || '',
            prName: item.pr_name || '',
            materialType: item.material_type || '',
            businessPartnerId: item.business_partner_id || '',
            shippingAddress: item.shipping_address || '',
            description: item.description || '',
          }))

          setOrderItems(items)
          
          // Set vendor from first item's business partner if available
          const firstItem = items[0]
          if (firstItem?.businessPartnerId) {
            const vendor = vendors.find(v => v.partner_id === firstItem.businessPartnerId)
            if (vendor) {
              setFormData(prev => ({
                ...prev,
                prId: prId,
                poNumber: poNumber,
                vendorId: vendor.partner_id,
              }))
            } else {
              setFormData(prev => ({
                ...prev,
                prId: prId,
                poNumber: poNumber,
              }))
            }
          } else {
            setFormData(prev => ({
              ...prev,
              prId: prId,
              poNumber: poNumber,
            }))
          }
        }
      }
    } catch (error) {
      console.error('Error fetching PR details:', error)
      toast.error('Failed to load PR details')
    } finally {
      setLoading(false)
    }
  }

  const fetchPurchaseOrder = async () => {
    try {
      setLoading(true)
      const response = await purchaseOrderService.getById(id)
      if (response.success) {
        const po = response.data?.purchaseOrder || response.data?.data
        if (po) {
          setFormData({
            poNumber: po.po_number || '',
            poDate: po.po_date ? po.po_date.split('T')[0] : new Date().toISOString().split('T')[0],
            vendorId: po.vendor_id || '',
            prId: po.pr_id || '',
            remarks: po.remarks || '',
          })
          
          // Set existing documents
          if (po.documents && Array.isArray(po.documents)) {
            setExistingDocuments(po.documents)
          }
          
          // Load items from PO (don't load PR if items already exist)
          if (po.items && Array.isArray(po.items) && po.items.length > 0) {
            setOrderItems(po.items.map((item, index) => ({
              id: item.item_id || index,
              materialId: item.material_id,
              itemName: item.material?.material_name || '-',
              productCode: item.material?.product_code || '-',
              quantity: item.quantity,
              unitPrice: item.unit_price || '',
              uom: item.material?.uom || 'PIECE(S)',
              remarks: item.remarks || '',
            })))
          } else if (po.pr_id) {
            // Only load PR if no items exist
            await handlePRSelection(po.pr_id)
          }
        }
      }
    } catch (error) {
      console.error('Error fetching purchase order:', error)
      toast.error('Failed to load purchase order')
    } finally {
      setLoading(false)
    }
  }

  const materialOptions = [
    { value: '', label: 'Select Material' },
    ...materials.map(material => ({
      value: material.material_id,
      label: `${material.material_name} (${material.product_code})`
    }))
  ]

  const vendorOptions = [
    { value: '', label: 'Select Vendor' },
    ...vendors.map(vendor => {
      const vendorName = vendor.partner_name || vendor.partnerName || vendor.name || 'Vendor'
      const vendorType = vendor.partner_type || vendor.partnerType || vendor.type || ''
      const typeSuffix = vendorType ? ` (${vendorType})` : ''
      return {
        value: vendor.partner_id,
        label: `${vendorName}${typeSuffix}`
      }
    })
  ]

  const prOptions = [
    { value: '', label: 'Select Purchase Request' },
    ...purchaseRequests.map(pr => ({
      value: pr.pr_id || pr.id,
      label: `${pr.pr_number || 'PR-' + (pr.pr_id || pr.id).substring(0, 8)} - ${pr.requested_date ? new Date(pr.requested_date).toLocaleDateString() : ''}`
    }))
  ]

  const handleAddItem = () => {
    if (!itemForm.materialId || !itemForm.quantity) {
      toast.error('Please fill all required fields')
      return
    }

    const selectedMaterial = materials.find(m => m.material_id === itemForm.materialId)
    if (!selectedMaterial) {
      toast.error('Please select a valid material')
      return
    }

    const newItem = {
      id: Date.now(),
      materialId: selectedMaterial.material_id,
      itemName: selectedMaterial.material_name,
      productCode: selectedMaterial.product_code || '-',
      quantity: parseInt(itemForm.quantity),
      unitPrice: parseFloat(itemForm.unitPrice) || 0,
      uom: selectedMaterial.uom || 'PIECE(S)',
      remarks: itemForm.remarks || '',
    }
    
    setOrderItems([...orderItems, newItem])
    setItemForm({
      materialId: '',
      quantity: '',
      unitPrice: '',
      remarks: '',
    })
    setIsAddItemModalOpen(false)
    toast.success('Item added successfully')
  }

  const handleEditItem = (item) => {
    setEditingItem(item)
    setItemForm({
      materialId: item.materialId,
      quantity: item.quantity.toString(),
      unitPrice: item.unitPrice.toString(),
      remarks: item.remarks || '',
    })
    setIsEditItemModalOpen(true)
  }

  const handleUpdateItem = () => {
    if (!itemForm.materialId || !itemForm.quantity) {
      toast.error('Please fill all required fields')
      return
    }

    const selectedMaterial = materials.find(m => m.material_id === itemForm.materialId)
    if (!selectedMaterial) {
      toast.error('Please select a valid material')
      return
    }

    const updatedItems = orderItems.map(item => 
      item.id === editingItem.id
        ? {
            ...item,
            materialId: selectedMaterial.material_id,
            itemName: selectedMaterial.material_name,
            productCode: selectedMaterial.product_code || '-',
            quantity: parseInt(itemForm.quantity),
            unitPrice: parseFloat(itemForm.unitPrice) || 0,
            uom: selectedMaterial.uom || 'PIECE(S)',
            remarks: itemForm.remarks || '',
          }
        : item
    )
    
    setOrderItems(updatedItems)
    setItemForm({
      materialId: '',
      quantity: '',
      unitPrice: '',
      remarks: '',
    })
    setEditingItem(null)
    setIsEditItemModalOpen(false)
    toast.success('Item updated successfully')
  }

  const handleDeleteItem = (itemId) => {
    setOrderItems(orderItems.filter((item) => item.id !== itemId))
    toast.success('Item removed')
  }

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files)
    setUploadedFiles([...uploadedFiles, ...files])
  }

  const handleRemoveFile = (index) => {
    setUploadedFiles(uploadedFiles.filter((_, i) => i !== index))
  }

  const handleRemoveExistingDocument = async (filename) => {
    try {
      const response = await fileService.delete(filename)
      if (response.success) {
        setExistingDocuments(existingDocuments.filter(doc => doc !== filename))
        toast.success('Document removed successfully')
      }
    } catch (error) {
      console.error('Error removing document:', error)
      toast.error('Failed to remove document')
    }
  }

  const handleSave = async () => {
    if (!formData.vendorId) {
      toast.error('Please select a vendor')
      return
    }
    if (orderItems.length === 0) {
      toast.error('Please add at least one item')
      return
    }

    try {
      setLoading(true)
      
      const orderData = {
        poNumber: formData.poNumber || undefined,
        poDate: formData.poDate,
        vendorId: formData.vendorId,
        prId: formData.prId || undefined,
        remarks: formData.remarks || undefined,
        orgId: getOrgId() || undefined,
        items: orderItems.map(item => ({
          materialId: item.materialId,
          quantity: item.quantity,
          unitPrice: item.unitPrice || undefined,
          remarks: item.remarks || undefined,
        })),
      }

      let response
      if (isEditMode) {
        response = await purchaseOrderService.update(id, orderData)
      } else if (formData.prId) {
        response = await purchaseOrderService.createFromPR(formData.prId, orderData)
      } else {
        response = await purchaseOrderService.create(orderData)
      }

      if (response.success) {
        const poId = response.data?.purchaseOrder?.po_id || response.data?.data?.po_id || id
        
        // Upload documents if any
        if (uploadedFiles.length > 0 && poId) {
          try {
            await fileService.addToPurchaseOrder(poId, uploadedFiles)
            setUploadedFiles([])
          } catch (error) {
            console.error('Error uploading documents:', error)
            toast.warning('PO saved but documents upload failed')
          }
        }

        toast.success(`Purchase order ${isEditMode ? 'updated' : 'created'} successfully!`)
        
        if (!isEditMode) {
          window.dispatchEvent(new CustomEvent('purchaseOrderCreated'))
          localStorage.setItem('purchaseOrderCreated', Date.now().toString())
          navigate(`/purchase-order/${poId}`)
        } else {
          // Reload to get updated data
          await fetchPurchaseOrder()
        }
      }
    } catch (error) {
      console.error('Error saving purchase order:', error)
      toast.error(error.message || `Failed to ${isEditMode ? 'update' : 'create'} purchase order`)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async () => {
    if (!formData.vendorId) {
      toast.error('Please select a vendor')
      return
    }
    if (orderItems.length === 0) {
      toast.error('Please add at least one item')
      return
    }

    try {
      setSubmitting(true)
      let poId = id

      // First save the PO if it's new
      if (!isEditMode || !poId) {
        // Save the PO first
        const orderData = {
          poNumber: formData.poNumber || undefined,
          poDate: formData.poDate,
          vendorId: formData.vendorId,
          prId: formData.prId || undefined,
          remarks: formData.remarks || undefined,
          orgId: getOrgId() || undefined,
          items: orderItems.map(item => ({
            materialId: item.materialId,
            quantity: item.quantity,
            unitPrice: item.unitPrice || undefined,
            remarks: item.remarks || undefined,
          })),
        }

        let createResponse
        if (formData.prId) {
          createResponse = await purchaseOrderService.createFromPR(formData.prId, orderData)
        } else {
          createResponse = await purchaseOrderService.create(orderData)
        }

        if (!createResponse.success) {
          toast.error('Failed to save purchase order')
          return
        }

        poId = createResponse.data?.purchaseOrder?.po_id || createResponse.data?.data?.po_id

        // Upload documents if any
        if (uploadedFiles.length > 0 && poId) {
          try {
            await fileService.addToPurchaseOrder(poId, uploadedFiles)
            setUploadedFiles([])
          } catch (error) {
            console.error('Error uploading documents:', error)
            toast.warning('PO saved but documents upload failed')
          }
        }
      }

      if (!poId) {
        toast.error('Failed to get purchase order ID')
        return
      }

      // Submit PO (this will send email to business partner)
      const response = await purchaseOrderService.submit(poId, {
        documents: [...existingDocuments, ...uploadedFiles.map(f => f.name)]
      })

      if (response.success) {
        toast.success('Purchase order submitted and sent to vendor successfully!')
        navigate('/purchase-order')
      }
    } catch (error) {
      console.error('Error submitting purchase order:', error)
      toast.error(error.message || 'Failed to submit purchase order')
    } finally {
      setSubmitting(false)
    }
  }

  const itemColumns = [
    { key: 'itemName', label: 'Material Name' },
    { key: 'productCode', label: 'Product Code' },
    { key: 'quantity', label: 'Quantity' },
    { key: 'unitPrice', label: 'Unit Price', render: (row) => `₹${parseFloat(row.unitPrice || 0).toFixed(2)}` },
    { key: 'uom', label: 'UOM' },
    { key: 'remarks', label: 'Remarks' },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleEditItem(row)}
            className="p-1 text-blue-600 hover:bg-blue-50 rounded"
            title="Edit"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDeleteItem(row.id)}
            className="p-1 text-red-600 hover:bg-red-50 rounded"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ]

  const totalAmount = orderItems.reduce((sum, item) => {
    return sum + (parseFloat(item.unitPrice) || 0) * (parseInt(item.quantity) || 0)
  }, 0)

  return (
    <div className="p-6">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" onClick={() => navigate('/purchase-order')} icon={<ArrowLeft className="w-4 h-4" />}>
          Back
        </Button>
        <h1 className="text-2xl font-bold text-gray-800">
          {isEditMode ? 'Edit Purchase Order' : 'Create Purchase Order'}
        </h1>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
        {/* PR Selection Dropdown */}
        <div className="border-b pb-4">
          <h2 className="text-lg font-semibold mb-4">Select Purchase Request</h2>
          <Dropdown
            label="Purchase Request"
            options={prOptions}
            value={formData.prId}
            onChange={(e) => handlePRSelection(e.target.value)}
            disabled={isEditMode || loading}
            required
          />
          {selectedPR && (
            <div className="mt-2 text-sm text-gray-600">
              <p>PR Number: {selectedPR.pr_number}</p>
              <p>Requested Date: {selectedPR.requested_date ? new Date(selectedPR.requested_date).toLocaleDateString() : '-'}</p>
            </div>
          )}
        </div>

        {/* PO Details */}
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="PO Number"
            value={formData.poNumber}
            onChange={(e) => setFormData({ ...formData, poNumber: e.target.value })}
            placeholder="Auto-generated from PR"
            disabled={!formData.prId}
          />
          <Input
            label="PO Date"
            type="date"
            value={formData.poDate}
            onChange={(e) => setFormData({ ...formData, poDate: e.target.value })}
          />
          <Dropdown
            label="Vendor"
            options={vendorOptions}
            value={formData.vendorId}
            onChange={(e) => setFormData({ ...formData, vendorId: e.target.value })}
            required
          />
          <Input
            label="Remarks"
            value={formData.remarks}
            onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
            placeholder="Optional remarks"
          />
        </div>

        {/* Order Items */}
        <div className="border-t pt-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Order Items</h2>
            <Button onClick={() => setIsAddItemModalOpen(true)} icon={<Plus className="w-4 h-4" />}>
              Add Item
            </Button>
          </div>

          {orderItems.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No items added yet. Select a PR or add items manually.</p>
          ) : (
            <>
              <Table data={orderItems} columns={itemColumns} />
              <div className="mt-4 text-right">
                <p className="text-lg font-semibold">Total Amount: ₹{totalAmount.toFixed(2)}</p>
              </div>
            </>
          )}
        </div>

        {/* Document Upload */}
        <div className="border-t pt-4">
          <h2 className="text-lg font-semibold mb-4">Documents</h2>
          
          {/* Existing Documents */}
          {existingDocuments.length > 0 && (
            <div className="mb-4">
              <p className="text-sm font-medium text-gray-700 mb-2">Existing Documents:</p>
              <div className="flex flex-wrap gap-2">
                {existingDocuments.map((doc, index) => (
                  <div key={index} className="flex items-center gap-2 bg-gray-100 px-3 py-2 rounded">
                    <FileText className="w-4 h-4 text-gray-600" />
                    <span className="text-sm text-gray-700">{doc.split('/').pop()}</span>
                    <button
                      onClick={() => handleRemoveExistingDocument(doc)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* File Upload */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
            <label className="flex flex-col items-center cursor-pointer">
              <Upload className="w-8 h-8 text-gray-400 mb-2" />
              <span className="text-sm text-gray-600">Click to upload documents</span>
              <input
                type="file"
                multiple
                accept="image/*,.pdf"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>

          {/* Uploaded Files Preview */}
          {uploadedFiles.length > 0 && (
            <div className="mt-4">
              <p className="text-sm font-medium text-gray-700 mb-2">Files to Upload:</p>
              <div className="flex flex-wrap gap-2">
                {uploadedFiles.map((file, index) => (
                  <div key={index} className="flex items-center gap-2 bg-blue-100 px-3 py-2 rounded">
                    <FileText className="w-4 h-4 text-blue-600" />
                    <span className="text-sm text-gray-700">{file.name}</span>
                    <button
                      onClick={() => handleRemoveFile(index)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 pt-4 border-t">
          <Button 
            onClick={handleSave} 
            disabled={loading} 
            icon={loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          >
            {isEditMode ? 'Update' : 'Save Draft'}
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={loading || submitting} 
            variant="primary"
            icon={submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          >
            {submitting ? 'Submitting...' : 'Submit to Vendor'}
          </Button>
          <Button onClick={() => navigate('/purchase-order')} variant="outline">
            Cancel
          </Button>
        </div>
      </div>

      {/* Add Item Modal */}
      <Modal
        isOpen={isAddItemModalOpen}
        onClose={() => setIsAddItemModalOpen(false)}
        title="Add Item"
      >
        <div className="space-y-4">
          <Dropdown
            label="Material"
            options={materialOptions}
            value={itemForm.materialId}
            onChange={(e) => setItemForm({ ...itemForm, materialId: e.target.value })}
            required
          />
          <Input
            label="Quantity"
            type="number"
            value={itemForm.quantity}
            onChange={(e) => setItemForm({ ...itemForm, quantity: e.target.value })}
            min="1"
            required
          />
          <Input
            label="Unit Price"
            type="number"
            step="0.01"
            value={itemForm.unitPrice}
            onChange={(e) => setItemForm({ ...itemForm, unitPrice: e.target.value })}
            min="0"
          />
          <Input
            label="Remarks"
            value={itemForm.remarks}
            onChange={(e) => setItemForm({ ...itemForm, remarks: e.target.value })}
            placeholder="Optional"
          />
          <div className="flex gap-2 justify-end">
            <Button onClick={() => setIsAddItemModalOpen(false)} variant="outline">
              Cancel
            </Button>
            <Button onClick={handleAddItem}>
              Add Item
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Item Modal */}
      <Modal
        isOpen={isEditItemModalOpen}
        onClose={() => {
          setIsEditItemModalOpen(false)
          setEditingItem(null)
        }}
        title="Edit Item"
      >
        <div className="space-y-4">
          <Dropdown
            label="Material"
            options={materialOptions}
            value={itemForm.materialId}
            onChange={(e) => setItemForm({ ...itemForm, materialId: e.target.value })}
            required
          />
          <Input
            label="Quantity"
            type="number"
            value={itemForm.quantity}
            onChange={(e) => setItemForm({ ...itemForm, quantity: e.target.value })}
            min="1"
            required
          />
          <Input
            label="Unit Price"
            type="number"
            step="0.01"
            value={itemForm.unitPrice}
            onChange={(e) => setItemForm({ ...itemForm, unitPrice: e.target.value })}
            min="0"
          />
          <Input
            label="Remarks"
            value={itemForm.remarks}
            onChange={(e) => setItemForm({ ...itemForm, remarks: e.target.value })}
            placeholder="Optional"
          />
          <div className="flex gap-2 justify-end">
            <Button 
              onClick={() => {
                setIsEditItemModalOpen(false)
                setEditingItem(null)
              }} 
              variant="outline"
            >
              Cancel
            </Button>
            <Button onClick={handleUpdateItem}>
              Update Item
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default PurchaseOrderDetails
