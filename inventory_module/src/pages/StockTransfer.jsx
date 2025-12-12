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

const StockTransfer = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEditMode = id && id !== 'new'
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [activeTab, setActiveTab] = useState('requested-items') // 'requested-items' or 'allocate-items'
  const [loading, setLoading] = useState(false)
  const [stockAreas, setStockAreas] = useState([])
  const [materialRequests, setMaterialRequests] = useState([])
  const [selectedMaterialRequest, setSelectedMaterialRequest] = useState(null)
  const [materials, setMaterials] = useState([])
  const [users, setUsers] = useState([])
  const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false)
  const [newItem, setNewItem] = useState({ materialId: '', quantity: 1, serialNumbers: '' })

  const formatDateDisplay = () => {
    return new Date().toISOString().split('T')[0] // yyyy-mm-dd
  }

  const [basicDetails, setBasicDetails] = useState({
    date: formatDateDisplay(),
    slipNo: '',
    transferType: '', // 'material-request' or 'reconciliation'
    materialRequestNo: '',
    fromStockArea: '',
    toPerson: '',
    toWarehouse: '',
    description: '',
  })

  // Fetch stock areas, material requests, users, and materials on mount
  useEffect(() => {
    fetchStockAreas()
    fetchMaterialRequests()
    fetchUsers()
    fetchMaterials()
    if (isEditMode) {
      fetchStockTransfer()
    } else {
      // Auto-generate slip number for new transfers
      generateSlipNumber()
    }
  }, [id])

  // Fetch material request details when selected
  useEffect(() => {
    if (basicDetails.transferType === 'material-request' && basicDetails.materialRequestNo) {
      fetchMaterialRequestDetails(basicDetails.materialRequestNo)
    } else {
      setSelectedMaterialRequest(null)
      setAllocateItemsData([])
    }
  }, [basicDetails.materialRequestNo, basicDetails.transferType])

  // Regenerate slip number when date changes (only for new transfers)
  const [isInitialMount, setIsInitialMount] = useState(true)
  
  useEffect(() => {
    if (isInitialMount) {
      setIsInitialMount(false)
      return
    }
    if (!isEditMode && basicDetails.date) {
      generateSlipNumber(basicDetails.date)
    }
  }, [basicDetails.date])

  // Generate slip number in format: ST-MONTH-YEAR-NUMBER
  const generateSlipNumber = async (dateValue = null) => {
    try {
      const date = dateValue ? new Date(dateValue) : new Date()
      const month = date.toLocaleString('default', { month: 'short' }).toUpperCase()
      const year = date.getFullYear()
      
      // Fetch existing transfers to get the next number
      const response = await stockTransferService.getAll({ limit: 1000 })
      if (response.success) {
        const transfers = response.data?.transfers || []
        const prefix = `ST-${month}-${year}`
        const pattern = new RegExp(`^${prefix}-(\\d+)$`)
        
        let maxNumber = 0
        transfers.forEach(transfer => {
          const slipNo = transfer.transfer_number || transfer.slip_number || ''
          const match = slipNo.match(pattern)
          if (match) {
            const num = parseInt(match[1], 10)
            if (num > maxNumber) maxNumber = num
          }
        })
        
        const nextNumber = (maxNumber + 1).toString().padStart(3, '0')
        const slipNumber = `${prefix}-${nextNumber}`
        setBasicDetails(prev => ({ ...prev, slipNo: slipNumber }))
      }
    } catch (error) {
      console.error('Error generating slip number:', error)
      // Fallback to simple format
      const date = dateValue ? new Date(dateValue) : new Date()
      const month = date.toLocaleString('default', { month: 'short' }).toUpperCase()
      const year = date.getFullYear()
      const slipNumber = `ST-${month}-${year}-001`
      setBasicDetails(prev => ({ ...prev, slipNo: slipNumber }))
    }
  }

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
      }
    } catch (error) {
      console.error('Error fetching stock areas:', error)
      toast.error('Failed to load stock areas')
      setStockAreas([{ value: '', label: 'Select Stock Area' }])
    }
  }

  const fetchMaterialRequests = async () => {
    try {
      const response = await materialRequestService.getAll({ limit: 1000, status: 'APPROVED' })
      if (response.success) {
        const mrs = response.data?.materialRequests || response.data?.data || []
        const options = [
          { value: '', label: 'Select Material Request' },
          ...mrs.map(mr => ({
            value: mr.request_id || mr.id,
            label: mr.mr_number || mr.mrNumber || mr.slip_number || `MR-${(mr.request_id || mr.id)?.substring(0, 8).toUpperCase()}`
          }))
        ]
        setMaterialRequests(options)
      }
    } catch (error) {
      console.error('Error fetching material requests:', error)
      setMaterialRequests([{ value: '', label: 'Select Material Request' }])
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
          // Determine transfer type: material-request if material_request_id exists, else reconciliation
          const transferType = transfer.material_request_id || transfer.materialRequestId ? 'material-request' : 'reconciliation'
          
          const transferDate = transfer.transfer_date || transfer.transferDate || new Date()
          setBasicDetails({
            date: new Date(transferDate).toISOString().split('T')[0],
            slipNo: transfer.transfer_number || transfer.slip_number || '',
            transferType,
            materialRequestNo: transfer.material_request_id || transfer.materialRequestId || '',
            fromStockArea: transfer.from_stock_area_id || transfer.fromStockAreaId || '',
            toPerson: transfer.to_user_id || transfer.toUserId || '',
            toWarehouse: transfer.to_stock_area_id || transfer.toStockAreaId || '',
            description: transfer.remarks || transfer.description || '',
          })

          // Prefill allocated items
          if (Array.isArray(transfer.items) && transfer.items.length > 0) {
            setAllocateItemsData(transfer.items.map((item, idx) => ({
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
    { value: 'reconciliation', label: 'Reconciliation' },
  ]

  // Requested Items from material request
  const [requestedItemsData, setRequestedItemsData] = useState([])

  // Allocate Items tab
  const [allocateItemsData, setAllocateItemsData] = useState([])

  const handleTransferTypeChange = (value) => {
    setBasicDetails({
      ...basicDetails,
      transferType: value,
      materialRequestNo: value === 'material-request' ? basicDetails.materialRequestNo : '',
      toPerson: '',
      toWarehouse: '',
    })
    if (value !== 'material-request') {
      setSelectedMaterialRequest(null)
      setRequestedItemsData([])
    }
  }

  const handleToPersonChange = (value) => {
    setBasicDetails({
      ...basicDetails,
      toPerson: value,
      toWarehouse: '', // Clear warehouse when person is selected
    })
  }

  const handleToWarehouseChange = (value) => {
    setBasicDetails({
      ...basicDetails,
      toWarehouse: value,
      toPerson: '', // Clear person when warehouse is selected
    })
  }

  const handleSave = async () => {
    // Validation
    if (!basicDetails.transferType) {
      toast.error('Please select Transfer Type')
      return
    }
    if (!basicDetails.fromStockArea) {
      toast.error('Please select From Stock Area')
      return
    }
    if (basicDetails.transferType === 'material-request' && !basicDetails.materialRequestNo) {
      toast.error('Please select Material Request Number')
      return
    }
    if (!basicDetails.toPerson && !basicDetails.toWarehouse) {
      toast.error('Please select either To Person or To Warehouse')
      return
    }
    if (basicDetails.toPerson && basicDetails.toWarehouse) {
      toast.error('Please select either To Person OR To Warehouse, not both')
      return
    }
    
    const selectedItems = allocateItemsData.filter(item => item.selected !== false)
    if (selectedItems.length === 0) {
      toast.error('Please add at least one item')
      return
    }

    try {
      setLoading(true)
      
      const transferData = {
        fromStockAreaId: basicDetails.fromStockArea,
        toStockAreaId: basicDetails.toWarehouse || undefined,
        toUserId: basicDetails.toPerson || undefined,
        materialRequestId: basicDetails.transferType === 'material-request' ? basicDetails.materialRequestNo : undefined,
        transferNumber: basicDetails.slipNo,
        slipNumber: basicDetails.slipNo,
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

  const paginatedAllocateItems = allocateItemsData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )
  const allocateTotalPages = Math.ceil(allocateItemsData.length / itemsPerPage)

  const paginatedRequestedItems = requestedItemsData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )
  const requestedTotalPages = Math.ceil(requestedItemsData.length / itemsPerPage)

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

  // User options for dropdown
  const userOptions = [
    { value: '', label: 'Select Person' },
    ...users.map(user => ({
      value: user.id || user.user_id,
      label: `${user.name || user.username || 'User'} (${user.employeCode || user.employee_code || 'N/A'})`
    }))
  ]

  // Warehouse options (stock areas)
  const warehouseOptions = stockAreas.filter(area => area.value !== '')

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Stock Transfer</h2>
        
        <div className="grid grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input
              type="date"
              value={basicDetails.date}
              onChange={(e) => setBasicDetails({ ...basicDetails, date: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <Input
            label="Slip Number"
            required
            value={basicDetails.slipNo}
            onChange={(e) => setBasicDetails({ ...basicDetails, slipNo: e.target.value })}
            placeholder="ST-MONTH-YEAR-NUMBER"
          />
          
          <Dropdown
            label="Transfer Type"
            required
            options={transferTypeOptions}
            value={basicDetails.transferType}
            onChange={(e) => handleTransferTypeChange(e.target.value)}
          />

          {/* Conditional fields based on transfer type */}
          {basicDetails.transferType === 'material-request' && (
            <>
              <Dropdown
                label="Material Request Number"
                required
                options={materialRequests}
                value={basicDetails.materialRequestNo}
                onChange={(e) => setBasicDetails({ ...basicDetails, materialRequestNo: e.target.value })}
              />
            </>
          )}

          <Dropdown
            label="From Stock Area"
            required
            options={stockAreas}
            value={basicDetails.fromStockArea}
            onChange={(e) => setBasicDetails({ ...basicDetails, fromStockArea: e.target.value })}
          />

          {/* To Person or Warehouse - one must be selected, other grayed */}
          {basicDetails.transferType && (
            <>
              <Dropdown
                label="To Person"
                required={!basicDetails.toWarehouse}
                options={userOptions}
                value={basicDetails.toPerson}
                onChange={(e) => handleToPersonChange(e.target.value)}
                disabled={!!basicDetails.toWarehouse}
              />
              
              <Dropdown
                label="To Warehouse"
                required={!basicDetails.toPerson}
                options={warehouseOptions}
                value={basicDetails.toWarehouse}
                onChange={(e) => handleToWarehouseChange(e.target.value)}
                disabled={!!basicDetails.toPerson}
              />
            </>
          )}
        </div>

        {/* Material Request Items Section - Only show when MR is selected */}
        {basicDetails.transferType === 'material-request' && basicDetails.materialRequestNo && (
          <div className="border-t border-gray-200 pt-6 mt-6">
            {/* Tabs - Side by Side */}
            <div className="flex border-b border-gray-200 mb-4">
              <button
                onClick={() => setActiveTab('requested-items')}
                className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
                  activeTab === 'requested-items'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                Requested Items
              </button>
              <button
                onClick={() => setActiveTab('allocate-items')}
                className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
                  activeTab === 'allocate-items'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                Allocate Items
              </button>
            </div>

            {/* Items List based on active tab */}
            {activeTab === 'requested-items' ? (
              <div>
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
                        No requested items found
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
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Allocate Items</h3>
                  <Button variant="primary" onClick={() => setIsAddItemModalOpen(true)}>
                    <PlusIcon className="w-4 h-4 mr-2 inline" />
                    Add Item
                  </Button>
                </div>
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
                        No items added. Click "Add Item" to add items.
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
              </div>
            )}
          </div>
        )}

        {/* Items Section for Reconciliation type */}
        {basicDetails.transferType === 'reconciliation' && (
          <div className="border-t border-gray-200 pt-6 mt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Items</h3>
              <Button variant="primary" onClick={() => setIsAddItemModalOpen(true)}>
                <PlusIcon className="w-4 h-4 mr-2 inline" />
                Add Item
              </Button>
            </div>
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
                    No items added. Click "Add Item" to add items.
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
          </div>
        )}

        {/* Description Field - Below all items */}
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
