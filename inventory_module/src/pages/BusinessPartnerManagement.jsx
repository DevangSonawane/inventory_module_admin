import { useState, useEffect } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { Plus, Search, RefreshCw, Edit, Trash2, Loader2, ArrowLeft } from 'lucide-react'
import { toast } from 'react-toastify'
import Button from '../components/common/Button'
import Input from '../components/common/Input'
import Dropdown from '../components/common/Dropdown'
import Table from '../components/common/Table'
import Pagination from '../components/common/Pagination'
import Modal from '../components/common/Modal'
import ConfirmationModal from '../components/common/ConfirmationModal'
import { businessPartnerService } from '../services/businessPartnerService.js'

const BusinessPartnerManagement = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { id } = useParams()
  const isEditMode = id && id !== 'new'
  
  const [partners, setPartners] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [totalItems, setTotalItems] = useState(0)
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  
  const [showModal, setShowModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedPartner, setSelectedPartner] = useState(null)
  const [deletePartnerId, setDeletePartnerId] = useState(null)
  const [saving, setSaving] = useState(false)
  
  const [formData, setFormData] = useState({
    partnerName: '',
    partnerType: 'SUPPLIER',
    email: '',
    phone: '',
    address: '',
    contactPerson: '',
  })
  const [formErrors, setFormErrors] = useState({})

  useEffect(() => {
    if (isEditMode) {
      fetchPartner()
    } else {
      resetForm()
    }
  }, [id, isEditMode])

  useEffect(() => {
    fetchPartners()
  }, [currentPage, itemsPerPage, searchTerm, typeFilter])

  const fetchPartners = async () => {
    try {
      setLoading(true)
      const response = await businessPartnerService.getAll({
        page: currentPage,
        limit: itemsPerPage,
        search: searchTerm,
        partnerType: typeFilter || undefined,
      })
      
      if (response.success) {
        setPartners(response.data?.businessPartners || response.data?.data || [])
        setTotalItems(response.data?.pagination?.totalItems || response.data?.totalItems || 0)
      }
    } catch (error) {
      console.error('Error fetching business partners:', error)
      toast.error('Failed to load business partners')
    } finally {
      setLoading(false)
    }
  }

  const fetchPartner = async () => {
    try {
      setLoading(true)
      const response = await businessPartnerService.getById(id)
      if (response.success) {
        const partner = response.data?.businessPartner || response.data?.data
        if (partner) {
          setFormData({
            partnerName: partner.partner_name || '',
            partnerType: partner.partner_type || 'SUPPLIER',
            email: partner.email || '',
            phone: partner.phone || '',
            address: partner.address || '',
            contactPerson: partner.contact_person || '',
          })
          setSelectedPartner(partner)
        }
      }
    } catch (error) {
      console.error('Error fetching business partner:', error)
      toast.error('Failed to load business partner')
      navigate('/business-partner')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      partnerName: '',
      partnerType: 'SUPPLIER',
      email: '',
      phone: '',
      address: '',
      contactPerson: '',
    })
    setFormErrors({})
    setSelectedPartner(null)
  }

  const validateForm = () => {
    const errors = {}
    if (!formData.partnerName.trim()) {
      errors.partnerName = 'Partner name is required'
    }
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Invalid email format'
    }
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSave = async () => {
    if (!validateForm()) {
      toast.error('Please fix the form errors')
      return
    }

    try {
      setSaving(true)
      let response
      if (isEditMode) {
        response = await businessPartnerService.update(id, formData)
      } else {
        response = await businessPartnerService.create(formData)
      }

      if (response.success) {
        toast.success(`Business partner ${isEditMode ? 'updated' : 'created'} successfully!`)
        if (isEditMode) {
          navigate('/business-partner')
        } else {
          setShowModal(false)
          resetForm()
          fetchPartners()
          // Trigger multiple refresh mechanisms for reliability
          window.dispatchEvent(new CustomEvent('businessPartnerCreated'))
          // Also use localStorage as a backup
          localStorage.setItem('businessPartnerCreated', Date.now().toString())
          // Trigger storage event for cross-tab/window communication
          window.dispatchEvent(new StorageEvent('storage', {
            key: 'businessPartnerCreated',
            newValue: Date.now().toString()
          }))
          
          // If we came from AddInward, navigate back and refresh
          if (sessionStorage.getItem('returnToInward') === 'true') {
            sessionStorage.removeItem('returnToInward')
            navigate('/add-inward')
          }
        }
      }
    } catch (error) {
      console.error('Error saving business partner:', error)
      toast.error(error.message || `Failed to ${isEditMode ? 'update' : 'create'} business partner`)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    try {
      await businessPartnerService.delete(deletePartnerId)
      toast.success('Business partner deleted successfully')
      setShowDeleteModal(false)
      setDeletePartnerId(null)
      fetchPartners()
    } catch (error) {
      toast.error(error.message || 'Failed to delete business partner')
    }
  }

  const partnerTypeOptions = [
    { value: '', label: 'All Types' },
    { value: 'SUPPLIER', label: 'Supplier' },
    { value: 'VENDOR', label: 'Vendor' },
    { value: 'CUSTOMER', label: 'Customer' },
  ]

  const formTypeOptions = [
    { value: 'SUPPLIER', label: 'Supplier' },
    { value: 'VENDOR', label: 'Vendor' },
    { value: 'CUSTOMER', label: 'Customer' },
  ]

  const columns = [
    { key: 'srNo', label: 'Sr. No.' },
    { key: 'partnerName', label: 'Partner Name' },
    { key: 'partnerType', label: 'Type' },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Phone' },
    { key: 'contactPerson', label: 'Contact Person' },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(`/business-partner/${row.id}`)}
            className="p-1 text-blue-600 hover:bg-blue-50 rounded"
            title="Edit"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              setDeletePartnerId(row.id)
              setShowDeleteModal(true)
            }}
            className="p-1 text-red-600 hover:bg-red-50 rounded"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ]

  const tableData = partners.map((partner, index) => ({
    id: partner.partner_id,
    srNo: (currentPage - 1) * itemsPerPage + index + 1,
    partnerName: partner.partner_name,
    partnerType: partner.partner_type,
    email: partner.email || '-',
    phone: partner.phone || '-',
    contactPerson: partner.contact_person || '-',
  }))

  if (isEditMode) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" onClick={() => navigate('/business-partner')} icon={<ArrowLeft className="w-4 h-4" />}>
            Back
          </Button>
          <h1 className="text-2xl font-bold text-gray-800">Edit Business Partner</h1>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="space-y-4">
            <Input
              label="Partner Name"
              value={formData.partnerName}
              onChange={(e) => setFormData({ ...formData, partnerName: e.target.value })}
              error={formErrors.partnerName}
              required
            />
            <Dropdown
              label="Partner Type"
              options={formTypeOptions}
              value={formData.partnerType}
              onChange={(e) => setFormData({ ...formData, partnerType: e.target.value })}
            />
            <Input
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              error={formErrors.email}
            />
            <Input
              label="Phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
            <Input
              label="Address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />
            <Input
              label="Contact Person"
              value={formData.contactPerson}
              onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
            />
            <div className="flex gap-4 pt-4">
              <Button onClick={handleSave} disabled={saving} icon={saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}>
                Update
              </Button>
              <Button onClick={() => navigate('/business-partner')} variant="outline">
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Business Partners</h1>
        <Button onClick={() => setShowModal(true)} icon={<Plus className="w-4 h-4" />}>
          Add Business Partner
        </Button>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by name, email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <Dropdown
            options={partnerTypeOptions}
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-48"
          />
          <Button onClick={fetchPartners} variant="outline" icon={<RefreshCw className="w-4 h-4" />}>
            Refresh
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600" />
            <p className="mt-2 text-gray-600">Loading business partners...</p>
          </div>
        ) : tableData.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-600">No business partners found</p>
          </div>
        ) : (
          <>
            <Table data={tableData} columns={columns} />
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

      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false)
          resetForm()
        }}
        title="Add Business Partner"
      >
        <div className="space-y-4">
          <Input
            label="Partner Name"
            value={formData.partnerName}
            onChange={(e) => setFormData({ ...formData, partnerName: e.target.value })}
            error={formErrors.partnerName}
            required
          />
          <Dropdown
            label="Partner Type"
            options={formTypeOptions}
            value={formData.partnerType}
            onChange={(e) => setFormData({ ...formData, partnerType: e.target.value })}
          />
          <Input
            label="Email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            error={formErrors.email}
          />
          <Input
            label="Phone"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          />
          <Input
            label="Address"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          />
          <Input
            label="Contact Person"
            value={formData.contactPerson}
            onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
          />
          <div className="flex gap-2 justify-end pt-4">
            <Button onClick={() => {
              setShowModal(false)
              resetForm()
            }} variant="outline">
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving} icon={saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}>
              Create
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false)
          setDeletePartnerId(null)
        }}
        onConfirm={handleDelete}
        title="Delete Business Partner"
        message="Are you sure you want to delete this business partner? This action cannot be undone."
      />
    </div>
  )
}

export default BusinessPartnerManagement
