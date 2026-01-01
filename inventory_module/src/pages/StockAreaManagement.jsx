import { useState, useEffect } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { Plus, Search, Edit, Trash2, Loader2, Download } from 'lucide-react'
import { toast } from 'react-toastify'
import Button from '../components/common/Button'
import Input from '../components/common/Input'
import Dropdown from '../components/common/Dropdown'
import Table from '../components/common/Table'
import Pagination from '../components/common/Pagination'
import Modal from '../components/common/Modal'
import ConfirmationModal from '../components/common/ConfirmationModal'
import { TableSkeleton } from '../components/common/Skeleton'
import { stockAreaService } from '../services/stockAreaService.js'
import { userService } from '../services/userService.js'
import { exportService } from '../services/exportService.js'

const StockAreaManagement = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { id } = useParams()
  const isEditMode = Boolean(id && id !== 'new')
  const isCreateMode = location.pathname.endsWith('/stock-area-management/new')
  
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
  
  const [employees, setEmployees] = useState([])
  const [loadingEmployees, setLoadingEmployees] = useState(false)
  const [formData, setFormData] = useState({
    areaName: '',
    storeKeeperId: '',
    description: '',
    pinCode: '',
    companyName: '',
    streetNumberName: '',
    apartmentUnit: '',
    localityDistrict: '',
    city: '',
    stateProvince: '',
    country: '',
  })
  const [formErrors, setFormErrors] = useState({})

  useEffect(() => {
    fetchEmployees()
  }, [])

  useEffect(() => {
    if (isEditMode) {
      fetchStockArea()
    } else {
      resetForm()
    }
  }, [id, isEditMode])

  useEffect(() => {
    if (isCreateMode && !isEditMode) {
      resetForm()
      setShowModal(true)
    } else if (!isEditMode) {
      setShowModal(false)
    }
  }, [isCreateMode, isEditMode])

  useEffect(() => {
    fetchStockAreas()
  }, [currentPage, itemsPerPage, searchTerm])

  const fetchEmployees = async () => {
    try {
      setLoadingEmployees(true)
      const response = await userService.getAll({ limit: 1000 })
      if (response.success && response.data?.users) {
        setEmployees(response.data.users)
      }
    } catch (error) {
      console.error('Error fetching employees:', error)
      toast.error('Failed to load employees')
    } finally {
      setLoadingEmployees(false)
    }
  }

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
          storeKeeperId: area.store_keeper_id?.toString() || '',
          description: area.description || '',
          pinCode: area.pin_code || '',
          companyName: area.company_name || '',
          streetNumberName: area.street_number_name || '',
          apartmentUnit: area.apartment_unit || '',
          localityDistrict: area.locality_district || '',
          city: area.city || '',
          stateProvince: area.state_province || '',
          country: area.country || '',
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
      storeKeeperId: '',
      description: '',
      pinCode: '',
      companyName: '',
      streetNumberName: '',
      apartmentUnit: '',
      localityDistrict: '',
      city: '',
      stateProvince: '',
      country: '',
    })
    setFormErrors({})
  }

  const handleSubmit = async () => {
    // Validation
    const errors = {}
    if (!formData.areaName.trim()) errors.areaName = 'Warehouse name is required'

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      return
    }

    try {
      setSaving(true)
      const areaData = {
        areaName: formData.areaName.trim(),
        storeKeeperId: formData.storeKeeperId ? parseInt(formData.storeKeeperId) : undefined,
        description: formData.description.trim() || undefined,
        pinCode: formData.pinCode.trim() || undefined,
        companyName: formData.companyName.trim() || undefined,
        streetNumberName: formData.streetNumberName.trim() || undefined,
        apartmentUnit: formData.apartmentUnit.trim() || undefined,
        localityDistrict: formData.localityDistrict.trim() || undefined,
        city: formData.city.trim() || undefined,
        stateProvince: formData.stateProvince.trim() || undefined,
        country: formData.country.trim() || undefined,
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
              headers={['WAREHOUSE NAME', 'STORE KEEPER', 'DESCRIPTION', 'PIN CODE', 'ACTIONS']}
            >
              {stockAreas.length > 0 ? (
                stockAreas.map((area) => (
                  <tr key={area.area_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{area.area_name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {area.storeKeeper ? area.storeKeeper.name : '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {area.description ? (area.description.length > 50 ? `${area.description.substring(0, 50)}...` : area.description) : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{area.pin_code || '-'}</td>
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
              navigate('/stock-area-management')
              setShowModal(false)
              resetForm()
            }
          }}
          title={isEditMode ? 'Edit Stock Area' : 'Add New Stock Area'}
          size="md"
        >
          <div className="space-y-4">
            <Input
              label="Warehouse Name"
              required
              value={formData.areaName}
              onChange={(e) => {
                setFormData({ ...formData, areaName: e.target.value })
                setFormErrors({ ...formErrors, areaName: '' })
              }}
              error={formErrors.areaName}
              placeholder="Enter warehouse name"
            />
            <Dropdown
              label="Store Keeper"
              value={formData.storeKeeperId}
              onChange={(e) => {
                setFormData({ ...formData, storeKeeperId: e.target.value })
                setFormErrors({ ...formErrors, storeKeeperId: '' })
              }}
              error={formErrors.storeKeeperId}
              options={[
                { value: '', label: 'Select Store Keeper' },
                ...employees
                  .filter(emp => emp.isActive !== false)
                  .map(emp => ({
                    value: emp.id.toString(),
                    label: `${emp.name}${emp.employeCode ? ` (${emp.employeCode})` : ''}`
                  }))
              ]}
              disabled={loadingEmployees}
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => {
                  setFormData({ ...formData, description: e.target.value })
                  setFormErrors({ ...formErrors, description: '' })
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Enter description"
              />
              {formErrors.description && (
                <span className="text-sm text-red-500 mt-1">{formErrors.description}</span>
              )}
            </div>
            <Input
              label="Company Name (if applicable)"
              value={formData.companyName}
              onChange={(e) => {
                setFormData({ ...formData, companyName: e.target.value })
              }}
              placeholder="Enter company name"
            />
            <Input
              label="Street Number & Name"
              value={formData.streetNumberName}
              onChange={(e) => {
                setFormData({ ...formData, streetNumberName: e.target.value })
              }}
              placeholder="Enter street number and name"
            />
            <Input
              label="Apartment/Unit"
              value={formData.apartmentUnit}
              onChange={(e) => {
                setFormData({ ...formData, apartmentUnit: e.target.value })
              }}
              placeholder="Enter apartment/unit"
            />
            <Input
              label="Locality/District (if needed)"
              value={formData.localityDistrict}
              onChange={(e) => {
                setFormData({ ...formData, localityDistrict: e.target.value })
              }}
              placeholder="Enter locality/district"
            />
            <Input
              label="City"
              value={formData.city}
              onChange={(e) => {
                setFormData({ ...formData, city: e.target.value })
              }}
              placeholder="Enter city"
            />
            <Input
              label="State/Province"
              value={formData.stateProvince}
              onChange={(e) => {
                setFormData({ ...formData, stateProvince: e.target.value })
              }}
              placeholder="Enter state/province"
            />
            <Input
              label="Postal Code"
              type="text"
              value={formData.pinCode}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '')
                setFormData({ ...formData, pinCode: value })
                setFormErrors({ ...formErrors, pinCode: '' })
              }}
              error={formErrors.pinCode}
              placeholder="Enter postal code"
              maxLength={10}
            />
            <Input
              label="Country (in all caps)"
              value={formData.country}
              onChange={(e) => {
                setFormData({ ...formData, country: e.target.value.toUpperCase() })
              }}
              placeholder="Enter country"
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

