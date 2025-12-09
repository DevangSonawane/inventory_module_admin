import { useState, useEffect } from 'react'
import { Loader2, Download, FileText } from 'lucide-react'
import { toast } from 'react-toastify'
import Table from '../components/common/Table'
import Button from '../components/common/Button'
import Input from '../components/common/Input'
import Dropdown from '../components/common/Dropdown'
import Badge from '../components/common/Badge'
import { TableSkeleton } from '../components/common/Skeleton'
import { reportService } from '../services/reportService.js'
import { exportService } from '../services/exportService.js'
import { format } from 'date-fns'

const Reports = () => {
  const [activeTab, setActiveTab] = useState('transactions')
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState([])
  const [summary, setSummary] = useState(null)
  
  // Filters
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [materialId, setMaterialId] = useState('')
  const [stockAreaId, setStockAreaId] = useState('')
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(50)

  useEffect(() => {
    fetchData()
  }, [activeTab, startDate, endDate, typeFilter, materialId, stockAreaId, page, limit])

  const fetchData = async () => {
    try {
      setLoading(true)
      const params = {
        startDate,
        endDate,
        page,
        limit,
        ...(typeFilter && { type: typeFilter }),
        ...(materialId && { materialId }),
        ...(stockAreaId && { stockAreaId }),
      }

      let response
      switch (activeTab) {
        case 'transactions':
          response = await reportService.getTransactionHistory(params)
          break
        case 'movement':
          response = await reportService.getStockMovement(params)
          break
        case 'consumption':
          response = await reportService.getConsumptionAnalysis(params)
          break
        case 'valuation':
          response = await reportService.getStockValuation(params)
          break
        default:
          return
      }

      if (response.success) {
        if (activeTab === 'transactions') {
          setData(response.data.transactions || [])
        } else if (activeTab === 'movement') {
          setData(response.data.movements || [])
          setSummary(response.data.summary || null)
        } else if (activeTab === 'consumption') {
          setData(response.data.analysis || [])
          setSummary(response.data.summary || null)
        } else if (activeTab === 'valuation') {
          setData(response.data.valuations || [])
          setSummary(response.data.summary || null)
        }
      }
    } catch (error) {
      console.error('Error fetching report data:', error)
      toast.error('Failed to load report data')
    } finally {
      setLoading(false)
    }
  }

  const handleExport = async () => {
    const params = {
      startDate,
      endDate,
      ...(typeFilter && { type: typeFilter }),
      ...(materialId && { materialId }),
      ...(stockAreaId && { stockAreaId }),
    }

    try {
      switch (activeTab) {
        case 'transactions':
          await exportService.exportInward('csv', params)
          toast.success('Export started successfully')
          break
        case 'movement':
        case 'consumption':
        case 'valuation':
          // These would need specific export endpoints
          toast.info('Export functionality coming soon for this report type')
          break
      }
    } catch (error) {
      console.error('Export error:', error)
      toast.error('Failed to export data')
    }
  }

  const renderTransactionsTable = () => (
    <Table headers={['TYPE', 'DATE', 'REFERENCE', 'STOCK AREA', 'ITEMS', 'STATUS']}>
      {data.map((item, index) => (
        <tr key={index} className="hover:bg-gray-50">
          <td className="px-6 py-4 whitespace-nowrap text-sm">
            <Badge variant={item.type === 'INWARD' ? 'primary' : item.type === 'TRANSFER' ? 'success' : 'warning'}>
              {item.type}
            </Badge>
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
            {item.date ? format(new Date(item.date), 'dd-MM-yyyy') : '-'}
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.reference || '-'}</td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
            {item.stockArea || item.fromStockArea || '-'}
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
            {item.items?.length || 0} items
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-sm">
            {item.status && <Badge variant={item.status === 'COMPLETED' ? 'success' : 'warning'}>{item.status}</Badge>}
          </td>
        </tr>
      ))}
    </Table>
  )

  const renderMovementTable = () => (
    <Table headers={['MATERIAL', 'PRODUCT CODE', 'STOCK AREA', 'INWARD', 'TRANSFER OUT', 'TRANSFER IN', 'CONSUMPTION', 'NET MOVEMENT']}>
      {data.map((item, index) => (
        <tr key={index} className="hover:bg-gray-50">
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.material_name || '-'}</td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.product_code || '-'}</td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.stock_area || '-'}</td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.inward_qty || 0}</td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.transfer_out_qty || 0}</td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.transfer_in_qty || 0}</td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.consumption_qty || 0}</td>
          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.net_movement || 0}</td>
        </tr>
      ))}
    </Table>
  )

  const renderConsumptionTable = () => (
    <Table headers={['MATERIAL', 'PRODUCT CODE', 'STOCK AREA', 'CONSUMPTION COUNT', 'TOTAL CONSUMED', 'AVG PER CONSUMPTION', 'FIRST', 'LAST']}>
      {data.map((item, index) => (
        <tr key={index} className="hover:bg-gray-50">
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.material_name || '-'}</td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.product_code || '-'}</td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.stock_area || '-'}</td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.consumption_count || 0}</td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.total_consumed || 0}</td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{parseFloat(item.avg_per_consumption || 0).toFixed(2)}</td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
            {item.first_consumption ? format(new Date(item.first_consumption), 'dd-MM-yyyy') : '-'}
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
            {item.last_consumption ? format(new Date(item.last_consumption), 'dd-MM-yyyy') : '-'}
          </td>
        </tr>
      ))}
    </Table>
  )

  const renderValuationTable = () => (
    <Table headers={['MATERIAL', 'PRODUCT CODE', 'MATERIAL TYPE', 'STOCK AREA', 'CURRENT STOCK', 'AVG UNIT PRICE', 'TOTAL VALUE']}>
      {data.map((item, index) => (
        <tr key={index} className="hover:bg-gray-50">
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.material_name || '-'}</td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.product_code || '-'}</td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.material_type || '-'}</td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.stock_area || '-'}</td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.current_stock || 0}</td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
            ₹{parseFloat(item.avg_unit_price || 0).toFixed(2)}
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
            ₹{parseFloat(item.total_value || 0).toFixed(2)}
          </td>
        </tr>
      ))}
    </Table>
  )

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            {['transactions', 'movement', 'consumption', 'valuation'].map((tab) => (
              <button
                key={tab}
                onClick={() => {
                  setActiveTab(tab)
                  setPage(1)
                }}
                className={`px-6 py-4 font-medium text-sm border-b-2 transition-colors capitalize ${
                  activeTab === tab
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                }`}
              >
                {tab === 'transactions' ? 'Transaction History' : 
                 tab === 'movement' ? 'Stock Movement' :
                 tab === 'consumption' ? 'Consumption Analysis' : 'Stock Valuation'}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              {activeTab === 'transactions' ? 'Transaction History Report' : 
               activeTab === 'movement' ? 'Stock Movement Report' :
               activeTab === 'consumption' ? 'Consumption Analysis Report' : 'Stock Valuation Report'}
            </h2>
            <Button variant="primary" onClick={handleExport}>
              <Download className="w-4 h-4 mr-2 inline" />
              Export CSV
            </Button>
          </div>

          <div className="grid grid-cols-4 gap-4 mb-6">
            <Input
              label="Start Date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
            <Input
              label="End Date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
            {activeTab === 'transactions' && (
              <Dropdown
                label="Type"
                options={[
                  { value: '', label: 'All Types' },
                  { value: 'inward', label: 'Inward' },
                  { value: 'transfer', label: 'Transfer' },
                  { value: 'consumption', label: 'Consumption' },
                ]}
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
              />
            )}
          </div>

          {summary && (
            <div className="grid grid-cols-4 gap-4 mb-6">
              {Object.entries(summary).map(([key, value]) => (
                <div key={key} className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
                  <p className="text-2xl font-bold text-gray-900">{value}</p>
                </div>
              ))}
            </div>
          )}

          {loading ? (
            <TableSkeleton rows={10} columns={6} />
          ) : (
            <>
              {activeTab === 'transactions' && renderTransactionsTable()}
              {activeTab === 'movement' && renderMovementTable()}
              {activeTab === 'consumption' && renderConsumptionTable()}
              {activeTab === 'valuation' && renderValuationTable()}
              {data.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  No data found for the selected filters
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default Reports

