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
import { groupService } from '../services/groupService.js'
import { teamService } from '../services/teamService.js'
import { userService } from '../services/userService.js'
import { useAuth } from '../utils/useAuth.js'
import { generateMRPreview } from '../utils/formatters.js'

const MaterialRequestDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const isEditMode = id && id !== 'new'
  const [activeTab, setActiveTab] = useState('details')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [loading, setLoading] = useState(false)
  const [materials, setMaterials] = useState([])
  const [stockAreas, setStockAreas] = useState([])
  const [groups, setGroups] = useState([])
  const [teams, setTeams] = useState([])
  const [users, setUsers] = useState([])
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
  const [mrNumber, setMrNumber] = useState('')

  const [mrFields, setMrFields] = useState([
    { id: 1, mrNumber: '', mrDate: '' },
  ])

  const [formData, setFormData] = useState({
    ticketId: '',
    fromStockArea: '',
    requestDate: new Date().toISOString().split('T')[0], // Default to current date
    requestorId: '',
    groupId: '',
    teamId: '',
    serviceArea: '',
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
    fetchGroups()
    fetchUsers()
    if (isEditMode) {
      fetchMaterialRequest()
    }
  }, [id])

  useEffect(() => {
    if (formData.groupId) {
      fetchTeamsByGroup(formData.groupId)
    } else {
      setTeams([])
      setFormData(prev => ({ ...prev, teamId: '' }))
    }
  }, [formData.groupId])

  // Update MR numbers when request date changes
  useEffect(() => {
    if (formData.requestDate && !isEditMode) {
      const updatedMrFields = mrFields.map((field, index) => ({
        ...field,
        mrNumber: generateMRPreview(formData.requestDate, index + 1), // Preview with sequence based on index
        mrDate: formData.requestDate
      }))
      setMrFields(updatedMrFields)
    }
  }, [formData.requestDate, isEditMode])

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

  const fetchGroups = async () => {
    try {
      const response = await groupService.getAll({ limit: 100 })
      if (response.success) {
        setGroups(response.data?.groups || [])
      }
    } catch (error) {
      console.error('Error fetching groups:', error)
      setGroups([])
    }
  }

  const fetchTeamsByGroup = async (groupId) => {
    try {
      const response = await teamService.getByGroup(groupId)
      if (response.success) {
        setTeams(response.data?.teams || [])
      }
    } catch (error) {
      console.error('Error fetching teams:', error)
      setTeams([])
    }
  }

  const fetchUsers = async () => {
    try {
      const response = await userService.getAll({ limit: 1000 })
      if (response.success) {
        setUsers(response.data?.users || response.data?.data || [])
      }
    } catch (error) {
      console.error('Error fetching users:', error)
      setUsers([])
    }
  }

  const fetchMaterialRequest = async () => {
    try {
      setLoading(true)
      const response = await materialRequestService.getById(id)
      if (response.success) {
        const request =
          response.data?.materialRequest ||
          response.data?.data?.materialRequest ||
          response.data?.data ||
          response.data

        if (request) {
          const statusValue = request.status || request.request_status
          setMaterialRequestStatus(statusValue)
          setMrNumber(request.mr_number || request.mrNumber || 'Auto-generated')
          
          setFormData({
            ticketId: request.ticket_id || request.ticketId || '',
            fromStockArea: request.from_stock_area_id || request.fromStockAreaId || '',
            requestDate: request.request_date || request.requestDate || new Date().toISOString().split('T')[0],
            requestorId: request.requestor_id || request.requestorId || '',
            groupId: request.group_id || request.groupId || '',
            teamId: request.team_id || request.teamId || '',
            serviceArea: request.service_area || request.serviceArea || '',
          })
          
          // Fetch teams for the selected group
          if (request.group_id || request.groupId) {
            fetchTeamsByGroup(request.group_id || request.groupId)
          }
          
          // Handle MR numbers if they exist (for backward compatibility with PR numbers)
          if ((request.pr_numbers && Array.isArray(request.pr_numbers)) || (request.prNumbers && Array.isArray(request.prNumbers))) {
            const source = request.pr_numbers || request.prNumbers
            setMrFields(source.map((mr, index) => ({
              id: index + 1,
              mrNumber: mr.mrNumber || mr.prNumber || mr.mr_number || mr.pr_number || generateMRPreview(request.request_date || request.requestDate || formData.requestDate, index + 1),
              mrDate: mr.mrDate || mr.prDate || mr.mr_date || mr.pr_date || request.request_date || request.requestDate || formData.requestDate,
            })))
          } else {
            // Initialize with MR number based on request date
            setMrFields([{
              id: 1,
              mrNumber: generateMRPreview(request.request_date || request.requestDate || formData.requestDate, 1),
              mrDate: request.request_date || request.requestDate || formData.requestDate,
            }])
          }
          
          if (request.items && Array.isArray(request.items)) {
            setRequestedItems(request.items.map((item, index) => ({
              id: item.item_id || item.id || index,
              itemId: item.item_id || item.id,
              materialId: item.material_id,
              itemName: item.material?.material_name || item.material_name || '-',
              properties: item.material?.product_code || item.properties || '-',
              requestedQuantity: item.requested_quantity || item.requestedQuantity,
              qtyToApprove: item.approved_quantity || item.approvedQuantity || item.requested_quantity,
              uom: item.uom || 'PIECE(S)',
              remarks: item.remarks || '',
            })))
          }
          
          if (statusValue === 'APPROVED') {
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

  const handleAddMrField = () => {
    const nextSequence = mrFields.length + 1
    setMrFields([
      ...mrFields,
      { 
        id: Date.now(), 
        mrNumber: generateMRPreview(formData.requestDate, nextSequence),
        mrDate: formData.requestDate || new Date().toISOString().split('T')[0]
      },
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

    // Prevent duplicates of same material to reduce server-side conflicts
    const alreadyExists = requestedItems.some(item => item.materialId === selectedMaterial.material_id)
    if (alreadyExists) {
      toast.error('This material is already added')
      return
    }

    const newItem = {
      id: Date.now(),
      materialId: selectedMaterial.material_id,
      itemName: selectedMaterial.material_name,
      properties: selectedMaterial.product_code || '-',
      requestedQuantity: parseInt(itemForm.requestedQuantity, 10),
      qtyToApprove: parseInt(itemForm.requestedQuantity, 10), // Default to requested quantity
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
    if (mrFields.some(f => !f.mrNumber)) {
      toast.error('Please ensure all MR Number fields are filled')
      return
    }
    if (requestedItems.length === 0) {
      toast.error('Please add at least one requested item')
      return
    }

    try {
      setLoading(true)
      const orgId =
        user?.org_id ||
        user?.orgId ||
        user?.organization_id ||
        user?.organizationId ||
        localStorage.getItem('orgId') ||
        undefined

      const requestData = {
        ticketId: formData.ticketId || undefined,
        fromStockAreaId: formData.fromStockArea || undefined,
        requestDate: formData.requestDate || new Date().toISOString().split('T')[0],
        requestorId: formData.requestorId || undefined,
        groupId: formData.groupId || undefined,
        teamId: formData.teamId || undefined,
        serviceArea: formData.serviceArea || undefined,
        // Note: MR numbers are auto-generated by backend, but we send the preview for reference
        // The backend will generate the actual sequential MR number
        prNumbers: mrFields.map(f => ({
          prNumber: f.mrNumber, // Backend expects prNumber field but we're sending MR number
          prDate: f.mrDate || formData.requestDate || new Date().toISOString().split('T')[0],
        })),
        items: requestedItems.map(item => ({
          itemId: item.itemId || item.id, // send back item id for updates if present
          materialId: item.materialId,
          requestedQuantity: item.requestedQuantity,
          uom: item.uom,
          remarks: item.remarks || undefined,
        })),
        orgId,
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
      } else {
        // Handle validation errors from backend
        if (response.errors && Array.isArray(response.errors)) {
          const errorMessages = response.errors.map(err => err.message || err.msg).join(', ')
          toast.error(errorMessages || response.message || `Failed to ${isEditMode ? 'update' : 'create'} material request`)
        } else {
          toast.error(response.message || `Failed to ${isEditMode ? 'update' : 'create'} material request`)
        }
      }
    } catch (error) {
      console.error('Error saving material request:', error)
      // Handle error response with validation errors
      if (error.errors && Array.isArray(error.errors)) {
        const errorMessages = error.errors.map(err => err.message || err.msg || err).join(', ')
        toast.error(errorMessages || error.message || `Failed to ${isEditMode ? 'update' : 'create'} material request`)
      } else if (error.message) {
        toast.error(error.message || `Failed to ${isEditMode ? 'update' : 'create'} material request`)
      } else {
        toast.error(`Failed to ${isEditMode ? 'update' : 'create'} material request`)
      }
    } finally {
      setLoading(false)
    }
  }

  // Count existing allocations per material to enforce remaining limits
  const allocationsStateByMaterial = () => {
    const counts = {}
    allocations.forEach((allocation) => {
      const materialId =
        allocation.material_id ||
        allocation.materialId ||
        allocation.inventory?.material?.material_id
      if (materialId) {
        counts[materialId] = (counts[materialId] || 0) + 1
      }
    })
    return counts
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
      // Track remaining allowed quantities to prevent over-allocation
      const existingAllocationsByMaterial = allocationsStateByMaterial()
      
      requestedItems.forEach(requestItem => {
        const materialId = requestItem.materialId
        const inventoryIds = inventoryByMaterial[materialId] || []
        if (inventoryIds.length === 0) return

        const allowedQty =
          requestItem.qtyToApprove ||
          requestItem.approvedQuantity ||
          requestItem.requestedQuantity ||
          0
        const alreadyAllocated = existingAllocationsByMaterial[materialId] || 0
        const remaining = Math.max(allowedQty - alreadyAllocated, 0)

        if (inventoryIds.length > remaining) {
          toast.error(
            `Cannot allocate more than allowed for ${requestItem.itemName || 'item'}. Remaining: ${remaining}`
          )
          throw new Error('OVER_ALLOCATE')
        }

        allocations.push({
          materialRequestItemId: requestItem.id, // This should be the item_id from backend
          inventoryMasterIds: inventoryIds
        })
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
      if (error.message !== 'OVER_ALLOCATE') {
        console.error('Error allocating items:', error)
        toast.error(error.message || 'Failed to allocate items')
      }
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
            label="Request Date"
            type="date"
            value={formData.requestDate}
            onChange={(e) => setFormData({ ...formData, requestDate: e.target.value })}
            required
          />
          <Dropdown
            label="Requestor (Employee/Technician)"
            options={[
              { value: '', label: 'Select Requestor' },
              ...users.map(user => ({
                value: user.id || user.user_id,
                label: `${user.name || ''} ${user.employeCode ? `(${user.employeCode})` : ''}`.trim()
              }))
            ]}
            value={formData.requestorId}
            onChange={(e) => setFormData({ ...formData, requestorId: e.target.value })}
          />
          <Dropdown
            label="Group"
            options={[
              { value: '', label: 'Select Group' },
              ...groups.map(group => ({
                value: group.group_id,
                label: group.group_name
              }))
            ]}
            value={formData.groupId}
            onChange={(e) => setFormData({ ...formData, groupId: e.target.value, teamId: '' })}
          />
          <Dropdown
            label="Team"
            options={[
              { value: '', label: 'Select Team' },
              ...teams.map(team => ({
                value: team.team_id,
                label: team.team_name
              }))
            ]}
            value={formData.teamId}
            onChange={(e) => setFormData({ ...formData, teamId: e.target.value })}
            disabled={!formData.groupId}
          />
          <Dropdown
            label="Service Area (States in Goa)"
            options={[
              { value: '', label: 'Select Service Area' },
              { value: 'North Goa', label: 'North Goa' },
              { value: 'South Goa', label: 'South Goa' },
              { value: 'Panaji', label: 'Panaji' },
              { value: 'Margao', label: 'Margao' },
              { value: 'Vasco', label: 'Vasco' },
              { value: 'Mapusa', label: 'Mapusa' },
              { value: 'Ponda', label: 'Ponda' },
            ]}
            value={formData.serviceArea}
            onChange={(e) => setFormData({ ...formData, serviceArea: e.target.value })}
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
          <Input
            label="Ticket ID (Optional)"
            placeholder="e.g., TKT-55S"
            value={formData.ticketId}
            onChange={(e) => setFormData({ ...formData, ticketId: e.target.value })}
          />
          {isEditMode && mrNumber && (
            <Input
              label="MR Number (Auto-generated)"
              value={mrNumber}
              disabled
              className="bg-gray-50"
            />
          )}
          
          {!isEditMode && (
            <div className="border-t border-gray-200 pt-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">MR Numbers</h2>
                <Button variant="primary" onClick={handleAddMrField}>
                  <Plus className="w-4 h-4 mr-2 inline" />
                  Add MR Number
                </Button>
              </div>
            </div>
          )}
          
          {mrFields.map((field, index) => (
            <div key={field.id} className="space-y-4 mb-4">
              <div className="flex items-end gap-4">
                <div className="flex-1">
                  <Input
                    label="MR Number"
                    required
                    value={field.mrNumber}
                    // MR number is auto-generated, no onChange needed
                    placeholder="Auto-generated based on date"
                    className="bg-gray-50"
                    readOnly={true} // Always read-only as it's auto-generated
                  />
                </div>
                <div className="flex-1">
                  <Input
                    label="MR Date"
                    placeholder="Enter MR Date"
                    type="date"
                    value={field.mrDate || formData.requestDate}
                    onChange={(e) => {
                      const newDate = e.target.value
                      // Update this field's date and regenerate MR number
                      setMrFields(
                        mrFields.map((f) =>
                          f.id === field.id 
                            ? { ...f, mrDate: newDate, mrNumber: generateMRPreview(newDate, index + 1) }
                            : f
                        )
                      )
                      // Also update the main request date if this is the first field
                      if (index === 0) {
                        setFormData(prev => ({ ...prev, requestDate: newDate }))
                      }
                    }}
                  />
                </div>
                {mrFields.length > 1 && (
                  <button
                    onClick={() => setMrFields(mrFields.filter(f => f.id !== field.id))}
                    className="text-red-600 hover:text-red-700 mb-1"
                    type="button"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
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
