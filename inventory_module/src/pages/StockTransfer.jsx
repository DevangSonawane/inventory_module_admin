import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Search, Loader2, Plus as PlusIcon } from 'lucide-react'
import { toast } from 'react-toastify'
import Button from '../components/common/Button'
import Input from '../components/common/Input'
import Dropdown from '../components/common/Dropdown'
import Table from '../components/common/Table'
import Pagination from '../components/common/Pagination'
import Modal from '../components/common/Modal'
import { stockTransferService } from '../services/stockTransferService.js'
import { stockAreaService } from '../services/stockAreaService.js'
import { materialRequestService } from '../services/materialRequestService.js'
import { materialService } from '../services/materialService.js'
import { userService } from '../services/userService.js'
import { validationService } from '../services/validationService.js'

const StockTransfer = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEditMode = id && id !== 'new'
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [activeTab, setActiveTab] = useState('requested-items')
  const [loading, setLoading] = useState(false)
  const [stockAreas, setStockAreas] = useState([])
  const [materialRequests, setMaterialRequests] = useState([])
  const [selectedMaterialRequest, setSelectedMaterialRequest] = useState(null)
  const [materials, setMaterials] = useState([])
  const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false)
  const [newItem, setNewItem] = useState({ materialId: '', quantity: 1, serialNumbers: '' })

  const formatDateDisplay = () => {
    // Use ISO date to satisfy backend validation
    return new Date().toISOString().split('T')[0] // yyyy-mm-dd
  }

  const [basicDetails, setBasicDetails] = useState({
    date: formatDateDisplay(),
    slipNo: '',
    transferType: '',
    materialRequestNo: '',
    fromStockArea: '',
    toStockArea: '',
    description: '',
  })

  // Fetch stock areas and material requests on mount
  useEffect(() => {
    fetchStockAreas()
    fetchMaterialRequests()
    fetchUsers()
    fetchMaterials()
    if (isEditMode) {
      fetchStockTransfer()
    }
  }, [id])

  // Fetch material request details when selected
  useEffect(() => {
    if (basicDetails.materialRequestNo) {
      fetchMaterialRequestDetails(basicDetails.materialRequestNo)
    } else {
      setSelectedMaterialRequest(null)
      setAllocateItemsData([])
    }
  }, [basicDetails.materialRequestNo])

  const fetchStockAreas = async () => {
    try {
      const response = await stockAreaService.getAll({ limit: 100 })
      if (response.success) {
        const areas = response.data?.stockAreas || response.data?.data || []
        const options = [
          { value: '', label: 'Select Stock Area' },
          ...areas.map(area => ({
            value: area.area_id || area.id,
            label: area.area_name || area.name
          }))
        ]
        setStockAreas(options)
        // auto-select first available destination for non-person transfers if empty
        if (!basicDetails.toStockArea && basicDetails.transferType !== 'warehouse-to-person') {
          const first = areas[0]?.area_id || areas[0]?.id || ''
          if (first) {
            setBasicDetails(prev => ({ ...prev, toStockArea: first }))
          }
        }
      }
    } catch (error) {
      console.error('Error fetching stock areas:', error)
      toast.error('Failed to load stock areas')
      setStockAreas([{ value: '', label: 'Select Stock Area' }])
    }
  }

  const fetchMaterialRequests = async () => {
    try {
      const response = await materialRequestService.getAll({ limit: 100, status: 'APPROVED' })
      if (response.success) {
        const mrs = response.data?.materialRequests || response.data?.data || []
        const options = [
          { value: '', label: 'Select Material Request No' },
          ...mrs.map(mr => ({
            value: mr.request_id || mr.id,
            label: mr.slip_number || `MR-${(mr.request_id || mr.id)?.substring(0, 8).toUpperCase()}`
          }))
        ]
        setMaterialRequests(options)
      }
    } catch (error) {
      console.error('Error fetching material requests:', error)
      setMaterialRequests([{ value: '', label: 'Select Material Request No' }])
    }
  }

  const fetchMaterials = async () => {
    try {
      const response = await materialService.getAll({ limit: 200 })
      if (response.success || Array.isArray(response?.data)) {
        const list =
          response.data?.materials ||
          response.data?.data ||
          (Array.isArray(response.data) ? response.data : []) ||
          []
        const options = [
          { value: '', label: 'Select Material' },
          ...list.map((m) => ({
            value: m.material_id || m.id,
            label: m.material_name || m.materialName || m.name || 'Material',
            productCode: m.product_code || m.productCode || '',
          })),
        ]
        setMaterials(options)
      }
    } catch (error) {
      console.error('Error fetching materials:', error)
      setMaterials([{ value: '', label: 'Select Material' }])
    }
  }

  const fetchUsers = async () => {
    try {
      const response = await userService.getAll({ limit: 1000 })
      if (response.success || response.data) {
        const usersList = response.data?.users || response.data?.data || (Array.isArray(response.data) ? response.data : [])
        setUsers(usersList)
      }
    } catch (error) {
      console.error('Error fetching users:', error)
      setUsers([])
    }
  }

  const fetchMaterialRequestDetails = async (requestId) => {
    try {
      const response = await materialRequestService.getById(requestId)
      if (response.success) {
        const request = response.data?.materialRequest || response.data?.data
        if (request) {
          setSelectedMaterialRequest(request)
          
          // Set requested items
          if (request.items && Array.isArray(request.items)) {
            setRequestedItemsData(request.items.map(item => ({
              id: item.item_id,
              itemName: item.material?.material_name || '-',
              uom: item.uom || 'PIECE(S)',
              properties: item.material?.product_code || '-',
              requestedQuantity: item.requested_quantity,
              remainingQuantity: item.requested_quantity - (item.approved_quantity || 0),
            })))
          }
        }
      }
    } catch (error) {
      console.error('Error fetching material request details:', error)
      toast.error('Failed to load material request details')
      setRequestedItemsData([])
    }
  }

  const fetchStockTransfer = async () => {
    try {
      setLoading(true)
      const response = await stockTransferService.getById(id)
      if (response.success) {
        const transfer =
          response.data?.stockTransfer ||
          response.data?.transfer ||
          response.data?.data ||
          response.data

        if (transfer) {
          try {
            const normalize = (t) => ({
              date: t.transfer_date || t.transferDate || t.date,
              slipNo: t.transfer_number || t.slip_number || t.slipNo || '',
              transferTypeRaw: t.transfer_type || t.transferType,
              materialRequestNo: t.material_request_id || t.materialRequestId || '',
              fromStockArea: t.from_stock_area_id || t.fromStockAreaId || t.from_stock_area || '',
              toStockArea: t.to_stock_area_id || t.toStockAreaId || t.to_stock_area || '',
              toUserId: t.to_user_id || t.toUserId || '',
              ticketId: t.ticket_id || t.ticketId || '',
              description: t.remarks || t.description || '',
              items: t.items || t.transfer_items || [],
              materialRequest: t.material_request || t.materialRequest,
            })

            const normalized = normalize(transfer)

            // map backend transfer type to UI value
            const transferType =
              normalized.materialRequestNo
                ? 'material-request'
                : normalized.toUserId
                  ? 'warehouse-to-person'
                  : normalized.transferTypeRaw === 'other'
                    ? 'other'
                    : 'warehouse-to-warehouse'

            const transferDate = normalized.date ? new Date(normalized.date) : new Date()
            setBasicDetails({
              date: transferDate.toISOString().split('T')[0],
              slipNo: normalized.slipNo,
              transferType,
              materialRequestNo: normalized.materialRequestNo,
              fromStockArea: normalized.fromStockArea,
              toStockArea: normalized.toStockArea,
              description: normalized.description,
            })
            setToUserId(normalized.toUserId)
            setTicketId(normalized.ticketId)

            // Prefill allocated items (if API returns them)
            if (Array.isArray(normalized.items) && normalized.items.length > 0) {
              setAllocateItemsData(normalized.items.map((item, idx) => ({
                id: item.id || item.item_id || `${idx}`,
                materialId: item.material_id || item.materialId,
                itemName: item.material?.material_name || item.materialName || '-',
                properties: item.material?.product_code || item.properties || '-',
                grnNo: item.grn_number || item.grnNo || '-',
                assetId: item.asset_id || item.assetId || '-',
                requestedQuantity: item.requested_quantity || item.quantity || 0,
                remarks: item.remarks || '',
                quantity: item.quantity || 0,
                selected: true,
              })))
            }

            // Prefill requested items from material request (if already embedded)
            const mr = normalized.materialRequest
            if (mr && Array.isArray(mr.items)) {
              setRequestedItemsData(mr.items.map((item) => ({
                id: item.item_id,
                itemName: item.material?.material_name || '-',
                uom: item.uom || 'PIECE(S)',
                properties: item.material?.product_code || '-',
                requestedQuantity: item.requested_quantity,
                remainingQuantity: item.requested_quantity - (item.approved_quantity || 0),
              })))
            }
          } catch (err) {
            console.error('Error processing transfer data:', err)
            toast.error('Error loading transfer data')
          }
        }
      }
    } catch (error) {
      console.error('Error fetching stock transfer:', error)
      toast.error('Failed to load stock transfer')
    } finally {
      setLoading(false)
    }
  }

  const transferTypeOptions = [
    { value: '', label: 'Select Transfer Type' },
    { value: 'material-request', label: 'Material Request' },
    { value: 'warehouse-to-warehouse', label: 'Warehouse to Warehouse' },
    { value: 'warehouse-to-person', label: 'Warehouse to Person' },
    { value: 'other', label: 'Other' },
  ]

  const [users, setUsers] = useState([])
  const [toUserId, setToUserId] = useState('')
  const [ticketId, setTicketId] = useState('')

  const toStockAreaOptionsPerson = [
    { value: 'PERSON', label: 'Person (Technician Holding)' },
    { value: 'VAN', label: 'Van' },
    ...stockAreas,
  ]
  const toStockAreaOptionsWarehouse = stockAreas

  // Requested Items from material request
  const [requestedItemsData, setRequestedItemsData] = useState([])

  // Allocate Items tab
  const [allocateItemsData, setAllocateItemsData] = useState([])

  const handleTransferTypeChange = (value) => {
    setBasicDetails({
      ...basicDetails,
      transferType: value,
      materialRequestNo: value === 'material-request' ? basicDetails.materialRequestNo : '',
      // Always keep destination selectable; backend allows both user and stock area
      toStockArea: value === 'warehouse-to-person'
        ? (basicDetails.toStockArea || 'PERSON')
        : (basicDetails.toStockArea || stockAreas.find(s => s.value)?.value || ''),
    })
    if (value !== 'warehouse-to-person') {
      setToUserId('')
      setTicketId('')
    }
  }

  const handleSave = async () => {
    if (!basicDetails.transferType || !basicDetails.fromStockArea) {
      toast.error('Please fill all required fields')
      return
    }
    const isPersonTransfer = basicDetails.transferType === 'warehouse-to-person'
    const toStockAreaValue = isPersonTransfer
      ? (basicDetails.toStockArea || 'PERSON')
      : (basicDetails.toStockArea || '')

    // Destination stock area is required for all types; technician required for person transfer
    if (!toStockAreaValue) {
      toast.error('Please select destination stock area')
      return
    }
    if (isPersonTransfer && !toUserId) {
      toast.error('Please select a technician')
      return
    }
    if (basicDetails.transferType === 'material-request' && !basicDetails.materialRequestNo) {
      toast.error('Please select Material Request No.')
      return
    }
    const selectedItems = allocateItemsData.filter(item => item.selected !== false)
    if (selectedItems.length === 0) {
      toast.error('Please allocate at least one item')
      return
    }

    try {
      setLoading(true)
      
      const transferData = {
        fromStockAreaId: basicDetails.fromStockArea,
        toStockAreaId: toStockAreaValue || undefined,
        to_stock_area_id: toStockAreaValue || undefined, // send snake_case to satisfy backend
        toUserId: isPersonTransfer ? toUserId : undefined,
        to_user_id: isPersonTransfer ? toUserId : undefined, // snake_case for backend
        ticketId: isPersonTransfer ? (ticketId || undefined) : undefined,
        materialRequestId: basicDetails.materialRequestNo || undefined,
        transferNumber: basicDetails.slipNo || undefined,
        slipNumber: basicDetails.slipNo || undefined,
        transferDate: basicDetails.date,
        items: selectedItems.map(item => ({
          materialId: item.materialId,
          quantity: item.quantity,
          serialNumbers: item.serialNumbers || undefined,
          remarks: item.remarks || undefined,
        })),
        remarks: basicDetails.description || undefined,
      }

      let response
      if (isEditMode) {
        response = await stockTransferService.update(id, transferData)
      } else {
        response = await stockTransferService.create(transferData)
      }

      if (response.success) {
        toast.success(`Stock transfer ${isEditMode ? 'updated' : 'created'} successfully!`)
        navigate('/stock-transfer')
      }
    } catch (error) {
      console.error('Error saving stock transfer:', error)
      toast.error(error.message || `Failed to ${isEditMode ? 'update' : 'create'} stock transfer`)
    } finally {
      setLoading(false)
    }
  }

  const paginatedRequestedItems = requestedItemsData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )
  const requestedTotalPages = Math.ceil(requestedItemsData.length / itemsPerPage)

  const paginatedAllocateItems = allocateItemsData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )
  const allocateTotalPages = Math.ceil(allocateItemsData.length / itemsPerPage)

  const resetNewItem = () => setNewItem({ materialId: '', quantity: 1, serialNumbers: '' })

  const handleAddAllocatedItem = () => {
    if (!newItem.materialId) {
      toast.error('Please select a material')
      return
    }
    if (!newItem.quantity || Number(newItem.quantity) <= 0) {
      toast.error('Quantity must be greater than zero')
      return
    }
    const materialInfo = materials.find((m) => m.value === newItem.materialId)
    const newRow = {
      id: `${Date.now()}`,
      materialId: newItem.materialId,
      itemName: materialInfo?.label || 'Material',
      properties: materialInfo?.productCode || '-',
      grnNo: '-',
      assetId: '-',
      requestedQuantity: newItem.quantity,
      quantity: Number(newItem.quantity),
      remarks: '',
      serialNumbers: newItem.serialNumbers || '',
      selected: true,
    }
    setAllocateItemsData([...allocateItemsData, newRow])
    resetNewItem()
    setIsAddItemModalOpen(false)
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Basic Details</h2>
        
        <div className="grid grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input
              type="text"
              value={basicDetails.date}
              readOnly
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
            />
          </div>
          <Input
            label="Slip No"
            required
            value={basicDetails.slipNo}
            onChange={(e) => setBasicDetails({ ...basicDetails, slipNo: e.target.value })}
          />
          <Dropdown
            label="Transfer Type"
            required
            options={transferTypeOptions}
            value={basicDetails.transferType}
            onChange={(e) => handleTransferTypeChange(e.target.value)}
          />
          {basicDetails.transferType === 'material-request' && (
            <Dropdown
              label="Material Request No."
              required
              options={materialRequests}
              value={basicDetails.materialRequestNo}
              onChange={(e) => setBasicDetails({ ...basicDetails, materialRequestNo: e.target.value })}
            />
          )}
          <Dropdown
            label="From Stock Area"
            required
            options={stockAreas}
            value={basicDetails.fromStockArea}
            onChange={(e) => setBasicDetails({ ...basicDetails, fromStockArea: e.target.value })}
          />
          {basicDetails.transferType === 'warehouse-to-person' ? (
            <>
              <Dropdown
                label="Destination Stock Area"
                required
                options={toStockAreaOptionsPerson}
                value={basicDetails.toStockArea}
                onChange={(e) => setBasicDetails({ ...basicDetails, toStockArea: e.target.value })}
              />
              <Dropdown
                label="To Technician"
                required
                options={[
                  { value: '', label: 'Select Technician' },
                  ...users.map(user => ({
                    value: user.id || user.user_id,
                    label: `${user.name || user.username || 'User'} (${user.employeCode || user.employee_code || 'N/A'})`
                  }))
                ]}
                value={toUserId}
                onChange={(e) => setToUserId(e.target.value)}
              />
              <Input
                label="Ticket ID (Optional)"
                placeholder="e.g., TKT-55S"
                value={ticketId}
                onChange={(e) => setTicketId(e.target.value)}
              />
            </>
          ) : (
            <Dropdown
              label="To Stock Area"
              required
              options={toStockAreaOptionsWarehouse}
              value={basicDetails.toStockArea}
              onChange={(e) => setBasicDetails({ ...basicDetails, toStockArea: e.target.value })}
            />
          )}
        </div>

        <div className="border-t border-gray-200 pt-6">
          {basicDetails.transferType === 'material-request' && basicDetails.materialRequestNo ? (
            <div className="flex border-b border-gray-200 mb-4">
              <button
                onClick={() => setActiveTab('requested-items')}
                className={`px-6 py-3 font-medium text-sm ${
                  activeTab === 'requested-items'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Requested Items
              </button>
              <button
                onClick={() => setActiveTab('allocate-items')}
                className={`px-6 py-3 font-medium text-sm ${
                  activeTab === 'allocate-items'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Allocate Items
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Allocate Items</h3>
              <Button variant="primary" onClick={() => setIsAddItemModalOpen(true)}>
                <PlusIcon className="w-4 h-4 mr-2 inline" />
                Add Item
              </Button>
            </div>
          )}

          {basicDetails.transferType === 'material-request' && basicDetails.materialRequestNo && activeTab === 'requested-items' ? (
            <>
              <Table
                headers={['ITEM NAME', 'UOM', 'PROPERTIES', 'REQUESTED QUANTITY', 'REMAINING QUANTITY']}
              >
                {paginatedRequestedItems.length > 0 ? (
                  paginatedRequestedItems.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.itemName}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.uom}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.properties}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.requestedQuantity}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.remainingQuantity}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                      No data found
                    </td>
                  </tr>
                )}
              </Table>
              {requestedItemsData.length > 0 && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={requestedTotalPages}
                  itemsPerPage={itemsPerPage}
                  totalItems={requestedItemsData.length}
                  onPageChange={setCurrentPage}
                  onItemsPerPageChange={setItemsPerPage}
                />
              )}
            </>
          ) : (
            <>
              {basicDetails.transferType === 'material-request' && basicDetails.materialRequestNo && (
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Allocate Items</h3>
                  <Button variant="primary" onClick={() => setIsAddItemModalOpen(true)}>
                    <PlusIcon className="w-4 h-4 mr-2 inline" />
                    Add Item
                  </Button>
                </div>
              )}
              <Table
                headers={['SELECT', 'ITEM NAME', 'PROPERTIES', 'GRN NO.', 'ASSET ID', 'QUANTITY', 'REMARKS']}
              >
                {paginatedAllocateItems.length > 0 ? (
                  paginatedAllocateItems.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                        <input
                          type="checkbox"
                          checked={item.selected}
                          onChange={(e) => {
                            setAllocateItemsData(allocateItemsData.map(i =>
                              i.id === item.id ? { ...i, selected: e.target.checked } : i
                            ))
                          }}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.itemName}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.properties}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.grnNo}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.assetId}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.quantity || item.requestedQuantity}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.remarks}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                      No items added. Click "Add Item" to allocate.
                    </td>
                  </tr>
                )}
              </Table>
              {allocateItemsData.length > 0 && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={allocateTotalPages}
                  itemsPerPage={itemsPerPage}
                  totalItems={allocateItemsData.length}
                  onPageChange={setCurrentPage}
                  onItemsPerPageChange={setItemsPerPage}
                />
              )}
            </>
          )}
        </div>

        <div className="border-t border-gray-200 pt-6 mt-6">
          <Input
            label="Description"
            placeholder="Enter Description"
            value={basicDetails.description}
            onChange={(e) => setBasicDetails({ ...basicDetails, description: e.target.value })}
          />
        </div>

        <div className="flex gap-4 justify-end mt-6 pt-6 border-t border-gray-200">
          <Button variant="gray" onClick={() => navigate('/stock-transfer')}>
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

      <Modal
        isOpen={isAddItemModalOpen}
        onClose={() => {
          resetNewItem()
          setIsAddItemModalOpen(false)
        }}
        title="Add Item"
        size="sm"
      >
        <div className="space-y-4">
          <Dropdown
            label="Material"
            required
            options={materials}
            value={newItem.materialId}
            onChange={(e) => setNewItem({ ...newItem, materialId: e.target.value })}
          />
          <Input
            label="Quantity"
            type="number"
            min="0"
            value={newItem.quantity}
            onChange={(e) => setNewItem({ ...newItem, quantity: e.target.value })}
            required
          />
          <Input
            label="Serial Numbers (optional)"
            placeholder="Comma separated or single value"
            value={newItem.serialNumbers}
            onChange={(e) => setNewItem({ ...newItem, serialNumbers: e.target.value })}
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="gray"
              onClick={() => {
                resetNewItem()
                setIsAddItemModalOpen(false)
              }}
            >
              Cancel
            </Button>
            <Button variant="primary" onClick={handleAddAllocatedItem}>
              Add
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default StockTransfer
