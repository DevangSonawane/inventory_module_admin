import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, RefreshCw, Eye, Edit, Trash2, Loader2, Send, Package } from 'lucide-react'
import { toast } from 'react-toastify'
import Button from '../components/common/Button'
import Table from '../components/common/Table'
import Pagination from '../components/common/Pagination'
import Dropdown from '../components/common/Dropdown'
import Badge from '../components/common/Badge'
import ConfirmationModal from '../components/common/ConfirmationModal'
import { purchaseOrderService } from '../services/purchaseOrderService.js'

const PurchaseOrderList = () => {
  const navigate = useNavigate()
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [purchaseOrders, setPurchaseOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [totalItems, setTotalItems] = useState(0)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteId, setDeleteId] = useState(null)
  const [actionLoading, setActionLoading] = useState(null)

  useEffect(() => {
    fetchPurchaseOrders()
  }, [currentPage, itemsPerPage, searchTerm, statusFilter])

  useEffect(() => {
    const timer = setTimeout(() => {
      if (currentPage === 1) {
        fetchPurchaseOrders()
      } else {
        setCurrentPage(1)
      }
    }, 500)
    return () => clearTimeout(timer)
  }, [searchTerm])

  const fetchPurchaseOrders = async () => {
    try {
      setLoading(true)
      const response = await purchaseOrderService.getAll({
        page: currentPage,
        limit: itemsPerPage,
        search: searchTerm || undefined,
        status: statusFilter || undefined,
      })
      
      if (response.success) {
        const posData = ((response.data?.purchaseOrders || response.data?.data || [])).map((po, index) => {
          try {
            const date = new Date(po.po_date || po.created_at || Date.now())
            const formattedDate = `${String(date.getDate()).padStart(2, '0')}-${String(date.getMonth() + 1).padStart(2, '0')}-${date.getFullYear()}`
            
            const totalAmount = (po.items || []).reduce((sum, item) => {
              return sum + (parseFloat(item.unit_price) || 0) * (parseInt(item.quantity) || 0)
            }, 0)
            
            return {
              id: po.po_id || po.id,
              srNo: (currentPage - 1) * itemsPerPage + index + 1,
              poNumber: po.po_number || `PO-${(po.po_id || po.id)?.substring(0, 8).toUpperCase()}`,
              date: formattedDate,
              vendor: po.vendor?.partner_name || po.vendor_name || '-',
              totalAmount: totalAmount.toFixed(2),
              status: po.status || 'DRAFT',
              prNumber: po.purchase_request?.pr_number || '-',
            }
          } catch (err) {
            console.error('Error processing PO:', err, po)
            return null
          }
        }).filter(Boolean)
        
        setPurchaseOrders(posData)
        setTotalItems(response.data?.pagination?.totalItems || response.data?.totalItems || posData.length)
      }
    } catch (error) {
      console.error('Error fetching purchase orders:', error)
      toast.error(error.message || 'Failed to load purchase orders')
      setPurchaseOrders([])
    } finally {
      setLoading(false)
    }
  }

  const handleSend = async (id) => {
    try {
      setActionLoading(id)
      await purchaseOrderService.send(id)
      toast.success('Purchase order sent successfully')
      fetchPurchaseOrders()
    } catch (error) {
      toast.error(error.message || 'Failed to send purchase order')
    } finally {
      setActionLoading(null)
    }
  }

  const handleReceive = async (id) => {
    try {
      setActionLoading(id)
      await purchaseOrderService.receive(id)
      toast.success('Purchase order marked as received')
      fetchPurchaseOrders()
    } catch (error) {
      toast.error(error.message || 'Failed to mark purchase order as received')
    } finally {
      setActionLoading(null)
    }
  }

  const handleDelete = async () => {
    try {
      await purchaseOrderService.delete(deleteId)
      toast.success('Purchase order deleted successfully')
      setShowDeleteModal(false)
      setDeleteId(null)
      fetchPurchaseOrders()
    } catch (error) {
      toast.error(error.message || 'Failed to delete purchase order')
    }
  }

  const getStatusBadge = (status) => {
    const statusMap = {
      'DRAFT': { label: 'Draft', color: 'gray' },
      'SENT': { label: 'Sent', color: 'blue' },
      'RECEIVED': { label: 'Received', color: 'green' },
      'CANCELLED': { label: 'Cancelled', color: 'red' },
    }
    const statusInfo = statusMap[status] || { label: status, color: 'gray' }
    return <Badge color={statusInfo.color}>{statusInfo.label}</Badge>
  }

  const columns = [
    { key: 'srNo', label: 'Sr. No.' },
    { key: 'poNumber', label: 'PO Number' },
    { key: 'date', label: 'Date' },
    { key: 'vendor', label: 'Vendor' },
    { key: 'prNumber', label: 'PR Number' },
    { key: 'totalAmount', label: 'Total Amount' },
    { key: 'status', label: 'Status', render: (row) => getStatusBadge(row.status) },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(`/purchase-order/${row.id}`)}
            className="p-1 text-blue-600 hover:bg-blue-50 rounded"
            title="View Details"
          >
            <Eye className="w-4 h-4" />
          </button>
          {row.status === 'DRAFT' && (
            <button
              onClick={() => handleSend(row.id)}
              disabled={actionLoading === row.id}
              className="p-1 text-blue-600 hover:bg-blue-50 rounded disabled:opacity-50"
              title="Send"
            >
              {actionLoading === row.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          )}
          {row.status === 'SENT' && (
            <button
              onClick={() => handleReceive(row.id)}
              disabled={actionLoading === row.id}
              className="p-1 text-green-600 hover:bg-green-50 rounded disabled:opacity-50"
              title="Mark as Received"
            >
              {actionLoading === row.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Package className="w-4 h-4" />}
            </button>
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
    { value: 'SENT', label: 'Sent' },
    { value: 'RECEIVED', label: 'Received' },
    { value: 'CANCELLED', label: 'Cancelled' },
  ]

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Purchase Orders</h1>
        <Button onClick={() => navigate('/purchase-order/new')} icon={<Plus className="w-4 h-4" />}>
          Create Purchase Order
        </Button>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by PO number, vendor..."
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
          <Button onClick={fetchPurchaseOrders} variant="outline" icon={<RefreshCw className="w-4 h-4" />}>
            Refresh
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600" />
            <p className="mt-2 text-gray-600">Loading purchase orders...</p>
          </div>
        ) : purchaseOrders.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-600">No purchase orders found</p>
          </div>
        ) : (
          <>
            <Table data={purchaseOrders} columns={columns} />
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
        title="Delete Purchase Order"
        message="Are you sure you want to delete this purchase order? This action cannot be undone."
      />
    </div>
  )
}

export default PurchaseOrderList
