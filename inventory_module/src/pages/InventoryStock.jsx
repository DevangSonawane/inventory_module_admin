import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, Loader2 } from 'lucide-react'
import { toast } from 'react-toastify'
import Table from '../components/common/Table'
import Pagination from '../components/common/Pagination'
import Dropdown from '../components/common/Dropdown'
import Button from '../components/common/Button'
import { materialService } from '../services/materialService.js'
import { stockAreaService } from '../services/stockAreaService.js'

const InventoryStock = () => {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('inventory-stock')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [stockAreaFilter, setStockAreaFilter] = useState('')
  
  const [materials, setMaterials] = useState([])
  const [stockAreas, setStockAreas] = useState([])
  const [loading, setLoading] = useState(true)
  const [totalItems, setTotalItems] = useState(0)

  // Fetch materials on component mount and when filters change
  useEffect(() => {
    fetchMaterials()
  }, [currentPage, itemsPerPage, searchTerm, typeFilter])

  // Fetch stock areas for filter dropdown
  useEffect(() => {
    fetchStockAreas()
  }, [])

  const fetchMaterials = async () => {
    try {
      setLoading(true)
      const response = await materialService.getAll({
        page: currentPage,
        limit: itemsPerPage,
        search: searchTerm,
        materialType: typeFilter || undefined,
      })
      
      if (response.success) {
        setMaterials(response.data?.materials || response.data?.data || [])
        setTotalItems(response.data?.pagination?.totalItems || response.data?.totalItems || 0)
      }
    } catch (error) {
      console.error('Error fetching materials:', error)
      toast.error(error.message || 'Failed to load materials')
      setMaterials([])
    } finally {
      setLoading(false)
    }
  }

  const fetchStockAreas = async () => {
    try {
      const response = await stockAreaService.getAll({ limit: 100 })
      if (response.success) {
        const areas = response.data?.stockAreas || response.data?.data || []
        const options = [
          { value: '', label: 'Select Stock Area to Filter' },
          ...areas.map(area => ({
            value: area.area_id || area.id,
            label: area.area_name || area.name
          }))
        ]
        setStockAreas(options)
      }
    } catch (error) {
      console.error('Error fetching stock areas:', error)
    }
  }

  // Get unique material types for filter
  const typeOptions = [
    { value: '', label: 'Select Type to Filter' },
    ...Array.from(new Set(materials.map(m => m.material_type))).map(type => ({
      value: type,
      label: type
    }))
  ]

  const totalPages = Math.ceil(totalItems / itemsPerPage)

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (currentPage === 1) {
        fetchMaterials()
      } else {
        setCurrentPage(1) // Reset to page 1 when search changes
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [searchTerm])

  // Refetch when page or items per page changes
  useEffect(() => {
    fetchMaterials()
  }, [currentPage, itemsPerPage, typeFilter])

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Basic Details</h2>
          <div className="flex gap-4">
            {activeTab === 'inventory-stock' && (
              <Button variant="primary" onClick={() => navigate('/add-inward')}>
                Pre Inward
              </Button>
            )}
            <Button variant="primary" onClick={() => navigate('/add-inward')}>
              Inward
            </Button>
          </div>
        </div>

        <div className="flex gap-6 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 h-[38px] border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <Dropdown
            options={typeOptions}
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-64"
          />
          <Dropdown
            options={stockAreas}
            value={stockAreaFilter}
            onChange={(e) => setStockAreaFilter(e.target.value)}
            className="w-64"
          />
        </div>

        <div className="flex border-b border-gray-200 mb-6">
          <button
            onClick={() => setActiveTab('inventory-stock')}
            className={`px-6 py-3 font-medium text-sm ${
              activeTab === 'inventory-stock'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Inventory Stock
          </button>
          <button
            onClick={() => setActiveTab('approval-request')}
            className={`px-6 py-3 font-medium text-sm ${
              activeTab === 'approval-request'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Approval Request
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <span className="ml-2 text-gray-600">Loading materials...</span>
          </div>
        ) : (
          <>
            <Table
              headers={['', 'MATERIAL NAME', 'PRODUCT CODE', 'MATERIAL TYPE', 'UOM']}
            >
              {materials.length > 0 ? (
                materials.map((item) => (
                  <tr key={item.material_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <button 
                        onClick={() => navigate('/add-inward')}
                        className="text-blue-600 hover:text-blue-700 transition-colors"
                        title="Add Inward"
                      >
                        <Plus className="w-5 h-5" />
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.material_name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.product_code}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.material_type}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.uom}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    No materials found
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

export default InventoryStock

