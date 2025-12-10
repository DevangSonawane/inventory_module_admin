import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Plus, Trash2, Loader2, Package, CheckCircle } from 'lucide-react'
import { toast } from 'react-toastify'
import Button from '../components/common/Button'
import Input from '../components/common/Input'
import Dropdown from '../components/common/Dropdown'
import Modal from '../components/common/Modal'
import Table from '../components/common/Table'
import Pagination from '../components/common/Pagination'
import Badge from '../components/common/Badge'
import { materialRequestService } from '../services/materialRequestService.js'
import { materialService } from '../services/materialService.js'
import { stockAreaService } from '../services/stockAreaService.js'
import { materialAllocationService } from '../services/materialAllocationService.js'

const MaterialRequestDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEditMode = id && id !== 'new'
  const [activeTab, setActiveTab] = useState('details')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [loading, setLoading] = useState(false)
  const [materials, setMaterials] = useState([])
  const [stockAreas, setStockAreas] = useState([])
  const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false)
  
  // Allocation state
  const [availableStock, setAvailableStock] = useState([])
  const [allocations, setAllocations] = useState([])
  const [allocationLoading, setAllocationLoading] = useState(false)
  const [selectedItems, setSelectedItems] = useState({}) // { inventoryId: true/false }
  const [allocationFilters, setAllocationFilters] = useState({
    stockAreaId: '',
    materialId: '',
  })
  const [materialRequestStatus, setMaterialRequestStatus] = useState(null)

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
          // Set status
          setMaterialRequestStatus(request.status || request.request_status)
          
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
          
          // Fetch allocations if approved
          if (request.status === 'APPROVED' || request.request_status === 'APPROVED') {
            fetchAllocations()
            fetchAvailableStock()
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
  
  const fetchAvailableStock = async () => {
    if (!id || id === 'new') return
    
    try {
      setAllocationLoading(true)
      const response = await materialAllocationService.getAvailableStock(id, allocationFilters)
      if (response.success) {
        setAvailableStock(response.data?.availableStock || [])
      }
    } catch (error) {
      console.error('Error fetching available stock:', error)
      toast.error('Failed to load available stock')
    } finally {
      setAllocationLoading(false)
    }
  }
  
  const fetchAllocations = async () => {
    if (!id || id === 'new') return
    
    try {
      const response = await materialAllocationService.getAllocations(id)
      if (response.success) {
        setAllocations(response.data?.allocations || [])
      }
    } catch (error) {
      console.error('Error fetching allocations:', error)
    }
  }
  
  useEffect(() => {
    if (activeTab === 'allocation' && id && id !== 'new' && materialRequestStatus === 'APPROVED') {
      fetchAvailableStock()
      fetchAllocations()
    }
  }, [activeTab, allocationFilters, id, materialRequestStatus])

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

  const handleAllocate = async () => {
    if (!id || id === 'new') return
    
    const selectedInventoryIds = Object.keys(selectedItems).filter(key => selectedItems[key])
    if (selectedInventoryIds.length === 0) {
      toast.error('Please select at least one item to allocate')
      return
    }
    
    try {
      setAllocationLoading(true)
      
      // Group selected inventory items by material
      const inventoryByMaterial = {}
      
      // Find selected items in available stock
      availableStock.forEach(group => {
        group.items.forEach(item => {
          if (selectedItems[item.inventory_id]) {
            const materialId = group.material?.material_id
            if (!inventoryByMaterial[materialId]) {
              inventoryByMaterial[materialId] = []
            }
            inventoryByMaterial[materialId].push(item.inventory_id)
          }
        })
      })
      
      // Map to material request items
      const allocations = []
      requestedItems.forEach(requestItem => {
        const materialId = requestItem.materialId
        const inventoryIds = inventoryByMaterial[materialId] || []
        
        if (inventoryIds.length > 0) {
          allocations.push({
            materialRequestItemId: requestItem.id, // This should be the item_id from backend
            inventoryMasterIds: inventoryIds
          })
        }
      })
      
      if (allocations.length === 0) {
        toast.error('No matching items found for allocation')
        return
      }
      
      const response = await materialAllocationService.allocate(id, allocations)
      if (response.success) {
        toast.success('Items allocated successfully')
        setSelectedItems({})
        fetchAvailableStock()
        fetchAllocations()
      }
    } catch (error) {
      console.error('Error allocating items:', error)
      toast.error(error.message || 'Failed to allocate items')
    } finally {
      setAllocationLoading(false)
    }
  }
  
  const handleToggleItemSelection = (inventoryId) => {
    setSelectedItems(prev => ({
      ...prev,
      [inventoryId]: !prev[inventoryId]
    }))
  }
  
  const handleSelectAllForMaterial = (materialKey) => {
    const group = availableStock.find(g => 
      `${g.material?.material_id}_${g.stockArea?.area_id}` === materialKey
    )
    if (!group) return
    
    const allSelected = group.items.every(item => selectedItems[item.inventory_id])
    const newSelection = { ...selectedItems }
    
    group.items.forEach(item => {
      newSelection[item.inventory_id] = !allSelected
    })
    
    setSelectedItems(newSelection)
  }

  const paginatedItems = requestedItems.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )
  const totalPages = Math.ceil(requestedItems.length / itemsPerPage)

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab('details')}
              className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
                activeTab === 'details'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Basic Details
            </button>
            {isEditMode && (materialRequestStatus === 'APPROVED' || materialRequestStatus === 'APPROVED') && (
              <button
                onClick={() => setActiveTab('allocation')}
                className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors flex items-center gap-2 ${
                  activeTab === 'allocation'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                <Package className="w-4 h-4" />
                Allocation
                {allocations.length > 0 && (
                  <Badge variant="success" className="ml-1">{allocations.length}</Badge>
                )}
              </button>
            )}
          </nav>
        </div>
        
        {activeTab === 'details' && (
          <>
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
        </>
        )}
        
        {/* Allocation Tab */}
        {activeTab === 'allocation' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Allocate Items</h2>
              <div className="flex gap-3">
                <Button
                  variant="primary"
                  onClick={handleAllocate}
                  disabled={allocationLoading || Object.values(selectedItems).filter(Boolean).length === 0}
                >
                  {allocationLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 inline animate-spin" />
                      Allocating...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Allocate Selected ({Object.values(selectedItems).filter(Boolean).length})
                    </>
                  )}
                </Button>
              </div>
            </div>
            
            {/* Filters */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <Dropdown
                label="Filter by Stock Area"
                options={[
                  { value: '', label: 'All Stock Areas' },
                  ...stockAreas.map(area => ({
                    value: area.area_id || area.id,
                    label: area.area_name || area.name
                  }))
                ]}
                value={allocationFilters.stockAreaId}
                onChange={(e) => {
                  setAllocationFilters({ ...allocationFilters, stockAreaId: e.target.value })
                  setCurrentPage(1)
                }}
              />
              <Dropdown
                label="Filter by Material"
                options={[
                  { value: '', label: 'All Materials' },
                  ...materials.map(m => ({
                    value: m.material_id,
                    label: m.material_name
                  }))
                ]}
                value={allocationFilters.materialId}
                onChange={(e) => {
                  setAllocationFilters({ ...allocationFilters, materialId: e.target.value })
                  setCurrentPage(1)
                }}
              />
            </div>
            
            {allocationLoading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                <span className="ml-2 text-gray-600">Loading available stock...</span>
              </div>
            ) : availableStock.length > 0 ? (
              <div className="space-y-6">
                {availableStock.map((group, groupIndex) => {
                  const materialKey = `${group.material?.material_id}_${group.stockArea?.area_id}`
                  const allSelected = group.items.every(item => selectedItems[item.inventory_id])
                  const someSelected = group.items.some(item => selectedItems[item.inventory_id])
                  
                  return (
                    <div key={materialKey || groupIndex} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            {group.material?.material_name || 'Unknown Material'}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {group.material?.product_code || ''} • {group.stockArea?.area_name || 'Unknown Location'} • 
                            Available: {group.totalQuantity} {group.material?.uom || 'items'}
                          </p>
                        </div>
                        <button
                          onClick={() => handleSelectAllForMaterial(materialKey)}
                          className={`px-3 py-1 text-sm rounded ${
                            allSelected
                              ? 'bg-blue-600 text-white'
                              : someSelected
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {allSelected ? 'Deselect All' : 'Select All'}
                        </button>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {group.items.map((item) => (
                          <div
                            key={item.inventory_id}
                            onClick={() => handleToggleItemSelection(item.inventory_id)}
                            className={`p-3 border-2 rounded-lg cursor-pointer transition-colors ${
                              selectedItems[item.inventory_id]
                                ? 'border-blue-600 bg-blue-50'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <input
                                    type="checkbox"
                                    checked={selectedItems[item.inventory_id] || false}
                                    onChange={() => handleToggleItemSelection(item.inventory_id)}
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                  />
                                  <span className="text-sm font-medium text-gray-900">
                                    {item.serial_number || `Item #${item.inventory_id?.substring(0, 8)}`}
                                  </span>
                                </div>
                                {item.mac_id && (
                                  <p className="text-xs text-gray-500">MAC: {item.mac_id}</p>
                                )}
                                <p className="text-xs text-gray-500 mt-1">
                                  Status: <Badge variant="success" className="text-xs">AVAILABLE</Badge>
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <Package className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p>No available stock found for allocation</p>
                <p className="text-sm mt-2">Try adjusting the filters or ensure items are in warehouse stock</p>
              </div>
            )}
            
            {/* Existing Allocations */}
            {allocations.length > 0 && (
              <div className="mt-8 border-t border-gray-200 pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Existing Allocations</h3>
                <Table
                  headers={['SERIAL NUMBER', 'MAC ID', 'MATERIAL', 'STOCK AREA', 'ALLOCATED DATE', 'STATUS']}
                >
                  {allocations.map((allocation) => (
                    <tr key={allocation.allocation_id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {allocation.inventory?.serial_number || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {allocation.inventory?.mac_id || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {allocation.inventory?.material?.material_name || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {allocation.inventory?.stockAreaLocation?.area_name || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {allocation.created_at ? new Date(allocation.created_at).toLocaleDateString() : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <Badge variant="primary">ALLOCATED</Badge>
                      </td>
                    </tr>
                  ))}
                </Table>
              </div>
            )}
          </div>
        )}
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
