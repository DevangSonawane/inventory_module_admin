import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Plus, Search, Edit, Trash2, Loader2, Download } from 'lucide-react'
import { toast } from 'react-toastify'
import Button from '../components/common/Button'
import Input from '../components/common/Input'
import Table from '../components/common/Table'
import Pagination from '../components/common/Pagination'
import Modal from '../components/common/Modal'
import ConfirmationModal from '../components/common/ConfirmationModal'
import { TableSkeleton } from '../components/common/Skeleton'
import { stockAreaService } from '../services/stockAreaService.js'
import { exportService } from '../services/exportService.js'

const StockAreaManagement = () => {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEditMode = id && id !== 'new'
  
  const [stockAreas, setStockAreas] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [totalItems, setTotalItems] = useState(0)
  const [searchTerm, setSearchTerm] = useState('')
  
  const [showModal, setShowModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteAreaId, setDeleteAreaId] = useState(null)
  const [saving, setSaving] = useState(false)
  
  const [formData, setFormData] = useState({
    areaName: '',
    locationCode: '',
    address: '',
    capacity: '',
  })
  const [formErrors, setFormErrors] = useState({})

  useEffect(() => {
    if (isEditMode) {
      fetchStockArea()
    } else {
      resetForm()
    }
  }, [id, isEditMode])

  useEffect(() => {
    fetchStockAreas()
  }, [currentPage, itemsPerPage, searchTerm])

  const fetchStockAreas = async () => {
    try {
      setLoading(true)
      const response = await stockAreaService.getAll({
        page: currentPage,
        limit: itemsPerPage,
        search: searchTerm,
      })
      
      if (response.success) {
        setStockAreas(response.data.stockAreas || [])
        setTotalItems(response.data.pagination?.totalItems || 0)
      }
    } catch (error) {
      console.error('Error fetching stock areas:', error)
      toast.error('Failed to load stock areas')
    } finally {
      setLoading(false)
    }
  }

  const fetchStockArea = async () => {
    try {
      setLoading(true)
      const response = await stockAreaService.getById(id)
      if (response.success) {
        const area = response.data.stockArea
        setFormData({
          areaName: area.area_name || '',
          locationCode: area.location_code || '',
          address: area.address || '',
          capacity: area.capacity?.toString() || '',
        })
      }
    } catch (error) {
      console.error('Error fetching stock area:', error)
      toast.error('Failed to load stock area')
      navigate('/stock-area-management')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      areaName: '',
      locationCode: '',
      address: '',
      capacity: '',
    })
    setFormErrors({})
  }

  const handleSubmit = async () => {
    // Validation
    const errors = {}
    if (!formData.areaName.trim()) errors.areaName = 'Area name is required'
    if (!formData.locationCode.trim()) errors.locationCode = 'Location code is required'

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      return
    }

    try {
      setSaving(true)
      const areaData = {
        areaName: formData.areaName.trim(),
        locationCode: formData.locationCode.trim(),
        address: formData.address.trim() || undefined,
        capacity: formData.capacity ? parseInt(formData.capacity) : undefined,
      }

      let response
      if (isEditMode) {
        response = await stockAreaService.update(id, areaData)
      } else {
        response = await stockAreaService.create(areaData)
      }

      if (response.success) {
        toast.success(`Stock area ${isEditMode ? 'updated' : 'created'} successfully!`)
        if (isEditMode) {
          navigate('/stock-area-management')
        } else {
          resetForm()
          setShowModal(false)
          fetchStockAreas()
        }
      }
    } catch (error) {
      console.error('Error saving stock area:', error)
      toast.error(error.message || `Failed to ${isEditMode ? 'update' : 'create'} stock area`)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteAreaId) return

    try {
      setSaving(true)
      const response = await stockAreaService.delete(deleteAreaId)
      if (response.success) {
        toast.success('Stock area deleted successfully')
        setShowDeleteModal(false)
        setDeleteAreaId(null)
        fetchStockAreas()
      }
    } catch (error) {
      console.error('Error deleting stock area:', error)
      toast.error(error.message || 'Failed to delete stock area')
    } finally {
      setSaving(false)
    }
  }

  const totalPages = Math.ceil(totalItems / itemsPerPage)

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Stock Area Management</h2>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={async () => {
              try {
                await exportService.exportMaterials('csv')
                toast.success('Export started successfully')
              } catch (error) {
                console.error('Export error:', error)
                toast.error('Failed to export data')
              }
            }}>
              <Download className="w-4 h-4 mr-2 inline" />
              Export
            </Button>
            <Button variant="primary" onClick={() => navigate('/stock-area-management/new')}>
              <Plus className="w-4 h-4 mr-2 inline" />
              Add New
            </Button>
          </div>
        </div>

        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search stock areas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {loading ? (
          <TableSkeleton rows={10} columns={5} />
        ) : (
          <>
            <Table
              headers={['AREA NAME', 'LOCATION CODE', 'ADDRESS', 'CAPACITY', 'ACTIONS']}
            >
              {stockAreas.length > 0 ? (
                stockAreas.map((area) => (
                  <tr key={area.area_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{area.area_name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{area.location_code}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{area.address || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{area.capacity || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex gap-2">
                        <button
                          onClick={() => navigate(`/stock-area-management/${area.area_id}`)}
                          className="text-blue-600 hover:text-blue-700"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setDeleteAreaId(area.area_id)
                            setShowDeleteModal(true)
                          }}
                          className="text-red-600 hover:text-red-700"
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
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    No stock areas found
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

      {/* Create/Edit Modal */}
      {(isEditMode || showModal) && (
        <Modal
          isOpen={true}
          onClose={() => {
            if (isEditMode) {
              navigate('/stock-area-management')
            } else {
              setShowModal(false)
              resetForm()
            }
          }}
          title={isEditMode ? 'Edit Stock Area' : 'Add New Stock Area'}
          size="md"
        >
          <div className="space-y-4">
            <Input
              label="Area Name"
              required
              value={formData.areaName}
              onChange={(e) => {
                setFormData({ ...formData, areaName: e.target.value })
                setFormErrors({ ...formErrors, areaName: '' })
              }}
              error={formErrors.areaName}
            />
            <Input
              label="Location Code"
              required
              value={formData.locationCode}
              onChange={(e) => {
                setFormData({ ...formData, locationCode: e.target.value })
                setFormErrors({ ...formErrors, locationCode: '' })
              }}
              error={formErrors.locationCode}
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Address
              </label>
              <textarea
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
              />
            </div>
            <Input
              label="Capacity"
              type="number"
              value={formData.capacity}
              onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
            />
            <div className="flex justify-end gap-3 pt-4">
              <Button
                variant="gray"
                onClick={() => {
                  if (isEditMode) {
                    navigate('/stock-area-management')
                  } else {
                    setShowModal(false)
                    resetForm()
                  }
                }}
              >
                Cancel
              </Button>
              <Button variant="primary" onClick={handleSubmit} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 inline animate-spin" />
                    Saving...
                  </>
                ) : (
                  isEditMode ? 'Update' : 'Create'
                )}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false)
          setDeleteAreaId(null)
        }}
        onConfirm={handleDelete}
        title="Delete Stock Area"
        message="Are you sure you want to delete this stock area? This action cannot be undone."
        confirmText="Delete"
        variant="danger"
      />
    </div>
  )
}

export default StockAreaManagement

