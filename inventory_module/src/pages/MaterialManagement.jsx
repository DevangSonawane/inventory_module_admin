import { useState, useEffect } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { Plus, Search, RefreshCw, Edit, Trash2, Loader2, Download, Upload } from 'lucide-react'
import { toast } from 'react-toastify'
import Button from '../components/common/Button'
import Input from '../components/common/Input'
import Dropdown from '../components/common/Dropdown'
import Table from '../components/common/Table'
import Pagination from '../components/common/Pagination'
import Modal from '../components/common/Modal'
import ConfirmationModal from '../components/common/ConfirmationModal'
import { TableSkeleton } from '../components/common/Skeleton'
import { materialService } from '../services/materialService.js'
import { validationService } from '../services/validationService.js'
import { exportService } from '../services/exportService.js'
import { bulkService } from '../services/bulkService.js'

const MaterialManagement = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { id } = useParams()
  const isEditMode = Boolean(id && id !== 'new')
  const isCreateMode = location.pathname.endsWith('/material-management/new')
  
  const [materials, setMaterials] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [totalItems, setTotalItems] = useState(0)
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  
  const [showModal, setShowModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showBulkModal, setShowBulkModal] = useState(false)
  const [selectedMaterial, setSelectedMaterial] = useState(null)
  const [deleteMaterialId, setDeleteMaterialId] = useState(null)
  const [saving, setSaving] = useState(false)
  
  const [formData, setFormData] = useState({
    materialName: '',
    productCode: '',
    materialType: '',
    uom: 'PIECE(S)',
    properties: '',
    description: '',
  })
  const [formErrors, setFormErrors] = useState({})
  const [productCodeValidating, setProductCodeValidating] = useState(false)

  useEffect(() => {
    if (isEditMode) {
      fetchMaterial()
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
    fetchMaterials()
  }, [currentPage, itemsPerPage, searchTerm, typeFilter])

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
        setMaterials(response.data.materials || [])
        setTotalItems(response.data.pagination?.totalItems || 0)
      }
    } catch (error) {
      console.error('Error fetching materials:', error)
      toast.error('Failed to load materials')
    } finally {
      setLoading(false)
    }
  }

  const fetchMaterial = async () => {
    try {
      setLoading(true)
      const response = await materialService.getById(id)
      if (response.success) {
        const material = response.data.material
        setFormData({
          materialName: material.material_name || '',
          productCode: material.product_code || '',
          materialType: material.material_type || '',
          uom: material.uom || 'PIECE(S)',
          properties: material.properties ? JSON.stringify(material.properties, null, 2) : '',
          description: material.description || '',
        })
        setSelectedMaterial(material)
      }
    } catch (error) {
      console.error('Error fetching material:', error)
      toast.error('Failed to load material')
      navigate('/material-management')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      materialName: '',
      productCode: '',
      materialType: '',
      uom: 'PIECE(S)',
      properties: '',
      description: '',
    })
    setFormErrors({})
    setSelectedMaterial(null)
  }

  const validateProductCode = async (productCode, excludeId = null) => {
    if (!productCode.trim()) {
      setFormErrors({ ...formErrors, productCode: '' })
      return true
    }

    try {
      setProductCodeValidating(true)
      const response = await validationService.validateProductCode(productCode, undefined, excludeId)
      if (response.success) {
        if (response.data.exists) {
          setFormErrors({ ...formErrors, productCode: 'Product code already exists' })
          return false
        } else {
          setFormErrors({ ...formErrors, productCode: '' })
          return true
        }
      }
    } catch (error) {
      console.error('Error validating product code:', error)
      return true // Allow submission if validation fails
    } finally {
      setProductCodeValidating(false)
    }
    return true
  }

  const handleProductCodeBlur = async () => {
    if (formData.productCode.trim()) {
      await validateProductCode(formData.productCode, isEditMode ? id : null)
    }
  }

  const handleSubmit = async () => {
    // Validation
    const errors = {}
    if (!formData.materialName.trim()) errors.materialName = 'Material name is required'
    if (!formData.productCode.trim()) errors.productCode = 'Product code is required'
    if (!formData.materialType.trim()) errors.materialType = 'Material type is required'

    // Check product code uniqueness
    const isProductCodeValid = await validateProductCode(formData.productCode, isEditMode ? id : null)
    if (!isProductCodeValid) {
      errors.productCode = 'Product code already exists'
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      return
    }

    try {
      setSaving(true)
      const materialData = {
        materialName: formData.materialName.trim(),
        productCode: formData.productCode.trim(),
        materialType: formData.materialType.trim(),
        uom: formData.uom || undefined,
        description: formData.description.trim() || undefined,
        properties: formData.properties.trim() ? JSON.parse(formData.properties) : undefined,
      }

      let response
      if (isEditMode) {
        response = await materialService.update(id, materialData)
      } else {
        response = await materialService.create(materialData)
      }

      if (response.success) {
        toast.success(`Material ${isEditMode ? 'updated' : 'created'} successfully!`)
        if (isEditMode) {
          navigate('/material-management')
        } else {
          resetForm()
          setShowModal(false)
          fetchMaterials()
        }
      }
    } catch (error) {
      console.error('Error saving material:', error)
      toast.error(error.message || `Failed to ${isEditMode ? 'update' : 'create'} material`)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteMaterialId) return

    try {
      setSaving(true)
      const response = await materialService.delete(deleteMaterialId)
      if (response.success) {
        toast.success('Material deleted successfully')
        setShowDeleteModal(false)
        setDeleteMaterialId(null)
        fetchMaterials()
      }
    } catch (error) {
      console.error('Error deleting material:', error)
      toast.error(error.message || 'Failed to delete material')
    } finally {
      setSaving(false)
    }
  }

  const handleBulkImport = async (file) => {
    if (!file) {
      toast.error('Please select a file')
      return
    }

    try {
      setSaving(true)
      const text = await file.text()
      const lines = text.split('\n').filter(line => line.trim())
      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))
      
      const materials = []
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''))
        const material = {}
        headers.forEach((header, index) => {
          const key = header.toLowerCase().replace(/\s+/g, '')
          if (key === 'materialname') material.materialName = values[index]
          else if (key === 'productcode') material.productCode = values[index]
          else if (key === 'materialtype') material.materialType = values[index]
          else if (key === 'uom') material.uom = values[index]
          else if (key === 'description') material.description = values[index]
        })
        if (material.materialName && material.productCode && material.materialType) {
          materials.push(material)
        }
      }

      if (materials.length === 0) {
        toast.error('No valid materials found in file')
        return
      }

      const response = await bulkService.bulkMaterials(materials)
      if (response.success) {
        toast.success(`Successfully imported ${response.data.created} materials`)
        setShowBulkModal(false)
        fetchMaterials()
      }
    } catch (error) {
      console.error('Error importing materials:', error)
      toast.error(error.message || 'Failed to import materials')
    } finally {
      setSaving(false)
    }
  }

  const materialTypeOptions = [
    { value: '', label: 'All Types' },
    { value: 'COMPONENT', label: 'Component' },
    { value: 'EQUIPMENT', label: 'Equipment' },
    { value: 'CONSUMABLE', label: 'Consumable' },
    { value: 'TOOL', label: 'Tool' },
  ]

  const uomOptions = [
    { value: 'PIECE(S)', label: 'Piece(s)' },
    { value: 'KG', label: 'Kilogram' },
    { value: 'LITER', label: 'Liter' },
    { value: 'METER', label: 'Meter' },
    { value: 'BOX', label: 'Box' },
    { value: 'PACK', label: 'Pack' },
  ]

  const totalPages = Math.ceil(totalItems / itemsPerPage)

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Material Management</h2>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={async () => {
              try {
                await exportService.exportMaterials('csv', { search: searchTerm, materialType: typeFilter })
                toast.success('Export started successfully')
              } catch (error) {
                console.error('Export error:', error)
                toast.error('Failed to export data')
              }
            }}>
              <Download className="w-4 h-4 mr-2 inline" />
              Export
            </Button>
            <Button variant="secondary" onClick={() => setShowBulkModal(true)}>
              <Upload className="w-4 h-4 mr-2 inline" />
              Bulk Import
            </Button>
            <Button variant="primary" onClick={() => navigate('/material-management/new')}>
              <Plus className="w-4 h-4 mr-2 inline" />
              Add New
            </Button>
          </div>
        </div>

        <div className="flex gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search materials..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="w-64">
            <Dropdown
              options={materialTypeOptions}
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <TableSkeleton rows={10} columns={6} />
        ) : (
          <>
            <Table
              headers={['MATERIAL NAME', 'PRODUCT CODE', 'MATERIAL TYPE', 'UOM', 'DESCRIPTION', 'ACTIONS']}
            >
              {materials.length > 0 ? (
                materials.map((material) => (
                  <tr key={material.material_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{material.material_name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{material.product_code}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{material.material_type}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{material.uom || 'N/A'}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{material.description || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex gap-2">
                        <button
                          onClick={() => navigate(`/material-management/${material.material_id}`)}
                          className="text-blue-600 hover:text-blue-700"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setDeleteMaterialId(material.material_id)
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
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
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

      {/* Create/Edit Modal */}
      {(isEditMode || showModal) && (
        <Modal
          isOpen={true}
          onClose={() => {
          if (isEditMode) {
              navigate('/material-management')
          } else {
              navigate('/material-management')
            setShowModal(false)
            resetForm()
          }
          }}
          title={isEditMode ? 'Edit Material' : 'Add New Material'}
          size="lg"
        >
          <div className="space-y-4">
            <Input
              label="Material Name"
              required
              value={formData.materialName}
              onChange={(e) => {
                setFormData({ ...formData, materialName: e.target.value })
                setFormErrors({ ...formErrors, materialName: '' })
              }}
              error={formErrors.materialName}
            />
            <div>
              <Input
                label="Product Code"
                required
                value={formData.productCode}
                onChange={(e) => {
                  setFormData({ ...formData, productCode: e.target.value })
                  setFormErrors({ ...formErrors, productCode: '' })
                }}
                onBlur={handleProductCodeBlur}
                error={formErrors.productCode}
                disabled={productCodeValidating}
              />
              {productCodeValidating && (
                <p className="text-xs text-gray-500 mt-1">Validating...</p>
              )}
            </div>
            <Dropdown
              label="Material Type"
              required
              options={[
                { value: '', label: 'Select Material Type' },
                { value: 'COMPONENT', label: 'Component' },
                { value: 'EQUIPMENT', label: 'Equipment' },
                { value: 'CONSUMABLE', label: 'Consumable' },
                { value: 'TOOL', label: 'Tool' },
              ]}
              value={formData.materialType}
              onChange={(e) => {
                setFormData({ ...formData, materialType: e.target.value })
                setFormErrors({ ...formErrors, materialType: '' })
              }}
            />
            {formErrors.materialType && (
              <p className="text-sm text-red-600">{formErrors.materialType}</p>
            )}
            <Dropdown
              label="Unit of Measure (UOM)"
              options={uomOptions}
              value={formData.uom}
              onChange={(e) => setFormData({ ...formData, uom: e.target.value })}
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Properties (JSON format)
              </label>
              <textarea
                value={formData.properties}
                onChange={(e) => setFormData({ ...formData, properties: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={4}
                placeholder='{"key": "value"}'
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button
                variant="gray"
                onClick={() => {
                  if (isEditMode) {
                    navigate('/material-management')
                  } else {
                    navigate('/material-management')
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
          setDeleteMaterialId(null)
        }}
        onConfirm={handleDelete}
        title="Delete Material"
        message="Are you sure you want to delete this material? This action cannot be undone."
        confirmText="Delete"
        variant="danger"
      />

      {/* Bulk Import Modal */}
      <Modal
        isOpen={showBulkModal}
        onClose={() => setShowBulkModal(false)}
        title="Bulk Import Materials"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Upload a CSV file with columns: MaterialName, ProductCode, MaterialType, UOM, Description
          </p>
          <input
            type="file"
            accept=".csv"
            onChange={(e) => {
              const file = e.target.files[0]
              if (file) {
                handleBulkImport(file)
              }
            }}
            className="w-full"
          />
          <div className="flex justify-end">
            <Button variant="gray" onClick={() => setShowBulkModal(false)}>
              Close
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default MaterialManagement

