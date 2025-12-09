import { useState, useEffect } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { Plus, Trash2, Loader2, ArrowLeft } from 'lucide-react'
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

const PurchaseOrderDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const prId = new URLSearchParams(location.search).get('prId')
  const isEditMode = id && id !== 'new'
  const [loading, setLoading] = useState(false)
  const [materials, setMaterials] = useState([])
  const [vendors, setVendors] = useState([])
  const [purchaseRequests, setPurchaseRequests] = useState([])
  const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false)

  const [formData, setFormData] = useState({
    poNumber: '',
    poDate: new Date().toISOString().split('T')[0],
    vendorId: '',
    prId: prId || '',
  })

  const [orderItems, setOrderItems] = useState([])
  
  const [itemForm, setItemForm] = useState({
    materialId: '',
    quantity: '',
    unitPrice: '',
    remarks: '',
  })

  useEffect(() => {
    fetchMaterials()
    fetchVendors()
    if (prId) {
      fetchPRItems(prId)
    }
    if (isEditMode) {
      fetchPurchaseOrder()
    }
  }, [id, prId])

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

  const fetchPRItems = async (prId) => {
    try {
      const response = await purchaseRequestService.getById(prId)
      if (response.success && response.data?.purchaseRequest?.items) {
        const items = (response.data.purchaseRequest.items || []).map(item => ({
          id: Date.now() + Math.random(),
          materialId: item.material_id,
          itemName: item.material?.material_name || '-',
          productCode: item.material?.product_code || '-',
          quantity: item.requested_quantity,
          unitPrice: '',
          uom: item.material?.uom || 'PIECE(S)',
          remarks: item.remarks || '',
        }))
        setOrderItems(items)
        setFormData(prev => ({ ...prev, prId }))
      }
    } catch (error) {
      console.error('Error fetching PR items:', error)
      toast.error('Failed to load PR items')
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
          })
          
          if (po.items && Array.isArray(po.items)) {
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
    ...vendors.map(vendor => ({
      value: vendor.partner_id,
      label: vendor.partner_name
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

  const handleDeleteItem = (itemId) => {
    setOrderItems(orderItems.filter((item) => item.id !== itemId))
    toast.success('Item removed')
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
        toast.success(`Purchase order ${isEditMode ? 'updated' : 'created'} successfully!`)
        // Trigger multiple refresh mechanisms for reliability
        if (!isEditMode) {
          window.dispatchEvent(new CustomEvent('purchaseOrderCreated'))
          // Also use localStorage as a backup
          localStorage.setItem('purchaseOrderCreated', Date.now().toString())
          // Trigger storage event for cross-tab/window communication
          window.dispatchEvent(new StorageEvent('storage', {
            key: 'purchaseOrderCreated',
            newValue: Date.now().toString()
          }))
          
          // If we came from AddInward, navigate back and refresh
          if (sessionStorage.getItem('returnToInward') === 'true') {
            sessionStorage.removeItem('returnToInward')
            navigate('/add-inward')
          } else {
            navigate('/purchase-order')
          }
        } else {
          navigate('/purchase-order')
        }
      }
    } catch (error) {
      console.error('Error saving purchase order:', error)
      toast.error(error.message || `Failed to ${isEditMode ? 'update' : 'create'} purchase order`)
    } finally {
      setLoading(false)
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
        <button
          onClick={() => handleDeleteItem(row.id)}
          className="p-1 text-red-600 hover:bg-red-50 rounded"
        >
          <Trash2 className="w-4 h-4" />
        </button>
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
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="PO Number"
            value={formData.poNumber}
            onChange={(e) => setFormData({ ...formData, poNumber: e.target.value })}
            placeholder="Auto-generated if left empty"
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
        </div>

        <div className="border-t pt-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Order Items</h2>
            <Button onClick={() => setIsAddItemModalOpen(true)} icon={<Plus className="w-4 h-4" />}>
              Add Item
            </Button>
          </div>

          {orderItems.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No items added yet</p>
          ) : (
            <>
              <Table data={orderItems} columns={itemColumns} />
              <div className="mt-4 text-right">
                <p className="text-lg font-semibold">Total Amount: ₹{totalAmount.toFixed(2)}</p>
              </div>
            </>
          )}
        </div>

        <div className="flex gap-4 pt-4 border-t">
          <Button onClick={handleSave} disabled={loading} icon={loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}>
            {isEditMode ? 'Update' : 'Save'}
          </Button>
          <Button onClick={() => navigate('/purchase-order')} variant="outline">
            Cancel
          </Button>
        </div>
      </div>

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
          />
          <Input
            label="Quantity"
            type="number"
            value={itemForm.quantity}
            onChange={(e) => setItemForm({ ...itemForm, quantity: e.target.value })}
            min="1"
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
    </div>
  )
}

export default PurchaseOrderDetails
