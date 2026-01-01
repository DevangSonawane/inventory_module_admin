import { useState, useEffect } from 'react'
import { CheckCircle, XCircle, FileText, ShoppingBag, Loader2, Filter } from 'lucide-react'
import { toast } from 'react-toastify'
import Table from '../components/common/Table'
import Pagination from '../components/common/Pagination'
import Badge from '../components/common/Badge'
import { TableSkeleton } from '../components/common/Skeleton'
import ConfirmationModal from '../components/common/ConfirmationModal'
import { materialRequestService } from '../services/materialRequestService.js'
import { purchaseRequestService } from '../services/purchaseRequestService.js'
import { useAuth } from '../utils/useAuth.js'
import { format } from 'date-fns'

const ApprovalCenter = () => {
  const { isAdmin } = useAuth()
  const [activeTab, setActiveTab] = useState('purchase-requests')
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [totalItems, setTotalItems] = useState(0)
  const [data, setData] = useState([])
  const [actionLoading, setActionLoading] = useState({})
  const [statusFilter, setStatusFilter] = useState('') // Default to empty to show all items
  const [showApprovalModal, setShowApprovalModal] = useState(false)
  const [showRejectionModal, setShowRejectionModal] = useState(false)
  const [selectedItem, setSelectedItem] = useState(null)
  const [actionType, setActionType] = useState(null) // 'purchase-request' or 'material-request'
  const [remarks, setRemarks] = useState('')

  useEffect(() => {
    fetchData()
  }, [activeTab, currentPage, itemsPerPage, statusFilter])

  const fetchData = async () => {
    try {
      setLoading(true)
      let response

      if (activeTab === 'purchase-requests') {
        response = await purchaseRequestService.getAll({
          status: statusFilter || undefined, // Show all if no filter
          page: currentPage,
          limit: itemsPerPage,
        })
        const payload = response.data || {}
        setData(payload.purchaseRequests || [])
        setTotalItems(payload.pagination?.totalItems || 0)
      } else {
        response = await materialRequestService.getAll({
          status: statusFilter || undefined, // Show all if no filter
          page: currentPage,
          limit: itemsPerPage,
        })
        const payload = response.data || {}
        setData(payload.materialRequests || [])
        setTotalItems(payload.pagination?.totalItems || 0)
      }
    } catch (error) {
      console.error('Error fetching approvals:', error)
      toast.error('Failed to load approvals')
    } finally {
      setLoading(false)
    }
  }

  const openApprovalModal = (item, type) => {
    setSelectedItem(item)
    setActionType(type)
    setRemarks('')
    setShowApprovalModal(true)
  }

  const openRejectionModal = (item, type) => {
    setSelectedItem(item)
    setActionType(type)
    setRemarks('')
    setShowRejectionModal(true)
  }

  const handleApprove = async () => {
    if (!selectedItem || !actionType) return

    const id = actionType === 'purchase-request' 
      ? (selectedItem.id || selectedItem.pr_id)
      : (selectedItem.request_id || selectedItem.id || selectedItem.mr_id)
    
    const actionKey = `${actionType}-${id}`
    
    try {
      setActionLoading((prev) => ({ ...prev, [actionKey]: true }))
      let response
      
      if (actionType === 'purchase-request') {
        // Purchase Request approve accepts optional remarks in body
        response = await purchaseRequestService.approve(id, remarks || null)
      } else {
        // Material Request approve requires status, approvedItems, and remarks in body
        response = await materialRequestService.approve(id, {
          status: 'APPROVED',
          approvedItems: [], // Empty array means approve all items as requested
          remarks: remarks || 'Approved by admin'
        })
      }

      if (response.success) {
        toast.success(`${actionType === 'purchase-request' ? 'Purchase Request' : 'Material Request'} approved successfully`)
        setShowApprovalModal(false)
        setSelectedItem(null)
        setActionType(null)
        setRemarks('')
        fetchData()
      }
    } catch (error) {
      console.error('Error approving:', error)
      toast.error(error.response?.data?.message || error.message || 'Failed to approve')
    } finally {
      setActionLoading((prev) => ({ ...prev, [actionKey]: false }))
    }
  }

  const handleReject = async () => {
    if (!selectedItem || !actionType) return

    if (!remarks || remarks.trim() === '') {
      toast.error('Please provide a reason for rejection')
      return
    }

    const id = actionType === 'purchase-request' 
      ? (selectedItem.id || selectedItem.pr_id)
      : (selectedItem.request_id || selectedItem.id || selectedItem.mr_id)
    
    const actionKey = `${actionType}-${id}`

    try {
      setActionLoading((prev) => ({ ...prev, [actionKey]: true }))
      let response
      
      if (actionType === 'purchase-request') {
        // Purchase Request reject expects remarks as string parameter
        response = await purchaseRequestService.reject(id, remarks)
      } else {
        // Material Request reject uses approve endpoint with status 'REJECTED'
        response = await materialRequestService.approve(id, {
          status: 'REJECTED',
          approvedItems: [],
          remarks: remarks
        })
      }

      if (response.success) {
        toast.success(`${actionType === 'purchase-request' ? 'Purchase Request' : 'Material Request'} rejected`)
        setShowRejectionModal(false)
        setSelectedItem(null)
        setActionType(null)
        setRemarks('')
        fetchData()
      }
    } catch (error) {
      console.error('Error rejecting:', error)
      toast.error(error.response?.data?.message || error.message || 'Failed to reject')
    } finally {
      setActionLoading((prev) => ({ ...prev, [actionKey]: false }))
    }
  }

  const renderStatusBadge = (status) => {
    const normalized = (status || '').toUpperCase()
    if (normalized === 'APPROVED') return <Badge variant="success">Approved</Badge>
    if (normalized === 'REJECTED') return <Badge variant="danger">Rejected</Badge>
    if (normalized === 'SUBMITTED') return <Badge variant="warning">Submitted</Badge>
    if (normalized === 'DRAFT') return <Badge variant="default">Draft</Badge>
    if (normalized === 'FULFILLED') return <Badge variant="primary">Fulfilled</Badge>
    return <Badge variant="warning">Pending</Badge>
  }

  const canApproveOrReject = (status) => {
    const normalized = (status || '').toUpperCase()
    
    // Don't show buttons if already approved or rejected
    if (normalized === 'APPROVED' || normalized === 'REJECTED') {
      return false
    }
    
    // Admins can approve/reject any status except APPROVED/REJECTED, regular users can only approve/reject SUBMITTED
    if (isAdmin) {
      return true
    }
    
    return normalized === 'SUBMITTED'
  }

  // Calculate total with GST/SGST for a purchase request
  const calculatePRTotal = (pr) => {
    const items = pr.items || pr.purchase_request_items || []
    if (items.length === 0) return 0
    
    return items.reduce((total, item) => {
      const quantity = parseInt(item.requested_quantity) || 0
      const material = item.material || {}
      const unitPrice = parseFloat(material.price) || 0
      const gstPercentage = parseFloat(material.gst_percentage) || 0
      const sgstPercentage = parseFloat(material.sgst_percentage) || 0
      
      const subtotal = quantity * unitPrice
      const gstAmount = subtotal * (gstPercentage / 100)
      const sgstAmount = subtotal * (sgstPercentage / 100)
      const itemTotal = subtotal + gstAmount + sgstAmount
      
      return total + itemTotal
    }, 0)
  }

  const renderPurchaseRequestTable = () => (
    <Table
      headers={['PR NUMBER', 'DATE', 'REQUESTED BY', 'ITEMS', 'TOTAL AMOUNT', 'STATUS', 'ACTIONS']}
    >
      {data.length > 0 ? (
        data.map((pr) => {
          const calculatedTotal = calculatePRTotal(pr)
          return (
          <tr key={pr.id || pr.pr_id} className="hover:bg-gray-50">
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
              {pr.pr_number || pr.prNumber || `PR-${pr.id}`}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
              {pr.requested_date ? format(new Date(pr.requested_date), 'dd-MM-yyyy') : pr.pr_date ? format(new Date(pr.pr_date), 'dd-MM-yyyy') : '-'}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
              {pr.requester?.name || pr.requested_by || pr.requestedBy || '-'}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
              {pr.itemCount || pr.items?.length || pr.purchase_request_items?.length || 0} items
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">
              ₹{calculatedTotal.toFixed(2)}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm">
              {renderStatusBadge(pr.status)}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm">
              {canApproveOrReject(pr.status) ? (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openApprovalModal(pr, 'purchase-request')}
                    disabled={actionLoading[`purchase-request-${pr.id || pr.pr_id}`]}
                    className="px-3 py-1.5 bg-green-50 text-green-700 hover:bg-green-100 disabled:opacity-60 disabled:cursor-not-allowed rounded-md flex items-center gap-1.5 text-sm font-medium transition-colors"
                    title="Approve"
                  >
                    {actionLoading[`purchase-request-${pr.id || pr.pr_id}`] ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <CheckCircle className="w-4 h-4" />
                    )}
                    Approve
                  </button>
                  <button
                    onClick={() => openRejectionModal(pr, 'purchase-request')}
                    disabled={actionLoading[`purchase-request-${pr.id || pr.pr_id}`]}
                    className="px-3 py-1.5 bg-red-50 text-red-700 hover:bg-red-100 disabled:opacity-60 disabled:cursor-not-allowed rounded-md flex items-center gap-1.5 text-sm font-medium transition-colors"
                    title="Reject"
                  >
                    {actionLoading[`purchase-request-${pr.id || pr.pr_id}`] ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <XCircle className="w-4 h-4" />
                    )}
                    Reject
                  </button>
                </div>
              ) : (
                <span className="text-gray-400 text-sm">No action available</span>
              )}
            </td>
          </tr>
          )
        })
      ) : (
        <tr>
          <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
            {statusFilter ? `No purchase requests with status "${statusFilter}"` : 'No purchase requests found'}
          </td>
        </tr>
      )}
    </Table>
  )

  const renderMaterialRequestTable = () => (
    <Table
      headers={['MR NUMBER', 'DATE', 'REQUESTED BY', 'STOCK AREA', 'ITEMS', 'STATUS', 'ACTIONS']}
    >
      {data.length > 0 ? (
        data.map((mr) => (
          <tr key={mr.id || mr.mr_id} className="hover:bg-gray-50">
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
              {mr.slip_number || mr.mr_number || mr.mrNumber || `MR-${mr.request_id?.substring(0, 8).toUpperCase() || mr.id}`}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
              {mr.created_at ? format(new Date(mr.created_at), 'dd-MM-yyyy') : mr.request_date ? format(new Date(mr.request_date), 'dd-MM-yyyy') : '-'}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
              {mr.requester?.name || mr.requested_by || mr.requestedBy || '-'}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
              {mr.from_stock_area?.stock_area_name || mr.stock_area_name || mr.stockAreaName || '-'}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
              {mr.items?.length || mr.material_request_items?.length || mr.itemCount || 0} items
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm">
              {renderStatusBadge(mr.status)}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm">
              {canApproveOrReject(mr.status) ? (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openApprovalModal(mr, 'material-request')}
                    disabled={actionLoading[`material-request-${mr.request_id || mr.id || mr.mr_id}`]}
                    className="px-3 py-1.5 bg-green-50 text-green-700 hover:bg-green-100 disabled:opacity-60 disabled:cursor-not-allowed rounded-md flex items-center gap-1.5 text-sm font-medium transition-colors"
                    title="Approve"
                  >
                    {actionLoading[`material-request-${mr.request_id || mr.id || mr.mr_id}`] ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <CheckCircle className="w-4 h-4" />
                    )}
                    Approve
                  </button>
                  <button
                    onClick={() => openRejectionModal(mr, 'material-request')}
                    disabled={actionLoading[`material-request-${mr.request_id || mr.id || mr.mr_id}`]}
                    className="px-3 py-1.5 bg-red-50 text-red-700 hover:bg-red-100 disabled:opacity-60 disabled:cursor-not-allowed rounded-md flex items-center gap-1.5 text-sm font-medium transition-colors"
                    title="Reject"
                  >
                    {actionLoading[`material-request-${mr.request_id || mr.id || mr.mr_id}`] ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <XCircle className="w-4 h-4" />
                    )}
                    Reject
                  </button>
                </div>
              ) : (
                <span className="text-gray-400 text-sm">No action available</span>
              )}
            </td>
          </tr>
        ))
      ) : (
        <tr>
          <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
            {statusFilter ? `No material requests with status "${statusFilter}"` : 'No material requests found'}
          </td>
        </tr>
      )}
    </Table>
  )

  const totalPages = Math.ceil(totalItems / itemsPerPage)

  const statusOptions = [
    { value: '', label: 'All Statuses' },
    { value: 'DRAFT', label: 'Draft' },
    { value: 'SUBMITTED', label: 'Submitted' },
    { value: 'APPROVED', label: 'Approved' },
    { value: 'REJECTED', label: 'Rejected' },
    { value: 'FULFILLED', label: 'Fulfilled' },
  ]

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Approval Center</h2>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value)
                  setCurrentPage(1)
                }}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="flex border-b border-gray-200 mb-6">
          <button
            onClick={() => {
              setActiveTab('purchase-requests')
              setCurrentPage(1)
            }}
            className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'purchase-requests'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            Purchase Requests ({activeTab === 'purchase-requests' ? totalItems : '...'})
          </button>
          <button
            onClick={() => {
              setActiveTab('material-requests')
              setCurrentPage(1)
            }}
            className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'material-requests'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <FileText className="w-4 h-4" />
            Material Requests ({activeTab === 'material-requests' ? totalItems : '...'})
          </button>
        </div>

        {loading ? (
          <TableSkeleton rows={10} columns={7} />
        ) : (
          <>
            {activeTab === 'purchase-requests' ? renderPurchaseRequestTable() : renderMaterialRequestTable()}

            {totalItems > 0 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                itemsPerPage={itemsPerPage}
                totalItems={totalItems}
                onPageChange={setCurrentPage}
                onItemsPerPageChange={setItemsPerPage}
              />
            )}
          </>
        )}
      </div>

      {/* Approval Modal */}
      <ConfirmationModal
        isOpen={showApprovalModal}
        onClose={() => {
          setShowApprovalModal(false)
          setSelectedItem(null)
          setActionType(null)
          setRemarks('')
        }}
        onConfirm={handleApprove}
        title={`Approve ${actionType === 'purchase-request' ? 'Purchase Request' : 'Material Request'}`}
        confirmText="Approve"
        variant="success"
        message={
          <div className="space-y-4">
            <p className="text-gray-600">
              Are you sure you want to approve this {actionType === 'purchase-request' ? 'purchase request' : 'material request'}?
            </p>
            {selectedItem && (
              <div className="bg-gray-50 p-3 rounded-md">
                <p className="text-sm text-gray-700">
                  <span className="font-medium">Request ID:</span>{' '}
                  {actionType === 'purchase-request' 
                    ? (selectedItem.pr_number || selectedItem.prNumber || `PR-${selectedItem.id}`)
                    : (selectedItem.slip_number || selectedItem.mr_number || `MR-${selectedItem.request_id || selectedItem.id}`)
                  }
                </p>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Remarks (Optional)
              </label>
              <textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Enter approval remarks..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                rows="3"
              />
            </div>
          </div>
        }
      />

      {/* Rejection Modal */}
      <ConfirmationModal
        isOpen={showRejectionModal}
        onClose={() => {
          setShowRejectionModal(false)
          setSelectedItem(null)
          setActionType(null)
          setRemarks('')
        }}
        onConfirm={handleReject}
        title={`Reject ${actionType === 'purchase-request' ? 'Purchase Request' : 'Material Request'}`}
        confirmText="Reject"
        variant="danger"
        message={
          <div className="space-y-4">
            <p className="text-gray-600">
              Are you sure you want to reject this {actionType === 'purchase-request' ? 'purchase request' : 'material request'}?
            </p>
            {selectedItem && (
              <div className="bg-gray-50 p-3 rounded-md">
                <p className="text-sm text-gray-700">
                  <span className="font-medium">Request ID:</span>{' '}
                  {actionType === 'purchase-request' 
                    ? (selectedItem.pr_number || selectedItem.prNumber || `PR-${selectedItem.id}`)
                    : (selectedItem.slip_number || selectedItem.mr_number || `MR-${selectedItem.request_id || selectedItem.id}`)
                  }
                </p>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rejection Reason <span className="text-red-500">*</span>
              </label>
              <textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Please provide a reason for rejection..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                rows="3"
                required
              />
              {!remarks && (
                <p className="text-xs text-red-500 mt-1">Rejection reason is required</p>
              )}
            </div>
          </div>
        }
      />
    </div>
  )
}

export default ApprovalCenter

