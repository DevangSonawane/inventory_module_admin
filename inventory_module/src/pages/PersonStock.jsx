import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, RefreshCw, Loader2, Package, User } from 'lucide-react'
import { toast } from 'react-toastify'
import Button from '../components/common/Button'
import Table from '../components/common/Table'
import Pagination from '../components/common/Pagination'
import Dropdown from '../components/common/Dropdown'
import Badge from '../components/common/Badge'
import { personStockService } from '../services/personStockService.js'

const PersonStock = () => {
  const navigate = useNavigate()
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [searchTerm, setSearchTerm] = useState('')
  const [ticketFilter, setTicketFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [personStock, setPersonStock] = useState([])
  const [loading, setLoading] = useState(true)
  const [totalItems, setTotalItems] = useState(0)
  const [userId, setUserId] = useState(null)

  useEffect(() => {
    // Get current user ID from localStorage
    const userStr = localStorage.getItem('user')
    if (userStr) {
      try {
        const user = JSON.parse(userStr)
        setUserId(user.id || user.user_id)
      } catch (e) {
        console.error('Error parsing user data:', e)
      }
    }
  }, [])

  useEffect(() => {
    if (userId) {
      fetchPersonStock()
    }
  }, [currentPage, itemsPerPage, searchTerm, ticketFilter, statusFilter, userId])

  useEffect(() => {
    const timer = setTimeout(() => {
      if (currentPage === 1) {
        fetchPersonStock()
      } else {
        setCurrentPage(1)
      }
    }, 500)
    return () => clearTimeout(timer)
  }, [searchTerm])

  const fetchPersonStock = async () => {
    if (!userId) return
    
    try {
      setLoading(true)
      const params = {
        page: currentPage,
        limit: itemsPerPage,
        userId: userId,
        ticketId: ticketFilter || undefined,
        status: statusFilter || undefined,
      }

      let response
      if (ticketFilter) {
        response = await personStockService.getByTicket(ticketFilter, params)
      } else {
        response = await personStockService.getAll(params)
      }
      
      if (response.success) {
        const stockData = (response.data?.personStock || response.data?.items || []).map((item, index) => {
          return {
            id: item.id || item.inventory_master_id,
            srNo: (currentPage - 1) * itemsPerPage + index + 1,
            materialName: item.material?.material_name || '-',
            productCode: item.material?.product_code || '-',
            serialNumber: item.serial_number || '-',
            macId: item.mac_id || '-',
            ticketId: item.ticket_id || '-',
            status: item.status || 'AVAILABLE',
            location: item.current_location_type || 'PERSON',
            assignedDate: item.created_at ? new Date(item.created_at).toLocaleDateString() : '-',
          }
        })
        
        setPersonStock(stockData)
        setTotalItems(response.data?.pagination?.totalItems || response.data?.totalItems || stockData.length)
      }
    } catch (error) {
      console.error('Error fetching person stock:', error)
      toast.error(error.message || 'Failed to load person stock')
      setPersonStock([])
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status) => {
    const statusMap = {
      'AVAILABLE': { label: 'Available', color: 'green' },
      'ALLOCATED': { label: 'Allocated', color: 'blue' },
      'IN_TRANSIT': { label: 'In Transit', color: 'yellow' },
      'CONSUMED': { label: 'Consumed', color: 'gray' },
      'FAULTY': { label: 'Faulty', color: 'red' },
    }
    const statusInfo = statusMap[status] || { label: status, color: 'gray' }
    return <Badge color={statusInfo.color}>{statusInfo.label}</Badge>
  }

  const columns = [
    { key: 'srNo', label: 'Sr. No.' },
    { key: 'materialName', label: 'Material Name' },
    { key: 'productCode', label: 'Product Code' },
    { key: 'serialNumber', label: 'Serial Number' },
    { key: 'macId', label: 'MAC ID' },
    { key: 'ticketId', label: 'Ticket ID' },
    { key: 'status', label: 'Status', render: (row) => getStatusBadge(row.status) },
    { key: 'assignedDate', label: 'Assigned Date' },
  ]

  const statusOptions = [
    { value: '', label: 'All Statuses' },
    { value: 'AVAILABLE', label: 'Available' },
    { value: 'ALLOCATED', label: 'Allocated' },
    { value: 'IN_TRANSIT', label: 'In Transit' },
    { value: 'CONSUMED', label: 'Consumed' },
    { value: 'FAULTY', label: 'Faulty' },
  ]

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <User className="w-6 h-6 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-800">Person Stock</h1>
        </div>
        <Button onClick={fetchPersonStock} variant="outline" icon={<RefreshCw className="w-4 h-4" />}>
          Refresh
        </Button>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by serial number, material name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <input
            type="text"
            placeholder="Ticket ID"
            value={ticketFilter}
            onChange={(e) => setTicketFilter(e.target.value)}
            className="w-48 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <Dropdown
            options={statusOptions}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-48"
          />
        </div>

        {loading ? (
          <div className="text-center py-8">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600" />
            <p className="mt-2 text-gray-600">Loading person stock...</p>
          </div>
        ) : personStock.length === 0 ? (
          <div className="text-center py-8">
            <Package className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600">No items in your stock</p>
          </div>
        ) : (
          <>
            <Table data={personStock} columns={columns} />
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
    </div>
  )
}

export default PersonStock
