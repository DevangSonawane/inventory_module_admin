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
  const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false)

  const [formData, setFormData] = useState({
    prNumber: '',
    requestedDate: new Date().toISOString().split('T')[0],
  })
  const [generatingPRNumber, setGeneratingPRNumber] = useState(false)

  const [requestedItems, setRequestedItems] = useState([])
  
  const [itemForm, setItemForm] = useState({
    prName: '',
    materialType: '',
    businessPartnerId: '',
    warehouseId: '',
    shippingAddress: '',
    description: '',
    materialId: '',
    requestedQuantity: '',
    remarks: '',
  })

  const materialTypeOptions = [
    { value: '', label: 'Select Material Type' },
    { value: 'components', label: 'Components' },
    { value: 'raw material', label: 'Raw Material' },
    { value: 'finish product', label: 'Finish Product' },
    { value: 'supportive material', label: 'Supportive Material' },
    { value: 'cable', label: 'Cable' },
  ]

  useEffect(() => {
    fetchMaterials()
    fetchBusinessPartners()
    fetchStockAreas()
    if (isEditMode) {
      fetchPurchaseRequest()
    } else {
      // Auto-generate PR number on initial load for new PR
      handleDateChange(new Date().toISOString().split('T')[0])
    }
  }, [id])

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
          setFormData({
            prNumber: pr.pr_number || '',
            requestedDate: pr.requested_date ? pr.requested_date.split('T')[0] : new Date().toISOString().split('T')[0],
          })
          
          if (pr.items && Array.isArray(pr.items)) {
            setRequestedItems(pr.items.map((item, index) => ({
              id: item.item_id || index,
              prName: item.pr_name || '',
              materialType: item.material_type || '',
              businessPartnerId: item.business_partner_id || '',
              businessPartnerName: item.businessPartner?.partner_name || '',
              warehouseId: '',
              shippingAddress: item.shipping_address || '',
              description: item.description || '',
              materialId: item.material_id || '',
              itemName: item.material?.material_name || '-',
              productCode: item.material?.product_code || '-',
              requestedQuantity: item.requested_quantity || 1,
              uom: item.material?.uom || 'PIECE(S)',
              remarks: item.remarks || '',
            })))
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

  const handleWarehouseChange = (warehouseId) => {
    const selectedWarehouse = stockAreas.find(area => area.area_id === warehouseId)
    setItemForm({
      ...itemForm,
      warehouseId: warehouseId,
      shippingAddress: selectedWarehouse?.address || ''
    })
  }

  const handleAddItem = () => {
    if (!itemForm.prName || !itemForm.materialType) {
      toast.error('Please fill PR Name and Material Type (required fields)')
      return
    }

    const selectedBusinessPartner = businessPartners.find(bp => bp.partner_id === itemForm.businessPartnerId)
    const selectedWarehouse = stockAreas.find(area => area.area_id === itemForm.warehouseId)
    const selectedMaterial = materials.find(m => m.material_id === itemForm.materialId)

    const newItem = {
      id: Date.now(),
      prName: itemForm.prName,
      materialType: itemForm.materialType,
      businessPartnerId: itemForm.businessPartnerId || null,
      businessPartnerName: selectedBusinessPartner?.partner_name || '',
      warehouseId: itemForm.warehouseId || null,
      shippingAddress: itemForm.shippingAddress || '',
      description: itemForm.description || '',
      materialId: itemForm.materialId || null,
      itemName: selectedMaterial?.material_name || '-',
      productCode: selectedMaterial?.product_code || '-',
      requestedQuantity: itemForm.requestedQuantity ? parseInt(itemForm.requestedQuantity) : 1,
      uom: selectedMaterial?.uom || 'PIECE(S)',
      remarks: itemForm.remarks || '',
    }
    
    setRequestedItems([...requestedItems, newItem])
    setItemForm({
      prName: '',
      materialType: '',
      businessPartnerId: '',
      warehouseId: '',
      shippingAddress: '',
      description: '',
      materialId: '',
      requestedQuantity: '',
      remarks: '',
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
          materialType: item.materialType,
          businessPartnerId: item.businessPartnerId || undefined,
          shippingAddress: item.shippingAddress || undefined,
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
        navigate('/purchase-request')
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
      await purchaseRequestService.submit(id)
      toast.success('Purchase request submitted successfully!')
      navigate('/purchase-request')
    } catch (error) {
      toast.error(error.message || 'Failed to submit purchase request')
    } finally {
      setLoading(false)
    }
  }

  const itemColumns = [
    { key: 'prName', label: 'PR Name' },
    { key: 'materialType', label: 'Material Type' },
    { key: 'businessPartnerName', label: 'Business Partner' },
    { key: 'shippingAddress', label: 'Shipping Address', render: (row) => (
      <span className="max-w-xs truncate block" title={row.shippingAddress}>
        {row.shippingAddress || '-'}
      </span>
    )},
    { key: 'description', label: 'Description', render: (row) => (
      <span className="max-w-xs truncate block" title={row.description}>
        {row.description || '-'}
      </span>
    )},
    { key: 'itemName', label: 'Material' },
    { key: 'requestedQuantity', label: 'Quantity' },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <button
          onClick={() => handleDeleteItem(row.id)}
          className="p-1 text-red-600 hover:bg-red-50 rounded"
        >
          <Trash2 className="w-4 h-4" />
        </button>
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
              disabled={isEditMode || generatingPRNumber}
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
              disabled={generatingPRNumber}
            />
            {generatingPRNumber && (
              <p className="text-xs text-blue-500 mt-1">Generating PR number...</p>
            )}
          </div>
        </div>

        <div className="border-t pt-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Requested Items</h2>
            <Button onClick={() => setIsAddItemModalOpen(true)} icon={<Plus className="w-4 h-4" />}>
              Add Item
            </Button>
          </div>

          {requestedItems.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No items added yet</p>
          ) : (
            <Table data={requestedItems} columns={itemColumns} />
          )}
        </div>

        <div className="flex gap-4 pt-4 border-t">
          <Button onClick={handleSave} disabled={loading} icon={loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}>
            {isEditMode ? 'Update' : 'Save Draft'}
          </Button>
          {isEditMode && (
            <Button onClick={handleSubmit} disabled={loading} variant="primary">
              Submit for Approval
            </Button>
          )}
          <Button onClick={() => navigate('/purchase-request')} variant="outline">
            Cancel
          </Button>
        </div>
      </div>

      <Modal
        isOpen={isAddItemModalOpen}
        onClose={() => setIsAddItemModalOpen(false)}
        title="Add Purchase Request Item"
        size="large"
      >
        <div className="space-y-4">
          <Input
            label="PR Name"
            required
            value={itemForm.prName}
            onChange={(e) => setItemForm({ ...itemForm, prName: e.target.value })}
            placeholder="Name of the product requested"
          />
          <Dropdown
            label="Material Type"
            required
            options={materialTypeOptions}
            value={itemForm.materialType}
            onChange={(e) => setItemForm({ ...itemForm, materialType: e.target.value })}
          />
          <Dropdown
            label="Business Partner"
            options={businessPartnerOptions}
            value={itemForm.businessPartnerId}
            onChange={(e) => setItemForm({ ...itemForm, businessPartnerId: e.target.value })}
          />
          <Dropdown
            label="Warehouse (Shipping Address)"
            options={warehouseOptions}
            value={itemForm.warehouseId}
            onChange={(e) => handleWarehouseChange(e.target.value)}
          />
          <Input
            label="Shipping Address"
            value={itemForm.shippingAddress}
            onChange={(e) => setItemForm({ ...itemForm, shippingAddress: e.target.value })}
            placeholder="Auto-filled from warehouse, can be edited"
            disabled={!itemForm.warehouseId}
          />
          <Input
            label="Description"
            value={itemForm.description}
            onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })}
            placeholder="Optional description"
          />
          <Dropdown
            label="Material (Optional)"
            options={materialOptions}
            value={itemForm.materialId}
            onChange={(e) => setItemForm({ ...itemForm, materialId: e.target.value })}
          />
          <Input
            label="Requested Quantity"
            type="number"
            value={itemForm.requestedQuantity}
            onChange={(e) => setItemForm({ ...itemForm, requestedQuantity: e.target.value })}
            min="1"
            placeholder="Optional"
          />
          <Input
            label="Remarks"
            value={itemForm.remarks}
            onChange={(e) => setItemForm({ ...itemForm, remarks: e.target.value })}
            placeholder="Optional"
          />
          <div className="flex gap-2 justify-end pt-4">
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
