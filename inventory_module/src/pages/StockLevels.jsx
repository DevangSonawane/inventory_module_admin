import { useState, useEffect } from 'react'
import { Loader2, Download, AlertTriangle } from 'lucide-react'
import { toast } from 'react-toastify'
import Table from '../components/common/Table'
import Dropdown from '../components/common/Dropdown'
import Button from '../components/common/Button'
import Badge from '../components/common/Badge'
import { TableSkeleton } from '../components/common/Skeleton'
import { stockLevelService } from '../services/stockLevelService.js'
import { stockAreaService } from '../services/stockAreaService.js'
import { materialService } from '../services/materialService.js'
import { exportService } from '../services/exportService.js'

const StockLevels = () => {
  const [loading, setLoading] = useState(true)
  const [stockLevels, setStockLevels] = useState([])
  const [summary, setSummary] = useState(null)
  const [materialTypeFilter, setMaterialTypeFilter] = useState('')
  const [stockAreaFilter, setStockAreaFilter] = useState('')
  const [stockAreas, setStockAreas] = useState([])
  const [materialTypes, setMaterialTypes] = useState([])

  useEffect(() => {
    fetchStockAreas()
    fetchMaterialTypes()
  }, [])

  useEffect(() => {
    fetchStockLevels()
  }, [materialTypeFilter, stockAreaFilter])

  const fetchStockAreas = async () => {
    try {
      const response = await stockAreaService.getAll({ limit: 100 })
      if (response.success) {
        setStockAreas(response.data.stockAreas || [])
      }
    } catch (error) {
      console.error('Error fetching stock areas:', error)
    }
  }

  const fetchMaterialTypes = async () => {
    try {
      const response = await materialService.getAll({ limit: 1000 })
      if (response.success) {
        const types = [...new Set((response.data.materials || []).map(m => m.material_type).filter(Boolean))]
        setMaterialTypes(types)
      }
    } catch (error) {
      console.error('Error fetching material types:', error)
    }
  }

  const fetchStockLevels = async () => {
    try {
      setLoading(true)
      const params = {}
      if (materialTypeFilter) params.materialType = materialTypeFilter
      if (stockAreaFilter) params.stockAreaId = stockAreaFilter

      const response = await stockLevelService.getAll(params)
      if (response.success) {
        setStockLevels(response.data.stockLevels || [])
        setSummary(response.data.summary || null)
      }
    } catch (error) {
      console.error('Error fetching stock levels:', error)
      toast.error('Failed to load stock levels')
    } finally {
      setLoading(false)
    }
  }

  const getStockStatus = (stock) => {
    if (stock <= 0) return { variant: 'danger', label: 'Out of Stock' }
    if (stock <= 10) return { variant: 'warning', label: 'Low Stock' }
    return { variant: 'success', label: 'In Stock' }
  }

  const stockAreaOptions = [
    { value: '', label: 'All Stock Areas' },
    ...stockAreas.map(sa => ({ value: sa.area_id, label: sa.area_name }))
  ]

  const materialTypeOptions = [
    { value: '', label: 'All Material Types' },
    ...materialTypes.map(type => ({ value: type, label: type }))
  ]

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Stock Levels</h2>
          <Button variant="primary" onClick={async () => {
            try {
              await exportService.exportStockLevels('csv', { materialType: materialTypeFilter, stockAreaId: stockAreaFilter })
              toast.success('Export started successfully')
            } catch (error) {
              console.error('Export error:', error)
              toast.error('Failed to export data')
            }
          }}>
            <Download className="w-4 h-4 mr-2 inline" />
            Export CSV
          </Button>
        </div>

        {summary && (
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Total Materials</p>
              <p className="text-2xl font-bold text-blue-600">{summary.totalMaterials}</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Total Stock</p>
              <p className="text-2xl font-bold text-green-600">{summary.totalStock}</p>
            </div>
            <div className="bg-red-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Low Stock Items</p>
              <p className="text-2xl font-bold text-red-600">{summary.lowStockCount}</p>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Healthy Stock</p>
              <p className="text-2xl font-bold text-yellow-600">{summary.totalMaterials - summary.lowStockCount}</p>
            </div>
          </div>
        )}

        <div className="flex gap-4 mb-6">
          <div className="w-64">
            <label className="block text-sm font-medium text-gray-700 mb-1">Material Type</label>
            <Dropdown
              options={materialTypeOptions}
              value={materialTypeFilter}
              onChange={(e) => setMaterialTypeFilter(e.target.value)}
            />
          </div>
          <div className="w-64">
            <label className="block text-sm font-medium text-gray-700 mb-1">Stock Area</label>
            <Dropdown
              options={stockAreaOptions}
              value={stockAreaFilter}
              onChange={(e) => setStockAreaFilter(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <TableSkeleton rows={10} columns={7} />
        ) : (
          <Table
            headers={['MATERIAL NAME', 'PRODUCT CODE', 'MATERIAL TYPE', 'UOM', 'CURRENT STOCK', 'STATUS', 'DETAILS']}
          >
            {stockLevels.length > 0 ? (
              stockLevels.map((level) => {
                const status = getStockStatus(level.currentStock)
                return (
                  <tr key={level.materialId} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {level.material?.materialName || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {level.material?.productCode || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {level.material?.materialType || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {level.material?.uom || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {level.currentStock}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <Badge variant={status.variant}>{status.label}</Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="text-xs text-gray-500">
                        <div>Inward: {level.totalInward}</div>
                        <div>Transferred Out: {level.totalTransferredOut}</div>
                        <div>Transferred In: {level.totalTransferredIn}</div>
                        <div>Consumed: {level.totalConsumed}</div>
                      </div>
                    </td>
                  </tr>
                )
              })
            ) : (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                  No stock levels found
                </td>
              </tr>
            )}
          </Table>
        )}
      </div>
    </div>
  )
}

export default StockLevels

