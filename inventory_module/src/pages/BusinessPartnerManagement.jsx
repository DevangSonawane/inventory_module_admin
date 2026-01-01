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

// Country and State data
const countries = [
  { value: '', label: 'Select Country' },
  { value: 'India', label: 'India' },
  { value: 'USA', label: 'United States' },
  { value: 'UK', label: 'United Kingdom' },
  { value: 'Canada', label: 'Canada' },
  { value: 'Australia', label: 'Australia' },
  { value: 'Germany', label: 'Germany' },
  { value: 'France', label: 'France' },
  { value: 'Japan', label: 'Japan' },
  { value: 'China', label: 'China' },
  { value: 'Singapore', label: 'Singapore' },
]

const indianStates = [
  { value: '', label: 'Select State' },
  { value: 'Andhra Pradesh', label: 'Andhra Pradesh' },
  { value: 'Arunachal Pradesh', label: 'Arunachal Pradesh' },
  { value: 'Assam', label: 'Assam' },
  { value: 'Bihar', label: 'Bihar' },
  { value: 'Chhattisgarh', label: 'Chhattisgarh' },
  { value: 'Goa', label: 'Goa' },
  { value: 'Gujarat', label: 'Gujarat' },
  { value: 'Haryana', label: 'Haryana' },
  { value: 'Himachal Pradesh', label: 'Himachal Pradesh' },
  { value: 'Jharkhand', label: 'Jharkhand' },
  { value: 'Karnataka', label: 'Karnataka' },
  { value: 'Kerala', label: 'Kerala' },
  { value: 'Madhya Pradesh', label: 'Madhya Pradesh' },
  { value: 'Maharashtra', label: 'Maharashtra' },
  { value: 'Manipur', label: 'Manipur' },
  { value: 'Meghalaya', label: 'Meghalaya' },
  { value: 'Mizoram', label: 'Mizoram' },
  { value: 'Nagaland', label: 'Nagaland' },
  { value: 'Odisha', label: 'Odisha' },
  { value: 'Punjab', label: 'Punjab' },
  { value: 'Rajasthan', label: 'Rajasthan' },
  { value: 'Sikkim', label: 'Sikkim' },
  { value: 'Tamil Nadu', label: 'Tamil Nadu' },
  { value: 'Telangana', label: 'Telangana' },
  { value: 'Tripura', label: 'Tripura' },
  { value: 'Uttar Pradesh', label: 'Uttar Pradesh' },
  { value: 'Uttarakhand', label: 'Uttarakhand' },
  { value: 'West Bengal', label: 'West Bengal' },
  { value: 'Andaman and Nicobar Islands', label: 'Andaman and Nicobar Islands' },
  { value: 'Chandigarh', label: 'Chandigarh' },
  { value: 'Dadra and Nagar Haveli and Daman and Diu', label: 'Dadra and Nagar Haveli and Daman and Diu' },
  { value: 'Delhi', label: 'Delhi' },
  { value: 'Jammu and Kashmir', label: 'Jammu and Kashmir' },
  { value: 'Ladakh', label: 'Ladakh' },
  { value: 'Lakshadweep', label: 'Lakshadweep' },
  { value: 'Puducherry', label: 'Puducherry' },
]

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
    gstNumber: '',
    panCard: '',
    tanNumber: '',
    billingAddress: '',
    shippingAddress: '',
    sameAsBilling: false,
    bankName: '',
    bankAccountName: '',
    ifscCode: '',
    accountNumber: '',
    contactFirstName: '',
    contactLastName: '',
    contactDesignation: '',
    contactPhone: '',
    contactEmail: '',
    country: '',
    state: '',
    companyWebsite: '',
    vendorCode: '',
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

  // Update shipping address when same as billing is checked
  useEffect(() => {
    if (formData.sameAsBilling && formData.billingAddress) {
      setFormData(prev => ({ ...prev, shippingAddress: prev.billingAddress }))
    }
  }, [formData.sameAsBilling, formData.billingAddress])

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
            gstNumber: partner.gst_number || '',
            panCard: partner.pan_card || '',
            tanNumber: partner.tan_number || '',
            billingAddress: partner.billing_address || '',
            shippingAddress: partner.shipping_address || '',
            sameAsBilling: partner.same_as_billing || false,
            bankName: partner.bank_name || '',
            bankAccountName: partner.bank_account_name || '',
            ifscCode: partner.ifsc_code || '',
            accountNumber: partner.account_number || '',
            contactFirstName: partner.contact_first_name || '',
            contactLastName: partner.contact_last_name || '',
            contactDesignation: partner.contact_designation || '',
            contactPhone: partner.contact_phone || '',
            contactEmail: partner.contact_email || '',
            country: partner.country || '',
            state: partner.state || '',
            companyWebsite: partner.company_website || '',
            vendorCode: partner.vendor_code || '',
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
      gstNumber: '',
      panCard: '',
      tanNumber: '',
      billingAddress: '',
      shippingAddress: '',
      sameAsBilling: false,
      bankName: '',
      bankAccountName: '',
      ifscCode: '',
      accountNumber: '',
      contactFirstName: '',
      contactLastName: '',
      contactDesignation: '',
      contactPhone: '',
      contactEmail: '',
      country: '',
      state: '',
      companyWebsite: '',
      vendorCode: '',
    })
    setFormErrors({})
    setSelectedPartner(null)
  }

  const validateForm = () => {
    const errors = {}
    
    // Mandatory fields
    if (!formData.partnerName.trim()) {
      errors.partnerName = 'Partner name is required'
    }
    if (!formData.partnerType) {
      errors.partnerType = 'Partner type is required'
    }
    if (!formData.gstNumber.trim()) {
      errors.gstNumber = 'GST number is required'
    } else if (formData.gstNumber.length !== 15) {
      errors.gstNumber = 'GST number must be 15 characters'
    }
    if (!formData.panCard.trim()) {
      errors.panCard = 'PAN card is required'
    } else if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(formData.panCard.toUpperCase())) {
      errors.panCard = 'Invalid PAN card format (e.g., ABCDE1234F)'
    }
    if (!formData.billingAddress.trim()) {
      errors.billingAddress = 'Billing address is required'
    }
    if (!formData.shippingAddress.trim()) {
      errors.shippingAddress = 'Shipping address is required'
    }
    if (!formData.bankName.trim()) {
      errors.bankName = 'Bank name is required'
    }
    if (!formData.bankAccountName.trim()) {
      errors.bankAccountName = 'Bank account name is required'
    }
    if (!formData.ifscCode.trim()) {
      errors.ifscCode = 'IFSC code is required'
    } else if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(formData.ifscCode.toUpperCase())) {
      errors.ifscCode = 'Invalid IFSC code format (e.g., ABCD0123456)'
    }
    if (!formData.accountNumber.trim()) {
      errors.accountNumber = 'Account number is required'
    }
    if (!formData.contactFirstName.trim()) {
      errors.contactFirstName = 'Contact first name is required'
    }
    if (!formData.contactLastName.trim()) {
      errors.contactLastName = 'Contact last name is required'
    }
    if (!formData.contactDesignation.trim()) {
      errors.contactDesignation = 'Contact designation is required'
    }
    if (!formData.contactPhone.trim()) {
      errors.contactPhone = 'Contact phone number is required'
    } else if (!/^[0-9]{10}$/.test(formData.contactPhone.replace(/\D/g, ''))) {
      errors.contactPhone = 'Invalid phone number (must be 10 digits)'
    }
    if (!formData.contactEmail.trim()) {
      errors.contactEmail = 'Contact email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contactEmail)) {
      errors.contactEmail = 'Invalid email format'
    }
    
    // Optional field validation
    if (formData.companyWebsite && !/^https?:\/\/.+/.test(formData.companyWebsite)) {
      errors.companyWebsite = 'Invalid website URL format'
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
      
      // Format data for API
      const submitData = {
        partnerName: formData.partnerName.trim(),
        partnerType: formData.partnerType,
        gstNumber: formData.gstNumber.trim().toUpperCase(),
        panCard: formData.panCard.trim().toUpperCase(),
        billingAddress: formData.billingAddress.trim(),
        shippingAddress: formData.shippingAddress.trim(),
        sameAsBilling: formData.sameAsBilling,
        bankName: formData.bankName.trim(),
        bankAccountName: formData.bankAccountName.trim(),
        ifscCode: formData.ifscCode.trim().toUpperCase(),
        accountNumber: formData.accountNumber.trim(),
        contactFirstName: formData.contactFirstName.trim(),
        contactLastName: formData.contactLastName.trim(),
        contactDesignation: formData.contactDesignation.trim(),
        contactPhone: formData.contactPhone.replace(/\D/g, ''),
        contactEmail: formData.contactEmail.trim().toLowerCase(),
        country: formData.country || undefined,
        state: formData.state || undefined,
        companyWebsite: formData.companyWebsite.trim() || undefined,
        vendorCode: formData.vendorCode.trim() || undefined,
      }
      
      let response
      if (isEditMode) {
        response = await businessPartnerService.update(id, submitData)
      } else {
        response = await businessPartnerService.create(submitData)
      }

      if (response.success) {
        toast.success(`Business partner ${isEditMode ? 'updated' : 'created'} successfully!`)
        if (isEditMode) {
          navigate('/business-partner')
        } else {
          setShowModal(false)
          resetForm()
          fetchPartners()
          window.dispatchEvent(new CustomEvent('businessPartnerCreated'))
          localStorage.setItem('businessPartnerCreated', Date.now().toString())
          window.dispatchEvent(new StorageEvent('storage', {
            key: 'businessPartnerCreated',
            newValue: Date.now().toString()
          }))
          
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
    { value: 'FRANCHISE', label: 'Franchise' },
    { value: 'BOTH', label: 'Both' },
  ]

  const formTypeOptions = [
    { value: 'SUPPLIER', label: 'Supplier' },
    { value: 'FRANCHISE', label: 'Franchise' },
    { value: 'BOTH', label: 'Both' },
  ]

  const columns = [
    { key: 'srNo', label: 'Sr. No.' },
    { key: 'partnerName', label: 'Partner Name' },
    { key: 'partnerType', label: 'Type' },
    { key: 'gstNumber', label: 'GST Number' },
    { key: 'contactEmail', label: 'Contact Email' },
    { key: 'contactPhone', label: 'Contact Phone' },
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
    gstNumber: partner.gst_number || '-',
    contactEmail: partner.contact_email || partner.email || '-',
    contactPhone: partner.contact_phone || partner.phone || '-',
  }))

  const renderForm = () => (
    <div className="space-y-6 max-h-[80vh] overflow-y-auto pr-2">
      {/* Basic Information */}
      <div className="border-b pb-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Basic Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            error={formErrors.partnerType}
            required
          />
          <Input
            label="GST Number"
            value={formData.gstNumber}
            onChange={(e) => setFormData({ ...formData, gstNumber: e.target.value.toUpperCase() })}
            error={formErrors.gstNumber}
            maxLength={15}
            required
            placeholder="15 character GST number"
          />
          <Input
            label="PAN Card"
            value={formData.panCard}
            onChange={(e) => setFormData({ ...formData, panCard: e.target.value.toUpperCase() })}
            error={formErrors.panCard}
            maxLength={10}
            required
            placeholder="ABCDE1234F"
          />
          <Input
            label="TAN Number / Card"
            value={formData.tanNumber}
            onChange={(e) => setFormData({ ...formData, tanNumber: e.target.value.toUpperCase() })}
            error={formErrors.tanNumber}
            placeholder="Optional - Enter TAN number"
          />
          <Input
            label="Vendor Code (Auto-generated if left empty)"
            value={formData.vendorCode}
            onChange={(e) => setFormData({ ...formData, vendorCode: e.target.value })}
            placeholder="Leave empty for auto-generation"
          />
        </div>
      </div>

      {/* Address Information */}
      <div className="border-b pb-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Address Information</h3>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Billing Address <span className="text-red-500">*</span></label>
            <textarea
              value={formData.billingAddress}
              onChange={(e) => setFormData({ ...formData, billingAddress: e.target.value })}
              className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${formErrors.billingAddress ? 'border-red-500' : ''}`}
              rows={3}
              required
            />
            {formErrors.billingAddress && <span className="text-sm text-red-500 mt-1">{formErrors.billingAddress}</span>}
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="sameAsBilling"
              checked={formData.sameAsBilling}
              onChange={(e) => setFormData({ ...formData, sameAsBilling: e.target.checked })}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="sameAsBilling" className="ml-2 text-sm text-gray-700">
              Shipping address is same as billing address
            </label>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Shipping Address <span className="text-red-500">*</span></label>
            <textarea
              value={formData.shippingAddress}
              onChange={(e) => setFormData({ ...formData, shippingAddress: e.target.value })}
              disabled={formData.sameAsBilling}
              className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${formData.sameAsBilling ? 'bg-gray-100' : ''} ${formErrors.shippingAddress ? 'border-red-500' : ''}`}
              rows={3}
              required
            />
            {formErrors.shippingAddress && <span className="text-sm text-red-500 mt-1">{formErrors.shippingAddress}</span>}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Dropdown
              label="Country"
              options={countries}
              value={formData.country}
              onChange={(e) => setFormData({ ...formData, country: e.target.value })}
            />
            <Dropdown
              label="State"
              options={indianStates}
              value={formData.state}
              onChange={(e) => setFormData({ ...formData, state: e.target.value })}
            />
          </div>
        </div>
      </div>

      {/* Bank Details */}
      <div className="border-b pb-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Bank Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Bank Name"
            value={formData.bankName}
            onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
            error={formErrors.bankName}
            required
          />
          <Input
            label="Account Holder Name"
            value={formData.bankAccountName}
            onChange={(e) => setFormData({ ...formData, bankAccountName: e.target.value })}
            error={formErrors.bankAccountName}
            required
          />
          <Input
            label="IFSC Code"
            value={formData.ifscCode}
            onChange={(e) => setFormData({ ...formData, ifscCode: e.target.value.toUpperCase() })}
            error={formErrors.ifscCode}
            maxLength={11}
            required
            placeholder="ABCD0123456"
          />
          <Input
            label="Account Number"
            value={formData.accountNumber}
            onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
            error={formErrors.accountNumber}
            required
          />
        </div>
      </div>

      {/* Contact Details */}
      <div className="border-b pb-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Contact Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="First Name"
            value={formData.contactFirstName}
            onChange={(e) => setFormData({ ...formData, contactFirstName: e.target.value })}
            error={formErrors.contactFirstName}
            required
          />
          <Input
            label="Last Name"
            value={formData.contactLastName}
            onChange={(e) => setFormData({ ...formData, contactLastName: e.target.value })}
            error={formErrors.contactLastName}
            required
          />
          <Input
            label="Designation"
            value={formData.contactDesignation}
            onChange={(e) => setFormData({ ...formData, contactDesignation: e.target.value })}
            error={formErrors.contactDesignation}
            required
            placeholder="e.g., Manager, Director"
          />
          <Input
            label="Phone Number"
            value={formData.contactPhone}
            onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
            error={formErrors.contactPhone}
            maxLength={10}
            required
            placeholder="10 digits"
          />
          <Input
            label="Email"
            type="email"
            value={formData.contactEmail}
            onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
            error={formErrors.contactEmail}
            required
          />
        </div>
      </div>

      {/* Optional Information */}
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Optional Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Company Website"
            value={formData.companyWebsite}
            onChange={(e) => setFormData({ ...formData, companyWebsite: e.target.value })}
            error={formErrors.companyWebsite}
            placeholder="https://example.com"
          />
        </div>
      </div>
    </div>
  )

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
          {renderForm()}
          <div className="flex gap-4 pt-6 mt-6 border-t">
            <Button onClick={handleSave} disabled={saving} icon={saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}>
              Update
            </Button>
            <Button onClick={() => navigate('/business-partner')} variant="outline">
              Cancel
            </Button>
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
        size="lg"
      >
        {renderForm()}
        <div className="flex gap-2 justify-end pt-4 mt-6 border-t">
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
