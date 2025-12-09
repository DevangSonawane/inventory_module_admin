import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Search, Loader2 } from 'lucide-react'
import { toast } from 'react-toastify'
import Button from '../components/common/Button'
import Input from '../components/common/Input'
import Dropdown from '../components/common/Dropdown'
import Table from '../components/common/Table'
import Pagination from '../components/common/Pagination'
import { stockTransferService } from '../services/stockTransferService.js'
import { stockAreaService } from '../services/stockAreaService.js'
import { materialRequestService } from '../services/materialRequestService.js'
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

  const formatDateDisplay = () => {
    const date = new Date()
    const day = String(date.getDate()).padStart(2, '0')
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const year = date.getFullYear()
    return `${day}-${month}-${year}`
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
        const transfer = response.data?.stockTransfer || response.data?.data
        if (transfer) {
          try {
            const transferDate = transfer.transfer_date ? new Date(transfer.transfer_date) : new Date()
            setBasicDetails({
              date: transferDate.toISOString().split('T')[0],
              slipNo: transfer.slip_number || '',
              transferType: transfer.material_request_id ? 'material-request' : (transfer.to_user_id ? 'warehouse-to-person' : 'other'),
              materialRequestNo: transfer.material_request_id || '',
              fromStockArea: transfer.from_stock_area_id || '',
              toStockArea: transfer.to_stock_area_id || '',
              description: transfer.remarks || '',
            })
            setToUserId(transfer.to_user_id || '')
            setTicketId(transfer.ticket_id || '')
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

  const toStockAreaOptions = stockAreas

  // Requested Items from material request
  const [requestedItemsData, setRequestedItemsData] = useState([])

  // Allocate Items tab
  const [allocateItemsData, setAllocateItemsData] = useState([])

  const handleTransferTypeChange = (value) => {
    setBasicDetails({
      ...basicDetails,
      transferType: value,
      materialRequestNo: value === 'material-request' ? basicDetails.materialRequestNo : '',
      toStockArea: value === 'warehouse-to-person' ? '' : basicDetails.toStockArea,
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
    if (basicDetails.transferType === 'warehouse-to-person') {
      if (!toUserId) {
        toast.error('Please select a technician')
        return
      }
    } else {
      if (!basicDetails.toStockArea) {
        toast.error('Please select destination stock area')
        return
      }
    }
    if (basicDetails.transferType === 'material-request' && !basicDetails.materialRequestNo) {
      toast.error('Please select Material Request No.')
      return
    }
    if (allocateItemsData.length === 0 && basicDetails.transferType === 'material-request') {
      toast.error('Please allocate at least one item')
      return
    }

    try {
      setLoading(true)
      
      const transferData = {
        fromStockAreaId: basicDetails.fromStockArea,
        toStockAreaId: basicDetails.transferType === 'warehouse-to-person' ? undefined : basicDetails.toStockArea,
        toUserId: basicDetails.transferType === 'warehouse-to-person' ? toUserId : undefined,
        ticketId: basicDetails.transferType === 'warehouse-to-person' ? (ticketId || undefined) : undefined,
        materialRequestId: basicDetails.materialRequestNo || undefined,
        transferDate: basicDetails.date,
        items: allocateItemsData.length > 0 ? allocateItemsData.map(item => ({
          materialId: item.materialId,
          quantity: item.quantity,
          serialNumbers: item.serialNumbers || undefined,
          remarks: item.remarks || undefined,
        })) : [],
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
            readOnly
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
              options={toStockAreaOptions}
              value={basicDetails.toStockArea}
              onChange={(e) => setBasicDetails({ ...basicDetails, toStockArea: e.target.value })}
            />
          )}
        </div>

        {basicDetails.transferType === 'material-request' && basicDetails.materialRequestNo && (
          <div className="border-t border-gray-200 pt-6">
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

            <div className="mb-4">
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search"
                  className="w-full pl-10 pr-4 py-2 h-[38px] border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {activeTab === 'requested-items' ? (
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
                <Table
                  headers={['SELECT', 'ITEM NAME', 'PROPERTIES', 'GRN NO.', 'AASET ID', 'REQUESTED QUANTITY', 'REMARKS']}
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
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.requestedQuantity}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.remarks}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                        No data found
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
        )}

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
    </div>
  )
}

export default StockTransfer
