import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, RefreshCw, Eye, Loader2, Download, Printer } from 'lucide-react'
import { toast } from 'react-toastify'
import Button from '../components/common/Button'
import Table from '../components/common/Table'
import Pagination from '../components/common/Pagination'
import { stockTransferService } from '../services/stockTransferService.js'
import { exportService } from '../services/exportService.js'
import { printDocument } from '../utils/printUtils.js'

const StockTransferList = () => {
  const navigate = useNavigate()
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [searchTerm, setSearchTerm] = useState('')
  const [stockTransfers, setStockTransfers] = useState([])
  const [loading, setLoading] = useState(true)
  const [totalItems, setTotalItems] = useState(0)

  // Fetch stock transfers on mount and when filters change
  useEffect(() => {
    fetchStockTransfers()
  }, [currentPage, itemsPerPage, searchTerm])

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (currentPage === 1) {
        fetchStockTransfers()
      } else {
        setCurrentPage(1)
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [searchTerm])

  const fetchStockTransfers = async () => {
    try {
      setLoading(true)
      const response = await stockTransferService.getAll({
        page: currentPage,
        limit: itemsPerPage,
        search: searchTerm || undefined,
      })
      
      if (response.success) {
        const transfersData = (response.data.stockTransfers || []).map((transfer, index) => {
          // Format date
          const date = new Date(transfer.transfer_date)
          const formattedDate = `${String(date.getDate()).padStart(2, '0')}-${String(date.getMonth() + 1).padStart(2, '0')}-${date.getFullYear()}`

          // Determine transfer type
          const transferType = transfer.material_request_id ? 'Material Request' : 'Direct Transfer'

          return {
            id: transfer.transfer_id,
            srNo: (currentPage - 1) * itemsPerPage + index + 1,
            date: formattedDate,
            slipNo: transfer.slip_number || `ST-${transfer.transfer_id?.substring(0, 8).toUpperCase()}`,
            transferType: transferType,
            fromStockArea: transfer.fromStockArea?.area_name || '-',
            toStockArea: transfer.toStockArea?.area_name || '-',
          }
        })
        
        setStockTransfers(transfersData)
        setTotalItems(response.data.pagination?.totalItems || 0)
      }
    } catch (error) {
      console.error('Error fetching stock transfers:', error)
      toast.error(error.message || 'Failed to load stock transfers')
      setStockTransfers([])
    } finally {
      setLoading(false)
    }
  }

  const totalPages = Math.ceil(totalItems / itemsPerPage)

  const handleRefresh = () => {
    setSearchTerm('')
    setCurrentPage(1)
    fetchStockTransfers()
    toast.success('Refreshed')
  }

  const handleExport = async () => {
    try {
      await exportService.exportStockTransfers('csv', { search: searchTerm })
      toast.success('Export started successfully')
    } catch (error) {
      console.error('Export error:', error)
      toast.error('Failed to export data')
    }
  }

  const handlePrint = () => {
    printDocument(
      {
        title: 'Stock Transfer List',
        data: stockTransfers,
        headers: ['SR. NO.', 'DATE', 'SLIP NO.', 'TRANSFER TYPE', 'FROM STOCK AREA', 'TO STOCK AREA'],
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
                <td>${item.slipNo}</td>
                <td>${item.transferType}</td>
                <td>${item.fromStockArea}</td>
                <td>${item.toStockArea}</td>
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
          <h2 className="text-xl font-semibold text-gray-900">Stock Transfer</h2>
          <div className="flex gap-4">
            <Button variant="secondary" onClick={handleExport}>
              <Download className="w-4 h-4 mr-2 inline" />
              Export
            </Button>
            <Button variant="secondary" onClick={handlePrint}>
              <Printer className="w-4 h-4 mr-2 inline" />
              Print
            </Button>
            <Button variant="primary" onClick={() => navigate('/stock-transfer/new')}>
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

        <div className="mb-6">
          <div className="relative max-w-md">
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

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <span className="ml-2 text-gray-600">Loading stock transfers...</span>
          </div>
        ) : (
          <>
            <Table
              headers={['SR. NO.', 'DATE', 'SLIP NO.', 'TRANSFER TYPE', 'FROM STOCK AREA', 'TO STOCK AREA', 'ACTIONS']}
            >
              {stockTransfers.length > 0 ? (
                stockTransfers.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.srNo}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.date}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.slipNo}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.transferType}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.fromStockArea}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.toStockArea}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => navigate(`/stock-transfer/${item.id}`)}
                        className="text-blue-600 hover:text-blue-700"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    No stock transfers found
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
    </div>
  )
}

export default StockTransferList
