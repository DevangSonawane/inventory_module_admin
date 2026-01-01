import { useState, useEffect } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { Plus, Search, Edit, Trash2, Loader2 } from 'lucide-react'
import { toast } from 'react-toastify'
import Button from '../components/common/Button'
import Input from '../components/common/Input'
import Table from '../components/common/Table'
import Pagination from '../components/common/Pagination'
import Modal from '../components/common/Modal'
import ConfirmationModal from '../components/common/ConfirmationModal'
import { TableSkeleton } from '../components/common/Skeleton'
import { materialTypeService } from '../services/materialTypeService.js'

const MaterialTypeManagement = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { id } = useParams()
  const isEditMode = Boolean(id && id !== 'new')
  const isCreateMode = location.pathname.endsWith('/material-type-management/new')
  
  const [materialTypes, setMaterialTypes] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [totalItems, setTotalItems] = useState(0)
  const [searchTerm, setSearchTerm] = useState('')
  
  const [showModal, setShowModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteTypeId, setDeleteTypeId] = useState(null)
  const [saving, setSaving] = useState(false)
  
  const [formData, setFormData] = useState({
    typeName: '',
    typeCode: '',
    description: '',
  })
  const [formErrors, setFormErrors] = useState({})

  useEffect(() => {
    if (isEditMode) {
      fetchMaterialType()
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
    fetchMaterialTypes()
  }, [currentPage, itemsPerPage, searchTerm])

  const fetchMaterialTypes = async () => {
    try {
      setLoading(true)
      const response = await materialTypeService.getAll({
        page: currentPage,
        limit: itemsPerPage,
        search: searchTerm,
      })
      
      if (response.success) {
        setMaterialTypes(response.data?.materialTypes || [])
        setTotalItems(response.data?.pagination?.totalItems || 0)
      }
    } catch (error) {
      console.error('Error fetching material types:', error)
      toast.error('Failed to load material types')
    } finally {
      setLoading(false)
    }
  }

  const fetchMaterialType = async () => {
    try {
      setLoading(true)
      const response = await materialTypeService.getById(id)
      if (response.success) {
        const type = response.data?.materialType || response.data?.data
        if (type) {
          setFormData({
            typeName: type.type_name || '',
            typeCode: type.type_code || '',
            description: type.description || '',
          })
        }
      }
    } catch (error) {
      console.error('Error fetching material type:', error)
      toast.error('Failed to load material type')
      navigate('/material-type-management')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      typeName: '',
      typeCode: '',
      description: '',
    })
    setFormErrors({})
  }

  const handleSubmit = async () => {
    // Validation
    const errors = {}
    if (!formData.typeName.trim()) errors.typeName = 'Type name is required'

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      return
    }

    try {
      setSaving(true)
      const typeData = {
        typeName: formData.typeName.trim(),
        typeCode: formData.typeCode.trim() || undefined,
        description: formData.description.trim() || undefined,
      }

      let response
      if (isEditMode) {
        response = await materialTypeService.update(id, typeData)
      } else {
        response = await materialTypeService.create(typeData)
      }

      if (response.success) {
        toast.success(`Material type ${isEditMode ? 'updated' : 'created'} successfully!`)
        if (isEditMode) {
          navigate('/material-type-management')
        } else {
          resetForm()
          setShowModal(false)
          fetchMaterialTypes()
        }
      }
    } catch (error) {
      console.error('Error saving material type:', error)
      toast.error(error.response?.data?.message || error.message || `Failed to ${isEditMode ? 'update' : 'create'} material type`)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTypeId) return

    try {
      setSaving(true)
      const response = await materialTypeService.delete(deleteTypeId)
      if (response.success) {
        toast.success('Material type deleted successfully')
        setShowDeleteModal(false)
        setDeleteTypeId(null)
        fetchMaterialTypes()
      }
    } catch (error) {
      console.error('Error deleting material type:', error)
      toast.error(error.response?.data?.message || error.message || 'Failed to delete material type')
    } finally {
      setSaving(false)
    }
  }

  const totalPages = Math.ceil(totalItems / itemsPerPage)

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Material Type Management</h2>
          <Button variant="primary" onClick={() => navigate('/material-type-management/new')}>
            <Plus className="w-4 h-4 mr-2 inline" />
            Add New
          </Button>
        </div>

        <div className="flex gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search material types..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {loading ? (
          <TableSkeleton rows={10} columns={4} />
        ) : (
          <>
            <Table
              headers={['TYPE NAME', 'TYPE CODE', 'DESCRIPTION', 'ACTIONS']}
            >
              {materialTypes.length > 0 ? (
                materialTypes.map((type) => (
                  <tr key={type.type_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{type.type_name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{type.type_code || '-'}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{type.description || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex gap-2">
                        <button
                          onClick={() => navigate(`/material-type-management/${type.type_id}`)}
                          className="text-blue-600 hover:text-blue-700"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setDeleteTypeId(type.type_id)
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
                  <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                    No material types found
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
              navigate('/material-type-management')
            } else {
              navigate('/material-type-management')
              setShowModal(false)
              resetForm()
            }
          }}
          title={isEditMode ? 'Edit Material Type' : 'Add New Material Type'}
          size="md"
        >
          <div className="space-y-4">
            <Input
              label="Type Name"
              required
              value={formData.typeName}
              onChange={(e) => {
                setFormData({ ...formData, typeName: e.target.value })
                setFormErrors({ ...formErrors, typeName: '' })
              }}
              error={formErrors.typeName}
            />
            <Input
              label="Type Code"
              value={formData.typeCode}
              onChange={(e) => setFormData({ ...formData, typeCode: e.target.value })}
              placeholder="Enter type code (optional)"
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Enter description (optional)"
              />
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button
                variant="secondary"
                onClick={() => {
                  if (isEditMode) {
                    navigate('/material-type-management')
                  } else {
                    navigate('/material-type-management')
                    setShowModal(false)
                    resetForm()
                  }
                }}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleSubmit}
                disabled={saving}
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 inline animate-spin" />
                    {isEditMode ? 'Updating...' : 'Creating...'}
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
          setDeleteTypeId(null)
        }}
        onConfirm={handleDelete}
        title="Delete Material Type"
        message="Are you sure you want to delete this material type? This action cannot be undone."
        confirmText="Delete"
        confirmVariant="danger"
        isLoading={saving}
      />
    </div>
  )
}

export default MaterialTypeManagement

