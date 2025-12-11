import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, RefreshCw, Edit, Trash2, Loader2, Download, Printer } from 'lucide-react'
import { toast } from 'react-toastify'
import Button from '../components/common/Button'
import Table from '../components/common/Table'
import Pagination from '../components/common/Pagination'
import Dropdown from '../components/common/Dropdown'
import Badge from '../components/common/Badge'
import ConfirmationModal from '../components/common/ConfirmationModal'
import { materialRequestService } from '../services/materialRequestService.js'
import { exportService } from '../services/exportService.js'
import { printDocument } from '../utils/printUtils.js'
import { useAuth } from '../utils/useAuth.js'

const MaterialRequest = () => {
  const navigate = useNavigate()
  const { user, isAdmin } = useAuth()
  const [activeTab, setActiveTab] = useState('all-mr')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [searchTerm, setSearchTerm] = useState('')
  const [approvalStatusFilter, setApprovalStatusFilter] = useState('')
  const [materialRequests, setMaterialRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [totalItems, setTotalItems] = useState(0)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteId, setDeleteId] = useState(null)

  // Fetch material requests on mount and when filters change
  useEffect(() => {
    fetchMaterialRequests()
  }, [currentPage, itemsPerPage, searchTerm, approvalStatusFilter, activeTab])

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (currentPage === 1) {
        fetchMaterialRequests()
      } else {
        setCurrentPage(1)
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [searchTerm])

  const fetchMaterialRequests = async () => {
    try {
      setLoading(true)
      const orgId =
        user?.org_id ||
        user?.orgId ||
        user?.organization_id ||
        user?.organizationId ||
        localStorage.getItem('orgId') ||
        undefined

      const params = {
        page: currentPage,
        limit: itemsPerPage,
        search: searchTerm || undefined,
        status: approvalStatusFilter || undefined,
        orgId,
      }

      // Filter by tab if needed
      if (activeTab === 'my-mr') {
        // Filter by current user's ID
        if (user?.id || user?.user_id) {
          params.requestedBy = user.id || user.user_id
        }
      } else if (activeTab === 'approval-mr') {
        // Only approved MRs for this tab
        params.status = 'APPROVED'
      }

      const response = await materialRequestService.getAll(params)
      
      if (response?.success) {
        const raw = response?.data ?? response ?? []
        const dataSource = (() => {
          if (Array.isArray(raw?.materialRequests)) return raw.materialRequests
          if (Array.isArray(raw?.data?.materialRequests)) return raw.data.materialRequests
          if (Array.isArray(raw?.requests)) return raw.requests
          if (Array.isArray(raw?.data?.requests)) return raw.data.requests
          if (Array.isArray(raw?.data)) return raw.data
          if (Array.isArray(raw?.material_requests)) return raw.material_requests
          if (Array.isArray(raw?.data?.material_requests)) return raw.data.material_requests
          if (Array.isArray(response?.materialRequests)) return response.materialRequests
          if (Array.isArray(response)) return response
          return []
        })()

        const paginationTotal =
          response.data?.pagination?.totalItems ||
          response.data?.data?.pagination?.totalItems ||
          raw?.pagination?.totalItems ||
          dataSource.length

        const statusMap = {
          PENDING: 'Requested',
          APPROVED: 'Approved',
          REJECTED: 'Rejected',
          REQUESTED: 'Requested',
          SUBMITTED: 'Requested',
          DRAFT: 'Requested',
        }

        // Filter per tab view client-side to ensure "Approval MR" only shows pending
        const filteredByTab = dataSource.filter((request) => {
          const statusRaw = request.status || request.request_status || 'REQUESTED'
          if (activeTab === 'approval-mr') {
            return statusRaw === 'APPROVED'
          }
          if (activeTab === 'my-mr') {
            const uid = user?.id || user?.user_id
            return uid ? request.requested_by === uid : true
          }
          return true // all-mr
        })

        const requestsData = filteredByTab.map((request, index) => {
          const created =
            request.created_at ||
            request.updated_at ||
            request.createdAt ||
            request.updatedAt ||
            new Date().toISOString()

          const date = new Date(created)
          const formattedDate = `${String(date.getDate()).padStart(2, '0')}-${String(date.getMonth() + 1).padStart(2, '0')}-${date.getFullYear()} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:${String(date.getSeconds()).padStart(2, '0')} ${date.getHours() >= 12 ? 'PM' : 'AM'}`

          const mrNo =
            request.slip_number ||
            request.mr_number ||
            request.mrNo ||
            `MR-${(request.request_id || request.id || 'XXXXXX').substring(0, 8).toUpperCase()}`

          const statusRaw = request.status || request.request_status || 'REQUESTED'
          const approvalStatus = statusMap[statusRaw] || statusRaw

          const fromStockArea =
            request.from_stock_area ||
            request.fromStockArea?.area_name ||
            request.from_stock_area_name ||
            '-'

          return {
            id: request.request_id || request.id,
            srNo: (currentPage - 1) * itemsPerPage + index + 1,
            approvalAction: request.approved_by ? 'Approved' : '-',
            date: formattedDate,
            mrNo,
            approvalStatus,
            fromStockArea,
          }
        })
        
        setMaterialRequests(requestsData)
        setTotalItems(paginationTotal)
      }
    } catch (error) {
      console.error('Error fetching material requests:', error)
      toast.error(error.message || 'Failed to load material requests')
      setMaterialRequests([])
    } finally {
      setLoading(false)
    }
  }

  const totalPages = Math.ceil(totalItems / itemsPerPage)

  const approvalStatusOptions = [
    { value: '', label: 'Select Approval Status to Filter' },
    { value: 'PENDING', label: 'Pending' },
    { value: 'APPROVED', label: 'Approved' },
    { value: 'REJECTED', label: 'Rejected' },
    { value: 'REQUESTED', label: 'Requested' },
  ]

  const getStatusVariant = (status) => {
    if (status === 'Requested' || status === 'PENDING') return 'requested'
    if (status === 'Approved' || status === 'APPROVED') return 'approved'
    if (status === 'Rejected' || status === 'REJECTED') return 'danger'
    return 'default'
  }

  const handleEdit = (id) => {
    navigate(`/material-request/${id}`)
  }

  const handleDelete = (id) => {
    setDeleteId(id)
    setShowDeleteModal(true)
  }

  const confirmDelete = async () => {
    if (!deleteId) return
    try {
      const response = await materialRequestService.delete(deleteId)
      if (response.success) {
        toast.success('Material request deleted successfully')
        setShowDeleteModal(false)
        setDeleteId(null)
        fetchMaterialRequests()
      }
    } catch (error) {
      console.error('Error deleting material request:', error)
      toast.error(error.message || 'Failed to delete material request')
    }
  }

  const handleApprove = async (id) => {
    try {
      // Fetch the material request to get items
      const requestResponse = await materialRequestService.getById(id)
      if (!requestResponse.success) {
        toast.error('Failed to load material request details')
        return
      }

      const request =
        requestResponse.data?.materialRequest ||
        requestResponse.data?.data?.materialRequest ||
        requestResponse.data?.data ||
        requestResponse.data
      
      // Approve all items with requested quantities
      const approvedItems = (request?.items || []).map(item => ({
        itemId: item.item_id || item.id,
        approvedQuantity: item.approved_quantity || item.requested_quantity,
        item_id: item.item_id || item.id,
        approved_quantity: item.approved_quantity || item.requested_quantity,
      }))

      const response = await materialRequestService.approve(id, {
        status: 'APPROVED',
        approvedItems,
        remarks: 'Approved via UI',
      })

      if (response.success) {
        toast.success('Material request approved successfully')
        fetchMaterialRequests()
      }
    } catch (error) {
      console.error('Error approving material request:', error)
      toast.error(error.message || 'Failed to approve material request')
    }
  }

  const handleRefresh = () => {
    setSearchTerm('')
    setApprovalStatusFilter('')
    setCurrentPage(1)
    fetchMaterialRequests()
    toast.success('Refreshed')
  }

  const handleExport = async () => {
    try {
      await exportService.exportMaterialRequests('csv', { search: searchTerm, status: approvalStatusFilter })
      toast.success('Export started successfully')
    } catch (error) {
      console.error('Export error:', error)
      toast.error('Failed to export data')
    }
  }

  const handlePrint = () => {
    printDocument(
      {
        title: 'Material Request List',
        data: materialRequests,
        headers: ['SR. NO.', 'MR NO.', 'DATE', 'REQUESTED BY', 'STATUS', 'ITEMS COUNT'],
      },
      (data) => `
        <div class="header">
          <h1>${data.title}</h1>
          <p>Generated on: ${new Date().toLocaleString()}</p>
        </div>
        <table>
          <thead>
            <tr>
              ${data.headers.map(h => `<th>${h}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${data.data.map(item => `
              <tr>
                <td>${item.srNo}</td>
                <td>${item.mrNo}</td>
                <td>${item.date}</td>
                <td>${item.requestedBy}</td>
                <td>${item.status}</td>
                <td>${item.itemsCount}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <div class="footer">
          <p>Total Records: ${data.data.length}</p>
        </div>
      `
    )
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Material Request</h2>
          <div className="flex gap-4">
            <Button variant="secondary" onClick={handleExport}>
              <Download className="w-4 h-4 mr-2 inline" />
              Export
            </Button>
            <Button variant="secondary" onClick={handlePrint}>
              <Printer className="w-4 h-4 mr-2 inline" />
              Print
            </Button>
            <Button variant="primary" onClick={() => navigate('/material-request/new')}>
              <Plus className="w-4 h-4 mr-2 inline" />
              Add New
            </Button>
            <Button variant="secondary" onClick={handleRefresh}>
              <RefreshCw className="w-4 h-4 mr-2 inline" />
              Refresh
            </Button>
          </div>
        </div>

        <div className="flex border-b border-gray-200 mb-6">
          <button
            onClick={() => setActiveTab('my-mr')}
            className={`px-6 py-3 font-medium text-sm ${
              activeTab === 'my-mr'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            My MR
          </button>
          <button
            onClick={() => setActiveTab('all-mr')}
            className={`px-6 py-3 font-medium text-sm ${
              activeTab === 'all-mr'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            All MR
          </button>
          <button
            onClick={() => setActiveTab('approval-mr')}
            className={`px-6 py-3 font-medium text-sm ${
              activeTab === 'approval-mr'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Approval MR
          </button>
        </div>

        <div className="flex gap-6 mb-6 items-end">
          <div className="relative flex-1 max-w-md">
            <label className="block text-sm font-medium text-gray-700 mb-1 invisible">
              Search
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 h-[38px] border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="w-64">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              MR Approval Status
            </label>
            <Dropdown
              options={approvalStatusOptions}
              value={approvalStatusFilter}
              onChange={(e) => setApprovalStatusFilter(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <span className="ml-2 text-gray-600">Loading material requests...</span>
          </div>
        ) : (
          <>
            <Table
              headers={['SR. NO.', 'APPROVAL ACTION', 'DATE', 'MR. NO.', 'MR APPROVAL STATUS', 'FROM STOCK AREA', 'ACTIONS']}
            >
              {materialRequests.length > 0 ? (
                materialRequests.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.srNo}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {isAdmin && (item.approvalStatus === 'Requested' || item.approvalStatus === 'PENDING') ? (
                        <button
                          onClick={() => handleApprove(item.id)}
                          className="px-3 py-1 text-xs font-medium text-white bg-blue-600 rounded hover:bg-blue-700 transition-colors"
                        >
                          Approve
                        </button>
                      ) : (
                        item.approvalAction
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.date}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => handleEdit(item.id)}
                        className="text-blue-600 hover:text-blue-700 underline"
                      >
                        {item.mrNo}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <Badge variant={getStatusVariant(item.approvalStatus)}>
                        {item.approvalStatus}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.fromStockArea}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(item.id)}
                          className="text-blue-600 hover:text-blue-700"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    No material requests found
                  </td>
                </tr>
              )}
            </Table>

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

      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false)
          setDeleteId(null)
        }}
        onConfirm={confirmDelete}
        title="Delete Material Request"
        message="Are you sure you want to delete this material request? This action cannot be undone."
        confirmText="Delete"
        variant="danger"
      />
    </div>
  )
}

export default MaterialRequest
