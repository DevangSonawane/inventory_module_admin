import { useState, useEffect } from 'react'
import { CheckCircle, XCircle, FileText, ShoppingBag, Loader2 } from 'lucide-react'
import { toast } from 'react-toastify'
import Table from '../components/common/Table'
import Pagination from '../components/common/Pagination'
import Button from '../components/common/Button'
import Badge from '../components/common/Badge'
import { TableSkeleton } from '../components/common/Skeleton'
import { materialRequestService } from '../services/materialRequestService.js'
import { purchaseRequestService } from '../services/purchaseRequestService.js'
import { format } from 'date-fns'

const ApprovalCenter = () => {
  const [activeTab, setActiveTab] = useState('purchase-requests')
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [totalItems, setTotalItems] = useState(0)
  const [data, setData] = useState([])

  useEffect(() => {
    fetchData()
  }, [activeTab, currentPage, itemsPerPage])

  const fetchData = async () => {
    try {
      setLoading(true)
      let response

      if (activeTab === 'purchase-requests') {
        response = await purchaseRequestService.getAll({
          status: 'SUBMITTED',
          page: currentPage,
          limit: itemsPerPage,
        })
        setData(response.data?.purchaseRequests || [])
        setTotalItems(response.data?.pagination?.totalItems || 0)
      } else {
        response = await materialRequestService.getAll({
          status: 'SUBMITTED',
          page: currentPage,
          limit: itemsPerPage,
        })
        setData(response.data?.materialRequests || [])
        setTotalItems(response.data?.pagination?.totalItems || 0)
      }
    } catch (error) {
      console.error('Error fetching approvals:', error)
      toast.error('Failed to load approvals')
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (id, type) => {
    try {
      let response
      if (type === 'purchase-request') {
        response = await purchaseRequestService.approve(id)
      } else {
        // Material Request approve requires status, approvedItems, and remarks in body
        response = await materialRequestService.approve(id, {
          status: 'APPROVED',
          approvedItems: [], // Empty array means approve all items as requested
          remarks: 'Approved by admin'
        })
      }

      if (response.success) {
        toast.success(`${type === 'purchase-request' ? 'Purchase Request' : 'Material Request'} approved successfully`)
        fetchData()
      }
    } catch (error) {
      console.error('Error approving:', error)
      toast.error(error.message || 'Failed to approve')
    }
  }

  const handleReject = async (id, type) => {
    // Get rejection reason from user
    const reason = window.prompt('Please provide a reason for rejection:')
    if (!reason || reason.trim() === '') {
      return
    }

    try {
      let response
      if (type === 'purchase-request') {
        // Purchase Request reject expects remarks as string parameter
        response = await purchaseRequestService.reject(id, reason)
      } else {
        // Material Request reject uses approve endpoint with status 'REJECTED'
        response = await materialRequestService.approve(id, {
          status: 'REJECTED',
          approvedItems: [],
          remarks: reason
        })
      }

      if (response.success) {
        toast.success(`${type === 'purchase-request' ? 'Purchase Request' : 'Material Request'} rejected`)
        fetchData()
      }
    } catch (error) {
      console.error('Error rejecting:', error)
      toast.error(error.message || 'Failed to reject')
    }
  }

  const renderPurchaseRequestTable = () => (
    <Table
      headers={['PR NUMBER', 'DATE', 'REQUESTED BY', 'ITEMS', 'TOTAL AMOUNT', 'STATUS', 'ACTIONS']}
    >
      {data.length > 0 ? (
        data.map((pr) => (
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
              {pr.items?.length || pr.purchase_request_items?.length || pr.itemCount || 0} items
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
              ₹{pr.total_amount || pr.totalAmount || 0}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm">
              <Badge variant="warning">Pending</Badge>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleApprove(pr.id || pr.pr_id, 'purchase-request')}
                  className="px-3 py-1.5 bg-green-50 text-green-700 hover:bg-green-100 rounded-md flex items-center gap-1.5 text-sm font-medium transition-colors"
                  title="Approve"
                >
                  <CheckCircle className="w-4 h-4" />
                  Approve
                </button>
                <button
                  onClick={() => handleReject(pr.id || pr.pr_id, 'purchase-request')}
                  className="px-3 py-1.5 bg-red-50 text-red-700 hover:bg-red-100 rounded-md flex items-center gap-1.5 text-sm font-medium transition-colors"
                  title="Reject"
                >
                  <XCircle className="w-4 h-4" />
                  Reject
                </button>
              </div>
            </td>
          </tr>
        ))
      ) : (
        <tr>
          <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
            No pending purchase requests
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
              <Badge variant="warning">Pending</Badge>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleApprove(mr.request_id || mr.id || mr.mr_id, 'material-request')}
                  className="px-3 py-1.5 bg-green-50 text-green-700 hover:bg-green-100 rounded-md flex items-center gap-1.5 text-sm font-medium transition-colors"
                  title="Approve"
                >
                  <CheckCircle className="w-4 h-4" />
                  Approve
                </button>
                <button
                  onClick={() => handleReject(mr.request_id || mr.id || mr.mr_id, 'material-request')}
                  className="px-3 py-1.5 bg-red-50 text-red-700 hover:bg-red-100 rounded-md flex items-center gap-1.5 text-sm font-medium transition-colors"
                  title="Reject"
                >
                  <XCircle className="w-4 h-4" />
                  Reject
                </button>
              </div>
            </td>
          </tr>
        ))
      ) : (
        <tr>
          <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
            No pending material requests
          </td>
        </tr>
      )}
    </Table>
  )

  const totalPages = Math.ceil(totalItems / itemsPerPage)

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Approval Center</h2>
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
    </div>
  )
}

export default ApprovalCenter

