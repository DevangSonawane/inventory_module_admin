import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Plus, Trash2, Loader2, ArrowLeft, Upload, X, FileText, Send, Edit2 } from 'lucide-react'
import { toast } from 'react-toastify'
import Button from '../components/common/Button'
import Input from '../components/common/Input'
import Dropdown from '../components/common/Dropdown'
import Modal from '../components/common/Modal'
import Table from '../components/common/Table'
import { purchaseOrderService } from '../services/purchaseOrderService.js'
import { purchaseRequestService } from '../services/purchaseRequestService.js'
import { businessPartnerService } from '../services/businessPartnerService.js'
import { materialService } from '../services/materialService.js'
import { fileService } from '../services/fileService.js'
import { API_BASE_URL } from '../utils/constants.js'

const PurchaseOrderDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEditMode = id && id !== 'new'
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [materials, setMaterials] = useState([])
  const [vendors, setVendors] = useState([])
  const [purchaseRequests, setPurchaseRequests] = useState([])
  const [selectedPR, setSelectedPR] = useState(null)
  const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false)
  const [isEditItemModalOpen, setIsEditItemModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [uploadedFiles, setUploadedFiles] = useState([])
  const [existingDocuments, setExistingDocuments] = useState([])

  const [formData, setFormData] = useState({
    poNumber: '',
    poDate: new Date().toISOString().split('T')[0],
    vendorId: '',
    prId: '',
    remarks: '',
  })

  const [orderItems, setOrderItems] = useState([])
  
  const [itemForm, setItemForm] = useState({
    materialId: '',
    quantity: '',
    unitPrice: '',
    gstPercentage: '',
    sgstPercentage: '',
    uom: '',
    remarks: '',
  })

  const getOrgId = () => {
    const storedUser = localStorage.getItem('user')
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser)
        return (
          parsed?.org_id ||
          parsed?.orgId ||
          parsed?.organization_id ||
          parsed?.organizationId ||
          null
        )
      } catch (error) {
        console.error('Failed to parse user for orgId', error)
      }
    }
    return localStorage.getItem('orgId') || null
  }

  useEffect(() => {
    fetchMaterials()
    fetchVendors()
    fetchPurchaseRequests()
    if (isEditMode) {
      fetchPurchaseOrder()
    }
  }, [id])

  const fetchMaterials = async () => {
    try {
      const response = await materialService.getAll({ limit: 1000 })
      if (response.success) {
        setMaterials(response.data?.materials || response.data?.data || [])
      }
    } catch (error) {
      console.error('Error fetching materials:', error)
      setMaterials([])
    }
  }

  const fetchVendors = async () => {
    try {
      const response = await businessPartnerService.getAll({ partnerType: 'SUPPLIER', limit: 1000 })
      if (response.success) {
        setVendors(response.data?.businessPartners || response.data?.data || [])
      }
    } catch (error) {
      console.error('Error fetching vendors:', error)
      setVendors([])
    }
  }

  const fetchPurchaseRequests = async () => {
    try {
      setLoading(true)
      let allPRs = []
      let currentPage = 1
      let hasMore = true
      const pageSize = 1000 // Fetch in batches of 1000
      
      // Fetch ALL PRs (no status filter) with pagination to get all records
      // This ensures all PRs from the PR list are available in the dropdown
      while (hasMore) {
        const response = await purchaseRequestService.getAll({ 
          limit: pageSize,
          page: currentPage,
          // Don't filter by status - show all PRs like in the PR list
          // Users can select any PR regardless of status
        })
        
        if (response.success) {
          const prs = response.data?.purchaseRequests || response.data?.data || []
          allPRs = [...allPRs, ...prs]
          
          // Check if there are more pages
          const pagination = response.data?.pagination || {}
          const totalPages = pagination.totalPages || 1
          hasMore = currentPage < totalPages && prs.length === pageSize
          currentPage++
        } else {
          hasMore = false
        }
      }
      
      // Sort by created_at descending (latest first) to show newest PRs first
      const sortedPRs = allPRs.sort((a, b) => {
        const dateA = new Date(a.created_at || a.requested_date || 0)
        const dateB = new Date(b.created_at || b.requested_date || 0)
        return dateB - dateA // Descending order (newest first)
      })
      
      setPurchaseRequests(sortedPRs)
      console.log(`✅ Fetched ${sortedPRs.length} purchase requests for dropdown`)
    } catch (error) {
      console.error('Error fetching purchase requests:', error)
      toast.error('Failed to load purchase requests')
      setPurchaseRequests([])
    } finally {
      setLoading(false)
    }
  }

  const handlePRSelection = async (prId) => {
    if (!prId) {
      setSelectedPR(null)
      setFormData(prev => ({ ...prev, prId: '', poNumber: '' }))
      setOrderItems([])
      return
    }

    try {
      setLoading(true)
      const response = await purchaseRequestService.getById(prId)
      if (response.success) {
        const pr = response.data?.purchaseRequest || response.data?.data
        if (pr) {
          setSelectedPR(pr)
          
          // Generate PO number based on PR number
          const prNumber = pr.pr_number || ''
          const poNumber = prNumber ? `PO-${prNumber.replace('PR-', '')}` : ''
          
          // Fetch PR items and populate order items with calculations
          const items = (pr.items || []).map((item, index) => {
            const quantity = item.requested_quantity || 1
            const material = item.material
            const unitPrice = material?.price ? parseFloat(material.price) : 0
            const gstPercentage = material?.gst_percentage ? parseFloat(material.gst_percentage) : 0
            const sgstPercentage = material?.sgst_percentage ? parseFloat(material.sgst_percentage) : 0
            
            const subtotal = quantity * unitPrice
            const gstAmount = subtotal * (gstPercentage / 100)
            const sgstAmount = subtotal * (sgstPercentage / 100)
            const itemTotal = subtotal + gstAmount + sgstAmount

            return {
              id: Date.now() + index,
              materialId: item.material_id,
              itemName: material?.material_name || item.pr_name || '-',
              productCode: material?.product_code || '-',
              quantity: quantity,
              unitPrice: unitPrice,
              gstPercentage: gstPercentage,
              sgstPercentage: sgstPercentage,
              subtotal: subtotal,
              gstAmount: gstAmount,
              sgstAmount: sgstAmount,
              itemTotal: itemTotal,
              uom: material?.uom || 'PIECE(S)',
              remarks: item.remarks || '',
              prName: item.pr_name || '',
              materialType: item.material_type || '',
              businessPartnerId: item.business_partner_id || '',
              shippingAddress: item.shipping_address || '',
              description: item.description || '',
            }
          })

          setOrderItems(items)
          
          // Set vendor from first item's business partner if available
          const firstItem = items[0]
          if (firstItem?.businessPartnerId) {
            const vendor = vendors.find(v => v.partner_id === firstItem.businessPartnerId)
            if (vendor) {
              setFormData(prev => ({
                ...prev,
                prId: prId,
                poNumber: poNumber,
                vendorId: vendor.partner_id,
              }))
            } else {
              setFormData(prev => ({
                ...prev,
                prId: prId,
                poNumber: poNumber,
              }))
            }
          } else {
            setFormData(prev => ({
              ...prev,
              prId: prId,
              poNumber: poNumber,
            }))
          }
        }
      }
    } catch (error) {
      console.error('Error fetching PR details:', error)
      toast.error('Failed to load PR details')
    } finally {
      setLoading(false)
    }
  }

  const fetchPurchaseOrder = async () => {
    try {
      setLoading(true)
      const response = await purchaseOrderService.getById(id)
      if (response.success) {
        const po = response.data?.purchaseOrder || response.data?.data
        if (po) {
          setFormData({
            poNumber: po.po_number || '',
            poDate: po.po_date ? po.po_date.split('T')[0] : new Date().toISOString().split('T')[0],
            vendorId: po.vendor_id || '',
            prId: po.pr_id || '',
            remarks: po.remarks || '',
          })
          
          // Set existing documents (handle both array and string formats)
          if (po.documents) {
            if (Array.isArray(po.documents)) {
              setExistingDocuments(po.documents)
            } else if (typeof po.documents === 'string') {
              // If documents is a JSON string, parse it
              try {
                const parsed = JSON.parse(po.documents)
                setExistingDocuments(Array.isArray(parsed) ? parsed : [])
              } catch {
                // If not JSON, treat as single document path
                setExistingDocuments([po.documents])
              }
            } else {
              setExistingDocuments([])
            }
          } else {
            setExistingDocuments([])
          }
          
          // Load items from PO (don't load PR if items already exist)
          if (po.items && Array.isArray(po.items) && po.items.length > 0) {
            setOrderItems(po.items.map((item, index) => {
              const quantity = item.quantity || 1
              const material = item.material
              const unitPrice = item.unit_price ? parseFloat(item.unit_price) : (material?.price ? parseFloat(material.price) : 0)
              const gstPercentage = material?.gst_percentage ? parseFloat(material.gst_percentage) : 0
              const sgstPercentage = material?.sgst_percentage ? parseFloat(material.sgst_percentage) : 0
              
              const subtotal = quantity * unitPrice
              const gstAmount = subtotal * (gstPercentage / 100)
              const sgstAmount = subtotal * (sgstPercentage / 100)
              const itemTotal = subtotal + gstAmount + sgstAmount

              return {
                id: item.item_id || index,
                materialId: item.material_id,
                itemName: material?.material_name || '-',
                productCode: material?.product_code || '-',
                quantity: quantity,
                unitPrice: unitPrice,
                gstPercentage: gstPercentage,
                sgstPercentage: sgstPercentage,
                subtotal: subtotal,
                gstAmount: gstAmount,
                sgstAmount: sgstAmount,
                itemTotal: itemTotal,
                uom: material?.uom || 'PIECE(S)',
                remarks: item.remarks || '',
              }
            }))
          } else if (po.pr_id) {
            // Only load PR if no items exist
            await handlePRSelection(po.pr_id)
          }
        }
      }
    } catch (error) {
      console.error('Error fetching purchase order:', error)
      toast.error('Failed to load purchase order')
    } finally {
      setLoading(false)
    }
  }

  const materialOptions = [
    { value: '', label: 'Select Material' },
    ...materials.map(material => ({
      value: material.material_id,
      label: `${material.material_name} (${material.product_code})`
    }))
  ]

  const vendorOptions = [
    { value: '', label: 'Select Vendor' },
    ...vendors.map(vendor => {
      const vendorName = vendor.partner_name || vendor.partnerName || vendor.name || 'Vendor'
      const vendorType = vendor.partner_type || vendor.partnerType || vendor.type || ''
      const typeSuffix = vendorType ? ` (${vendorType})` : ''
      return {
        value: vendor.partner_id,
        label: `${vendorName}${typeSuffix}`
      }
    })
  ]

  const handleMaterialChange = (materialId) => {
    const selectedMaterial = materials.find(m => m.material_id === materialId)
    if (selectedMaterial) {
      setItemForm({
        ...itemForm,
        materialId: materialId,
        unitPrice: selectedMaterial.price ? parseFloat(selectedMaterial.price).toFixed(2) : '',
        gstPercentage: selectedMaterial.gst_percentage ? parseFloat(selectedMaterial.gst_percentage).toFixed(2) : '',
        sgstPercentage: selectedMaterial.sgst_percentage ? parseFloat(selectedMaterial.sgst_percentage).toFixed(2) : '',
        uom: selectedMaterial.uom || 'PIECE(S)',
      })
    } else {
      setItemForm({
        ...itemForm,
        materialId: materialId,
        unitPrice: '',
        gstPercentage: '',
        sgstPercentage: '',
        uom: '',
      })
    }
  }

  const prOptions = [
    { value: '', label: 'Select Purchase Request' },
    ...purchaseRequests.map(pr => {
      // Use created_at for date display (always present) as fallback to requested_date
      const displayDate = pr.created_at 
        ? new Date(pr.created_at).toLocaleDateString() 
        : (pr.requested_date ? new Date(pr.requested_date).toLocaleDateString() : '')
      const prNumber = pr.pr_number || `PR-${(pr.pr_id || pr.id)?.substring(0, 8)}`
      const status = pr.status || 'DRAFT'
      // Show status in label to help users identify approved PRs
      const statusLabel = status !== 'APPROVED' ? ` [${status}]` : ''
      return {
        value: pr.pr_id || pr.id,
        label: `${prNumber} - ${displayDate}${statusLabel}`
      }
    })
  ]

  const handleAddItem = () => {
    if (!itemForm.materialId || !itemForm.quantity) {
      toast.error('Please fill all required fields')
      return
    }

    const selectedMaterial = materials.find(m => m.material_id === itemForm.materialId)
    if (!selectedMaterial) {
      toast.error('Please select a valid material')
      return
    }

    // Calculate prices and taxes
    const quantity = parseInt(itemForm.quantity)
    const unitPrice = itemForm.unitPrice ? parseFloat(itemForm.unitPrice) : (selectedMaterial.price ? parseFloat(selectedMaterial.price) : 0)
    const gstPercentage = itemForm.gstPercentage ? parseFloat(itemForm.gstPercentage) : (selectedMaterial.gst_percentage ? parseFloat(selectedMaterial.gst_percentage) : 0)
    const sgstPercentage = itemForm.sgstPercentage ? parseFloat(itemForm.sgstPercentage) : (selectedMaterial.sgst_percentage ? parseFloat(selectedMaterial.sgst_percentage) : 0)
    
    const subtotal = quantity * unitPrice
    const gstAmount = subtotal * (gstPercentage / 100)
    const sgstAmount = subtotal * (sgstPercentage / 100)
    const itemTotal = subtotal + gstAmount + sgstAmount

    const newItem = {
      id: Date.now(),
      materialId: selectedMaterial.material_id,
      itemName: selectedMaterial.material_name,
      productCode: selectedMaterial.product_code || '-',
      quantity: quantity,
      unitPrice: unitPrice,
      gstPercentage: gstPercentage,
      sgstPercentage: sgstPercentage,
      subtotal: subtotal,
      gstAmount: gstAmount,
      sgstAmount: sgstAmount,
      itemTotal: itemTotal,
      uom: itemForm.uom || selectedMaterial.uom || 'PIECE(S)',
      remarks: itemForm.remarks || '',
    }
    
    setOrderItems([...orderItems, newItem])
    setItemForm({
      materialId: '',
      quantity: '',
      unitPrice: '',
      gstPercentage: '',
      sgstPercentage: '',
      uom: '',
      remarks: '',
    })
    setIsAddItemModalOpen(false)
    toast.success('Item added successfully')
  }

  const handleEditItem = (item) => {
    setEditingItem(item)
    setItemForm({
      materialId: item.materialId,
      quantity: item.quantity.toString(),
      unitPrice: (item.unitPrice || 0).toString(),
      gstPercentage: (item.gstPercentage || 0).toString(),
      sgstPercentage: (item.sgstPercentage || 0).toString(),
      uom: item.uom || '',
      remarks: item.remarks || '',
    })
    setIsEditItemModalOpen(true)
  }

  const handleUpdateItem = () => {
    if (!itemForm.materialId || !itemForm.quantity) {
      toast.error('Please fill all required fields')
      return
    }

    const selectedMaterial = materials.find(m => m.material_id === itemForm.materialId)
    if (!selectedMaterial) {
      toast.error('Please select a valid material')
      return
    }

    // Calculate prices and taxes
    const quantity = parseInt(itemForm.quantity)
    const unitPrice = itemForm.unitPrice ? parseFloat(itemForm.unitPrice) : (selectedMaterial.price ? parseFloat(selectedMaterial.price) : 0)
    const gstPercentage = itemForm.gstPercentage ? parseFloat(itemForm.gstPercentage) : (selectedMaterial.gst_percentage ? parseFloat(selectedMaterial.gst_percentage) : 0)
    const sgstPercentage = itemForm.sgstPercentage ? parseFloat(itemForm.sgstPercentage) : (selectedMaterial.sgst_percentage ? parseFloat(selectedMaterial.sgst_percentage) : 0)
    
    const subtotal = quantity * unitPrice
    const gstAmount = subtotal * (gstPercentage / 100)
    const sgstAmount = subtotal * (sgstPercentage / 100)
    const itemTotal = subtotal + gstAmount + sgstAmount

    const updatedItems = orderItems.map(item => 
      item.id === editingItem.id
        ? {
            ...item,
            materialId: selectedMaterial.material_id,
            itemName: selectedMaterial.material_name,
            productCode: selectedMaterial.product_code || '-',
            quantity: quantity,
            unitPrice: unitPrice,
            gstPercentage: gstPercentage,
            sgstPercentage: sgstPercentage,
            subtotal: subtotal,
            gstAmount: gstAmount,
            sgstAmount: sgstAmount,
            itemTotal: itemTotal,
            uom: itemForm.uom || selectedMaterial.uom || 'PIECE(S)',
            remarks: itemForm.remarks || '',
          }
        : item
    )
    
    setOrderItems(updatedItems)
    setItemForm({
      materialId: '',
      quantity: '',
      unitPrice: '',
      gstPercentage: '',
      sgstPercentage: '',
      uom: '',
      remarks: '',
    })
    setEditingItem(null)
    setIsEditItemModalOpen(false)
    toast.success('Item updated successfully')
  }

  const handleDeleteItem = (itemId) => {
    setOrderItems(orderItems.filter((item) => item.id !== itemId))
    toast.success('Item removed')
  }

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files)
    setUploadedFiles([...uploadedFiles, ...files])
  }

  const handleRemoveFile = (index) => {
    setUploadedFiles(uploadedFiles.filter((_, i) => i !== index))
  }

  const handleRemoveExistingDocument = async (filename) => {
    try {
      // Extract just the filename from the full path if needed
      const docFilename = filename.includes('/') ? filename.split('/').pop() : filename
      const response = await fileService.delete(docFilename)
      if (response.success) {
        setExistingDocuments(existingDocuments.filter(doc => {
          const docName = doc.includes('/') ? doc.split('/').pop() : doc
          return docName !== docFilename
        }))
        toast.success('Document removed successfully')
        // Refresh to get updated file list
        if (isEditMode) {
          await fetchPurchaseOrder()
        }
      } else {
        toast.error(response.message || 'Failed to remove document')
      }
    } catch (error) {
      console.error('Error removing document:', error)
      if (error.message) {
        toast.error(error.message || 'Failed to remove document')
      } else {
        toast.error('Failed to remove document')
      }
    }
  }

  const handleSave = async () => {
    if (!formData.vendorId) {
      toast.error('Please select a vendor')
      return
    }
    if (orderItems.length === 0) {
      toast.error('Please add at least one item')
      return
    }

    try {
      setLoading(true)
      
      const orderData = {
        poNumber: formData.poNumber || undefined,
        poDate: formData.poDate,
        vendorId: formData.vendorId,
        prId: formData.prId || undefined,
        remarks: formData.remarks || undefined,
        orgId: getOrgId() || undefined,
        items: orderItems.map(item => ({
          materialId: item.materialId,
          quantity: item.quantity,
          unitPrice: item.unitPrice || undefined,
          remarks: item.remarks || undefined,
        })),
      }

      let response
      if (isEditMode) {
        response = await purchaseOrderService.update(id, orderData)
      } else if (formData.prId) {
        response = await purchaseOrderService.createFromPR(formData.prId, orderData)
      } else {
        response = await purchaseOrderService.create(orderData)
      }

      if (response.success) {
        const poId = response.data?.purchaseOrder?.po_id || response.data?.data?.po_id || id
        
        // Upload documents if any (works for both create and edit mode)
        if (uploadedFiles.length > 0 && poId) {
          try {
            await fileService.addToPurchaseOrder(poId, uploadedFiles)
            setUploadedFiles([])
            toast.success('Documents uploaded successfully')
          } catch (error) {
            console.error('Error uploading documents:', error)
            toast.warning('PO saved but documents upload failed. You can add documents later.')
          }
        }

        toast.success(`Purchase order ${isEditMode ? 'updated' : 'created'} successfully!`)
        
        if (!isEditMode) {
          window.dispatchEvent(new CustomEvent('purchaseOrderCreated'))
          localStorage.setItem('purchaseOrderCreated', Date.now().toString())
          navigate(`/purchase-order/${poId}`)
        } else {
          // Reload to get updated data including new documents
          await fetchPurchaseOrder()
        }
      } else {
        // Handle validation errors from backend
        if (response.errors && Array.isArray(response.errors)) {
          const errorMessages = response.errors.map(err => err.message || err.msg).join(', ')
          toast.error(errorMessages || response.message || `Failed to ${isEditMode ? 'update' : 'create'} purchase order`)
        } else {
          toast.error(response.message || `Failed to ${isEditMode ? 'update' : 'create'} purchase order`)
        }
      }
    } catch (error) {
      console.error('Error saving purchase order:', error)
      // Handle error response with validation errors
      if (error.errors && Array.isArray(error.errors)) {
        const errorMessages = error.errors.map(err => err.message || err.msg || err).join(', ')
        toast.error(errorMessages || error.message || `Failed to ${isEditMode ? 'update' : 'create'} purchase order`)
      } else if (error.message) {
        toast.error(error.message || `Failed to ${isEditMode ? 'update' : 'create'} purchase order`)
      } else {
        toast.error(`Failed to ${isEditMode ? 'update' : 'create'} purchase order`)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async () => {
    if (!formData.vendorId) {
      toast.error('Please select a vendor')
      return
    }
    if (orderItems.length === 0) {
      toast.error('Please add at least one item')
      return
    }

    try {
      setSubmitting(true)
      let poId = id

      // First save the PO if it's new
      if (!isEditMode || !poId) {
        // Save the PO first
        const orderData = {
          poNumber: formData.poNumber || undefined,
          poDate: formData.poDate,
          vendorId: formData.vendorId,
          prId: formData.prId || undefined,
          remarks: formData.remarks || undefined,
          orgId: getOrgId() || undefined,
          items: orderItems.map(item => ({
            materialId: item.materialId,
            quantity: item.quantity,
            unitPrice: item.unitPrice || undefined,
            remarks: item.remarks || undefined,
          })),
        }

        let createResponse
        if (formData.prId) {
          createResponse = await purchaseOrderService.createFromPR(formData.prId, orderData)
        } else {
          createResponse = await purchaseOrderService.create(orderData)
        }

        if (!createResponse.success) {
          // Handle validation errors from backend
          if (createResponse.errors && Array.isArray(createResponse.errors)) {
            const errorMessages = createResponse.errors.map(err => err.message || err.msg).join(', ')
            toast.error(errorMessages || createResponse.message || 'Failed to save purchase order')
          } else {
            toast.error(createResponse.message || 'Failed to save purchase order')
          }
          setSubmitting(false)
          return
        }

        poId = createResponse.data?.purchaseOrder?.po_id || createResponse.data?.data?.po_id

        // Upload documents if any
        if (uploadedFiles.length > 0 && poId) {
          try {
            await fileService.addToPurchaseOrder(poId, uploadedFiles)
            setUploadedFiles([])
          } catch (error) {
            console.error('Error uploading documents:', error)
            toast.warning('PO saved but documents upload failed')
          }
        }
      }

      if (!poId) {
        toast.error('Failed to get purchase order ID')
        return
      }

      // Submit PO (this will send email to business partner)
      // Note: Documents are already uploaded via addToPurchaseOrder, so we don't need to pass them
      const response = await purchaseOrderService.submit(poId, {})

      if (response.success) {
        toast.success('Purchase order submitted and sent to vendor successfully!')
        navigate('/purchase-order')
      } else {
        // Handle validation errors from backend
        if (response.errors && Array.isArray(response.errors)) {
          const errorMessages = response.errors.map(err => err.message || err.msg).join(', ')
          toast.error(errorMessages || response.message || 'Failed to submit purchase order')
        } else {
          toast.error(response.message || 'Failed to submit purchase order')
        }
      }
    } catch (error) {
      console.error('Error submitting purchase order:', error)
      // Handle error response with validation errors
      if (error.errors && Array.isArray(error.errors)) {
        const errorMessages = error.errors.map(err => err.message || err.msg || err).join(', ')
        toast.error(errorMessages || error.message || 'Failed to submit purchase order')
      } else if (error.message) {
        toast.error(error.message || 'Failed to submit purchase order')
      } else {
        toast.error('Failed to submit purchase order')
      }
    } finally {
      setSubmitting(false)
    }
  }

  const handleSendInvoice = async () => {
    if (!formData.vendorId) {
      toast.error('Please select a vendor')
      return
    }
    if (orderItems.length === 0) {
      toast.error('Please add at least one item')
      return
    }

    try {
      setSubmitting(true)
      let poId = id

      // First save the PO if it's new
      if (!isEditMode || !poId) {
        const orderData = {
          poNumber: formData.poNumber || undefined,
          poDate: formData.poDate,
          vendorId: formData.vendorId,
          prId: formData.prId || undefined,
          remarks: formData.remarks || undefined,
          orgId: getOrgId() || undefined,
          items: orderItems.map(item => ({
            materialId: item.materialId,
            quantity: item.quantity,
            unitPrice: item.unitPrice || undefined,
            remarks: item.remarks || undefined,
          })),
        }

        let createResponse
        if (formData.prId) {
          createResponse = await purchaseOrderService.createFromPR(formData.prId, orderData)
        } else {
          createResponse = await purchaseOrderService.create(orderData)
        }

        if (!createResponse.success) {
          if (createResponse.errors && Array.isArray(createResponse.errors)) {
            const errorMessages = createResponse.errors.map(err => err.message || err.msg).join(', ')
            toast.error(errorMessages || createResponse.message || 'Failed to save purchase order')
          } else {
            toast.error(createResponse.message || 'Failed to save purchase order')
          }
          setSubmitting(false)
          return
        }

        poId = createResponse.data?.purchaseOrder?.po_id || createResponse.data?.data?.po_id

        // Upload documents if any
        if (uploadedFiles.length > 0 && poId) {
          try {
            await fileService.addToPurchaseOrder(poId, uploadedFiles)
            setUploadedFiles([])
          } catch (error) {
            console.error('Error uploading documents:', error)
            toast.warning('PO saved but documents upload failed')
          }
        }
      }

      if (!poId) {
        toast.error('Failed to get purchase order ID')
        return
      }

      // Send invoice email to vendor
      const response = await purchaseOrderService.submit(poId, {})

      if (response.success) {
        toast.success('Invoice sent to vendor successfully!')
        if (!isEditMode) {
          navigate(`/purchase-order/${poId}`)
        } else {
          await fetchPurchaseOrder()
        }
      } else {
        if (response.errors && Array.isArray(response.errors)) {
          const errorMessages = response.errors.map(err => err.message || err.msg).join(', ')
          toast.error(errorMessages || response.message || 'Failed to send invoice')
        } else {
          toast.error(response.message || 'Failed to send invoice')
        }
      }
    } catch (error) {
      console.error('Error sending invoice:', error)
      if (error.errors && Array.isArray(error.errors)) {
        const errorMessages = error.errors.map(err => err.message || err.msg || err).join(', ')
        toast.error(errorMessages || error.message || 'Failed to send invoice')
      } else if (error.message) {
        toast.error(error.message || 'Failed to send invoice')
      } else {
        toast.error('Failed to send invoice')
      }
    } finally {
      setSubmitting(false)
    }
  }

  // Calculate grand totals
  const grandTotals = orderItems.reduce((totals, item) => {
    totals.subtotal += item.subtotal || 0
    totals.gst += item.gstAmount || 0
    totals.sgst += item.sgstAmount || 0
    totals.total += item.itemTotal || 0
    return totals
  }, { subtotal: 0, gst: 0, sgst: 0, total: 0 })

  const itemColumns = [
    { key: 'itemName', label: 'Material Name' },
    { key: 'productCode', label: 'Product Code' },
    { 
      key: 'quantity', 
      label: 'Qty',
      render: (row) => `${row.quantity || 0} ${row.uom || ''}`
    },
    { key: 'unitPrice', label: 'Unit Price', render: (row) => `₹${(row.unitPrice || 0).toFixed(2)}` },
    { 
      key: 'subtotal', 
      label: 'Subtotal',
      render: (row) => `₹${(row.subtotal || 0).toFixed(2)}`
    },
    { 
      key: 'gst', 
      label: `GST`,
      render: (row) => row.gstPercentage ? `₹${(row.gstAmount || 0).toFixed(2)} (${row.gstPercentage.toFixed(2)}%)` : '-'
    },
    { 
      key: 'sgst', 
      label: `SGST`,
      render: (row) => row.sgstPercentage ? `₹${(row.sgstAmount || 0).toFixed(2)} (${row.sgstPercentage.toFixed(2)}%)` : '-'
    },
    { 
      key: 'itemTotal', 
      label: 'Total',
      render: (row) => <span className="font-semibold">₹{(row.itemTotal || 0).toFixed(2)}</span>
    },
    { key: 'remarks', label: 'Remarks' },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        !isEditMode && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleEditItem(row)}
              className="p-1 text-blue-600 hover:bg-blue-50 rounded"
              title="Edit"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleDeleteItem(row.id)}
              className="p-1 text-red-600 hover:bg-red-50 rounded"
              title="Delete"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )
      ),
    },
  ]

  return (
    <div className="p-6">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" onClick={() => navigate('/purchase-order')} icon={<ArrowLeft className="w-4 h-4" />}>
          Back
        </Button>
        <h1 className="text-2xl font-bold text-gray-800">
          {isEditMode ? 'View Purchase Order' : 'Create Purchase Order'}
        </h1>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
        {/* PR Selection Dropdown */}
        <div className="border-b pb-4">
          <h2 className="text-lg font-semibold mb-4">Select Purchase Request</h2>
          <Dropdown
            label="Purchase Request"
            options={prOptions}
            value={formData.prId}
            onChange={(e) => handlePRSelection(e.target.value)}
            disabled={isEditMode || loading}
            required
          />
          {selectedPR && (
            <div className="mt-2 text-sm text-gray-600">
              <p>PR Number: {selectedPR.pr_number}</p>
              <p>Requested Date: {selectedPR.requested_date ? new Date(selectedPR.requested_date).toLocaleDateString() : '-'}</p>
            </div>
          )}
        </div>

        {/* PO Details */}
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="PO Number"
            value={formData.poNumber}
            onChange={(e) => setFormData({ ...formData, poNumber: e.target.value })}
            placeholder="Auto-generated from PR"
            disabled={isEditMode || !formData.prId}
          />
          <Input
            label="PO Date"
            type="date"
            value={formData.poDate}
            onChange={(e) => setFormData({ ...formData, poDate: e.target.value })}
            disabled={isEditMode}
          />
          <Dropdown
            label="Vendor"
            options={vendorOptions}
            value={formData.vendorId}
            onChange={(e) => setFormData({ ...formData, vendorId: e.target.value })}
            required
            disabled={isEditMode}
          />
          {formData.vendorId && !isEditMode && (
            <div className="col-span-2">
              <Button
                onClick={handleSendInvoice}
                disabled={loading || submitting || orderItems.length === 0}
                variant="secondary"
                icon={submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              >
                {submitting ? 'Sending Invoice...' : 'Send Invoice to Vendor'}
              </Button>
              <p className="text-xs text-gray-500 mt-1">Send invoice email to selected vendor</p>
            </div>
          )}
          <Input
            label="Remarks"
            value={formData.remarks}
            onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
            placeholder="Optional remarks"
            disabled={isEditMode}
          />
        </div>

        {/* Order Items */}
        <div className="border-t pt-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Order Items</h2>
            {!isEditMode && (
              <Button onClick={() => setIsAddItemModalOpen(true)} icon={<Plus className="w-4 h-4" />}>
                Add Item
              </Button>
            )}
          </div>

          {orderItems.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No items added yet. Select a PR or add items manually.</p>
          ) : (
            <>
              <Table data={orderItems} columns={itemColumns} />
              <div className="mt-4 pt-4 border-t">
                <div className="flex justify-end">
                  <div className="w-full max-w-md space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Subtotal:</span>
                      <span className="font-medium">₹{grandTotals.subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">GST:</span>
                      <span className="font-medium">₹{grandTotals.gst.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">SGST:</span>
                      <span className="font-medium">₹{grandTotals.sgst.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold border-t border-gray-300 pt-2">
                      <span>Grand Total:</span>
                      <span>₹{grandTotals.total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Document Upload */}
        <div className="border-t pt-4">
          <h2 className="text-lg font-semibold mb-4">Documents</h2>
          
          {/* Existing Documents */}
          {existingDocuments.length > 0 && (
            <div className="mb-4">
              <p className="text-sm font-medium text-gray-700 mb-2">Existing Documents:</p>
              <div className="flex flex-wrap gap-2">
                {existingDocuments.map((doc, index) => {
                  const docFilename = doc.includes('/') ? doc.split('/').pop() : doc
                  const docUrl = doc.startsWith('/') 
                    ? `${API_BASE_URL.replace('/api/v1', '')}${doc}`
                    : fileService.downloadUrl(docFilename)
                  return (
                    <div key={index} className="flex items-center gap-2 bg-gray-100 px-3 py-2 rounded">
                      <FileText className="w-4 h-4 text-gray-600" />
                      <a
                        href={docUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:text-blue-800 underline"
                      >
                        {docFilename}
                      </a>
                      <button
                        onClick={() => handleRemoveExistingDocument(doc)}
                        className="text-red-600 hover:text-red-800"
                        title="Remove document"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* File Upload */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
            <label className="flex flex-col items-center cursor-pointer">
              <Upload className="w-8 h-8 text-gray-400 mb-2" />
              <span className="text-sm text-gray-600">Click to upload documents</span>
              <input
                type="file"
                multiple
                accept="image/*,.pdf"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>

          {/* Uploaded Files Preview */}
          {uploadedFiles.length > 0 && (
            <div className="mt-4">
              <p className="text-sm font-medium text-gray-700 mb-2">Files to Upload:</p>
              <div className="flex flex-wrap gap-2">
                {uploadedFiles.map((file, index) => (
                  <div key={index} className="flex items-center gap-2 bg-blue-100 px-3 py-2 rounded">
                    <FileText className="w-4 h-4 text-blue-600" />
                    <span className="text-sm text-gray-700">{file.name}</span>
                    <button
                      onClick={() => handleRemoveFile(index)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 pt-4 border-t">
          {!isEditMode && (
            <Button 
              onClick={handleSubmit} 
              disabled={loading || submitting} 
              variant="primary"
              icon={submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            >
              {submitting ? 'Submitting...' : 'Submit for Approval'}
            </Button>
          )}
          {isEditMode && (
            <div className="px-3 py-2 text-sm text-gray-600 bg-gray-50 rounded-md border border-gray-200">
              Purchase Order is read-only. Use delete option to remove.
            </div>
          )}
          <Button onClick={() => navigate('/purchase-order')} variant="outline">
            {isEditMode ? 'Back' : 'Cancel'}
          </Button>
        </div>
      </div>

      {/* Add Item Modal */}
      <Modal
        isOpen={isAddItemModalOpen}
        onClose={() => setIsAddItemModalOpen(false)}
        title="Add Item"
        size="sm"
      >
        <div className="space-y-4">
          <Dropdown
            label="Material"
            options={materialOptions}
            value={itemForm.materialId}
            onChange={(e) => handleMaterialChange(e.target.value)}
            required
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Quantity"
              type="number"
              value={itemForm.quantity}
              onChange={(e) => setItemForm({ ...itemForm, quantity: e.target.value })}
              min="1"
              required
            />
            <Input
              label="UOM"
              value={itemForm.uom}
              disabled={true}
              className="bg-gray-100 text-gray-600"
              placeholder="Auto-populated from material"
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Input
              label="Unit Price"
              type="number"
              step="0.01"
              value={itemForm.unitPrice}
              onChange={(e) => setItemForm({ ...itemForm, unitPrice: e.target.value })}
              placeholder="Auto-populated from material"
              min="0"
            />
            <Input
              label="GST %"
              type="number"
              step="0.01"
              value={itemForm.gstPercentage}
              onChange={(e) => setItemForm({ ...itemForm, gstPercentage: e.target.value })}
              placeholder="Auto-populated from material"
            />
            <Input
              label="SGST %"
              type="number"
              step="0.01"
              value={itemForm.sgstPercentage}
              onChange={(e) => setItemForm({ ...itemForm, sgstPercentage: e.target.value })}
              placeholder="Auto-populated from material"
            />
          </div>
          {itemForm.quantity && itemForm.unitPrice && (
            <div className="bg-gray-50 p-3 rounded-md border border-gray-200">
              <div className="text-sm font-medium text-gray-700 mb-2">Price Calculation:</div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-medium">₹{((parseFloat(itemForm.quantity) || 0) * (parseFloat(itemForm.unitPrice) || 0)).toFixed(2)}</span>
                </div>
                {itemForm.gstPercentage && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">GST ({itemForm.gstPercentage}%):</span>
                    <span className="font-medium">₹{(((parseFloat(itemForm.quantity) || 0) * (parseFloat(itemForm.unitPrice) || 0)) * (parseFloat(itemForm.gstPercentage) || 0) / 100).toFixed(2)}</span>
                  </div>
                )}
                {itemForm.sgstPercentage && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">SGST ({itemForm.sgstPercentage}%):</span>
                    <span className="font-medium">₹{(((parseFloat(itemForm.quantity) || 0) * (parseFloat(itemForm.unitPrice) || 0)) * (parseFloat(itemForm.sgstPercentage) || 0) / 100).toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-gray-300 pt-1 mt-1">
                  <span className="font-medium text-gray-900">Total:</span>
                  <span className="font-bold text-gray-900">
                    ₹{(
                      ((parseFloat(itemForm.quantity) || 0) * (parseFloat(itemForm.unitPrice) || 0)) +
                      (((parseFloat(itemForm.quantity) || 0) * (parseFloat(itemForm.unitPrice) || 0)) * (parseFloat(itemForm.gstPercentage) || 0) / 100) +
                      (((parseFloat(itemForm.quantity) || 0) * (parseFloat(itemForm.unitPrice) || 0)) * (parseFloat(itemForm.sgstPercentage) || 0) / 100)
                    ).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          )}
          <Input
            label="Remarks"
            value={itemForm.remarks}
            onChange={(e) => setItemForm({ ...itemForm, remarks: e.target.value })}
            placeholder="Optional"
          />
          <div className="flex gap-2 justify-end pt-2">
            <Button onClick={() => setIsAddItemModalOpen(false)} variant="outline">
              Cancel
            </Button>
            <Button onClick={handleAddItem}>
              Add Item
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Item Modal */}
      <Modal
        isOpen={isEditItemModalOpen}
        onClose={() => {
          setIsEditItemModalOpen(false)
          setEditingItem(null)
        }}
        title="Edit Item"
        size="sm"
      >
        <div className="space-y-4">
          <Dropdown
            label="Material"
            options={materialOptions}
            value={itemForm.materialId}
            onChange={(e) => handleMaterialChange(e.target.value)}
            required
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Quantity"
              type="number"
              value={itemForm.quantity}
              onChange={(e) => setItemForm({ ...itemForm, quantity: e.target.value })}
              min="1"
              required
            />
            <Input
              label="UOM"
              value={itemForm.uom}
              disabled={true}
              className="bg-gray-100 text-gray-600"
              placeholder="Auto-populated from material"
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Input
              label="Unit Price"
              type="number"
              step="0.01"
              value={itemForm.unitPrice}
              onChange={(e) => setItemForm({ ...itemForm, unitPrice: e.target.value })}
              placeholder="Auto-populated from material"
              min="0"
            />
            <Input
              label="GST %"
              type="number"
              step="0.01"
              value={itemForm.gstPercentage}
              onChange={(e) => setItemForm({ ...itemForm, gstPercentage: e.target.value })}
              placeholder="Auto-populated from material"
            />
            <Input
              label="SGST %"
              type="number"
              step="0.01"
              value={itemForm.sgstPercentage}
              onChange={(e) => setItemForm({ ...itemForm, sgstPercentage: e.target.value })}
              placeholder="Auto-populated from material"
            />
          </div>
          {itemForm.quantity && itemForm.unitPrice && (
            <div className="bg-gray-50 p-3 rounded-md border border-gray-200">
              <div className="text-sm font-medium text-gray-700 mb-2">Price Calculation:</div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-medium">₹{((parseFloat(itemForm.quantity) || 0) * (parseFloat(itemForm.unitPrice) || 0)).toFixed(2)}</span>
                </div>
                {itemForm.gstPercentage && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">GST ({itemForm.gstPercentage}%):</span>
                    <span className="font-medium">₹{(((parseFloat(itemForm.quantity) || 0) * (parseFloat(itemForm.unitPrice) || 0)) * (parseFloat(itemForm.gstPercentage) || 0) / 100).toFixed(2)}</span>
                  </div>
                )}
                {itemForm.sgstPercentage && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">SGST ({itemForm.sgstPercentage}%):</span>
                    <span className="font-medium">₹{(((parseFloat(itemForm.quantity) || 0) * (parseFloat(itemForm.unitPrice) || 0)) * (parseFloat(itemForm.sgstPercentage) || 0) / 100).toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-gray-300 pt-1 mt-1">
                  <span className="font-medium text-gray-900">Total:</span>
                  <span className="font-bold text-gray-900">
                    ₹{(
                      ((parseFloat(itemForm.quantity) || 0) * (parseFloat(itemForm.unitPrice) || 0)) +
                      (((parseFloat(itemForm.quantity) || 0) * (parseFloat(itemForm.unitPrice) || 0)) * (parseFloat(itemForm.gstPercentage) || 0) / 100) +
                      (((parseFloat(itemForm.quantity) || 0) * (parseFloat(itemForm.unitPrice) || 0)) * (parseFloat(itemForm.sgstPercentage) || 0) / 100)
                    ).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          )}
          <Input
            label="Remarks"
            value={itemForm.remarks}
            onChange={(e) => setItemForm({ ...itemForm, remarks: e.target.value })}
            placeholder="Optional"
          />
          <div className="flex gap-2 justify-end pt-2">
            <Button 
              onClick={() => {
                setIsEditItemModalOpen(false)
                setEditingItem(null)
              }} 
              variant="outline"
            >
              Cancel
            </Button>
            <Button onClick={handleUpdateItem}>
              Update Item
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default PurchaseOrderDetails
