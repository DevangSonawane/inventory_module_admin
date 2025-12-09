import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Plus, Trash2, Loader2 } from 'lucide-react'
import { toast } from 'react-toastify'
import Button from '../components/common/Button'
import Input from '../components/common/Input'
import Dropdown from '../components/common/Dropdown'
import Modal from '../components/common/Modal'
import Table from '../components/common/Table'
import Pagination from '../components/common/Pagination'
import { materialRequestService } from '../services/materialRequestService.js'
import { materialService } from '../services/materialService.js'
import { stockAreaService } from '../services/stockAreaService.js'

const MaterialRequestDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEditMode = id && id !== 'new'
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [loading, setLoading] = useState(false)
  const [materials, setMaterials] = useState([])
  const [stockAreas, setStockAreas] = useState([])
  const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false)

  const [prFields, setPrFields] = useState([
    { id: 1, prNumber: '', prDate: '' },
  ])

  const [formData, setFormData] = useState({
    ticketId: '',
    fromStockArea: '',
  })

  const [requestedItems, setRequestedItems] = useState([])
  
  const [itemForm, setItemForm] = useState({
    materialId: '',
    requestedQuantity: '',
    uom: '',
    remarks: '',
  })

  // Fetch materials on mount
  useEffect(() => {
    fetchMaterials()
    fetchStockAreas()
    if (isEditMode) {
      fetchMaterialRequest()
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

  const fetchStockAreas = async () => {
    try {
      const response = await stockAreaService.getAll({ limit: 100 })
      if (response.success) {
        setStockAreas(response.data?.stockAreas || response.data?.data || [])
      }
    } catch (error) {
      console.error('Error fetching stock areas:', error)
      setStockAreas([])
    }
  }

  const fetchMaterialRequest = async () => {
    try {
      setLoading(true)
      const response = await materialRequestService.getById(id)
      if (response.success) {
        const request = response.data?.materialRequest || response.data?.data
        if (request) {
          // Set form data
          setFormData({
            ticketId: request.ticket_id || '',
            fromStockArea: request.from_stock_area_id || '',
          })
          
          // Set PR fields
          if (request.pr_numbers && Array.isArray(request.pr_numbers)) {
            setPrFields(request.pr_numbers.map((pr, index) => ({
              id: index + 1,
              prNumber: pr.prNumber || '',
              prDate: pr.prDate || '',
            })))
          }
          
          // Set requested items
          if (request.items && Array.isArray(request.items)) {
            setRequestedItems(request.items.map((item, index) => ({
              id: item.item_id || index,
              materialId: item.material_id,
              itemName: item.material?.material_name || '-',
              properties: item.material?.product_code || '-',
              requestedQuantity: item.requested_quantity,
              qtyToApprove: item.approved_quantity || item.requested_quantity,
              uom: item.uom || 'PIECE(S)',
              remarks: item.remarks || '',
            })))
          }
        }
      }
    } catch (error) {
      console.error('Error fetching material request:', error)
      toast.error('Failed to load material request')
    } finally {
      setLoading(false)
    }
  }

  const materialOptions = [
    { value: '', label: 'Select Material' },
    ...materials.map(material => ({
      value: material.material_id,
      label: material.material_name
    }))
  ]

  const handleAddPrField = () => {
    setPrFields([
      ...prFields,
      { id: Date.now(), prNumber: 'PR-SEP-2025-23', prDate: '' },
    ])
  }


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
      properties: selectedMaterial.product_code || '-',
      requestedQuantity: parseInt(itemForm.requestedQuantity),
      qtyToApprove: parseInt(itemForm.requestedQuantity), // Default to requested quantity
      uom: itemForm.uom || selectedMaterial.uom || 'PIECE(S)',
      remarks: itemForm.remarks || '',
    }
    
    setRequestedItems([...requestedItems, newItem])
    setItemForm({
      materialId: '',
      requestedQuantity: '',
      uom: '',
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
    if (prFields.some(f => !f.prNumber)) {
      toast.error('Please fill all PR Number fields')
      return
    }
    if (requestedItems.length === 0) {
      toast.error('Please add at least one requested item')
      return
    }

    try {
      setLoading(true)
      
      const requestData = {
        ticketId: formData.ticketId || undefined,
        fromStockAreaId: formData.fromStockArea || undefined,
        prNumbers: prFields.map(f => ({
          prNumber: f.prNumber,
          prDate: f.prDate || new Date().toISOString().split('T')[0],
        })),
        items: requestedItems.map(item => ({
          materialId: item.materialId,
          requestedQuantity: item.requestedQuantity,
          uom: item.uom,
          remarks: item.remarks || undefined,
        })),
      }

      let response
      if (isEditMode) {
        response = await materialRequestService.update(id, requestData)
      } else {
        response = await materialRequestService.create(requestData)
      }

      if (response.success) {
        toast.success(`Material request ${isEditMode ? 'updated' : 'created'} successfully!`)
        navigate('/material-request')
      }
    } catch (error) {
      console.error('Error saving material request:', error)
      toast.error(error.message || `Failed to ${isEditMode ? 'update' : 'create'} material request`)
    } finally {
      setLoading(false)
    }
  }

  const paginatedItems = requestedItems.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )
  const totalPages = Math.ceil(requestedItems.length / itemsPerPage)

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Basic Details</h2>
        
        <div className="grid grid-cols-2 gap-6 mb-6">
          <Input
            label="Ticket ID (Optional)"
            placeholder="e.g., TKT-55S"
            value={formData.ticketId}
            onChange={(e) => setFormData({ ...formData, ticketId: e.target.value })}
          />
          <Dropdown
            label="From Stock Area"
            options={[
              { value: '', label: 'Select Stock Area' },
              ...stockAreas.map(area => ({
                value: area.area_id,
                label: area.area_name
              }))
            ]}
            value={formData.fromStockArea}
            onChange={(e) => setFormData({ ...formData, fromStockArea: e.target.value })}
          />
          {prFields.map((field, index) => (
            <div key={field.id} className="space-y-4">
              <Input
                label="PR Number"
                required
                value={field.prNumber}
                onChange={(e) =>
                  setPrFields(
                    prFields.map((f) =>
                      f.id === field.id ? { ...f, prNumber: e.target.value } : f
                    )
                  )
                }
              />
              <Input
                label="PR Date"
                placeholder="Enter PR Date"
                type="date"
                value={field.prDate}
                onChange={(e) =>
                  setPrFields(
                    prFields.map((f) =>
                      f.id === field.id ? { ...f, prDate: e.target.value } : f
                    )
                  )
                }
              />
            </div>
          ))}
        </div>

        <div className="border-t border-gray-200 pt-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Requested Items</h2>
            <Button variant="primary" onClick={() => setIsAddItemModalOpen(true)}>
              <Plus className="w-4 h-4 mr-2 inline" />
              Add
            </Button>
          </div>

          <Table
            headers={['ITEM NAME', 'PROPERTIES', 'REQUESTED QUANTITY', 'QTY TO APPROVE', 'UOM', 'ACTIONS']}
          >
            {paginatedItems.length > 0 ? (
              paginatedItems.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.itemName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.properties}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.requestedQuantity}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.qtyToApprove}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.uom}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button
                      onClick={() => handleDeleteItem(item.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                  No items added yet. Click "Add" to add items.
                </td>
              </tr>
            )}
          </Table>

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages || 1}
            itemsPerPage={itemsPerPage}
            totalItems={requestedItems.length}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={setItemsPerPage}
          />
        </div>

        <div className="flex gap-4 justify-end mt-6 pt-6 border-t border-gray-200">
          <Button variant="gray" onClick={() => navigate('/material-request')}>
            Cancel
          </Button>
          <Button 
            variant="success"
            onClick={handleSave}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 inline animate-spin" />
                Saving...
              </>
            ) : (
              'Save'
            )}
          </Button>
        </div>
      </div>

      {/* Add Item Modal */}
      <Modal
        isOpen={isAddItemModalOpen}
        onClose={() => {
          setIsAddItemModalOpen(false)
          setItemForm({
            materialId: '',
            requestedQuantity: '',
            uom: '',
            remarks: '',
          })
        }}
        title="Add Requested Item"
        size="md"
      >
        <div className="space-y-4">
          <Dropdown
            label="Material"
            required
            options={materialOptions}
            value={itemForm.materialId}
            onChange={(e) => {
              const selectedMaterial = materials.find(m => m.material_id === e.target.value)
              setItemForm({
                ...itemForm,
                materialId: e.target.value,
                uom: selectedMaterial?.uom || '',
              })
            }}
          />
          <Input
            label="Requested Quantity"
            required
            type="number"
            value={itemForm.requestedQuantity}
            onChange={(e) => setItemForm({ ...itemForm, requestedQuantity: e.target.value })}
          />
          <Input
            label="UOM"
            value={itemForm.uom}
            onChange={(e) => setItemForm({ ...itemForm, uom: e.target.value })}
            placeholder="PIECE(S)"
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Remarks
            </label>
            <textarea
              value={itemForm.remarks}
              onChange={(e) => setItemForm({ ...itemForm, remarks: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
            />
          </div>
          <div className="flex gap-4 justify-end pt-4">
            <Button 
              variant="gray" 
              onClick={() => {
                setIsAddItemModalOpen(false)
                setItemForm({
                  materialId: '',
                  requestedQuantity: '',
                  uom: '',
                  remarks: '',
                })
              }}
            >
              Cancel
            </Button>
            <Button variant="primary" onClick={handleAddItem}>
              Add Item
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default MaterialRequestDetails
