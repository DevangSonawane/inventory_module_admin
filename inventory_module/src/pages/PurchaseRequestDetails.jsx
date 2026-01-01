import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Plus, Trash2, Loader2, ArrowLeft } from 'lucide-react'
import { toast } from 'react-toastify'
import Button from '../components/common/Button'
import Input from '../components/common/Input'
import Dropdown from '../components/common/Dropdown'
import Modal from '../components/common/Modal'
import Table from '../components/common/Table'
import { purchaseRequestService } from '../services/purchaseRequestService.js'
import { materialService } from '../services/materialService.js'
import { businessPartnerService } from '../services/businessPartnerService.js'
import { stockAreaService } from '../services/stockAreaService.js'
import { materialTypeService } from '../services/materialTypeService.js'

// UUID validation regex
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const PurchaseRequestDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEditMode = id && id !== 'new'
  const [loading, setLoading] = useState(false)
  const [materials, setMaterials] = useState([])
  const [businessPartners, setBusinessPartners] = useState([])
  const [stockAreas, setStockAreas] = useState([])
  const [materialTypes, setMaterialTypes] = useState([])
  const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false)

  const [formData, setFormData] = useState({
    prNumber: '',
    requestedDate: new Date().toISOString().split('T')[0],
  })
  const [generatingPRNumber, setGeneratingPRNumber] = useState(false)

  const [requestedItems, setRequestedItems] = useState([])
  const [prStatus, setPrStatus] = useState('DRAFT') // Track PR status
  
  const [itemForm, setItemForm] = useState({
    prName: '',
    materialType: '',
    businessPartnerId: '',
    warehouseId: '',
    shippingAddress: '',
    billingAddress: '',
    description: '',
    materialId: '',
    requestedQuantity: '',
    remarks: '',
    unitPrice: '',
    gstPercentage: '',
    sgstPercentage: '',
    uom: '',
  })

  useEffect(() => {
    fetchMaterials()
    fetchBusinessPartners()
    fetchStockAreas()
    fetchMaterialTypes()
    if (isEditMode) {
      fetchPurchaseRequest()
    } else {
      // Auto-generate PR number on initial load for new PR
      handleDateChange(new Date().toISOString().split('T')[0])
    }
  }, [id])

  const fetchMaterialTypes = async () => {
    try {
      const response = await materialTypeService.getAll({ limit: 1000 })
      if (response.success) {
        const types = response.data?.materialTypes || response.data?.data || []
        setMaterialTypes(types)
      }
    } catch (error) {
      console.error('Error fetching material types:', error)
      toast.error('Failed to load material types')
      setMaterialTypes([])
    }
  }

  const materialTypeOptions = [
    { value: '', label: 'Select Material Type' },
    ...materialTypes.map(type => ({
      value: type.type_name,
      label: type.type_name.charAt(0).toUpperCase() + type.type_name.slice(1).replace(/_/g, ' ')
    }))
  ]

  const handleDateChange = async (date) => {
    // Update date immediately for live update
    setFormData(prev => ({ ...prev, requestedDate: date, prNumber: '' }))
    
    // Generate PR number immediately when date is selected (only for new PRs, not edit mode)
    if (date && !isEditMode) {
      // Show loading state immediately
      setGeneratingPRNumber(true)
      
      // Generate PR number immediately - no delay needed for date selection
      try {
        const response = await purchaseRequestService.generatePRNumber(date)
        if (response.success && response.data?.prNumber) {
          // Update PR number immediately for live update
          setFormData(prev => ({ ...prev, prNumber: response.data.prNumber }))
        } else {
          setFormData(prev => ({ ...prev, prNumber: '' }))
        }
      } catch (error) {
        console.error('Error generating PR number:', error)
        // Clear PR number on error
        setFormData(prev => ({ ...prev, prNumber: '' }))
        toast.error('Failed to generate PR number')
      } finally {
        setGeneratingPRNumber(false)
      }
    } else {
      setGeneratingPRNumber(false)
    }
  }

  const fetchMaterials = async () => {
    try {
      const response = await materialService.getAll({ limit: 1000 })
      if (response.success) {
        setMaterials(response.data?.materials || response.data?.data || [])
      }
    } catch (error) {
      console.error('Error fetching materials:', error)
      toast.error('Failed to load materials')
      setMaterials([])
    }
  }

  const fetchBusinessPartners = async () => {
    try {
      // Fetch business partners with SUPPLIER category
      const response = await businessPartnerService.getAll({ 
        limit: 1000, 
        partnerType: 'SUPPLIER' 
      })
      if (response.success) {
        setBusinessPartners(response.data?.businessPartners || response.data?.data || [])
      }
    } catch (error) {
      console.error('Error fetching business partners:', error)
      toast.error('Failed to load business partners')
      setBusinessPartners([])
    }
  }

  const fetchStockAreas = async () => {
    try {
      const response = await stockAreaService.getAll({ limit: 100 })
      if (response.success) {
        setStockAreas(response.data?.stockAreas || response.data?.data || [])
      }
    } catch (error) {
      console.error('Error fetching stock areas:', error)
      toast.error('Failed to load stock areas')
      setStockAreas([])
    }
  }

  const fetchPurchaseRequest = async () => {
    try {
      setLoading(true)
      const response = await purchaseRequestService.getById(id)
      if (response.success) {
        const pr = response.data?.purchaseRequest || response.data?.data
        if (pr) {
          setPrStatus(pr.status || 'DRAFT') // Track the status
          setFormData({
            prNumber: pr.pr_number || '',
            requestedDate: pr.requested_date ? pr.requested_date.split('T')[0] : new Date().toISOString().split('T')[0],
          })
          
          if (pr.items && Array.isArray(pr.items)) {
            setRequestedItems(pr.items.map((item, index) => {
              const quantity = item.requested_quantity || 1
              const material = item.material
              const unitPrice = material?.price ? parseFloat(material.price) : 0
              const gstPercentage = material?.gst_percentage ? parseFloat(material.gst_percentage) : 0
              const sgstPercentage = material?.sgst_percentage ? parseFloat(material.sgst_percentage) : 0
              
              const subtotal = quantity * unitPrice
              const gstAmount = subtotal * (gstPercentage / 100)
              const sgstAmount = subtotal * (sgstPercentage / 100)
              const itemTotal = subtotal + gstAmount + sgstAmount
              
              return {
                id: item.item_id || index,
                prName: item.pr_name || '',
                materialType: item.material_type || '',
                businessPartnerId: item.business_partner_id || '',
                businessPartnerName: item.businessPartner?.partner_name || '',
                warehouseId: '',
                shippingAddress: item.shipping_address || '',
                billingAddress: item.billing_address || '',
                description: item.description || '',
                materialId: item.material_id || '',
                itemName: material?.material_name || '-',
                productCode: material?.product_code || '-',
                requestedQuantity: quantity,
                uom: material?.uom || 'PIECE(S)',
                unitPrice: unitPrice,
                gstPercentage: gstPercentage,
                sgstPercentage: sgstPercentage,
                subtotal: subtotal,
                gstAmount: gstAmount,
                sgstAmount: sgstAmount,
                itemTotal: itemTotal,
                remarks: item.remarks || '',
              }
            }))
          }
        }
      }
    } catch (error) {
      console.error('Error fetching purchase request:', error)
      toast.error('Failed to load purchase request')
    } finally {
      setLoading(false)
    }
  }

  const materialOptions = [
    { value: '', label: 'Select Material (Optional)' },
    ...materials.map(material => ({
      value: material.material_id,
      label: `${material.material_name} (${material.product_code})`
    }))
  ]

  const businessPartnerOptions = [
    { value: '', label: 'Select Business Partner' },
    ...businessPartners.map(bp => ({
      value: bp.partner_id,
      label: `${bp.partner_name}${bp.partner_type ? ` (${bp.partner_type})` : ''}`
    }))
  ]

  const warehouseOptions = [
    { value: '', label: 'Select Warehouse' },
    ...stockAreas.map(area => ({
      value: area.area_id,
      label: area.area_name,
      address: area.address || ''
    }))
  ]

  const handleMaterialChange = (materialId) => {
    const selectedMaterial = materials.find(m => m.material_id === materialId)
    if (selectedMaterial) {
      setItemForm({
        ...itemForm,
        materialId: materialId,
        materialType: selectedMaterial.material_type || itemForm.materialType,
        unitPrice: selectedMaterial.price ? parseFloat(selectedMaterial.price).toFixed(2) : '',
        gstPercentage: selectedMaterial.gst_percentage ? parseFloat(selectedMaterial.gst_percentage).toFixed(2) : '',
        sgstPercentage: selectedMaterial.sgst_percentage ? parseFloat(selectedMaterial.sgst_percentage).toFixed(2) : '',
        uom: selectedMaterial.uom || 'PIECE(S)',
      })
    } else {
      setItemForm({
        ...itemForm,
        materialId: materialId,
        unitPrice: '',
        gstPercentage: '',
        sgstPercentage: '',
        uom: '',
      })
    }
  }

  const handleWarehouseChange = (warehouseId) => {
    const selectedWarehouse = stockAreas.find(area => area.area_id === warehouseId)
    
    if (!selectedWarehouse) {
      setItemForm({
        ...itemForm,
        warehouseId: warehouseId,
        shippingAddress: '',
        billingAddress: ''
      })
      return
    }
    
    // Get address from address field, or construct from individual fields
    let address = selectedWarehouse.address || ''
    
    // If address field is empty, try to construct from individual fields
    if (!address || address.trim() === '') {
      const addressParts = []
      if (selectedWarehouse.street_number_name) addressParts.push(selectedWarehouse.street_number_name)
      if (selectedWarehouse.apartment_unit) addressParts.push(selectedWarehouse.apartment_unit)
      if (selectedWarehouse.locality_district) addressParts.push(selectedWarehouse.locality_district)
      if (selectedWarehouse.city) addressParts.push(selectedWarehouse.city)
      if (selectedWarehouse.state_province) addressParts.push(selectedWarehouse.state_province)
      if (selectedWarehouse.country) addressParts.push(selectedWarehouse.country)
      if (selectedWarehouse.pin_code) addressParts.push(selectedWarehouse.pin_code)
      
      address = addressParts.length > 0 ? addressParts.join(', ') : ''
    }
    
    setItemForm({
      ...itemForm,
      warehouseId: warehouseId,
      shippingAddress: address,
      billingAddress: address
    })
  }

  const handleAddItem = () => {
    if (!itemForm.prName || !itemForm.prName.trim()) {
      toast.error('PR Name is required')
      return
    }
    if (!itemForm.materialType || !itemForm.materialType.trim()) {
      toast.error('Material Type is required')
      return
    }

    const selectedBusinessPartner = businessPartners.find(bp => bp.partner_id === itemForm.businessPartnerId)
    const selectedWarehouse = stockAreas.find(area => area.area_id === itemForm.warehouseId)
    const selectedMaterial = materials.find(m => m.material_id === itemForm.materialId)

    // Calculate prices and taxes
    const quantity = itemForm.requestedQuantity ? parseFloat(itemForm.requestedQuantity) : 1
    const unitPrice = itemForm.unitPrice ? parseFloat(itemForm.unitPrice) : (selectedMaterial?.price ? parseFloat(selectedMaterial.price) : 0)
    const gstPercentage = itemForm.gstPercentage ? parseFloat(itemForm.gstPercentage) : (selectedMaterial?.gst_percentage ? parseFloat(selectedMaterial.gst_percentage) : 0)
    const sgstPercentage = itemForm.sgstPercentage ? parseFloat(itemForm.sgstPercentage) : (selectedMaterial?.sgst_percentage ? parseFloat(selectedMaterial.sgst_percentage) : 0)
    
    const subtotal = quantity * unitPrice
    const gstAmount = subtotal * (gstPercentage / 100)
    const sgstAmount = subtotal * (sgstPercentage / 100)
    const itemTotal = subtotal + gstAmount + sgstAmount

    const newItem = {
      id: Date.now(),
      prName: itemForm.prName,
      materialType: itemForm.materialType,
      businessPartnerId: itemForm.businessPartnerId || null,
      businessPartnerName: selectedBusinessPartner?.partner_name || '',
      warehouseId: itemForm.warehouseId || null,
      shippingAddress: itemForm.shippingAddress || '',
      billingAddress: itemForm.billingAddress || '',
      description: itemForm.description || '',
      materialId: itemForm.materialId || null,
      itemName: selectedMaterial?.material_name || '-',
      productCode: selectedMaterial?.product_code || '-',
      requestedQuantity: quantity,
      uom: itemForm.uom || selectedMaterial?.uom || 'PIECE(S)',
      unitPrice: unitPrice,
      gstPercentage: gstPercentage,
      sgstPercentage: sgstPercentage,
      subtotal: subtotal,
      gstAmount: gstAmount,
      sgstAmount: sgstAmount,
      itemTotal: itemTotal,
      remarks: itemForm.remarks || '',
    }
    
    setRequestedItems([...requestedItems, newItem])
    setItemForm({
      prName: '',
      materialType: '',
      businessPartnerId: '',
      warehouseId: '',
      shippingAddress: '',
      billingAddress: '',
      description: '',
      materialId: '',
      requestedQuantity: '',
      remarks: '',
      unitPrice: '',
      gstPercentage: '',
      sgstPercentage: '',
      uom: '',
    })
    setIsAddItemModalOpen(false)
    toast.success('Item added successfully')
  }

  const handleDeleteItem = (itemId) => {
    setRequestedItems(requestedItems.filter((item) => item.id !== itemId))
    toast.success('Item removed')
  }

  const handleSave = async () => {
    if (requestedItems.length === 0) {
      toast.error('Please add at least one requested item')
      return
    }

    // Validate ID for edit mode
    if (isEditMode) {
      if (!id || id === 'new') {
        toast.error('Invalid purchase request ID')
        return
      }
      // Validate UUID format
      if (!UUID_REGEX.test(id)) {
        toast.error('Invalid purchase request ID format. Please navigate from the purchase request list.')
        console.error('Invalid UUID format:', id)
        return
      }
    }

    try {
      setLoading(true)
      
      const requestData = {
        prNumber: formData.prNumber || undefined,
        requestedDate: formData.requestedDate,
        items: requestedItems.map(item => ({
          prName: item.prName,
          materialType: item.materialType && item.materialType.trim() ? item.materialType.trim() : undefined,
          businessPartnerId: item.businessPartnerId || undefined,
          shippingAddress: item.shippingAddress || undefined,
          billingAddress: item.billingAddress || undefined,
          description: item.description || undefined,
          materialId: item.materialId || undefined,
          requestedQuantity: item.requestedQuantity || 1,
          remarks: item.remarks || undefined,
        })),
      }

      let response
      if (isEditMode) {
        if (!id) {
          toast.error('Purchase request ID is required for update')
          return
        }
        response = await purchaseRequestService.update(id, requestData)
      } else {
        response = await purchaseRequestService.create(requestData)
      }

      if (response.success) {
        toast.success(`Purchase request ${isEditMode ? 'updated' : 'created'} successfully!`)
        // If creating new PR, navigate to edit mode so user can submit it
        if (isEditMode) {
          // After update, refresh the PR data to get updated status
          await fetchPurchaseRequest()
        } else {
          // For new PRs, get the ID and navigate to edit mode
          const prId = response.data?.purchaseRequest?.pr_id || response.data?.data?.pr_id || response.data?.purchaseRequest?.id || response.data?.data?.id
          if (prId) {
            // Navigate to edit mode so user can submit
            navigate(`/purchase-request/${prId}`, { replace: true })
          } else {
            navigate('/purchase-request')
          }
        }
      } else {
        // Handle validation errors from backend
        if (response.errors && Array.isArray(response.errors)) {
          const errorMessages = response.errors.map(err => err.message || err.msg).join(', ')
          toast.error(errorMessages || response.message || `Failed to ${isEditMode ? 'update' : 'create'} purchase request`)
        } else {
          toast.error(response.message || `Failed to ${isEditMode ? 'update' : 'create'} purchase request`)
        }
      }
    } catch (error) {
      console.error('Error saving purchase request:', error)
      // Handle error response with validation errors (from handleApiError wrapper)
      if (error.errors && Array.isArray(error.errors)) {
        const errorMessages = error.errors.map(err => err.message || err.msg || err).join(', ')
        toast.error(errorMessages || error.message || `Failed to ${isEditMode ? 'update' : 'create'} purchase request`)
      } else if (error.message) {
        toast.error(error.message || `Failed to ${isEditMode ? 'update' : 'create'} purchase request`)
      } else {
        toast.error(`Failed to ${isEditMode ? 'update' : 'create'} purchase request`)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async () => {
    if (requestedItems.length === 0) {
      toast.error('Please add at least one requested item')
      return
    }

    try {
      setLoading(true)
      const response = await purchaseRequestService.submit(id)
      if (response.success) {
        toast.success('Purchase request submitted successfully!')
        // Update status to SUBMITTED
        setPrStatus('SUBMITTED')
        // Navigate back to list
        navigate('/purchase-request')
      } else {
        // Handle validation errors from backend
        if (response.errors && Array.isArray(response.errors)) {
          const errorMessages = response.errors.map(err => err.message || err.msg).join(', ')
          toast.error(errorMessages || response.message || 'Failed to submit purchase request')
        } else {
          toast.error(response.message || 'Failed to submit purchase request')
        }
      }
    } catch (error) {
      console.error('Error submitting purchase request:', error)
      // Handle error response with validation errors
      if (error.errors && Array.isArray(error.errors)) {
        const errorMessages = error.errors.map(err => err.message || err.msg || err).join(', ')
        toast.error(errorMessages || error.message || 'Failed to submit purchase request')
      } else if (error.message) {
        toast.error(error.message || 'Failed to submit purchase request')
      } else {
        toast.error('Failed to submit purchase request')
      }
    } finally {
      setLoading(false)
    }
  }

  // Calculate grand totals
  const grandTotals = requestedItems.reduce((totals, item) => {
    totals.subtotal += item.subtotal || 0
    totals.gst += item.gstAmount || 0
    totals.sgst += item.sgstAmount || 0
    totals.total += item.itemTotal || 0
    return totals
  }, { subtotal: 0, gst: 0, sgst: 0, total: 0 })

  const itemColumns = [
    { key: 'prName', label: 'PR Name' },
    { key: 'materialType', label: 'Material Type' },
    { key: 'itemName', label: 'Material' },
    { key: 'businessPartnerName', label: 'Business Partner' },
    { 
      key: 'requestedQuantity', 
      label: 'Qty',
      render: (row) => `${row.requestedQuantity || 0} ${row.uom || ''}`
    },
    { 
      key: 'unitPrice', 
      label: 'Unit Price',
      render: (row) => `₹${(row.unitPrice || 0).toFixed(2)}`
    },
    { 
      key: 'subtotal', 
      label: 'Subtotal',
      render: (row) => `₹${(row.subtotal || 0).toFixed(2)}`
    },
    { 
      key: 'gst', 
      label: `GST`,
      render: (row) => row.gstPercentage ? `₹${(row.gstAmount || 0).toFixed(2)} (${row.gstPercentage.toFixed(2)}%)` : '-'
    },
    { 
      key: 'sgst', 
      label: `SGST`,
      render: (row) => row.sgstPercentage ? `₹${(row.sgstAmount || 0).toFixed(2)} (${row.sgstPercentage.toFixed(2)}%)` : '-'
    },
    { 
      key: 'itemTotal', 
      label: 'Total',
      render: (row) => <span className="font-semibold">₹{(row.itemTotal || 0).toFixed(2)}</span>
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        (prStatus === 'DRAFT' || !isEditMode) && (
          <button
            onClick={() => handleDeleteItem(row.id)}
            className="p-1 text-red-600 hover:bg-red-50 rounded"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )
      ),
    },
  ]

  return (
    <div className="p-6">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" onClick={() => navigate('/purchase-request')} icon={<ArrowLeft className="w-4 h-4" />}>
          Back
        </Button>
        <h1 className="text-2xl font-bold text-gray-800">
          {isEditMode ? 'Edit Purchase Request' : 'Create Purchase Request'}
        </h1>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Input
              label="PR Number"
              value={formData.prNumber}
              onChange={(e) => {
                // Allow manual override if needed, but will regenerate on date change
                if (!isEditMode) {
                  setFormData({ ...formData, prNumber: e.target.value })
                }
              }}
              placeholder={generatingPRNumber ? "Generating..." : "Auto-generated based on date"}
              disabled={isEditMode || generatingPRNumber || prStatus !== 'DRAFT'}
              icon={generatingPRNumber ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            />
            <p className="text-xs text-gray-500 mt-1">
              {generatingPRNumber 
                ? "Generating PR number..." 
                : "Format: PR-MONTH-YEAR-order (e.g., PR-AUG-2025-001). Auto-updates when date changes."}
            </p>
          </div>
          <div>
            <Input
              label="Requested Date"
              type="date"
              value={formData.requestedDate}
              onChange={(e) => handleDateChange(e.target.value)}
              disabled={generatingPRNumber || (isEditMode && prStatus !== 'DRAFT')}
            />
            {generatingPRNumber && (
              <p className="text-xs text-blue-500 mt-1">Generating PR number...</p>
            )}
          </div>
        </div>

        <div className="border-t pt-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Requested Items</h2>
            {(prStatus === 'DRAFT' || !isEditMode) && (
              <Button onClick={() => setIsAddItemModalOpen(true)} icon={<Plus className="w-4 h-4" />}>
                Add Item
              </Button>
            )}
          </div>

          {requestedItems.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No items added yet</p>
          ) : (
            <>
              <Table data={requestedItems} columns={itemColumns} />
              <div className="mt-4 pt-4 border-t">
                <div className="flex justify-end">
                  <div className="w-full max-w-md space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Subtotal:</span>
                      <span className="font-medium">₹{grandTotals.subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">GST:</span>
                      <span className="font-medium">₹{grandTotals.gst.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">SGST:</span>
                      <span className="font-medium">₹{grandTotals.sgst.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold border-t border-gray-300 pt-2">
                      <span>Grand Total:</span>
                      <span>₹{grandTotals.total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="flex gap-4 pt-4 border-t">
          {(prStatus === 'DRAFT' || !isEditMode) && (
            <Button onClick={handleSave} disabled={loading} icon={loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}>
              {isEditMode ? 'Save Draft' : 'Save Draft'}
            </Button>
          )}
          {isEditMode && prStatus === 'DRAFT' && (
            <Button onClick={handleSubmit} disabled={loading} variant="primary">
              Submit for Approval
            </Button>
          )}
          {isEditMode && prStatus !== 'DRAFT' && (
            <div className="px-3 py-2 text-sm text-gray-600 bg-gray-50 rounded-md border border-gray-200">
              Status: <span className="font-medium">{prStatus}</span> - Purchase Request cannot be edited after submission
            </div>
          )}
          <Button onClick={() => navigate('/purchase-request')} variant="outline">
            {isEditMode && prStatus !== 'DRAFT' ? 'Back' : 'Cancel'}
          </Button>
        </div>
      </div>

      <Modal
        isOpen={isAddItemModalOpen}
        onClose={() => setIsAddItemModalOpen(false)}
        title="Add Purchase Request Item"
        size="md"
      >
        <div className="space-y-3">
          <Input
            label="PR Name"
            required
            value={itemForm.prName}
            onChange={(e) => setItemForm({ ...itemForm, prName: e.target.value })}
            placeholder="Name of the product requested"
          />
          <div className="grid grid-cols-2 gap-3">
            <Dropdown
              label="Material Type"
              required
              options={materialTypeOptions}
              value={itemForm.materialType}
              onChange={(e) => setItemForm({ ...itemForm, materialType: e.target.value })}
            />
            <Dropdown
              label="Material (Optional)"
              options={materialOptions}
              value={itemForm.materialId}
              onChange={(e) => handleMaterialChange(e.target.value)}
            />
          </div>
          <Dropdown
            label="Business Partner"
            options={businessPartnerOptions}
            value={itemForm.businessPartnerId}
            onChange={(e) => setItemForm({ ...itemForm, businessPartnerId: e.target.value })}
          />
          <Dropdown
            label="Warehouse"
            options={warehouseOptions}
            value={itemForm.warehouseId}
            onChange={(e) => handleWarehouseChange(e.target.value)}
          />
          <Input
            label="Billing Address"
            value={itemForm.billingAddress}
            disabled={true}
            className="bg-gray-100 text-gray-600"
            placeholder="Auto-populated from warehouse"
          />
          <Input
            label="Shipping Address"
            value={itemForm.shippingAddress}
            disabled={true}
            className="bg-gray-100 text-gray-600"
            placeholder="Auto-populated from warehouse"
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Requested Quantity"
              type="number"
              value={itemForm.requestedQuantity}
              onChange={(e) => setItemForm({ ...itemForm, requestedQuantity: e.target.value })}
              min="1"
              placeholder="Optional"
            />
            <Input
              label="UOM"
              value={itemForm.uom}
              disabled={true}
              className="bg-gray-100 text-gray-600"
              placeholder="Auto-populated from material"
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Input
              label="Unit Price"
              type="number"
              step="0.01"
              value={itemForm.unitPrice}
              onChange={(e) => setItemForm({ ...itemForm, unitPrice: e.target.value })}
              placeholder="Auto-populated from material"
            />
            <Input
              label="GST %"
              type="number"
              step="0.01"
              value={itemForm.gstPercentage}
              onChange={(e) => setItemForm({ ...itemForm, gstPercentage: e.target.value })}
              placeholder="Auto-populated from material"
            />
            <Input
              label="SGST %"
              type="number"
              step="0.01"
              value={itemForm.sgstPercentage}
              onChange={(e) => setItemForm({ ...itemForm, sgstPercentage: e.target.value })}
              placeholder="Auto-populated from material"
            />
          </div>
          {itemForm.requestedQuantity && itemForm.unitPrice && (
            <div className="bg-gray-50 p-3 rounded-md border border-gray-200">
              <div className="text-sm font-medium text-gray-700 mb-2">Price Calculation:</div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-medium">₹{((parseFloat(itemForm.requestedQuantity) || 0) * (parseFloat(itemForm.unitPrice) || 0)).toFixed(2)}</span>
                </div>
                {itemForm.gstPercentage && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">GST ({itemForm.gstPercentage}%):</span>
                    <span className="font-medium">₹{(((parseFloat(itemForm.requestedQuantity) || 0) * (parseFloat(itemForm.unitPrice) || 0)) * (parseFloat(itemForm.gstPercentage) || 0) / 100).toFixed(2)}</span>
                  </div>
                )}
                {itemForm.sgstPercentage && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">SGST ({itemForm.sgstPercentage}%):</span>
                    <span className="font-medium">₹{(((parseFloat(itemForm.requestedQuantity) || 0) * (parseFloat(itemForm.unitPrice) || 0)) * (parseFloat(itemForm.sgstPercentage) || 0) / 100).toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-gray-300 pt-1 mt-1">
                  <span className="font-medium text-gray-900">Total:</span>
                  <span className="font-bold text-gray-900">
                    ₹{(
                      ((parseFloat(itemForm.requestedQuantity) || 0) * (parseFloat(itemForm.unitPrice) || 0)) +
                      (((parseFloat(itemForm.requestedQuantity) || 0) * (parseFloat(itemForm.unitPrice) || 0)) * (parseFloat(itemForm.gstPercentage) || 0) / 100) +
                      (((parseFloat(itemForm.requestedQuantity) || 0) * (parseFloat(itemForm.unitPrice) || 0)) * (parseFloat(itemForm.sgstPercentage) || 0) / 100)
                    ).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          )}
          <Input
            label="Description"
            value={itemForm.description}
            onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })}
            placeholder="Optional description"
          />
          <Input
            label="Remarks"
            value={itemForm.remarks}
            onChange={(e) => setItemForm({ ...itemForm, remarks: e.target.value })}
            placeholder="Optional"
          />
          <div className="flex gap-2 justify-end pt-2">
            <Button onClick={() => setIsAddItemModalOpen(false)} variant="outline">
              Cancel
            </Button>
            <Button onClick={handleAddItem}>
              Add Item
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default PurchaseRequestDetails
