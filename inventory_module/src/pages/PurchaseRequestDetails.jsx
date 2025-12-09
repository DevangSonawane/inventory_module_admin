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

const PurchaseRequestDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEditMode = id && id !== 'new'
  const [loading, setLoading] = useState(false)
  const [materials, setMaterials] = useState([])
  const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false)

  const [formData, setFormData] = useState({
    prNumber: '',
    requestedDate: new Date().toISOString().split('T')[0],
  })

  const [requestedItems, setRequestedItems] = useState([])
  
  const [itemForm, setItemForm] = useState({
    materialId: '',
    requestedQuantity: '',
    remarks: '',
  })

  useEffect(() => {
    fetchMaterials()
    if (isEditMode) {
      fetchPurchaseRequest()
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
      toast.error('Failed to load materials')
      setMaterials([])
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
              materialId: item.material_id,
              itemName: item.material?.material_name || '-',
              productCode: item.material?.product_code || '-',
              requestedQuantity: item.requested_quantity,
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
    { value: '', label: 'Select Material' },
    ...materials.map(material => ({
      value: material.material_id,
      label: `${material.material_name} (${material.product_code})`
    }))
  ]

  const handleAddItem = () => {
    if (!itemForm.materialId || !itemForm.requestedQuantity) {
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
      requestedQuantity: parseInt(itemForm.requestedQuantity),
      uom: selectedMaterial.uom || 'PIECE(S)',
      remarks: itemForm.remarks || '',
    }
    
    setRequestedItems([...requestedItems, newItem])
    setItemForm({
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

    try {
      setLoading(true)
      
      const requestData = {
        prNumber: formData.prNumber || undefined,
        requestedDate: formData.requestedDate,
        items: requestedItems.map(item => ({
          materialId: item.materialId,
          requestedQuantity: item.requestedQuantity,
          remarks: item.remarks || undefined,
        })),
      }

      let response
      if (isEditMode) {
        response = await purchaseRequestService.update(id, requestData)
      } else {
        response = await purchaseRequestService.create(requestData)
      }

      if (response.success) {
        toast.success(`Purchase request ${isEditMode ? 'updated' : 'created'} successfully!`)
        navigate('/purchase-request')
      }
    } catch (error) {
      console.error('Error saving purchase request:', error)
      toast.error(error.message || `Failed to ${isEditMode ? 'update' : 'create'} purchase request`)
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
    { key: 'itemName', label: 'Material Name' },
    { key: 'productCode', label: 'Product Code' },
    { key: 'requestedQuantity', label: 'Quantity' },
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
          <Input
            label="PR Number"
            value={formData.prNumber}
            onChange={(e) => setFormData({ ...formData, prNumber: e.target.value })}
            placeholder="Auto-generated if left empty"
          />
          <Input
            label="Requested Date"
            type="date"
            value={formData.requestedDate}
            onChange={(e) => setFormData({ ...formData, requestedDate: e.target.value })}
          />
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
        title="Add Item"
      >
        <div className="space-y-4">
          <Dropdown
            label="Material"
            options={materialOptions}
            value={itemForm.materialId}
            onChange={(e) => {
              const material = materials.find(m => m.material_id === e.target.value)
              setItemForm({ ...itemForm, materialId: e.target.value })
            }}
          />
          <Input
            label="Requested Quantity"
            type="number"
            value={itemForm.requestedQuantity}
            onChange={(e) => setItemForm({ ...itemForm, requestedQuantity: e.target.value })}
            min="1"
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

export default PurchaseRequestDetails
