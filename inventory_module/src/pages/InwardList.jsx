import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, RefreshCw, Eye, Edit, Trash2, Loader2, Download, Printer } from 'lucide-react'
import { toast } from 'react-toastify'
import Button from '../components/common/Button'
import Table from '../components/common/Table'
import Pagination from '../components/common/Pagination'
import Dropdown from '../components/common/Dropdown'
import ConfirmationModal from '../components/common/ConfirmationModal'
import { inwardService } from '../services/inwardService.js'
import { exportService } from '../services/exportService.js'
import { printDocument } from '../utils/printUtils.js'

const InwardList = () => {
  const navigate = useNavigate()
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [inwards, setInwards] = useState([])
  const [loading, setLoading] = useState(true)
  const [totalItems, setTotalItems] = useState(0)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteId, setDeleteId] = useState(null)
  const [selectedIds, setSelectedIds] = useState([])
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // Fetch inwards on mount and when filters change
  useEffect(() => {
    fetchInwards()
  }, [currentPage, itemsPerPage, searchTerm, statusFilter])

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (currentPage === 1) {
        fetchInwards()
      } else {
        setCurrentPage(1)
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [searchTerm])

  const fetchInwards = async () => {
    try {
      setLoading(true)
      const response = await inwardService.getAll({
        page: currentPage,
        limit: itemsPerPage,
        search: searchTerm || undefined,
        status: statusFilter || undefined,
      })
      
      if (response.success) {
        const inwardsData = (response.data.inwards || []).map((inward, index) => {
          // Calculate total amount from items
          const totalAmount = (inward.items || []).reduce((sum, item) => {
            return sum + (parseFloat(item.price) || 0) * (parseInt(item.quantity) || 0)
          }, 0)

          // Format date
          const date = new Date(inward.date)
          const formattedDate = `${String(date.getDate()).padStart(2, '0')}-${String(date.getMonth() + 1).padStart(2, '0')}-${date.getFullYear()}`

          return {
            id: inward.inward_id,
            srNo: (currentPage - 1) * itemsPerPage + index + 1,
            date: formattedDate,
            grnNo: inward.slip_number,
            invoiceNumber: inward.invoice_number,
            partyName: inward.party_name,
            totalAmount: totalAmount,
            status: inward.status || 'COMPLETED',
          }
        })
        
        setInwards(inwardsData)
        setTotalItems(response.data.pagination?.totalItems || 0)
      }
    } catch (error) {
      console.error('Error fetching inwards:', error)
      toast.error(error.message || 'Failed to load inward entries')
      setInwards([])
    } finally {
      setLoading(false)
    }
  }

  const totalPages = Math.ceil(totalItems / itemsPerPage)

  const statusOptions = [
    { value: '', label: 'Select Status to Filter' },
    { value: 'COMPLETED', label: 'Completed' },
    { value: 'PENDING', label: 'Pending' },
    { value: 'DRAFT', label: 'Draft' },
  ]

  const handleRefresh = () => {
    setSearchTerm('')
    setStatusFilter('')
    setCurrentPage(1)
    fetchInwards()
    toast.success('Refreshed')
  }

  const handleView = (id) => {
    navigate(`/add-inward?id=${id}`)
  }

  const handleEdit = (id) => {
    navigate(`/add-inward?id=${id}`)
  }

  const handleDelete = (id) => {
    setDeleteId(id)
    setShowDeleteModal(true)
  }

  const confirmDelete = async () => {
    if (!deleteId) return
    try {
      const response = await inwardService.delete(deleteId)
      if (response.success) {
        toast.success('Inward entry deleted successfully')
        setShowDeleteModal(false)
        setDeleteId(null)
        fetchInwards()
      }
    } catch (error) {
      console.error('Error deleting inward:', error)
      toast.error(error.message || 'Failed to delete inward entry')
    }
  }

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedIds(inwards.map(item => item.id))
    } else {
      setSelectedIds([])
    }
  }

  const handleSelectRow = (id, checked) => {
    if (checked) {
      setSelectedIds(prev => {
        // Prevent duplicate IDs
        if (prev.includes(id)) return prev
        return [...prev, id]
      })
    } else {
      setSelectedIds(prev => prev.filter(selectedId => selectedId !== id))
    }
  }

  const handleBulkDelete = () => {
    if (selectedIds.length === 0) return
    setShowBulkDeleteModal(true)
  }

  const confirmBulkDelete = async () => {
    if (selectedIds.length === 0) return
    try {
      setIsDeleting(true)
      const response = await inwardService.bulkDelete(selectedIds)
      if (response.success) {
        const deletedCount = response.data?.deleted || selectedIds.length
        toast.success(`${deletedCount} inward entry(ies) deleted successfully`)
        setShowBulkDeleteModal(false)
        setSelectedIds([])
        fetchInwards()
      } else {
        toast.error(response.message || 'Failed to delete inward entries')
      }
    } catch (error) {
      console.error('Error bulk deleting inward entries:', error)
      toast.error(error.message || 'Failed to delete inward entries')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleExport = async () => {
    try {
      await exportService.exportInward('csv', { search: searchTerm, status: statusFilter })
      toast.success('Export started successfully')
    } catch (error) {
      console.error('Export error:', error)
      toast.error('Failed to export data')
    }
  }

  const handlePrint = () => {
    printDocument(
      {
        title: 'Inward Entries List',
        data: inwards,
        headers: ['SR. NO.', 'DATE', 'GRN NO.', 'INVOICE NUMBER', 'PARTY NAME', 'TOTAL AMOUNT', 'STATUS'],
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
                <td>${item.date}</td>
                <td>${item.grnNo}</td>
                <td>${item.invoiceNumber}</td>
                <td>${item.partyName}</td>
                <td>₹${item.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td>${item.status}</td>
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
          <h2 className="text-xl font-semibold text-gray-900">Inward List</h2>
          <div className="flex gap-4 items-center">
            {selectedIds.length > 0 && (
              <div className="flex items-center gap-2 mr-2">
                <span className="text-sm text-gray-600">
                  {selectedIds.length} selected
                </span>
                <Button 
                  variant="danger" 
                  onClick={handleBulkDelete}
                  disabled={isDeleting}
                  className="bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 inline animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4 mr-2 inline" />
                      Delete Selected
                    </>
                  )}
                </Button>
              </div>
            )}
            <Button variant="secondary" onClick={handleExport}>
              <Download className="w-4 h-4 mr-2 inline" />
              Export
            </Button>
            <Button variant="secondary" onClick={handlePrint}>
              <Printer className="w-4 h-4 mr-2 inline" />
              Print
            </Button>
            <Button variant="primary" onClick={() => navigate('/add-inward')}>
              <Plus className="w-4 h-4 mr-2 inline" />
              Add New
            </Button>
            <button 
              onClick={handleRefresh}
              className="p-2 hover:bg-gray-100 rounded-md transition-colors"
              title="Refresh"
            >
              <RefreshCw className="w-5 h-5 text-gray-700" />
            </button>
          </div>
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
              Status
            </label>
            <Dropdown
              options={statusOptions}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <span className="ml-2 text-gray-600">Loading inward entries...</span>
          </div>
        ) : (
          <>
            <Table
              headers={['SR. NO.', 'DATE', 'GRN NO.', 'INVOICE NUMBER', 'PARTY NAME', 'TOTAL AMOUNT', 'STATUS', 'ACTIONS']}
              selectable
              selectedIds={selectedIds}
              onSelectAll={handleSelectAll}
              onSelectRow={handleSelectRow}
            >
              {inwards.length > 0 ? (
                inwards.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(item.id)}
                        onChange={(e) => handleSelectRow(item.id, e.target.checked)}
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.srNo}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.date}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.grnNo}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.invoiceNumber}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.partyName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">₹{item.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        item.status === 'COMPLETED' 
                          ? 'bg-green-100 text-green-800' 
                          : item.status === 'PENDING'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleView(item.id)}
                          className="text-blue-600 hover:text-blue-700 transition-colors"
                          title="View"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEdit(item.id)}
                          className="text-blue-600 hover:text-blue-700 transition-colors"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="text-red-600 hover:text-red-700 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                    No inward entries found
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
        title="Delete Inward Entry"
        message="Are you sure you want to delete this inward record? This action cannot be undone."
        confirmText="Delete"
        variant="danger"
      />

      <ConfirmationModal
        isOpen={showBulkDeleteModal}
        onClose={() => {
          if (!isDeleting) {
            setShowBulkDeleteModal(false)
          }
        }}
        onConfirm={confirmBulkDelete}
        title="Delete Selected Inward Entries"
        message={`Are you sure you want to delete ${selectedIds.length} inward entry(ies)? This action cannot be undone.`}
        confirmText={isDeleting ? "Deleting..." : "Delete"}
        variant="danger"
      />
    </div>
  )
}

export default InwardList

