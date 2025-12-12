import { useState, useEffect } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { Plus, Upload, Download, FileSpreadsheet, Loader2 } from 'lucide-react'
import { toast } from 'react-toastify'
import Button from '../components/common/Button'
import Input from '../components/common/Input'
import Dropdown from '../components/common/Dropdown'
import Modal from '../components/common/Modal'
import Table from '../components/common/Table'
import Pagination from '../components/common/Pagination'
import { generateGRN } from '../utils/formatters'
import { materialService } from '../services/materialService.js'
import { stockAreaService } from '../services/stockAreaService.js'
import { inwardService } from '../services/inwardService.js'
import { fileService } from '../services/fileService.js'
import { purchaseOrderService } from '../services/purchaseOrderService.js'
import { businessPartnerService } from '../services/businessPartnerService.js'
import { API_BASE_URL } from '../utils/constants.js'

const AddInward = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const isEditMode = id && id !== 'new'
  const [loading, setLoading] = useState(false)
  const [fetchingData, setFetchingData] = useState(false)
  const [materials, setMaterials] = useState([])
  const [stockAreas, setStockAreas] = useState([{ value: '', label: 'Select Input Stock Area' }])
  const [partyNameOptions, setPartyNameOptions] = useState([{ value: '', label: 'Party Name' }])
  const [purchaseOrderOptions, setPurchaseOrderOptions] = useState([{ value: '', label: 'Select Purchase Order' }])
  const [materialsLoading, setMaterialsLoading] = useState(false)
  const [loadingParties, setLoadingParties] = useState(false)
  const [loadingPOs, setLoadingPOs] = useState(false)
  
  const [basicDetails, setBasicDetails] = useState({
    date: new Date().toISOString().split('T')[0],
    vehicleNumber: '',
    slipNumber: '',
    invoiceNumber: '',
    partyName: '',
    purchaseOrder: '',
    stockArea: '',
    remark: '',
  })

  const [inwardItems, setInwardItems] = useState([])
  const [uploadedFiles, setUploadedFiles] = useState([])
  const [isAddMaterialModalOpen, setIsAddMaterialModalOpen] = useState(false)
  const [isUploadExcelModalOpen, setIsUploadExcelModalOpen] = useState(false)
  const [uploadExcelTab, setUploadExcelTab] = useState('download')
  const [materialPage, setMaterialPage] = useState(1)
  const [documentPage, setDocumentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)

  const [materialForm, setMaterialForm] = useState({
    materialType: '',
    materialName: '',
    productCode: '',
    price: '',
    quantity: '',
    serialNo: '',
    macId: '',
    remarks: '',
  })

  const [excelForm, setExcelForm] = useState({
    materialType: '',
    price: '',
    quantity: '',
    serialNo: '',
    macId: '',
    remarks1: '',
    remarks2: '',
  })

  const [fileRemark, setFileRemark] = useState('')

  const formatDateDisplay = (dateString) => {
    if (!dateString) return '12/9/2025'
    const date = new Date(dateString)
    const day = date.getDate()
    const month = date.getMonth() + 1
    const year = date.getFullYear()
    return `${day}/${month}/${year}`
  }

  // Fetch materials and stock areas on mount and when location changes (navigation back to page)
  useEffect(() => {
    fetchMaterials()
    fetchStockAreas()
    fetchPartyNames()
    fetchPurchaseOrders()
    if (isEditMode) {
      fetchInward()
    }
  }, [id, location.pathname])

  // Check if we need to refresh when component becomes visible (after navigation back)
  useEffect(() => {
    // Check localStorage for recent creations
    const checkForUpdates = () => {
      const bpCreated = localStorage.getItem('businessPartnerCreated')
      const poCreated = localStorage.getItem('purchaseOrderCreated')
      
      if (bpCreated) {
        const timestamp = parseInt(bpCreated)
        // If created within last 10 seconds, refresh
        if (Date.now() - timestamp < 10000) {
          fetchPartyNames()
          localStorage.removeItem('businessPartnerCreated')
        }
      }
      
      if (poCreated) {
        const timestamp = parseInt(poCreated)
        // If created within last 10 seconds, refresh
        if (Date.now() - timestamp < 10000) {
          fetchPurchaseOrders()
          localStorage.removeItem('purchaseOrderCreated')
        }
      }
    }
    
    // Check immediately and also after a short delay
    checkForUpdates()
    const timeout = setTimeout(checkForUpdates, 1000)
    
    return () => clearTimeout(timeout)
  }, [location.pathname])

  // Refresh party names and purchase orders when page regains focus, visibility changes, or when BP/PO is created
  useEffect(() => {
    const handleFocus = () => {
      // Small delay to ensure data is saved
      setTimeout(() => {
        fetchPartyNames()
        fetchPurchaseOrders()
      }, 500)
    }
    
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // Page became visible, refresh data
        setTimeout(() => {
          fetchPartyNames()
          fetchPurchaseOrders()
        }, 500)
      }
    }
    
    const handleBusinessPartnerCreated = () => {
      setTimeout(() => {
        fetchPartyNames()
      }, 500)
    }
    
    const handlePurchaseOrderCreated = () => {
      setTimeout(() => {
        fetchPurchaseOrders()
      }, 500)
    }
    
    // Listen to storage events (when data is saved in another tab/window)
    const handleStorageChange = (e) => {
      if (e.key === 'businessPartnerCreated' || e.key === 'purchaseOrderCreated') {
        if (e.key === 'businessPartnerCreated') {
          fetchPartyNames()
        } else {
          fetchPurchaseOrders()
        }
        localStorage.removeItem(e.key)
      }
    }
    
    window.addEventListener('focus', handleFocus)
    window.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('businessPartnerCreated', handleBusinessPartnerCreated)
    window.addEventListener('purchaseOrderCreated', handlePurchaseOrderCreated)
    window.addEventListener('storage', handleStorageChange)
    
    return () => {
      window.removeEventListener('focus', handleFocus)
      window.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('businessPartnerCreated', handleBusinessPartnerCreated)
      window.removeEventListener('purchaseOrderCreated', handlePurchaseOrderCreated)
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [])

  const fetchMaterials = async () => {
    try {
      setMaterialsLoading(true)
      const response = await materialService.getAll({ limit: 1000 })
      if (response.success) {
        setMaterials(response.data.materials || [])
      } else {
        setMaterials([])
      }
    } catch (error) {
      console.error('Error fetching materials:', error)
      toast.error('Failed to load materials')
      setMaterials([])
    } finally {
      setMaterialsLoading(false)
    }
  }

  const fetchStockAreas = async () => {
    try {
      const response = await stockAreaService.getAll({ limit: 100 })
      if (response.success) {
        const options = [
          { value: '', label: 'Select Input Stock Area' },
          ...(response.data.stockAreas || []).map(area => ({
            value: area.area_id,
            label: area.area_name
          }))
        ]
        setStockAreas(options)
      } else {
        // Set default empty option if API fails
        setStockAreas([{ value: '', label: 'Select Input Stock Area' }])
      }
    } catch (error) {
      console.error('Error fetching stock areas:', error)
      toast.error('Failed to load stock areas')
      // Set default empty option on error
      setStockAreas([{ value: '', label: 'Select Input Stock Area' }])
    }
  }

  const fetchPartyNames = async () => {
    try {
      setLoadingParties(true)
      // First try to get from business partners
      try {
        const bpResponse = await businessPartnerService.getAll({ limit: 1000, partnerType: 'SUPPLIER' })
        if (bpResponse.success && (bpResponse.data?.businessPartners || bpResponse.data?.data)) {
          const bps = bpResponse.data?.businessPartners || bpResponse.data?.data || []
          const bpOptions = [
            { value: '', label: 'Party Name' },
            ...bps.map(bp => {
              const partnerName = bp.partner_name || bp.partnerName || bp.name || 'Partner'
              const partnerType = bp.partner_type || bp.partnerType || bp.type || ''
              const typeSuffix = partnerType ? ` (${partnerType})` : ''
              return {
                value: bp.partner_name,
                label: `${partnerName}${typeSuffix}`
              }
            })
          ]
          setPartyNameOptions(bpOptions)
          return
        }
      } catch (err) {
        console.error('Error fetching business partners:', err)
      }
      
      // Fallback: get from inward entries
      try {
        const response = await inwardService.getAll({ limit: 1000 })
        if (response.success && response.data?.inwards) {
          const uniqueParties = [...new Set(
            response.data.inwards
              .map(inward => inward.party_name)
              .filter(name => name && name.trim() !== '')
          )].sort()
          
          setPartyNameOptions([
            { value: '', label: 'Party Name' },
            ...uniqueParties.map(party => ({ value: party, label: party }))
          ])
        }
      } catch (err) {
        console.error('Error fetching parties from inward:', err)
      }
    } catch (error) {
      console.error('Error fetching party names:', error)
      // Don't show error toast, just keep default empty option
    } finally {
      setLoadingParties(false)
    }
  }

  const fetchPurchaseOrders = async () => {
    try {
      setLoadingPOs(true)
      // Fetch both SENT and RECEIVED status POs (RECEIVED means goods received but inward not created yet)
      const response = await purchaseOrderService.getAll({ limit: 1000, status: '' })
      if (response.success && (response.data?.purchaseOrders || response.data?.data)) {
        const pos = response.data?.purchaseOrders || response.data?.data || []
        // Filter to show SENT and RECEIVED status POs
        const filteredPOs = pos.filter(po => po.status === 'SENT' || po.status === 'RECEIVED')
        const poOptions = [
          { value: '', label: 'Select Purchase Order' },
          ...filteredPOs.map(po => {
            const vendorName = po.vendor?.partner_name || po.vendor_name || 'Vendor'
            const vendorType = po.vendor?.partner_type || po.vendor?.partnerType || po.vendor?.type || ''
            const typeSuffix = vendorType ? ` (${vendorType})` : ''
            return {
              value: po.po_id || po.id,
              label: `${po.po_number || (po.po_id || po.id)?.substring(0, 8)} - ${vendorName}${typeSuffix}`
            }
          })
        ]
        setPurchaseOrderOptions(poOptions)
      } else {
        // Fallback: get from inward entries
        try {
          const inwardResponse = await inwardService.getAll({ limit: 1000 })
          if (inwardResponse.success && inwardResponse.data?.inwards) {
            const uniquePOs = [...new Set(
              inwardResponse.data.inwards
                .map(inward => inward.purchase_order)
                .filter(po => po && po.trim() !== '')
            )].sort()
            
            setPurchaseOrderOptions([
              { value: '', label: 'Select Purchase Order' },
              ...uniquePOs.map(po => ({ value: po, label: po }))
            ])
          }
        } catch (err) {
          console.error('Error fetching POs from inward:', err)
        }
      }
    } catch (error) {
      console.error('Error fetching purchase orders:', error)
      // Don't show error toast, just keep default empty option
    } finally {
      setLoadingPOs(false)
    }
  }

  const handlePurchaseOrderChange = async (poId) => {
    if (!poId || poId === '') {
      // Clear PO-related data if PO is deselected
      setBasicDetails(prev => ({ ...prev, purchaseOrder: '' }))
      return
    }

    try {
      setLoading(true)
      // Fetch PO details
      const response = await purchaseOrderService.getById(poId)
      
      if (response.success) {
        const po = response.data?.purchaseOrder || response.data?.data
        
        if (po) {
          // Auto-populate party name from PO vendor
          if (po.vendor?.partner_name || po.vendor_name) {
            const vendorName = po.vendor?.partner_name || po.vendor_name
            setBasicDetails(prev => ({
              ...prev,
              purchaseOrder: poId,
              partyName: vendorName
            }))
            
            // Update party name options if vendor not in list
            setPartyNameOptions(prev => {
              const exists = prev.some(opt => opt.value === vendorName)
              if (!exists) {
                return [
                  ...prev,
                  { value: vendorName, label: vendorName }
                ]
              }
              return prev
            })
          } else {
            setBasicDetails(prev => ({ ...prev, purchaseOrder: poId }))
          }

          // Auto-populate items from PO
          if (po.items && Array.isArray(po.items) && po.items.length > 0) {
            const poItems = po.items.map((item, index) => {
              const material = item.material || {}
              return {
                id: `po-item-${index}-${Date.now()}`,
                materialId: item.material_id,
                materialName: material.material_name || '-',
                productCode: material.product_code || '-',
                properties: material.product_code || '-',
                serialNumber: null,
                macId: null,
                price: parseFloat(item.unit_price || item.price || 0),
                quantity: parseInt(item.quantity || 0),
                uom: material.uom || 'PIECE(S)',
                remarks: item.remarks || null,
              }
            })
            
            // Ask user if they want to replace existing items or add to them
            if (inwardItems.length > 0) {
              const shouldReplace = window.confirm(
                'Purchase Order has items. Do you want to replace existing items with PO items? (Click OK to replace, Cancel to keep existing items)'
              )
              if (shouldReplace) {
                setInwardItems(poItems)
                toast.success('Items loaded from Purchase Order')
              } else {
                // Add PO items to existing items
                setInwardItems([...inwardItems, ...poItems])
                toast.success('PO items added to existing items')
              }
            } else {
              // No existing items, just set PO items
              setInwardItems(poItems)
              toast.success('Items loaded from Purchase Order')
            }
          } else {
            toast.info('Purchase Order has no items')
          }
        }
      }
    } catch (error) {
      console.error('Error fetching purchase order:', error)
      toast.error('Failed to load Purchase Order details')
      // Still set the PO ID even if fetch fails
      setBasicDetails(prev => ({ ...prev, purchaseOrder: poId }))
    } finally {
      setLoading(false)
    }
  }

  const fetchInward = async () => {
    try {
      setFetchingData(true)
      const response = await inwardService.getById(id)
      if (response.success) {
        const inward = response.data?.inward || response.data?.data
        if (inward) {
          // Set basic details
          setBasicDetails({
            date: inward.date || new Date().toISOString().split('T')[0],
            vehicleNumber: inward.vehicle_number || '',
            slipNumber: inward.slip_number || '',
            invoiceNumber: inward.invoice_number || '',
            partyName: inward.party_name || '',
            purchaseOrder: inward.po_id || inward.purchase_order || '', // Use po_id if available, fallback to purchase_order
            stockArea: inward.stock_area_id || '',
            remark: inward.remark || '',
          })
          
          // Set inward items
          if (inward.items && Array.isArray(inward.items)) {
            const items = inward.items.map((item, index) => ({
              id: item.item_id || index,
              materialId: item.material_id,
              materialName: item.material?.material_name || '-',
              productCode: item.material?.product_code || '-',
              properties: item.material?.product_code || '-',
              serialNumber: item.serial_number || null,
              macId: item.mac_id || null,
              price: parseFloat(item.price) || 0,
              quantity: parseInt(item.quantity) || 0,
              uom: item.material?.uom || 'PIECE(S)',
              remarks: item.remarks || null,
            }))
            setInwardItems(items)
          }
          
          // Set uploaded files (if documents exist)
          if (inward.documents && Array.isArray(inward.documents)) {
            const files = inward.documents.map((doc, index) => {
              // Documents are stored as file paths/filenames
              const filename = typeof doc === 'string' ? doc : doc.filename || doc.path || doc.url || ''
              
              return {
                id: `existing-${index}`,
                filename: filename,
                remark: doc.remark || '-',
                isExisting: true,
              }
            })
            setUploadedFiles(files)
          }
        }
      }
    } catch (error) {
      console.error('Error fetching inward:', error)
      toast.error('Failed to load inward entry')
      navigate('/inward-list')
    } finally {
      setFetchingData(false)
    }
  }

  const materialTypeOptions = [
    { value: '', label: 'Select Material Type' },
    { value: 'COMPONENT', label: 'COMPONENT' },
    { value: 'RAW_MATERIAL', label: 'RAW MATERIAL' },
  ]

  // Material name options - computed from materials state
  const materialNameOptions = [
    { value: '', label: 'Select Material Name' },
    ...(materials || []).map(material => ({
      value: material.material_id,
      label: material.material_name
    }))
  ]


  const handleAddMaterial = () => {
    if (!materialForm.materialName || !materialForm.price || !materialForm.quantity) {
      toast.error('Please fill required fields')
      return
    }

    const selectedMaterial = materials.find(m => m.material_id === materialForm.materialName)
    if (!selectedMaterial) {
      toast.error('Please select a valid material')
      return
    }

    const newItem = {
      id: Date.now().toString(),
      materialId: selectedMaterial.material_id,
      materialName: selectedMaterial.material_name,
      productCode: selectedMaterial.product_code,
      properties: materialForm.productCode || selectedMaterial.product_code || '-',
      serialNumber: materialForm.serialNo || null,
      macId: materialForm.macId || null,
      price: parseFloat(materialForm.price),
      quantity: parseInt(materialForm.quantity),
      uom: selectedMaterial.uom || 'PIECE(S)',
      remarks: materialForm.remarks || null,
    }

    setInwardItems([...inwardItems, newItem])
    setMaterialForm({
      materialType: '',
      materialName: '',
      productCode: '',
      price: '',
      quantity: '',
      serialNo: '',
      macId: '',
      remarks: '',
    })
    setIsAddMaterialModalOpen(false)
    toast.success('Material added successfully')
  }

  const handleAddExcelItem = () => {
    if (!excelForm.materialType || !excelForm.price || !excelForm.quantity) {
      toast.error('Please fill required fields')
      return
    }

    const selectedMaterial = materials.find(m => m.material_id === excelForm.materialType)
    if (!selectedMaterial) {
      toast.error('Please select a valid material')
      return
    }

    const newItem = {
      id: Date.now().toString(),
      materialId: selectedMaterial.material_id,
      materialName: selectedMaterial.material_name,
      productCode: selectedMaterial.product_code,
      properties: '-',
      serialNumber: excelForm.serialNo || null,
      macId: excelForm.macId || null,
      price: parseFloat(excelForm.price),
      quantity: parseInt(excelForm.quantity),
      uom: selectedMaterial.uom || 'PIECE(S)',
      remarks: excelForm.remarks1 || excelForm.remarks2 || null,
    }

    setInwardItems([...inwardItems, newItem])
    setExcelForm({
      materialType: '',
      price: '',
      quantity: '',
      serialNo: '',
      macId: '',
      remarks1: '',
      remarks2: '',
    })
    toast.success('Item added successfully')
  }

  const handleSave = async (shouldExit = false) => {
    if (!basicDetails.invoiceNumber || !basicDetails.partyName || !basicDetails.stockArea) {
      toast.error('Please fill all required fields')
      return
    }
    if (inwardItems.length === 0) {
      toast.error('Please add at least one inward item')
      return
    }

    try {
      setLoading(true)
      
      // Prepare inward data
      const inwardData = {
        date: basicDetails.date,
        invoiceNumber: basicDetails.invoiceNumber,
        partyName: basicDetails.partyName,
        stockAreaId: basicDetails.stockArea,
        purchaseOrder: basicDetails.purchaseOrder || undefined,
        poId: basicDetails.purchaseOrder && basicDetails.purchaseOrder.length > 20 ? basicDetails.purchaseOrder : undefined, // UUID if it's a PO ID
        slipNumber: basicDetails.slipNumber || undefined,
        vehicleNumber: basicDetails.vehicleNumber || undefined,
        remark: basicDetails.remark || undefined,
        items: inwardItems.map(item => ({
          materialId: item.materialId,
          quantity: item.quantity,
          price: item.price,
          serialNumber: item.serialNumber || undefined,
          macId: item.macId || undefined,
          remarks: item.remarks || undefined,
        }))
      }

      // Prepare files
      const files = uploadedFiles
        .filter(file => file.file instanceof File)
        .map(file => file.file)

      let response
      if (isEditMode) {
        // For update, preserve existing documents
        // Note: New files should be uploaded separately using handleAddDocumentsToExisting
        // or they can be uploaded here before saving
        const existingFiles = uploadedFiles.filter(f => f.isExisting)
        const existingDocUrls = existingFiles.map(f => f.url || f.filename).filter(Boolean)
        
        // Check if there are new files to upload
        const newFiles = uploadedFiles.filter(f => !f.isExisting && f.file)
        if (newFiles.length > 0) {
          // Upload new files first
          try {
            const filesToUpload = newFiles.map(f => f.file)
            const uploadResponse = await fileService.addToInward(id, filesToUpload)
            if (uploadResponse.success) {
              // Refresh to get updated file list with new files
              await fetchInward()
              toast.success('New documents uploaded successfully')
            }
          } catch (error) {
            console.error('Error uploading new files:', error)
            toast.warning('Some files could not be uploaded, but entry will be saved')
          }
        }
        
        const updateData = {
          ...inwardData,
          documents: existingDocUrls.length > 0 ? existingDocUrls : undefined,
        }
        
        response = await inwardService.update(id, updateData)
      } else {
        response = await inwardService.create(inwardData, files)
      }

      if (response.success) {
        toast.success(`Inward entry ${isEditMode ? 'updated' : 'created'} successfully!`)
        if (shouldExit || isEditMode) {
          navigate('/inward-list')
        } else {
          // Reset form only in create mode
          setBasicDetails({
            date: new Date().toISOString().split('T')[0],
            vehicleNumber: '',
            slipNumber: '',
            invoiceNumber: '',
            partyName: '',
            purchaseOrder: '',
            stockArea: '',
            remark: '',
          })
          setInwardItems([])
          setUploadedFiles([])
        }
      } else {
        // Handle validation errors from backend
        if (response.errors && Array.isArray(response.errors)) {
          const errorMessages = response.errors.map(err => err.message || err.msg).join(', ')
          toast.error(errorMessages || response.message || 'Failed to save inward entry')
        } else {
          toast.error(response.message || 'Failed to save inward entry')
        }
      }
    } catch (error) {
      console.error('Error saving inward:', error)
      // Handle error response with validation errors
      if (error.errors && Array.isArray(error.errors)) {
        const errorMessages = error.errors.map(err => err.message || err.msg || err).join(', ')
        toast.error(errorMessages || error.message || 'Failed to save inward entry')
      } else if (error.message) {
        toast.error(error.message || 'Failed to save inward entry')
      } else {
        toast.error('Failed to save inward entry')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleSaveAndExit = () => {
    handleSave(true)
  }

  const handleDeleteItem = (id) => {
    setInwardItems(inwardItems.filter((item) => item.id !== id))
  }

  const handleAddFile = () => {
    const fileInput = document.getElementById('file-input')
    if (!fileInput || !fileInput.files || !fileInput.files[0]) {
      toast.error('Please select a file')
      return
    }
    const file = fileInput.files[0]
    setUploadedFiles([...uploadedFiles, { 
      id: Date.now().toString(), 
      file: file, // Store actual file object
      remark: fileRemark || '-' 
    }])
    setFileRemark('')
    fileInput.value = ''
    toast.success('File added successfully')
  }

  const handleDeleteFile = async (fileItem) => {
    // If it's an existing file (has filename), delete via API
    if (fileItem.isExisting && fileItem.filename) {
      try {
        const response = await fileService.delete(fileItem.filename)
        if (response.success) {
          toast.success('File deleted successfully')
          setUploadedFiles(uploadedFiles.filter((file) => file.id !== fileItem.id))
          // Refresh the inward entry to get updated file list
          if (isEditMode) {
            fetchInward()
          }
        }
      } catch (error) {
        console.error('Error deleting file:', error)
        if (error.message) {
          toast.error(error.message || 'Failed to delete file')
        } else {
          toast.error('Failed to delete file')
        }
      }
    } else {
      // If it's a new file (not yet uploaded), just remove from state
      setUploadedFiles(uploadedFiles.filter((file) => file.id !== fileItem.id))
    }
  }

  const handleAddDocumentsToExisting = async () => {
    if (!isEditMode || !id) {
      toast.error('Cannot add documents in create mode')
      return
    }

    const newFiles = uploadedFiles.filter(f => !f.isExisting && f.file)
    if (newFiles.length === 0) {
      toast.error('Please select files to upload')
      return
    }

    try {
      setLoading(true)
      const filesToUpload = newFiles.map(f => f.file)
      const response = await fileService.addToInward(id, filesToUpload)
      if (response.success) {
        toast.success('Documents added successfully')
        // Refresh to get updated file list
        fetchInward()
        // Clear new files from state
        setUploadedFiles(uploadedFiles.filter(f => f.isExisting))
      }
    } catch (error) {
      console.error('Error adding documents:', error)
      if (error.errors && Array.isArray(error.errors)) {
        const errorMessages = error.errors.map(err => err.message || err.msg || err).join(', ')
        toast.error(errorMessages || error.message || 'Failed to add documents')
      } else if (error.message) {
        toast.error(error.message || 'Failed to add documents')
      } else {
        toast.error('Failed to add documents')
      }
    } finally {
      setLoading(false)
    }
  }

  const totalAmount = inwardItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  )

  const paginatedItems = inwardItems.slice(
    (materialPage - 1) * itemsPerPage,
    materialPage * itemsPerPage
  )
  const materialTotalPages = Math.ceil(inwardItems.length / itemsPerPage)

  const paginatedFiles = uploadedFiles.slice(
    (documentPage - 1) * itemsPerPage,
    documentPage * itemsPerPage
  )
  const documentTotalPages = Math.ceil(uploadedFiles.length / itemsPerPage)

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Basic Details</h2>
        
        <div className="grid grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input
              type="text"
              value={formatDateDisplay(basicDetails.date)}
              readOnly
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
            />
          </div>
          <Input
            label="Vehicle Number"
            placeholder="Enter Vehicle Number"
            value={basicDetails.vehicleNumber}
            onChange={(e) => setBasicDetails({ ...basicDetails, vehicleNumber: e.target.value })}
          />
          <Input
            label="Slip Number"
            placeholder="Auto-generated if left blank"
            value={basicDetails.slipNumber}
            onChange={(e) => setBasicDetails({ ...basicDetails, slipNumber: e.target.value })}
          />
          <Input
            label="Invoice Number"
            required
            placeholder="Enter Invoice Number"
            value={basicDetails.invoiceNumber}
            onChange={(e) => setBasicDetails({ ...basicDetails, invoiceNumber: e.target.value })}
          />
          <Dropdown
            label="Party Name"
            required
            options={partyNameOptions}
            value={basicDetails.partyName}
            onChange={(e) => setBasicDetails({ ...basicDetails, partyName: e.target.value })}
            showAdd
            showRefresh
            disabled={loadingParties}
            loading={loadingParties}
            onAdd={() => {
              // Store current page location to refresh when returning
              sessionStorage.setItem('returnToInward', 'true')
              navigate('/business-partner/new')
            }}
            onRefresh={() => {
              fetchPartyNames()
              toast.success('Party names refreshed')
            }}
          />
          <Dropdown
            label="Purchase Order"
            options={purchaseOrderOptions}
            value={basicDetails.purchaseOrder}
            onChange={(e) => handlePurchaseOrderChange(e.target.value)}
            showAdd
            showRefresh
            disabled={loadingPOs || loading}
            loading={loadingPOs || loading}
            onAdd={() => {
              // Store current page location to refresh when returning
              sessionStorage.setItem('returnToInward', 'true')
              navigate('/purchase-order/new')
            }}
            onRefresh={() => {
              fetchPurchaseOrders()
              toast.success('Purchase orders refreshed')
            }}
          />
          <Dropdown
            label="Stock Area"
            required
            options={stockAreas}
            value={basicDetails.stockArea}
            onChange={(e) => setBasicDetails({ ...basicDetails, stockArea: e.target.value })}
          />
          <Input
            label="Remark"
            placeholder="Enter Remark"
            value={basicDetails.remark}
            onChange={(e) => setBasicDetails({ ...basicDetails, remark: e.target.value })}
          />
        </div>

        <div className="border-t border-gray-200 pt-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Inward Details</h2>
            <div className="flex gap-4">
              <Button
                variant="primary"
                onClick={() => setIsAddMaterialModalOpen(true)}
              >
                <Plus className="w-4 h-4 mr-2 inline" />
                Add
              </Button>
              <Button
                variant="success"
                onClick={() => setIsUploadExcelModalOpen(true)}
              >
                <FileSpreadsheet className="w-4 h-4 mr-2 inline" />
                Upload Excel
              </Button>
            </div>
          </div>

          <Table
            headers={['MATERIAL NAME', 'PROPERTIES', 'SERIAL NUMBER', 'MAC ID', 'PRICE (/PER QTY)', 'QUANTITY', 'UOM']}
          >
            {paginatedItems.length > 0 ? (
              paginatedItems.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.materialName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.properties || item.productCode || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.serialNumber || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.macId || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.price.toFixed(2)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.quantity}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.uom}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                  No items added yet. Click "Add" to add materials.
                </td>
              </tr>
            )}
          </Table>
          <Pagination
            currentPage={materialPage}
            totalPages={materialTotalPages || 1}
            itemsPerPage={itemsPerPage}
            totalItems={inwardItems.length}
            onPageChange={setMaterialPage}
            onItemsPerPageChange={setItemsPerPage}
          />
        </div>

        <div className="border-t border-gray-200 pt-6 mt-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Document Upload</h2>
          <div className="flex gap-4 mb-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">File</label>
              <div className="relative">
                <input
                  id="file-input"
                  type="file"
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                <Plus className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
              </div>
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Remark</label>
              <input
                type="text"
                placeholder="Enter Remark"
                value={fileRemark}
                onChange={(e) => setFileRemark(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-end gap-2">
              <Button variant="primary" onClick={handleAddFile}>
                <Plus className="w-4 h-4 mr-2 inline" />
                Add
              </Button>
              {isEditMode && uploadedFiles.some(f => !f.isExisting && f.file) && (
                <Button variant="secondary" onClick={handleAddDocumentsToExisting} disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 inline animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2 inline" />
                      Upload Documents
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>

          {uploadedFiles.length > 0 && (
            <>
              <Table headers={['FILE', 'REMARK', 'ACTION']}>
                {paginatedFiles.map((file) => (
                  <tr key={file.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {file.isExisting && file.filename ? (
                        <a 
                          href={fileService.downloadUrl(file.filename)} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-700 underline"
                        >
                          {file.filename || 'View Document'}
                        </a>
                      ) : file.file instanceof File ? (
                        file.file.name
                      ) : (
                        file.file || 'Unknown file'
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{file.remark}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => handleDeleteFile(file)}
                        className="text-red-600 hover:text-red-700"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </Table>
              <Pagination
                currentPage={documentPage}
                totalPages={documentTotalPages || 1}
                itemsPerPage={itemsPerPage}
                totalItems={uploadedFiles.length}
                onPageChange={setDocumentPage}
                onItemsPerPageChange={setItemsPerPage}
              />
            </>
          )}
        </div>

        <div className="border-t border-gray-200 pt-6 mt-6">
          <div className="max-w-md">
            <Input
              label="Total Inward Amount"
              value={totalAmount.toFixed(2)}
              readOnly
              className="bg-gray-50"
            />
          </div>
        </div>

        <div className="flex gap-3 justify-end mt-6 pt-6 border-t border-gray-200">
          <Button variant="gray" onClick={() => navigate('/inward-list')} disabled={loading}>
            Cancel
          </Button>
          <Button variant="primary" onClick={() => handleSave(false)} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 inline animate-spin" />
                Saving...
              </>
            ) : (
              'Save'
            )}
          </Button>
          <Button variant="success" onClick={handleSaveAndExit} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 inline animate-spin" />
                Saving...
              </>
            ) : (
              'Save & Exit'
            )}
          </Button>
        </div>
      </div>

      {/* Add Material Modal */}
      <Modal
        isOpen={isAddMaterialModalOpen}
        onClose={() => setIsAddMaterialModalOpen(false)}
        title="Add Material"
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Dropdown
              label="Material Type"
              options={materialTypeOptions}
              value={materialForm.materialType}
              onChange={(e) => setMaterialForm({ ...materialForm, materialType: e.target.value })}
            />
            <Dropdown
              label="Material Name"
              required
              options={materialNameOptions}
              value={materialForm.materialName}
              onChange={(e) => {
                const selectedMaterial = materials.find(m => m.material_id === e.target.value)
                setMaterialForm({ 
                  ...materialForm, 
                  materialName: e.target.value,
                  productCode: selectedMaterial?.product_code || ''
                })
              }}
              showAdd
              showRefresh
              onAdd={() => toast.info('Material creation feature coming soon')}
              onRefresh={() => {
                fetchMaterials()
                toast.success('Materials refreshed')
              }}
              disabled={materialsLoading}
            />
            <Input
              label="Product Code"
              value={materialForm.productCode}
              onChange={(e) => setMaterialForm({ ...materialForm, productCode: e.target.value })}
            />
            <Input
              label="Price per qty"
              required
              type="number"
              value={materialForm.price}
              onChange={(e) => setMaterialForm({ ...materialForm, price: e.target.value })}
            />
            <Input
              label="Quantity"
              required
              type="number"
              value={materialForm.quantity}
              onChange={(e) => setMaterialForm({ ...materialForm, quantity: e.target.value })}
            />
            <Input
              label="Serial No."
              value={materialForm.serialNo}
              onChange={(e) => setMaterialForm({ ...materialForm, serialNo: e.target.value })}
            />
            <Input
              label="MAC ID"
              value={materialForm.macId}
              onChange={(e) => setMaterialForm({ ...materialForm, macId: e.target.value })}
            />
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Remarks
              </label>
              <textarea
                value={materialForm.remarks}
                onChange={(e) => setMaterialForm({ ...materialForm, remarks: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
              />
            </div>
          </div>
          <div className="flex gap-3 justify-end pt-4 border-t border-gray-200 mt-4">
            <Button variant="gray" onClick={() => {
              setMaterialForm({
                materialType: '',
                materialName: '',
                productCode: '',
                price: '',
                quantity: '',
                serialNo: '',
                macId: '',
                remarks: '',
              })
            }}>
              Reset
            </Button>
            <Button variant="primary" onClick={handleAddMaterial}>
              Add Material
            </Button>
          </div>
        </div>
      </Modal>

      {/* Upload Excel Modal */}
      <Modal
        isOpen={isUploadExcelModalOpen}
        onClose={() => setIsUploadExcelModalOpen(false)}
        title=""
        size="xl"
      >
        <div className="space-y-4">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setUploadExcelTab('download')}
              className={`px-6 py-3 font-medium text-sm ${
                uploadExcelTab === 'download'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Download Excel
            </button>
            <button
              onClick={() => setUploadExcelTab('upload')}
              className={`px-6 py-3 font-medium text-sm ${
                uploadExcelTab === 'upload'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Upload Excel
            </button>
          </div>

          {uploadExcelTab === 'download' ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Dropdown
                  label="Material Type"
                  options={materialTypeOptions}
                  value={excelForm.materialType}
                  onChange={(e) => setExcelForm({ ...excelForm, materialType: e.target.value })}
                />
                <Input
                  label="Price per qty"
                  required
                  type="number"
                  value={excelForm.price}
                  onChange={(e) => setExcelForm({ ...excelForm, price: e.target.value })}
                />
                <Input
                  label="Quantity"
                  required
                  type="number"
                  value={excelForm.quantity}
                  onChange={(e) => setExcelForm({ ...excelForm, quantity: e.target.value })}
                />
                <Input
                  label="Serial No."
                  value={excelForm.serialNo}
                  onChange={(e) => setExcelForm({ ...excelForm, serialNo: e.target.value })}
                />
                <Input
                  label="MAC ID"
                  value={excelForm.macId}
                  onChange={(e) => setExcelForm({ ...excelForm, macId: e.target.value })}
                />
                <Input
                  label="Remarks"
                  value={excelForm.remarks1}
                  onChange={(e) => setExcelForm({ ...excelForm, remarks1: e.target.value })}
                />
                <Input
                  label="Remarks"
                  value={excelForm.remarks2}
                  onChange={(e) => setExcelForm({ ...excelForm, remarks2: e.target.value })}
                />
              </div>
              <div className="flex gap-3 justify-end">
                <Button variant="primary" onClick={handleAddExcelItem}>
                  Add Item
                </Button>
              </div>

              {inwardItems.length > 0 && (
                <div className="mt-4">
                  <Table headers={['MATERIAL TYPE', 'PRICE', 'QUANTITY', 'SERIAL NO.', 'MAC ID', 'REMARKS']}>
                    {inwardItems.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.materialName}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.price.toFixed(2)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.quantity}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.serialNumber}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.macId}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">-</td>
                      </tr>
                    ))}
                  </Table>
                </div>
              )}

              <div className="flex gap-3 justify-end pt-4 border-t border-gray-200 mt-4">
                <Button variant="secondary">
                  <Download className="w-4 h-4 mr-2 inline" />
                  Sample File
                </Button>
                <Button variant="gray" onClick={() => setIsUploadExcelModalOpen(false)}>
                  Close
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">Choose file to upload</p>
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
              </div>
              <div className="flex gap-3 justify-end pt-4 border-t border-gray-200 mt-4">
                <Button variant="primary">
                  Upload
                </Button>
                <Button variant="gray" onClick={() => setIsUploadExcelModalOpen(false)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  )
}

export default AddInward
