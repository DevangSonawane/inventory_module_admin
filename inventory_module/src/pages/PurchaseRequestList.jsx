import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, RefreshCw, Eye, Edit, Trash2, Loader2, CheckCircle, XCircle } from 'lucide-react'
import { toast } from 'react-toastify'
import Button from '../components/common/Button'
import Table from '../components/common/Table'
import Pagination from '../components/common/Pagination'
import Dropdown from '../components/common/Dropdown'
import Badge from '../components/common/Badge'
import ConfirmationModal from '../components/common/ConfirmationModal'
import { purchaseRequestService } from '../services/purchaseRequestService.js'

const PurchaseRequestList = () => {
  const navigate = useNavigate()
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [purchaseRequests, setPurchaseRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [totalItems, setTotalItems] = useState(0)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteId, setDeleteId] = useState(null)
  const [actionLoading, setActionLoading] = useState(null)

  useEffect(() => {
    fetchPurchaseRequests()
  }, [currentPage, itemsPerPage, searchTerm, statusFilter])

  useEffect(() => {
    const timer = setTimeout(() => {
      if (currentPage === 1) {
        fetchPurchaseRequests()
      } else {
        setCurrentPage(1)
      }
    }, 500)
    return () => clearTimeout(timer)
  }, [searchTerm])

  const fetchPurchaseRequests = async () => {
    try {
      setLoading(true)
      const response = await purchaseRequestService.getAll({
        page: currentPage,
        limit: itemsPerPage,
        search: searchTerm || undefined,
        status: statusFilter || undefined,
      })
      
      if (response.success) {
        const prsData = ((response.data?.purchaseRequests || response.data?.data || [])).map((pr, index) => {
          try {
            const date = new Date(pr.requested_date || pr.created_at || Date.now())
            const formattedDate = `${String(date.getDate()).padStart(2, '0')}-${String(date.getMonth() + 1).padStart(2, '0')}-${date.getFullYear()}`
            
            const totalItems = (pr.items || []).reduce((sum, item) => sum + (parseInt(item.requested_quantity) || 0), 0)
            
            return {
              id: pr.pr_id || pr.id,
              srNo: (currentPage - 1) * itemsPerPage + index + 1,
              prNumber: pr.pr_number || `PR-${(pr.pr_id || pr.id)?.substring(0, 8).toUpperCase()}`,
              date: formattedDate,
              totalItems: totalItems,
              status: pr.status || 'DRAFT',
              requestedBy: pr.requested_by || pr.requestedBy || '-',
            }
          } catch (err) {
            console.error('Error processing PR:', err, pr)
            return null
          }
        }).filter(Boolean)
        
        setPurchaseRequests(prsData)
        setTotalItems(response.data?.pagination?.totalItems || response.data?.totalItems || prsData.length)
      }
    } catch (error) {
      console.error('Error fetching purchase requests:', error)
      toast.error(error.message || 'Failed to load purchase requests')
      setPurchaseRequests([])
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (id) => {
    try {
      setActionLoading(id)
      await purchaseRequestService.approve(id)
      toast.success('Purchase request approved successfully')
      fetchPurchaseRequests()
    } catch (error) {
      toast.error(error.message || 'Failed to approve purchase request')
    } finally {
      setActionLoading(null)
    }
  }

  const handleReject = async (id) => {
    const remarks = prompt('Enter rejection remarks:')
    if (!remarks) return
    
    try {
      setActionLoading(id)
      await purchaseRequestService.reject(id, remarks)
      toast.success('Purchase request rejected')
      fetchPurchaseRequests()
    } catch (error) {
      toast.error(error.message || 'Failed to reject purchase request')
    } finally {
      setActionLoading(null)
    }
  }

  const handleDelete = async () => {
    try {
      await purchaseRequestService.delete(deleteId)
      toast.success('Purchase request deleted successfully')
      setShowDeleteModal(false)
      setDeleteId(null)
      fetchPurchaseRequests()
    } catch (error) {
      toast.error(error.message || 'Failed to delete purchase request')
    }
  }

  const getStatusBadge = (status) => {
    const statusMap = {
      'DRAFT': { label: 'Draft', color: 'gray' },
      'SUBMITTED': { label: 'Submitted', color: 'blue' },
      'APPROVED': { label: 'Approved', color: 'green' },
      'REJECTED': { label: 'Rejected', color: 'red' },
    }
    const statusInfo = statusMap[status] || { label: status, color: 'gray' }
    return <Badge color={statusInfo.color}>{statusInfo.label}</Badge>
  }

  const columns = [
    { key: 'srNo', label: 'Sr. No.' },
    { key: 'prNumber', label: 'PR Number' },
    { key: 'date', label: 'Date' },
    { key: 'totalItems', label: 'Total Items' },
    { key: 'status', label: 'Status', render: (row) => getStatusBadge(row.status) },
    { key: 'requestedBy', label: 'Requested By' },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(`/purchase-request/${row.id}`)}
            className="p-1 text-blue-600 hover:bg-blue-50 rounded"
            title="View Details"
          >
            <Eye className="w-4 h-4" />
          </button>
          {row.status === 'SUBMITTED' && (
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
          <button
            onClick={() => {
              setDeleteId(row.id)
              setShowDeleteModal(true)
            }}
            className="p-1 text-red-600 hover:bg-red-50 rounded"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ]

  const statusOptions = [
    { value: '', label: 'All Statuses' },
    { value: 'DRAFT', label: 'Draft' },
    { value: 'SUBMITTED', label: 'Submitted' },
    { value: 'APPROVED', label: 'Approved' },
    { value: 'REJECTED', label: 'Rejected' },
  ]

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Purchase Requests</h1>
        <Button onClick={() => navigate('/purchase-request/new')} icon={<Plus className="w-4 h-4" />}>
          Create Purchase Request
        </Button>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by PR number, date..."
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
          <Button onClick={fetchPurchaseRequests} variant="outline" icon={<RefreshCw className="w-4 h-4" />}>
            Refresh
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600" />
            <p className="mt-2 text-gray-600">Loading purchase requests...</p>
          </div>
        ) : purchaseRequests.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-600">No purchase requests found</p>
          </div>
        ) : (
          <>
            <Table data={purchaseRequests} columns={columns} />
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

      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false)
          setDeleteId(null)
        }}
        onConfirm={handleDelete}
        title="Delete Purchase Request"
        message="Are you sure you want to delete this purchase request? This action cannot be undone."
      />
    </div>
  )
}

export default PurchaseRequestList
