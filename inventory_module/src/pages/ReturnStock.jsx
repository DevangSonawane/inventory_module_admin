import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, RefreshCw, Eye, Loader2, CheckCircle, XCircle, Package } from 'lucide-react'
import { toast } from 'react-toastify'
import Button from '../components/common/Button'
import Table from '../components/common/Table'
import Pagination from '../components/common/Pagination'
import Dropdown from '../components/common/Dropdown'
import Badge from '../components/common/Badge'
import Modal from '../components/common/Modal'
import Input from '../components/common/Input'
import { returnService } from '../services/returnService.js'
import { personStockService } from '../services/personStockService.js'

const ReturnStock = () => {
  const navigate = useNavigate()
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [returns, setReturns] = useState([])
  const [loading, setLoading] = useState(true)
  const [totalItems, setTotalItems] = useState(0)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [availableItems, setAvailableItems] = useState([])
  const [loadingItems, setLoadingItems] = useState(false)
  const [userId, setUserId] = useState(null)
  const [actionLoading, setActionLoading] = useState(null)

  const [returnForm, setReturnForm] = useState({
    technicianId: '',
    ticketId: '',
    reason: 'UNUSED',
    returnDate: new Date().toISOString().split('T')[0],
    remarks: '',
    items: [],
  })

  const [selectedItems, setSelectedItems] = useState([])

  useEffect(() => {
    const userStr = localStorage.getItem('user')
    if (userStr) {
      try {
        const user = JSON.parse(userStr)
        setUserId(user.id || user.user_id)
        setReturnForm(prev => ({ ...prev, technicianId: user.id || user.user_id }))
      } catch (e) {
        console.error('Error parsing user data:', e)
      }
    }
  }, [])

  useEffect(() => {
    fetchReturns()
  }, [currentPage, itemsPerPage, searchTerm, statusFilter])

  useEffect(() => {
    const timer = setTimeout(() => {
      if (currentPage === 1) {
        fetchReturns()
      } else {
        setCurrentPage(1)
      }
    }, 500)
    return () => clearTimeout(timer)
  }, [searchTerm])

  const fetchReturns = async () => {
    try {
      setLoading(true)
      const response = await returnService.getAll({
        page: currentPage,
        limit: itemsPerPage,
        search: searchTerm || undefined,
        status: statusFilter || undefined,
      })
      
      if (response.success) {
        const returnsData = ((response.data?.returns || response.data?.data || [])).map((ret, index) => {
          try {
            const date = new Date(ret.return_date || ret.created_at || Date.now())
            const formattedDate = `${String(date.getDate()).padStart(2, '0')}-${String(date.getMonth() + 1).padStart(2, '0')}-${date.getFullYear()}`
            
            return {
              id: ret.return_id || ret.id,
              srNo: (currentPage - 1) * itemsPerPage + index + 1,
              returnNumber: ret.return_number || `RET-${(ret.return_id || ret.id)?.substring(0, 8).toUpperCase()}`,
              date: formattedDate,
              technician: ret.technician?.name || ret.technician_name || '-',
              ticketId: ret.ticket_id || '-',
              reason: ret.reason,
              status: ret.status || 'PENDING',
              itemCount: ret.items?.length || 0,
            }
          } catch (err) {
            console.error('Error processing return:', err, ret)
            return null
          }
        }).filter(Boolean)
        
        setReturns(returnsData)
        setTotalItems(response.data?.pagination?.totalItems || response.data?.totalItems || returnsData.length)
      }
    } catch (error) {
      console.error('Error fetching returns:', error)
      toast.error(error.message || 'Failed to load returns')
      setReturns([])
    } finally {
      setLoading(false)
    }
  }

  const fetchAvailableItems = async () => {
    if (!userId) {
      toast.error('User ID not found')
      return
    }

    try {
      setLoadingItems(true)
      const response = await returnService.getAvailableItems({
        technicianId: userId,
        ticketId: returnForm.ticketId || undefined,
      })
      
      if (response.success) {
        // Handle different response structures
        const items = response.data?.items || response.data?.availableItems || []
        // Flatten grouped items if needed
        const flatItems = items.flatMap(group => {
          if (group.items && Array.isArray(group.items)) {
            return group.items.map(item => ({
              id: item.id || item.inventory_master_id,
              material_id: item.material_id || group.material?.material_id,
              material: item.material || group.material,
              serial_number: item.serial_number,
              mac_id: item.mac_id,
              ticket_id: item.ticket_id,
            }))
          }
          return [{
            id: group.id || group.inventory_master_id,
            material_id: group.material_id,
            material: group.material,
            serial_number: group.serial_number,
            mac_id: group.mac_id,
            ticket_id: group.ticket_id,
          }]
        })
        setAvailableItems(flatItems)
      }
    } catch (error) {
      console.error('Error fetching available items:', error)
      toast.error('Failed to load available items')
      setAvailableItems([])
    } finally {
      setLoadingItems(false)
    }
  }

  const handleCreateReturn = async () => {
    if (selectedItems.length === 0) {
      toast.error('Please select at least one item to return')
      return
    }

    try {
      setLoading(true)
      const returnData = {
        technicianId: returnForm.technicianId,
        ticketId: returnForm.ticketId || undefined,
        reason: returnForm.reason,
        returnDate: returnForm.returnDate,
        remarks: returnForm.remarks || undefined,
        items: selectedItems.map(item => ({
          materialId: item.material_id,
          serialNumber: item.serial_number || undefined,
          macId: item.mac_id || undefined,
          quantity: 1,
        })),
      }

      const response = await returnService.create(returnData)
      if (response.success) {
        toast.success('Return request created successfully')
        setShowCreateModal(false)
        resetForm()
        fetchReturns()
      }
    } catch (error) {
      console.error('Error creating return:', error)
      toast.error(error.message || 'Failed to create return request')
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (id) => {
    try {
      setActionLoading(id)
      await returnService.approve(id)
      toast.success('Return approved successfully')
      fetchReturns()
    } catch (error) {
      toast.error(error.message || 'Failed to approve return')
    } finally {
      setActionLoading(null)
    }
  }

  const handleReject = async (id) => {
    try {
      setActionLoading(id)
      await returnService.reject(id)
      toast.success('Return rejected')
      fetchReturns()
    } catch (error) {
      toast.error(error.message || 'Failed to reject return')
    } finally {
      setActionLoading(null)
    }
  }

  const resetForm = () => {
    setReturnForm({
      technicianId: userId || '',
      ticketId: '',
      reason: 'UNUSED',
      returnDate: new Date().toISOString().split('T')[0],
      remarks: '',
      items: [],
    })
    setSelectedItems([])
    setAvailableItems([])
  }

  const toggleItemSelection = (item) => {
    const isSelected = selectedItems.some(sel => sel.id === item.id)
    if (isSelected) {
      setSelectedItems(selectedItems.filter(sel => sel.id !== item.id))
    } else {
      setSelectedItems([...selectedItems, item])
    }
  }

  const getStatusBadge = (status) => {
    const statusMap = {
      'PENDING': { label: 'Pending', color: 'yellow' },
      'APPROVED': { label: 'Approved', color: 'green' },
      'REJECTED': { label: 'Rejected', color: 'red' },
    }
    const statusInfo = statusMap[status] || { label: status, color: 'gray' }
    return <Badge color={statusInfo.color}>{statusInfo.label}</Badge>
  }

  const getReasonBadge = (reason) => {
    const reasonMap = {
      'UNUSED': { label: 'Unused', color: 'blue' },
      'FAULTY': { label: 'Faulty', color: 'red' },
      'CANCELLED': { label: 'Cancelled', color: 'gray' },
    }
    const reasonInfo = reasonMap[reason] || { label: reason, color: 'gray' }
    return <Badge color={reasonInfo.color}>{reasonInfo.label}</Badge>
  }

  const columns = [
    { key: 'srNo', label: 'Sr. No.' },
    { key: 'returnNumber', label: 'Return Number' },
    { key: 'date', label: 'Date' },
    { key: 'technician', label: 'Technician' },
    { key: 'ticketId', label: 'Ticket ID' },
    { key: 'reason', label: 'Reason', render: (row) => getReasonBadge(row.reason) },
    { key: 'itemCount', label: 'Items' },
    { key: 'status', label: 'Status', render: (row) => getStatusBadge(row.status) },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(`/return-stock/${row.id}`)}
            className="p-1 text-blue-600 hover:bg-blue-50 rounded"
            title="View Details"
          >
            <Eye className="w-4 h-4" />
          </button>
          {row.status === 'PENDING' && (
            <>
              <button
                onClick={() => handleApprove(row.id)}
                disabled={actionLoading === row.id}
                className="p-1 text-green-600 hover:bg-green-50 rounded disabled:opacity-50"
                title="Approve"
              >
                {actionLoading === row.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
              </button>
              <button
                onClick={() => handleReject(row.id)}
                disabled={actionLoading === row.id}
                className="p-1 text-red-600 hover:bg-red-50 rounded disabled:opacity-50"
                title="Reject"
              >
                {actionLoading === row.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
              </button>
            </>
          )}
        </div>
      ),
    },
  ]

  const reasonOptions = [
    { value: 'UNUSED', label: 'Unused' },
    { value: 'FAULTY', label: 'Faulty' },
    { value: 'CANCELLED', label: 'Cancelled' },
  ]

  const statusOptions = [
    { value: '', label: 'All Statuses' },
    { value: 'PENDING', label: 'Pending' },
    { value: 'APPROVED', label: 'Approved' },
    { value: 'REJECTED', label: 'Rejected' },
  ]

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Return Stock</h1>
        <Button onClick={() => {
          resetForm()
          setShowCreateModal(true)
          fetchAvailableItems()
        }} icon={<Plus className="w-4 h-4" />}>
          Create Return Request
        </Button>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by return number, ticket ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <Dropdown
            options={statusOptions}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-48"
          />
          <Button onClick={fetchReturns} variant="outline" icon={<RefreshCw className="w-4 h-4" />}>
            Refresh
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600" />
            <p className="mt-2 text-gray-600">Loading returns...</p>
          </div>
        ) : returns.length === 0 ? (
          <div className="text-center py-8">
            <Package className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600">No return requests found</p>
          </div>
        ) : (
          <>
            <Table data={returns} columns={columns} />
            <Pagination
              currentPage={currentPage}
              totalPages={Math.ceil(totalItems / itemsPerPage)}
              itemsPerPage={itemsPerPage}
              totalItems={totalItems}
              onPageChange={setCurrentPage}
              onItemsPerPageChange={(value) => {
                setItemsPerPage(value)
                setCurrentPage(1)
              }}
            />
          </>
        )}
      </div>

      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false)
          resetForm()
        }}
        title="Create Return Request"
        size="lg"
      >
        <div className="space-y-4">
          <Input
            label="Ticket ID (Optional)"
            value={returnForm.ticketId}
            onChange={(e) => {
              setReturnForm({ ...returnForm, ticketId: e.target.value })
              if (e.target.value) {
                fetchAvailableItems()
              }
            }}
            placeholder="Enter ticket ID"
          />
          <Dropdown
            label="Reason"
            options={reasonOptions}
            value={returnForm.reason}
            onChange={(e) => setReturnForm({ ...returnForm, reason: e.target.value })}
          />
          <Input
            label="Return Date"
            type="date"
            value={returnForm.returnDate}
            onChange={(e) => setReturnForm({ ...returnForm, returnDate: e.target.value })}
          />
          <Input
            label="Remarks"
            value={returnForm.remarks}
            onChange={(e) => setReturnForm({ ...returnForm, remarks: e.target.value })}
            placeholder="Optional"
          />

          <div className="border-t pt-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold">Select Items to Return</h3>
              <Button onClick={fetchAvailableItems} variant="outline" size="sm" icon={<RefreshCw className="w-4 h-4" />}>
                Refresh Items
              </Button>
            </div>

            {loadingItems ? (
              <div className="text-center py-4">
                <Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-600" />
              </div>
            ) : availableItems.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No items available for return</p>
            ) : (
              <div className="max-h-64 overflow-y-auto border rounded">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-4 py-2 text-left">Select</th>
                      <th className="px-4 py-2 text-left">Material</th>
                      <th className="px-4 py-2 text-left">Serial</th>
                      <th className="px-4 py-2 text-left">MAC ID</th>
                      <th className="px-4 py-2 text-left">Ticket</th>
                    </tr>
                  </thead>
                  <tbody>
                    {availableItems.map((item) => {
                      const isSelected = selectedItems.some(sel => sel.id === item.id)
                      return (
                        <tr key={item.id} className={isSelected ? 'bg-blue-50' : ''}>
                          <td className="px-4 py-2">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleItemSelection(item)}
                            />
                          </td>
                          <td className="px-4 py-2">{item.material?.material_name || '-'}</td>
                          <td className="px-4 py-2">{item.serial_number || '-'}</td>
                          <td className="px-4 py-2">{item.mac_id || '-'}</td>
                          <td className="px-4 py-2">{item.ticket_id || '-'}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {selectedItems.length > 0 && (
              <p className="mt-2 text-sm text-gray-600">
                {selectedItems.length} item(s) selected
              </p>
            )}
          </div>

          <div className="flex gap-2 justify-end pt-4 border-t">
            <Button onClick={() => {
              setShowCreateModal(false)
              resetForm()
            }} variant="outline">
              Cancel
            </Button>
            <Button onClick={handleCreateReturn} disabled={loading || selectedItems.length === 0} icon={loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}>
              Create Return Request
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default ReturnStock
